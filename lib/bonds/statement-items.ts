import "server-only";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { bondsDatabaseUrl } from "./database-config";
import { listPurchases } from "./db";
import { listEquityHoldings } from "./equities";
import { validEquityDate } from "./equity-validation";
import type { BondPurchase, EquityHolding } from "./types";

export type StatementItem = { kind:"bond"|"equity"; date:string; amount:number; title:string; currency:"RWF"; broker:"BK Capital"; contractNote?:string; ticker?:string; shares?:number; pricePerShare?:number };
export function parseStatementItems(value: unknown): StatementItem[] | null {
  if (!Array.isArray(value) || !value.length || value.length > 500) return null;
  const result: StatementItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const p = raw as Record<string, unknown>;
    if (!["bond","equity"].includes(String(p.kind)) || !validEquityDate(p.date) || p.currency !== "RWF" || p.broker !== "BK Capital" || typeof p.amount !== "number" || !Number.isFinite(p.amount) || p.amount <= 0 || p.amount > 1e13 || typeof p.title !== "string" || !p.title.trim() || p.title.length > 160) return null;
    const item: StatementItem = {kind:p.kind as StatementItem["kind"],date:p.date,amount:p.amount,title:p.title.trim(),currency:"RWF",broker:"BK Capital"};
    if (p.kind === "equity") {
      if (typeof p.ticker !== "string" || !/^[A-Z][A-Z0-9]{1,9}$/.test(p.ticker) || typeof p.contractNote !== "string" || !/^\d{1,20}#\d{1,8}$/.test(p.contractNote) || typeof p.shares !== "number" || !Number.isSafeInteger(p.shares) || p.shares <= 0 || p.shares > 1e13 || typeof p.pricePerShare !== "number" || !Number.isFinite(p.pricePerShare) || p.pricePerShare <= 0 || p.pricePerShare > 1e13 || p.amount + .02 < p.shares * p.pricePerShare) return null;
      Object.assign(item,{ticker:p.ticker,contractNote:p.contractNote,shares:p.shares,pricePerShare:p.pricePerShare});
    }
    result.push(item);
  }
  return result;
}
const near = (a:number,b:number) => Math.abs(a-b) <= .02;
export function statementItemMatches(item: StatementItem, purchase: BondPurchase | EquityHolding) {
  if (purchase.currency !== item.currency || purchase.status === "submitted") return false;
  if (item.kind === "equity") {
    if (purchase.instrumentType !== "equity") return false;
    const p = purchase as EquityHolding;
    return p.broker.toUpperCase().replace(/[^A-Z0-9]/g,"") === "BKCAPITAL" && p.contractNote === item.contractNote && p.ticker === item.ticker && p.tradeDate === item.date && p.shares === item.shares && near(p.pricePerShare,item.pricePerShare!) && near(p.netAmountPayable,item.amount);
  }
  if (purchase.instrumentType === "equity") return false;
  const p = purchase as BondPurchase;
  // Journal posting can follow settlement; never infer principal from this debit.
  const days = (Date.parse(item.date)-Date.parse(p.settlementDate))/86400000;
  return days >= 0 && days <= 7 && near(p.faceValue*p.pricePercent/100+p.accruedInterestPaid,item.amount);
}
const identity = (p:StatementItem) => createHash("sha256").update(JSON.stringify([p.kind,p.date,p.amount,p.ticker??"",p.contractNote??"",p.shares??0,p.pricePerShare??0])).digest("hex");
function sqlClient() { const url=bondsDatabaseUrl(); if (!url) throw new Error("Statement storage unavailable."); return neon(url); }
async function existing(userId:string) { const [bonds,shares]=await Promise.all([listPurchases(userId),listEquityHoldings(userId)]); return [...bonds,...shares]; }
export async function listMissingStatementItems(userId:string) {
  const sql=sqlClient();
  const [rows,purchases]=await Promise.all([sql`SELECT id::text,item FROM bond_statement_items WHERE owner_id=${userId} ORDER BY created_at DESC LIMIT 500`,existing(userId)]);
  return rows.filter(row=>purchases.filter(p=>statementItemMatches(row.item as StatementItem,p)).length !== 1).map(row=>({...row.item as StatementItem,id:String(row.id)}));
}
export async function reconcileStatementItems(userId:string,items:StatementItem[]) {
  const purchases=await existing(userId);
  const states=items.map(item=>({...item,state:purchases.filter(p=>statementItemMatches(item,p)).length === 1 ? "recorded" : "missing"}));
  const missing=items.filter((_,index)=>states[index].state === "missing").map(item=>({identity:identity(item),item}));
  const sql=sqlClient();
  if (missing.length) await sql`INSERT INTO bond_statement_items (owner_id,identity,item)
    SELECT ${userId},source.identity,source.item FROM jsonb_to_recordset(${JSON.stringify(missing)}::jsonb) AS source(identity text,item jsonb)
    ON CONFLICT (owner_id,identity) DO NOTHING`;
  return states;
}

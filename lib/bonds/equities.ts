import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import equityPortfolio from "../../.data/equity-portfolio.json";
import { bondsDatabaseUrl } from "./database-config";
import { DuplicatePurchaseError, equityPurchaseKey, sameEquityPurchase } from "./purchase-identity";
import type { EquityHolding, EquityHoldingInput } from "./types";

let writes: Promise<unknown> = Promise.resolve();
function pathFor(userId: string) {
  if (userId !== "owner" && !/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid portfolio owner.");
  return join(process.cwd(), ".data", "bonds-users", `${userId}-equities.json`);
}
const defaults = (userId: string) => userId === "owner" ? equityPortfolio.holdings as EquityHolding[] : [];
async function localHoldings(userId: string): Promise<EquityHolding[]> {
  try { return JSON.parse(await readFile(pathFor(userId), "utf8")).holdings; }
  catch (error) { if ((error as { code?: string }).code === "ENOENT") return []; throw error; }
}
const sort = (holdings: EquityHolding[]) => [...holdings].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate) || b.createdAt.localeCompare(a.createdAt));
export async function listEquityHoldings(userId: string) {
  pathFor(userId);
  const url = bondsDatabaseUrl();
  let saved: EquityHolding[];
  if (url) {
    const sql = neon(url);
    const rows = await sql`SELECT holding FROM equity_purchases WHERE owner_id = ${userId} ORDER BY created_at DESC`;
    saved = rows.map((row) => row.holding as EquityHolding);
  } else {
    await writes;
    saved = await localHoldings(userId);
  }
  return sort([...defaults(userId), ...saved]);
}
export async function createEquityPurchase(userId: string, input: EquityHoldingInput) {
  pathFor(userId);
  const holding: EquityHolding = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  if (defaults(userId).some((item) => sameEquityPurchase(item, holding))) throw new DuplicatePurchaseError();
  const url = bondsDatabaseUrl();
  if (url) {
    const sql = neon(url);
    const contractKey = input.contractNote ? `${input.broker.toUpperCase().replace(/[^A-Z0-9]/g, "")}|${input.contractNote.toUpperCase().replace(/[^A-Z0-9]/g, "")}` : null;
    await sql`INSERT INTO equity_purchases (id, owner_id, dedup_key, contract_key, report_key, holding)
      VALUES (${holding.id}::uuid, ${userId}, ${equityPurchaseKey(holding)}, ${contractKey}, ${holding.tradeReportId || null}, ${JSON.stringify(holding)}::jsonb)`;
  } else {
    // A serial read/check/write protects local imports made in parallel.
    const operation = writes.then(async () => {
      const saved = await localHoldings(userId);
      if (saved.some((item) => sameEquityPurchase(item, holding))) throw new DuplicatePurchaseError();
      const path = pathFor(userId), temporary = `${path}.${randomUUID()}.tmp`;
      await mkdir(join(process.cwd(), ".data", "bonds-users"), { recursive: true });
      await writeFile(temporary, JSON.stringify({ holdings: [holding, ...saved] }));
      await rename(temporary, path);
    });
    writes = operation.catch(() => undefined);
    await operation;
  }
  return holding;
}

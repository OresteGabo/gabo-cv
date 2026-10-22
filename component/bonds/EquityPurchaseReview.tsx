"use client";
import type { EquityHoldingInput } from "@/lib/bonds/types";

export function EquityPurchaseReview({ value, onChange, disabled }: { value: EquityHoldingInput; onChange: (value: EquityHoldingInput) => void; disabled: boolean }) {
  const texts = [["securityName", "Company"], ["isin", "ISIN"], ["ticker", "RSE ticker"], ["contractNote", "Contract note"], ["tradeDate", "Purchase date"], ["settlementDate", "Settlement date"]] as const;
  const numbers = [["shares", "Number of shares"], ["pricePerShare", "Price per share (RWF)"], ["grossConsideration", "Gross consideration (RWF)"], ["brokerageCommission", "Brokerage commission"], ["rseTransactionFee", "RSE transaction fee"], ["csdTransactionLevy", "CSD transaction levy"], ["cmaTransactionFee", "CMA transaction fee"], ["totalCharges", "Total charges (RWF)"], ["netAmountPayable", "Cash cost (RWF)"]] as const;
  const inputClass = "mt-1 w-full min-w-0 rounded-lg border border-outline/15 bg-background px-3 py-2 text-sm text-on-surface";
  return <fieldset disabled={disabled} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
    <legend className="mb-3 text-sm font-black">Share purchase · RSE</legend>
    {texts.map(([key, label]) => <label key={key} className="min-w-0 text-xs font-bold text-on-surface-variant">{label}<input className={inputClass} value={value[key]} required={key !== "contractNote"} maxLength={key === "ticker" ? 10 : 160} type={key.endsWith("Date") ? "date" : "text"} onChange={(event) => onChange({ ...value, [key]: ["ticker", "isin"].includes(key) ? event.target.value.toUpperCase() : event.target.value })} /></label>)}
    {numbers.map(([key, label]) => <label key={key} className="min-w-0 text-xs font-bold text-on-surface-variant">{label}<input className={inputClass} type="number" required step={key === "shares" ? "1" : "0.01"} min={key === "shares" ? 1 : 0} value={value[key]} placeholder="0" onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })} /></label>)}
    <p className="text-xs leading-relaxed text-on-surface-variant sm:col-span-2">Gross consideration must equal shares × price. The individual fees must match total charges, and cash cost must equal gross consideration plus charges.</p>
  </fieldset>;
}

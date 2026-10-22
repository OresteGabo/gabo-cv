import { catalogEntryForPurchase } from "./catalog";
import type { BondPurchaseInput, EquityHolding } from "./types";

const normalized = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
const money = (value: number) => Number(value).toFixed(2);

// Business values, rather than filenames: renaming/re-exporting a PDF must not
// create another purchase. Different dates, quantities or prices remain separate.
export function bondPurchaseKey(input: BondPurchaseInput) {
  return [normalized(catalogEntryForPurchase(input)?.issuanceNumber ?? input.bondName), input.currency, input.market, input.market === "primary" ? "" : input.purchaseDate, input.settlementDate,
    money(input.faceValue), Number(input.pricePercent).toFixed(6)].join("|");
}

export function equityPurchaseKey(input: Pick<EquityHolding, "isin" | "securityName" | "currency" | "tradeDate" | "settlementDate" | "shares" | "pricePerShare" | "netAmountPayable">) {
  return [normalized(input.isin || input.securityName), input.currency, input.tradeDate, input.settlementDate,
    input.shares, money(input.pricePerShare), money(input.netAmountPayable)].join("|");
}

export function sameEquityPurchase(a: EquityHolding, b: EquityHolding) {
  return equityPurchaseKey(a) === equityPurchaseKey(b)
    || Boolean(a.contractNote && b.contractNote && normalized(a.broker) === normalized(b.broker) && normalized(a.contractNote) === normalized(b.contractNote))
    || Boolean(a.tradeReportId && a.tradeReportId === b.tradeReportId);
}

export class DuplicatePurchaseError extends Error {
  constructor() { super("This purchase is already saved in your portfolio."); }
}

export function isDuplicatePurchaseError(error: unknown) {
  return error instanceof DuplicatePurchaseError || (error as { code?: string } | null)?.code === "23505";
}

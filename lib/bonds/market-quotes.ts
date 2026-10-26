import type { BondPurchase, EquityHolding } from "./types";

export type QuoteSource = {
  url: string;
  status: "available" | "partial" | "empty" | "error";
  checkedAt: string;
  publishedAt: string | null;
  stale: boolean;
};
export type BondQuote = { bond: string; closing: number; previous: number | null; volume: number | null };
export type ListedBond = { bond: string; code: string };
export type BondQuotes = { source: QuoteSource; listingSource: QuoteSource; quotes: BondQuote[]; listings: ListedBond[] };
export type EquityQuote = { name: string; ticker: string; closing: number; previous: number | null; volume: number | null };
export type EquityQuotes = { source: QuoteSource; quotes: EquityQuote[] };
export type EquityObservation = { ticker: string; date: string; closing: number; observedAt: string };

export function bondIdentity(value: string) {
  const series = value.toUpperCase().match(/\b([A-Z]+\d*)\s*\/\s*(\d{4})\s*\/\s*(\d+)\s*(?:YEARS?|YRS?|Y)\b/);
  return series ? `${series[1]}/${series[2]}/${Number(series[3])}YR` : value.toUpperCase().replace(/\(RE[ -]?OPENED\)/g, "").replace(/\b(TREASURY|CORPORATE|SLB)\b/g, "").replace(/[^A-Z0-9]/g, "");
}
export function bondQuoteRange(purchase: Pick<BondPurchase, "isin" | "bondName">, data: BondQuotes) {
  const listing = purchase.isin ? data.listings.filter((row) => row.code === purchase.isin.toUpperCase().trim()) : [];
  const identity = listing.length ? bondIdentity(listing[0].bond) : bondIdentity(purchase.bondName);
  if (!identity) return null;
  // A known contradictory security code must never be matched by a similar name.
  if (purchase.isin && !listing.length && data.listings.some((row) => bondIdentity(row.bond) === identity && row.code !== purchase.isin.toUpperCase().trim())) return null;
  const quotes = data.quotes.filter((row) => bondIdentity(row.bond) === identity && row.volume !== 0);
  if (!quotes.length) return null;
  return { low: Math.min(...quotes.map((row) => row.closing)), high: Math.max(...quotes.map((row) => row.closing)), rows: quotes.length };
}

export function equityValuation(holding: EquityHolding, quotes: EquityQuote[]) {
  if (holding.status !== "active" || holding.currency !== "RWF") return null;
  const quote = quotes.find((row) => row.ticker === holding.ticker.trim().toUpperCase());
  if (!quote) return null;
  const value = holding.shares * quote.closing;
  const gain = value - holding.netAmountPayable;
  return { quote, value, gain, gainPercent: holding.netAmountPayable > 0 ? gain / holding.netAmountPayable * 100 : null };
}

export function equityRangeStart(period: "month" | "year" | "all", now: Date) {
  const cutoff = new Date(now);
  const day = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  if (period === "month") cutoff.setUTCMonth(cutoff.getUTCMonth() - 1);
  else if (period === "year") cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  cutoff.setUTCDate(Math.min(day, new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate()));
  return cutoff.toISOString().slice(0, 10);
}

export function equityHistorySeries(observations: EquityObservation[], ticker: string, period: "month" | "year" | "all", now = new Date()) {
  const cutoff = equityRangeStart(period, now);
  const byDate = new Map<string, EquityObservation>();
  for (const observation of observations) {
    if (observation.ticker !== ticker || !/^\d{4}-\d{2}-\d{2}$/.test(observation.date) || !Number.isFinite(Date.parse(observation.date)) || observation.date > now.toISOString().slice(0, 10) || !Number.isFinite(observation.closing) || observation.closing <= 0 || (period !== "all" && observation.date < cutoff)) continue;
    const old = byDate.get(observation.date);
    if (!old || observation.observedAt > old.observedAt) byDate.set(observation.date, observation);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

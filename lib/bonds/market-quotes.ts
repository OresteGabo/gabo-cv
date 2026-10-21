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

export function marketNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function text(value: string) {
  return value.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}
export function rseTableRows(html: string): string[][] {
  const bodies = [...html.matchAll(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/gi)];
  return bodies.flatMap((body) => [...body[1].replace(/<!--[\s\S]*?-->/g, "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => text(cell[1]))));
}
export function parseBondQuotes(html: string): BondQuote[] {
  return rseTableRows(html).flatMap(([bond, closing, previous, , volume]) => {
    const price = marketNumber(closing ?? "");
    return bond && price && price <= 1000 ? [{ bond, closing: price, previous: marketNumber(previous ?? ""), volume: marketNumber(volume ?? "") }] : [];
  });
}
export function parseListedBonds(html: string): ListedBond[] {
  return rseTableRows(html).flatMap(([bond, code]) => bond && code && /\/[12]\d{3}\//.test(bond) ? [{ bond, code: code.toUpperCase() }] : []);
}
export function parseEquityQuotes(html: string): EquityQuote[] {
  return rseTableRows(html).flatMap(([nameAndTicker, closing, previous, , volume]) => {
    const match = nameAndTicker?.match(/^(.+?)\s+([A-Z][A-Z0-9]{1,9})$/);
    const price = marketNumber(closing ?? "");
    return match && price ? [{ name: match[1], ticker: match[2], closing: price, previous: marketNumber(previous ?? ""), volume: marketNumber(volume ?? "") }] : [];
  });
}
export function rsePageCount(html: string) {
  return Math.min(8, Math.max(1, ...[...html.matchAll(/page_bonds-trades=(\d+)/g)].map((match) => Number(match[1]))));
}
export function publishedEquityDate(html: string, checkedAt: string): string | null {
  const value = text(html).match(/Last updated\s*[-–:]?\s*(\d{1,2})\s+([A-Za-z]+)\s+(?:(\d{4})\s+)?(\d{1,2}):(\d{2})\s+GMT\+2/i);
  if (!value) return null;
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const month = months.indexOf(value[2].toLowerCase());
  if (month < 0) return null;
  const now = new Date(checkedAt);
  let year = value[3] ? Number(value[3]) : now.getUTCFullYear();
  let date = new Date(Date.UTC(year, month, Number(value[1]), Number(value[4]) - 2, Number(value[5])));
  if (!value[3] && date.getTime() > now.getTime() + 86400000) { year--; date = new Date(Date.UTC(year, month, Number(value[1]), Number(value[4]) - 2, Number(value[5]))); }
  if (Number(value[1]) < 1 || Number(value[1]) > new Date(Date.UTC(year, month + 1, 0)).getUTCDate() || Number(value[4]) > 23 || Number(value[5]) > 59 || date.getTime() > now.getTime() + 86400000) return null;
  return date.toISOString();
}

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
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-400);
}

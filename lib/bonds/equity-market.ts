import { equityHistorySeries, type EquityObservation, type EquityQuote } from "./market-quotes";

// Names from the requested watchlist, matched against RSE's published symbols.
// This list controls display only; collection still saves every quoted symbol.
export const RSE_EQUITIES = [
  { ticker: "BLR", name: "Bralirwa" },
  { ticker: "IMR", name: "I&M Bank Rwanda" },
  { ticker: "CMR", name: "Cimerwa" },
  { ticker: "RHB", name: "RH Bophelo" },
  { ticker: "NMG", name: "Nation Media Group" },
  { ticker: "USL", name: "Uchumi" },
  { ticker: "BOK", name: "BK Group" },
  { ticker: "KCB", name: "KCB" },
  { ticker: "MTNR", name: "MTN Rwanda" },
  { ticker: "EQTY", name: "Equity Bank Group" },
] as const;

export function equityPriceChange(quote: EquityQuote | undefined) {
  if (!quote || !Number.isFinite(quote.closing) || quote.closing <= 0 || quote.previous === null || !Number.isFinite(quote.previous) || quote.previous <= 0) return null;
  const amount = quote.closing - quote.previous;
  return { amount, percent: amount / quote.previous * 100 };
}

export function equityMarketDate(timestamp: string | null | undefined) {
  const time = Date.parse(timestamp ?? "");
  return Number.isFinite(time) ? new Date(time + 2 * 3600000).toISOString().slice(0, 10) : null;
}

export function equityDailyRows(observations: EquityObservation[], tickers: string[], period: "month" | "year" | "all", now = new Date()) {
  const rows = new Map<string, Map<string, number>>();
  // Align the day boundary with Kigali, including around midnight UTC.
  const today = new Date(now.getTime() + 2 * 3600000);
  for (const ticker of tickers) {
    for (const observation of equityHistorySeries(observations, ticker, period, today)) {
      if (new Date(`${observation.date}T00:00:00Z`).toISOString().slice(0, 10) !== observation.date) continue;
      const prices = rows.get(observation.date) ?? new Map<string, number>();
      prices.set(ticker, observation.closing);
      rows.set(observation.date, prices);
    }
  }
  return [...rows].sort(([a], [b]) => b.localeCompare(a)).map(([date, prices]) => ({ date, prices }));
}

import "server-only";
import { neon } from "@neondatabase/serverless";
import { bondsDatabaseUrl } from "./database-config";
import { equityRangeStart, type EquityObservation, type EquityQuotes } from "./market-quotes";

export type EquityPeriod = "month" | "year" | "all";
type RecordingResult = { status: "saved"; marketDate: string; written: number } | { status: "database-unavailable" | "unusable-source" | "missing-market-date" };

export async function recordEquityQuotes(data: EquityQuotes): Promise<RecordingResult> {
  const url = bondsDatabaseUrl();
  if (!url) return { status: "database-unavailable" };
  if (data.source.stale || !data.quotes.length || data.source.status !== "available") return { status: "unusable-source" };
  const published = Date.parse(data.source.publishedAt ?? "");
  const checked = Date.parse(data.source.checkedAt);
  if (!Number.isFinite(published) || !Number.isFinite(checked) || published > checked) return { status: "missing-market-date" };
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5000) } });
  const date = new Date(published + 2 * 3600000).toISOString().slice(0, 10);
  const rows = [...new Map(data.quotes.filter((quote) => /^[A-Z][A-Z0-9]{1,9}$/.test(quote.ticker) && Number.isFinite(quote.closing) && quote.closing > 0).map((quote) => [quote.ticker, { ticker: quote.ticker, closing: quote.closing }])).values()];
  if (!rows.length) return { status: "unusable-source" };
  const written = await sql`
    INSERT INTO equity_market_observations (ticker, observed_date, closing_price, observed_at, published_at)
    SELECT ticker, ${date}::date, closing, ${data.source.checkedAt}::timestamptz, ${data.source.publishedAt}::timestamptz
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS quotes(ticker text, closing numeric)
    ON CONFLICT (ticker, observed_date) DO UPDATE SET closing_price = EXCLUDED.closing_price, observed_at = EXCLUDED.observed_at, published_at = EXCLUDED.published_at
    WHERE equity_market_observations.observed_at < EXCLUDED.observed_at
    RETURNING ticker`;
  return { status: "saved", marketDate: date, written: written.length };
}

// One bounded health record for the scheduled collector, separate from market dates.
export async function recordEquityCollectionRun(startedAt: string, status: RecordingResult["status"] | "collection-failed", marketDate: string | null) {
  const url = bondsDatabaseUrl();
  if (!url) return;
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5000) } });
  await sql`INSERT INTO equity_market_collection (id, attempted_at, succeeded_at, market_date, status)
    VALUES (true, ${startedAt}::timestamptz, CASE WHEN ${status} = 'saved' THEN ${startedAt}::timestamptz ELSE NULL END, ${marketDate}::date, ${status})
    ON CONFLICT (id) DO UPDATE SET attempted_at = EXCLUDED.attempted_at,
      succeeded_at = COALESCE(EXCLUDED.succeeded_at, equity_market_collection.succeeded_at),
      market_date = COALESCE(EXCLUDED.market_date, equity_market_collection.market_date), status = EXCLUDED.status
    WHERE equity_market_collection.attempted_at <= EXCLUDED.attempted_at`;
}

export async function listEquityObservations(tickers: string[], period: EquityPeriod = "all", now = new Date()): Promise<{ available: boolean; resolution: "daily" | "monthly"; observations: EquityObservation[] }> {
  const url = bondsDatabaseUrl();
  if (!url) return { available: false, resolution: "daily", observations: [] };
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5000) } });
  const today = new Date(now.getTime() + 2 * 3600000);
  const cutoff = period === "all" ? "0001-01-01" : equityRangeStart(period, today);
  const rows = await sql`
    WITH ranked AS (
      SELECT ticker, observed_date, closing_price, observed_at,
        count(*) OVER (PARTITION BY ticker) AS total,
        row_number() OVER (PARTITION BY ticker, date_trunc('month', observed_date) ORDER BY observed_date) AS first_in_month,
        row_number() OVER (PARTITION BY ticker, date_trunc('month', observed_date) ORDER BY observed_date DESC) AS last_in_month
      FROM equity_market_observations
      WHERE ticker IN (SELECT jsonb_array_elements_text(${JSON.stringify(tickers)}::jsonb))
        AND observed_date BETWEEN ${cutoff}::date AND ${today.toISOString().slice(0, 10)}::date
    ) SELECT ticker, observed_date::text AS date, closing_price::float8 AS closing, observed_at AS "observedAt", total > 400 AS aggregated
      FROM ranked WHERE total <= 400 OR first_in_month = 1 OR last_in_month = 1 ORDER BY ticker, observed_date`;
  return { available: true, resolution: rows.some((row) => row.aggregated) ? "monthly" : "daily", observations: rows.map((row) => ({ ticker: String(row.ticker), date: String(row.date), closing: Number(row.closing), observedAt: new Date(String(row.observedAt)).toISOString() })) };
}

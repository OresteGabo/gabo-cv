import "server-only";
import { neon } from "@neondatabase/serverless";
import { bondsDatabaseUrl } from "./database-config";
import type { EquityObservation, EquityQuotes } from "./market-quotes";

export async function recordEquityQuotes(data: EquityQuotes) {
  const url = bondsDatabaseUrl();
  if (!url || data.source.stale || !data.quotes.length || data.source.status === "error") return;
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5000) } });
  const date = new Date(new Date(data.source.publishedAt ?? data.source.checkedAt).getTime() + 2 * 3600000).toISOString().slice(0, 10);
  const rows = data.quotes.map((quote) => ({ ticker: quote.ticker, closing: quote.closing }));
  await sql`
    INSERT INTO equity_market_observations (ticker, observed_date, closing_price, observed_at, published_at)
    SELECT ticker, ${date}::date, closing, ${data.source.checkedAt}::timestamptz, ${data.source.publishedAt}::timestamptz
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS quotes(ticker text, closing numeric)
    ON CONFLICT (ticker, observed_date) DO UPDATE SET closing_price = EXCLUDED.closing_price, observed_at = EXCLUDED.observed_at, published_at = EXCLUDED.published_at
    WHERE equity_market_observations.observed_at < EXCLUDED.observed_at`;
}
export async function listEquityObservations(tickers: string[]): Promise<{ available: boolean; observations: EquityObservation[] }> {
  const url = bondsDatabaseUrl();
  if (!url) return { available: false, observations: [] };
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5000) } });
  const rows = await sql`
    WITH ranked AS (
      SELECT ticker, observed_date, closing_price, observed_at,
        row_number() OVER (PARTITION BY ticker ORDER BY observed_date DESC) AS position
      FROM equity_market_observations
      WHERE ticker IN (SELECT jsonb_array_elements_text(${JSON.stringify(tickers)}::jsonb))
    ) SELECT ticker, observed_date::text AS date, closing_price::float8 AS closing, observed_at AS "observedAt"
      FROM ranked WHERE position <= 400 ORDER BY ticker, observed_date`;
  return { available: true, observations: rows.map((row) => ({ ticker: String(row.ticker), date: String(row.date), closing: Number(row.closing), observedAt: new Date(String(row.observedAt)).toISOString() })) };
}

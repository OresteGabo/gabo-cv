import "server-only";

import { neon } from "@neondatabase/serverless";
import type { RseMarketTrade } from "./rse";

const RSE_BOND_MARKET_URL = "https://rse.rw/bond-market";

export type RecentTradeObservation = {
  normalizedBondName: string;
  tradeCount: number;
  lastObservedAt: string;
  lastObservedDate: string;
  lastClosingPrice: number | null;
  lastChange: string;
  lastVolume: string;
  lastValue: string;
};

function optionalDatabase() {
  const url = process.env.BONDS_DATABASE_URL;
  return url ? neon(url) : null;
}

export function normalizeObservedBondName(value: string) {
  return value
    .replace(/\s*TREASURY\s*$/i, "")
    .trim()
    .toLowerCase()
    .replace(/re-?opened/g, "reopened")
    .replace(/[^a-z0-9]/g, "");
}

function numericValue(value: string) {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function observationDate(fetchedAt: string | null) {
  const parsed = fetchedAt ? new Date(fetchedAt) : new Date();
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return safeDate.toISOString().slice(0, 10);
}

export async function recordRseTradeObservations({
  trades,
  fetchedAt,
}: {
  trades: RseMarketTrade[];
  fetchedAt: string | null;
}) {
  const sql = optionalDatabase();
  if (!sql || trades.length === 0) return;

  const observedDate = observationDate(fetchedAt);
  const observedAt = fetchedAt ?? new Date().toISOString();

  await Promise.all(
    trades.map((trade) => {
      const normalizedBondName = normalizeObservedBondName(trade.bond);
      if (!normalizedBondName) return Promise.resolve();

      return sql`
        INSERT INTO bond_market_observations (
          observed_date,
          observed_at,
          source_url,
          bond_name,
          normalized_bond_name,
          closing_price,
          previous_price,
          change_text,
          volume_text,
          value_text,
          raw_row
        )
        VALUES (
          ${observedDate},
          ${observedAt},
          ${RSE_BOND_MARKET_URL},
          ${trade.bond},
          ${normalizedBondName},
          ${numericValue(trade.closing)},
          ${numericValue(trade.previous)},
          ${trade.change},
          ${trade.volume},
          ${trade.value},
          ${JSON.stringify(trade)}::jsonb
        )
        ON CONFLICT DO NOTHING
      `;
    }),
  );
}

export async function listRecentTradeObservations({
  bondNames,
  lookbackDays = 14,
}: {
  bondNames: string[];
  lookbackDays?: number;
}): Promise<Map<string, RecentTradeObservation>> {
  const sql = optionalDatabase();
  if (!sql || bondNames.length === 0) return new Map();

  const normalizedNames = [...new Set(bondNames.map(normalizeObservedBondName))]
    .filter(Boolean);
  if (normalizedNames.length === 0) return new Map();

  const rows = await sql`
    WITH recent AS (
      SELECT *
      FROM bond_market_observations
      WHERE normalized_bond_name = ANY(${normalizedNames})
        AND observed_date >= (CURRENT_DATE - ${lookbackDays}::int)
    ),
    latest AS (
      SELECT DISTINCT ON (normalized_bond_name)
        normalized_bond_name,
        observed_at,
        observed_date,
        closing_price,
        change_text,
        volume_text,
        value_text
      FROM recent
      ORDER BY normalized_bond_name, observed_at DESC
    )
    SELECT
      latest.normalized_bond_name AS "normalizedBondName",
      COUNT(recent.id)::int AS "tradeCount",
      latest.observed_at::text AS "lastObservedAt",
      latest.observed_date::text AS "lastObservedDate",
      latest.closing_price::float8 AS "lastClosingPrice",
      latest.change_text AS "lastChange",
      latest.volume_text AS "lastVolume",
      latest.value_text AS "lastValue"
    FROM latest
    JOIN recent USING (normalized_bond_name)
    GROUP BY
      latest.normalized_bond_name,
      latest.observed_at,
      latest.observed_date,
      latest.closing_price,
      latest.change_text,
      latest.volume_text,
      latest.value_text
  `;

  return new Map(
    (rows as RecentTradeObservation[]).map((row) => [
      row.normalizedBondName,
      row,
    ]),
  );
}

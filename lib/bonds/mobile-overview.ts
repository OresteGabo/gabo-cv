import type { BondPurchase, EquityHolding } from "./types";

export const MOBILE_PREVIEW_LIMIT = 12;
export function overviewStart(today: string) {
  const [year, month, day] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year - 1, month, 0)).getUTCDate();
  return `${year - 1}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

/** Transfer recent records plus the minimal complete basis for totals, positions and payment schedules. */
export function mobilePortfolioOverview(bonds: BondPurchase[], shares: EquityHolding[], today: string) {
  const from = overviewStart(today);
  const recent = <T extends { id: string; createdAt: string }>(rows: T[], date: (row: T) => string) => rows
    .filter(row => date(row) >= from && date(row) <= today)
    .sort((a, b) => date(b).localeCompare(date(a)) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
    .slice(0, MOBILE_PREVIEW_LIMIT);
  const recentBonds = recent(bonds, row => row.purchaseDate);
  const recentShares = recent(shares, row => row.tradeDate);
  const bondIds = new Set(recentBonds.map(row => row.id));
  const shareIds = new Set(recentShares.map(row => row.id));
  const activeBonds = bonds.filter(row => row.status === "active" && !bondIds.has(row.id))
    .map(({ notes: _notes, sourceUrl: _sourceUrl, accountReference: _account, createdAt: _created, ...basis }) => basis);
  const positions = new Map<string, { id: string; ticker: string; currency: string; status: string; tradeDate: string; shares: number; netAmountPayable: number; lotCount: number }>();
  for (const row of shares) {
    if (row.status !== "active" || row.tradeDate > today || shareIds.has(row.id)) continue;
    const key = JSON.stringify([row.currency, row.ticker]);
    const position = positions.get(key) ?? { id: `aggregate:${key}`, ticker: row.ticker, currency: row.currency, status: "active",
      tradeDate: row.tradeDate, shares: 0, netAmountPayable: 0, lotCount: 0 };
    position.shares += row.shares;
    position.netAmountPayable += row.netAmountPayable;
    position.lotCount += 1;
    if (row.tradeDate < position.tradeDate) position.tradeDate = row.tradeDate;
    positions.set(key, position);
  }
  return { version: 1, from, through: today, previewLimit: MOBILE_PREVIEW_LIMIT,
    recentPurchaseIds: recentBonds.map(row => row.id), recentHoldingIds: recentShares.map(row => row.id),
    purchases: [...recentBonds, ...activeBonds], holdings: [...recentShares, ...positions.values()] };
}

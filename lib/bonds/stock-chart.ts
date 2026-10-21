import { equityHistorySeries, equityRangeStart, type EquityObservation } from "./market-quotes";
import type { EquityHolding } from "./types";

type StockLot = Pick<EquityHolding, "ticker" | "status" | "tradeDate" | "shares" | "netAmountPayable">;
export type StockChartPoint = { date: string; value: number; shares: number };
export type StockChartQuote = { closing: number; date: string };

export function localStockDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function stockChartData(holdings: StockLot[], observations: EquityObservation[], period: "month" | "year" | "all", today: string, latestQuote: StockChartQuote | null) {
  if (!validDate(today)) return null;
  const lots = holdings.filter((lot) => lot.status === "active" && lot.shares > 0 && Number.isFinite(lot.shares) && Number.isFinite(lot.netAmountPayable) && lot.netAmountPayable >= 0 && validDate(lot.tradeDate) && lot.tradeDate <= today).sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  if (!lots.length) return null;
  const ticker = lots[0].ticker;
  const companyLots = lots.filter((lot) => lot.ticker === ticker);
  const at = (date: string) => companyLots.filter((lot) => lot.tradeDate <= date).reduce((result, lot) => ({ shares: result.shares + lot.shares, value: result.value + lot.netAmountPayable }), { shares: 0, value: 0 });
  const startDate = period === "all" ? companyLots[0].tradeDate : [companyLots[0].tradeDate, equityRangeStart(period, new Date(`${today}T12:00:00Z`))].sort()[1];
  const costDates = [...new Set([startDate, ...companyLots.map((lot) => lot.tradeDate).filter((date) => date > startDate), today])].sort();
  const cost = costDates.map((date) => ({ date, ...at(date) }));
  const quotes = equityHistorySeries(observations, ticker, period, new Date(`${today}T12:00:00Z`)).map((point) => ({ date: point.date, closing: point.closing, shares: at(point.date).shares, value: at(point.date).shares * point.closing })).filter((point) => point.shares > 0 && point.date >= startDate);
  const totals = at(today);
  const current = latestQuote && validDate(latestQuote.date) && Number.isFinite(latestQuote.closing) && latestQuote.closing > 0 ? { date: today, shares: totals.shares, value: totals.shares * latestQuote.closing, quoteDate: latestQuote.date, closing: latestQuote.closing } : null;
  const firstMarket = quotes[0] ?? current;
  // A purchase-cost anchor is not a historical market quote. Its connector is
  // drawn separately, with dashes, so it cannot become a recorded-price line.
  const anchor = firstMarket ? [...cost].reverse().find((point) => point.date <= firstMarket.date && point.date !== today) ?? cost[0] : null;
  return { ticker, startDate, endDate: today, cost, quotes, current, anchor, totals, averageCashCost: totals.value / totals.shares };
}

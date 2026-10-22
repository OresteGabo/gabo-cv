import { equityHistorySeries, type EquityObservation } from "./market-quotes";

export type EquityPricePeriod = "month" | "year" | "all";
export type EquityPriceMode = "price" | "change";
export type EquityPricePoint = { date: string; closing: number; value: number };

export function equityPriceChartData(observations: EquityObservation[], tickers: string[], period: EquityPricePeriod, mode: EquityPriceMode, now = new Date()) {
  const today = new Date(now.getTime() + 2 * 3600000);
  const series = [...new Set(tickers)].map((ticker) => {
    const history = equityHistorySeries(observations, ticker, period, today).filter((point) => new Date(`${point.date}T00:00:00Z`).toISOString().slice(0, 10) === point.date);
    const first = history[0];
    const points: EquityPricePoint[] = history.map((point) => ({ date: point.date, closing: point.closing, value: mode === "price" ? point.closing : (point.closing / first.closing - 1) * 100 }));
    return { ticker, points, first: points[0] ?? null, last: points.at(-1) ?? null };
  });
  const dates = [...new Set(series.flatMap((item) => item.points.map((point) => point.date)))].sort();
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  if (!dates.length) return null;
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max((high - low) * 0.08, Math.abs(high) * 0.03, mode === "price" ? 1 : 0.5);
  return { series, dates, startDate: dates[0], endDate: dates.at(-1)!, minimum: mode === "price" ? Math.max(0, low - padding) : low - padding, maximum: high + padding };
}

export function nearestEquityPriceDate(dates: string[], time: number) {
  if (!dates.length || !Number.isFinite(time)) return null;
  let low = 0, high = dates.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (Date.parse(dates[middle]) < time) low = middle + 1;
    else high = middle;
  }
  if (low > 0 && Math.abs(Date.parse(dates[low - 1]) - time) <= Math.abs(Date.parse(dates[low]) - time)) return dates[low - 1];
  return dates[low];
}

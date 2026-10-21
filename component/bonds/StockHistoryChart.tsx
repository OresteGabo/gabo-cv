"use client";
import { equityHistorySeries, type EquityObservation } from "@/lib/bonds/market-quotes";
import type { EquityHolding } from "@/lib/bonds/types";

export default function StockHistoryChart({ observations, holdings, period }: { observations: EquityObservation[]; holdings: EquityHolding[]; period: "month" | "year" | "all" }) {
  const ticker = holdings[0].ticker;
  const series = equityHistorySeries(observations, ticker, period).map((point) => ({ ...point, shares: holdings.filter((holding) => holding.tradeDate <= point.date).reduce((total, holding) => total + holding.shares, 0) })).filter((point) => point.shares > 0);
  if (!series.length) return <p className="py-6 text-sm text-on-surface-variant">No dated prices in this range after your purchase. History builds as RSE prices are collected.</p>;
  if (series.length === 1) return <div className="rounded-2xl border border-outline/10 p-4 text-sm text-on-surface-variant">One dated observation: <strong>{series[0].date}</strong> · RWF {(series[0].closing * series[0].shares).toLocaleString("en", { maximumFractionDigits: 2 })}. At least two dates are needed for a growth graph.</div>;
  const points = series.filter((_, index) => index === 0 || index === series.length - 1 || index % Math.ceil(series.length / 100) === 0);
  const values = points.map((point) => point.closing * point.shares);
  const minimum = Math.min(...values) * 0.98, maximum = Math.max(...values) * 1.02;
  const start = Date.parse(points[0].date), end = Date.parse(points[points.length - 1].date);
  const x = (date: string) => 70 + (Date.parse(date) - start) / Math.max(1, end - start) * 490;
  const y = (value: number) => 160 - (value - minimum) / Math.max(1, maximum - minimum) * 130;
  const coordinates = points.map((point) => `${x(point.date)},${y(point.closing * point.shares)}`).join(" ");
  const priceChange = (series[series.length - 1].closing / series[0].closing - 1) * 100;
  return <div>
    <svg viewBox="0 0 600 195" role="img" aria-label={`${ticker} estimated holding value from ${series[0].date} to ${series[series.length - 1].date}, based on ${series.length} recorded quotes`} className="mt-3 w-full text-primary">
      {[minimum, (minimum + maximum) / 2, maximum].map((value) => <g key={value}><line x1="70" x2="560" y1={y(value)} y2={y(value)} stroke="currentColor" opacity="0.12" /><text x="62" y={y(value) + 4} textAnchor="end" fill="currentColor" fontSize="10">{Math.round(value).toLocaleString("en")}</text></g>)}
      <polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth="2.5" />
      {points.map((point) => <circle key={point.date} cx={x(point.date)} cy={y(point.closing * point.shares)} r="3" fill="currentColor"><title>{`${point.date}: RWF ${(point.closing * point.shares).toLocaleString("en")}, ${point.shares} shares at ${point.closing}`}</title></circle>)}
      <text x="70" y="186" fill="currentColor" fontSize="11">{series[0].date}</text><text x="560" y="186" textAnchor="end" fill="currentColor" fontSize="11">{series[series.length - 1].date}</text>
    </svg>
    <p className="text-xs text-on-surface-variant">Share price changed {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}% between these observations. Value also changes when purchases add shares.</p>
    <p className="mt-1 text-xs text-on-surface-variant">Dots are recorded quotes; lines connect available dates. Gaps are not daily valuations.</p>
    <details className="mt-3 text-xs"><summary className="cursor-pointer font-bold">Recent observations</summary><ul className="mt-2 space-y-1">{series.slice(-10).reverse().map((point) => <li key={point.date}>{point.date} · RWF {point.closing.toLocaleString("en")} per share · RWF {(point.closing * point.shares).toLocaleString("en")} value</li>)}</ul></details>
  </div>;
}

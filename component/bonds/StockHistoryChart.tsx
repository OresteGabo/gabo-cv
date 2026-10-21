"use client";
import type { EquityObservation } from "@/lib/bonds/market-quotes";
import { localStockDate, stockChartData, type StockChartPoint, type StockChartQuote } from "@/lib/bonds/stock-chart";
import type { EquityHolding } from "@/lib/bonds/types";

const money = (value: number) => `RWF ${value.toLocaleString("en", { maximumFractionDigits: 2 })}`;
export default function StockHistoryChart({ observations, holdings, period, latestQuote = null, valuationDate = localStockDate() }: { observations: EquityObservation[]; holdings: EquityHolding[]; period: "month" | "year" | "all"; latestQuote?: StockChartQuote | null; valuationDate?: string }) {
  const data = stockChartData(holdings, observations, period, valuationDate, latestQuote);
  if (!data) return <p className="py-6 text-sm text-on-surface-variant">No active shares purchased by this date.</p>;
  const { cost, quotes, current, anchor, startDate, endDate, ticker } = data;
  const sampled = quotes.filter((_, index) => index === 0 || index === quotes.length - 1 || index % Math.ceil(quotes.length / 100) === 0);
  const values = [...cost, ...quotes, ...(current ? [current] : [])].map((point) => point.value);
  const minimum = Math.min(...values) * 0.97, maximum = Math.max(...values, 1) * 1.03;
  const firstTime = Date.parse(startDate), lastTime = Date.parse(endDate);
  const x = (date: string) => firstTime === lastTime ? 315 : 78 + (Date.parse(date) - firstTime) / (lastTime - firstTime) * 480;
  const y = (value: number) => 170 - (value - minimum) / Math.max(1, maximum - minimum) * 140;
  const coordinates = (points: StockChartPoint[]) => points.map((point) => `${x(point.date)},${y(point.value)}`).join(" ");
  const costPath = cost.map((point, index) => index === 0 ? `M ${x(point.date)} ${y(point.value)}` : `H ${x(point.date)} V ${y(point.value)}`).join(" ");
  const firstMarket = quotes[0] ?? current;
  const lastMarket = quotes[quotes.length - 1];
  const primary = "var(--md-sys-color-primary)", outline = "var(--md-sys-color-outline)";
  return <div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant" aria-label="Graph legend"><span>━ Cash invested (steps for purchases)</span><span style={{ color: primary }}>● Recorded RSE values</span><span>┄ Cost-to-quote comparison / latest-quote estimate</span></div>
    <svg viewBox="0 0 600 210" role="img" aria-label={`${ticker} purchase cost and estimated value from ${startDate} to ${endDate}`} className="mt-3 w-full" style={{ color: primary }}>
      {[minimum, (minimum + maximum) / 2, maximum].map((value) => <g key={value}><line x1="78" x2="558" y1={y(value)} y2={y(value)} stroke="currentColor" opacity="0.12" /><text x="70" y={y(value) + 4} textAnchor="end" fill="currentColor" fontSize="10">{Math.round(value).toLocaleString("en")}</text></g>)}
      <path d={costPath} fill="none" stroke={outline} strokeWidth="2" aria-label="Cumulative purchase cash cost" />
      {cost.map((point) => <rect key={point.date} x={x(point.date) - 3} y={y(point.value) - 3} width="6" height="6" fill={outline}><title>{`${point.date}: purchase cash cost ${money(point.value)} for ${point.shares} shares`}</title></rect>)}
      {anchor && firstMarket && <polyline points={coordinates([anchor, firstMarket])} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" aria-label="Purchase cost to first available quoted value comparison" />}
      {sampled.length >= 2 && <polyline points={coordinates(sampled)} fill="none" stroke="currentColor" strokeWidth="2.5" aria-label="Recorded RSE value observations" />}
      {sampled.map((point) => <circle key={point.date} cx={x(point.date)} cy={y(point.value)} r="3.5" fill="currentColor"><title>{`${point.date}: recorded quote, ${money(point.value)}, ${point.shares} shares at ${point.closing}`}</title></circle>)}
      {current && <>
        {lastMarket && (lastMarket.date !== current.date || lastMarket.value !== current.value) && <polyline points={coordinates([lastMarket, current])} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" aria-label="Today estimate using the latest available quote" />}
        <circle cx={x(current.date)} cy={y(current.value)} r="5" fill="var(--md-sys-color-background)" stroke="currentColor" strokeWidth="2.5"><title>{`Today ${current.date}: estimated ${money(current.value)} using RSE quote dated ${current.quoteDate}`}</title></circle>
      </>}
      {startDate !== endDate && <text x="78" y="195" fill="currentColor" fontSize="11">{startDate}</text>}<text x={startDate === endDate ? 315 : 558} y="195" textAnchor={startDate === endDate ? "middle" : "end"} fill="currentColor" fontSize="11">{endDate} (today)</text>
    </svg>
    {current ? <p className="text-xs text-on-surface-variant"><strong>Today’s estimate ({endDate}): {money(current.value)}.</strong> Uses the latest available RSE price dated {current.quoteDate}.</p> : <p className="text-xs text-on-surface-variant">Current RSE value is unavailable. Your recorded purchase costs are still shown.</p>}
    <p className="mt-2 text-xs leading-5 text-on-surface-variant">Purchase costs include fees. Buying more shares raises the cash-invested line; it is not a market gain. Dashed segments compare known endpoints, not an observed daily price path.</p>
    {startDate === endDate && <p className="mt-2 text-xs text-on-surface-variant">Same-day purchase and valuation: markers share today’s date.</p>}
    <details className="mt-3 text-xs"><summary className="cursor-pointer font-bold">Purchase and quote details</summary><ul className="mt-2 space-y-1">{cost.map((point) => <li key={`cost-${point.date}`}>{point.date} · Cash invested {money(point.value)} · {point.shares} shares</li>)}{quotes.slice(-10).reverse().map((point) => <li key={`quote-${point.date}`}>{point.date} · Recorded RSE {money(point.closing)} per share · {money(point.value)} value</li>)}</ul></details>
  </div>;
}

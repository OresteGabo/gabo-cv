"use client";

import { useState } from "react";
import { RSE_EQUITIES } from "@/lib/bonds/equity-market";
import { equityPriceChartData, nearestEquityPriceDate, type EquityPriceMode, type EquityPricePeriod } from "@/lib/bonds/equity-price-chart";
import type { EquityObservation } from "@/lib/bonds/market-quotes";

const colors = ["#2563eb", "#059669", "#d97706", "#9333ea", "#e11d48", "#0891b2", "#0f766e", "#64748b", "#a16207", "#4f46e5"];
const dateLabel = (date: string) => date.split("-").reverse().join("/");
const number = (value: number) => value.toLocaleString("en", { maximumFractionDigits: 2 });
const price = (value: number) => `RWF ${number(value)}`;
const percent = (value: number) => `${value > 0 ? "+" : ""}${number(value)}%`;
type Props = { observations: EquityObservation[]; tickers: string[]; period: EquityPricePeriod; mode: EquityPriceMode; now?: Date };

export default function EquityPriceHistoryChart({ observations, tickers, period, mode, now }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const data = equityPriceChartData(observations, tickers, period, mode, now);
  if (!data) return <p className="py-6 text-sm leading-6 text-on-surface-variant">No saved prices for this selection yet. The daily collector will add published RSE prices as they become available. Earlier years need historical price data before they can appear here.</p>;
  const width = 960, left = 85, right = 930, top = 28, bottom = 270;
  const firstTime = Date.parse(data.startDate), lastTime = Date.parse(data.endDate);
  const x = (date: string) => firstTime === lastTime ? (left + right) / 2 : left + (Date.parse(date) - firstTime) / (lastTime - firstTime) * (right - left);
  const y = (value: number) => bottom - (value - data.minimum) / (data.maximum - data.minimum) * (bottom - top);
  const inspected = selectedDate && data.dates.includes(selectedDate) ? selectedDate : data.endDate;
  const inspectedIndex = data.dates.indexOf(inspected);
  const format = mode === "price" ? price : percent;
  const color = (ticker: string) => colors[Math.max(0, RSE_EQUITIES.findIndex((company) => company.ticker === ticker)) % colors.length];
  const companyName = (ticker: string) => RSE_EQUITIES.find((company) => company.ticker === ticker)?.name ?? ticker;
  const multipleDates = data.dates.length > 1;
  const tickCount = Math.min(5, data.dates.length);
  const ticks = multipleDates ? Array.from({ length: tickCount }, (_, index) => new Date(firstTime + (lastTime - firstTime) * index / (tickCount - 1)).toISOString().slice(0, 10)) : [data.startDate];

  return <div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
      <p>{dateLabel(data.startDate)}{multipleDates ? ` – ${dateLabel(data.endDate)}` : " · One recorded market date"}</p>
      <p>{mode === "price" ? "Closing price per share · RWF" : "Price change from each company’s first recorded price in this range"}</p>
    </div>
    <div className="mt-3 overflow-x-auto">
      <svg viewBox={`0 0 ${width} 320`} role="img" aria-label={`RSE closing ${mode === "price" ? "share prices in RWF" : "price changes in percent"} from ${data.startDate} to ${data.endDate}`} className="w-full min-w-[600px]" style={{ touchAction: "pan-y" }} onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const relative = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width * width / (right - left) - left / (right - left)));
        setSelectedDate(nearestEquityPriceDate(data.dates, firstTime + relative * (lastTime - firstTime)));
      }}>
        <title>RSE company price evolution</title>
        <desc>Each line connects recorded closing prices for one company. Missing dates are not added. Use the date slider or the recorded price table for exact observations.</desc>
        {Array.from({ length: 5 }, (_, index) => data.minimum + (data.maximum - data.minimum) * index / 4).map((value, index) => <g key={index}>
          <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="var(--md-sys-color-outline)" opacity="0.15" />
          <text x={left - 12} y={y(value) + 4} textAnchor="end" fill="var(--md-sys-color-on-surface-variant)" fontSize="12">{mode === "price" ? number(value) : `${number(value)}%`}</text>
        </g>)}
        {ticks.map((date, index) => <text key={index} x={x(date)} y="301" textAnchor={index === 0 && multipleDates ? "start" : index === ticks.length - 1 && multipleDates ? "end" : "middle"} fill="var(--md-sys-color-on-surface-variant)" fontSize="12">{dateLabel(date)}</text>)}
        <line x1={x(inspected)} x2={x(inspected)} y1={top} y2={bottom} stroke="var(--md-sys-color-outline)" strokeDasharray="3 5" opacity="0.5" />
        {data.series.map((series) => {
          const index = Math.max(0, RSE_EQUITIES.findIndex((company) => company.ticker === series.ticker));
          const point = series.points.find((item) => item.date === inspected);
          return <g key={series.ticker}>
            {series.points.length >= 2 && <polyline points={series.points.map((item) => `${x(item.date)},${y(item.value)}`).join(" ")} fill="none" stroke={color(series.ticker)} strokeWidth="2.5" strokeDasharray={index < 5 ? undefined : "7 3"} aria-label={`${companyName(series.ticker)} recorded prices`} />}
            {series.points.length <= 2 && series.points.map((item) => <circle key={item.date} cx={x(item.date)} cy={y(item.value)} r="4" fill={color(series.ticker)}><title>{`${companyName(series.ticker)} · ${dateLabel(item.date)} · ${price(item.closing)}${mode === "change" ? ` · ${percent(item.value)}` : ""}`}</title></circle>)}
            {point && <circle cx={x(point.date)} cy={y(point.value)} r="5" fill="var(--md-sys-color-background)" stroke={color(series.ticker)} strokeWidth="2.5" />}
          </g>;
        })}
      </svg>
    </div>
    {multipleDates ? <label className="mt-2 block text-xs font-bold">Inspect market date: {dateLabel(inspected)}
      <input type="range" min={0} max={data.dates.length - 1} step={1} value={inspectedIndex} onChange={(event) => setSelectedDate(data.dates[Number(event.target.value)])} aria-valuetext={dateLabel(inspected)} className="mt-3 block min-h-6 w-full accent-[var(--md-sys-color-primary)]" />
    </label> : <p className="mt-2 text-xs leading-5 text-on-surface-variant">Only one market date has been recorded so far. Dots show those prices; a trend line will appear as more dates are collected. Older years cannot be reconstructed from a current quote.</p>}
    <ul aria-label={`Company prices recorded on ${dateLabel(inspected)}`} className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {data.series.map((series) => {
        const point = series.points.find((item) => item.date === inspected);
        return <li key={series.ticker} className="rounded-lg border border-outline/10 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 font-bold"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(series.ticker) }} />{companyName(series.ticker)} <span className="text-on-surface-variant">{series.ticker}</span></span>
          <span className="mt-1 block font-mono tabular-nums">{point ? format(point.value) : "No recorded price on this date"}</span>
          {mode === "change" && series.first && <span className="mt-1 block text-[10px] text-on-surface-variant">From {price(series.first.closing)} · {dateLabel(series.first.date)}</span>}
        </li>;
      })}
    </ul>
    <p className="mt-4 text-xs leading-5 text-on-surface-variant">Lines connect recorded closes; they do not fill in missing daily prices. Price changes exclude dividends. Use the company selector to inspect overlapping lines.</p>
  </div>;
}

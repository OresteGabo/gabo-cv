"use client";

import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { RSE_EQUITIES, equityDailyRows, equityMarketDate, equityPriceChange } from "@/lib/bonds/equity-market";
import type { EquityObservation, EquityQuotes } from "@/lib/bonds/market-quotes";
import { useDeferredMarket } from "./useDeferredMarket";

const number = (value: number) => value.toLocaleString("en", { maximumFractionDigits: 2 });
const dateLabel = (date: string) => date.split("-").reverse().join("/");
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${number(Math.abs(value))}`;
type History = { available: boolean; resolution: "daily" | "monthly"; observations: EquityObservation[] };
type Props = { data: EquityQuotes | null; error: boolean; loading: boolean; onRetry: () => void };

export default function RseEquityMarket({ data, error, loading, onRetry }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [selected, setSelected] = useState("all");
  const symbols = RSE_EQUITIES.map((company) => company.ticker).join(",");
  const history = useDeferredMarket<History>(`/api/bonds/rse/equity-history?tickers=${symbols}&period=${period}`, expanded && !loading);
  const companies = RSE_EQUITIES.filter((company) => selected === "all" || selected === company.ticker);
  const days = equityDailyRows(history.data?.observations ?? [], companies.map((company) => company.ticker), period);
  const marketDate = equityMarketDate(data?.source.publishedAt);
  const unavailable = error || data?.source.status === "error";
  const quotes = new Map((data?.quotes ?? []).map((quote) => [quote.ticker, quote]));
  const quoted = RSE_EQUITIES.filter((company) => quotes.has(company.ticker)).length;
  const th = "whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant";
  const td = "whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums";

  return <section aria-labelledby="rse-equity-title" className="mt-8 overflow-hidden rounded-xl border border-outline/15 bg-surface-container-lowest/75 sm:rounded-2xl">
    <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Rwanda Stock Exchange</p>
        <h2 id="rse-equity-title" className="mt-1 text-xl font-black">Market prices</h2>
        <p className="mt-2 text-xs leading-5 text-on-surface-variant">All ten companies, whether or not you own their shares. Prices per share in RWF.</p>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <button type="button" disabled={loading} onClick={() => { onRetry(); if (expanded) history.retry(); }} className="inline-flex min-h-10 items-center gap-2 font-bold underline disabled:opacity-50"><RefreshCw size={14} />Refresh prices</button>
        <a href="https://rse.rw/equities-market" target="_blank" rel="noreferrer" className="underline">View RSE source</a>
      </div>
    </div>
    <div role="status" className="border-y border-outline/10 bg-surface-container-low/50 px-4 py-3 text-xs leading-5 text-on-surface-variant sm:px-6">
      {loading ? "Refreshing RSE prices…" : unavailable ? data?.quotes.length ? "RSE could not be refreshed. Previously loaded quotes are still shown." : "RSE prices are unavailable. You can retry or open saved daily history below." : data?.source.status === "empty" ? "RSE returned no usable prices. No prices have been filled in." : <>{quoted} of {RSE_EQUITIES.length} companies quoted · {marketDate ? <>Published <strong>{dateLabel(marketDate)}</strong> (Kigali)</> : "Publication date unavailable"}{data?.source.stale ? " · Cached after an RSE error" : ""}{data?.source.status === "partial" ? " · Incomplete RSE update" : ""}</>}
    </div>
    <div className="overflow-x-auto" role="region" aria-label="RSE company prices, scroll horizontally for more columns" tabIndex={0}>
      <table className="w-full min-w-[820px] border-collapse">
        <caption className="sr-only">Latest RSE closing prices, previous closing prices, changes and reported trading volume for ten companies.</caption>
        <thead className="bg-surface-container-low/50"><tr>
          <th scope="col" className={`${th} sticky left-0 z-10 bg-[var(--md-sys-color-background)] text-left`}>Company</th>
          <th scope="col" className={`${th} text-right`}>Symbol</th><th scope="col" className={`${th} text-right`}>Closing (RWF)</th><th scope="col" className={`${th} text-right`}>Previous (RWF)</th><th scope="col" className={`${th} text-right`}>Change (RWF / %)</th><th scope="col" className={`${th} text-right`}>Shares traded</th><th scope="col" className={`${th} text-left`}>Activity</th>
        </tr></thead>
        <tbody className="divide-y divide-outline/10">{RSE_EQUITIES.map((company) => {
          const quote = quotes.get(company.ticker);
          const change = equityPriceChange(quote);
          return <tr key={company.ticker}>
            <th scope="row" className="sticky left-0 z-10 bg-[var(--md-sys-color-background)] px-4 py-3 text-left text-sm font-bold">{company.name}</th>
            <td className={`${td} text-on-surface-variant`}>{company.ticker}</td>
            <td className={`${td} font-bold`}>{quote ? number(quote.closing) : "—"}</td>
            <td className={td}>{quote?.previous === null || !quote ? "—" : number(quote.previous)}</td>
            <td className={`${td} ${change && change.amount < 0 ? "text-error" : change && change.amount > 0 ? "text-primary" : "text-on-surface-variant"}`}>{change ? `${signed(change.amount)} (${signed(change.percent)}%)` : "—"}</td>
            <td className={td}>{quote?.volume === null || !quote ? "—" : number(quote.volume)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-on-surface-variant">{!quote ? "Quote unavailable" : quote.volume === null ? "Volume unavailable" : quote.volume === 0 ? "No trades reported" : "Trades reported"}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p className="px-4 py-3 text-xs leading-5 text-on-surface-variant sm:px-6">Change compares closing with the previous price published by RSE. A closing quote can stay unchanged when no shares trade.</p>
    <div className="border-t border-outline/15">
      <button type="button" aria-expanded={expanded} aria-controls="rse-daily-history" onClick={() => setExpanded((value) => !value)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-bold sm:px-6">
        Saved daily price history <ChevronDown size={18} className={expanded ? "rotate-180" : ""} />
      </button>
      {expanded && <div id="rse-daily-history" className="border-t border-outline/10">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <p className="max-w-xl text-xs leading-5 text-on-surface-variant">Collection is scheduled daily around 20:00 Kigali time. Dates below are RSE publication dates; missing prices are shown as —. History builds as updates are collected.</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold">Company <select value={selected} onChange={(event) => setSelected(event.target.value)} className="ml-2 rounded-lg border border-outline/20 bg-background px-2 py-2 font-normal"><option value="all">All companies</option>{RSE_EQUITIES.map((company) => <option key={company.ticker} value={company.ticker}>{company.name}</option>)}</select></label>
            <label className="text-xs font-bold">Period <select value={period} onChange={(event) => setPeriod(event.target.value as "month" | "year")} className="ml-2 rounded-lg border border-outline/20 bg-background px-2 py-2 font-normal"><option value="month">Last month</option><option value="year">Last year</option></select></label>
          </div>
        </div>
        {history.error || history.data?.available === false ? <p role="alert" className="px-4 pb-4 text-sm text-on-surface-variant sm:px-6">Saved price history is unavailable. <button type="button" onClick={history.retry} className="font-bold underline">Try again</button></p> : !history.data ? <p role="status" className="px-4 pb-4 text-sm text-on-surface-variant sm:px-6">{history.loading ? "Loading saved daily prices…" : "Waiting for an idle moment to load history…"}</p> : <>
          {history.loading && <p role="status" className="px-4 pb-3 text-xs text-on-surface-variant sm:px-6">Refreshing saved daily prices…</p>}
          {days.length === 0 ? <p className="px-4 pb-4 text-sm text-on-surface-variant sm:px-6">No saved prices for this selection yet. The daily collector will add new published market dates.</p> : <div className="max-h-[32rem] overflow-auto" role="region" aria-label="Saved daily prices, scroll for more dates and companies" tabIndex={0}>
            <table className="w-full border-collapse">
              <caption className="sr-only">Saved closing prices in RWF per share, newest market date first. A dash means no recorded price.</caption>
              <thead className="sticky top-0 z-20 bg-[var(--md-sys-color-background)]"><tr><th scope="col" className={`${th} sticky left-0 z-30 bg-[var(--md-sys-color-background)] text-left`}>Market date</th>{companies.map((company) => <th key={company.ticker} scope="col" title={company.name} className={`${th} text-right`}>{company.ticker}</th>)}</tr></thead>
              <tbody className="divide-y divide-outline/10">{days.map((day) => <tr key={day.date}><th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-[var(--md-sys-color-background)] px-4 py-3 text-left text-xs font-bold tabular-nums">{dateLabel(day.date)}</th>{companies.map((company) => <td key={company.ticker} className={td}>{day.prices.has(company.ticker) ? number(day.prices.get(company.ticker)!) : <span aria-label="No recorded price" className="text-on-surface-variant">—</span>}</td>)}</tr>)}</tbody>
            </table>
          </div>}
        </>}
      </div>}
    </div>
  </section>;
}

"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { BondAccountAccess } from "./BondAccountAccess";
import { BondPortfolioChrome } from "./BondSiteChrome";
import { useDeferredMarket } from "./useDeferredMarket";
import { equityValuation, type EquityObservation, type EquityQuotes } from "@/lib/bonds/market-quotes";
import type { EquityHolding } from "@/lib/bonds/types";
import { localStockDate } from "@/lib/bonds/stock-chart";

const HistoryChart = dynamic(() => import("./StockHistoryChart"), { ssr: false, loading: () => <p className="py-6 text-sm text-on-surface-variant">Preparing graph…</p> });
const EquityMarket = dynamic(() => import("./RseEquityMarket"), { ssr: false, loading: () => <p role="status" className="mt-8 py-6 text-sm text-on-surface-variant">Preparing market table…</p> });
const money = (amount: number, currency = "RWF") => `${currency} ${amount.toLocaleString("en", { maximumFractionDigits: 2 })}`;

export function StockPerformance() {
  const [holdings, setHoldings] = useState<EquityHolding[]>([]);
  const [status, setStatus] = useState<"loading" | "signed-out" | "ready" | "error">("loading");
  const [authenticated, setAuthenticated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [period, setPeriod] = useState<"month" | "year" | "all">("all");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/bonds/equities", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (response.status === 401) { setAuthenticated(false); setHoldings([]); setStatus("signed-out"); return; }
      if (!response.ok) throw new Error("Holdings unavailable.");
      const data = await response.json();
      if (!controller.signal.aborted) { setAuthenticated(true); setHoldings(data.holdings); setStatus("ready"); }
    }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [attempt]);
  const valuationDate = localStockDate();
  const active = holdings.filter((holding) => holding.status === "active" && holding.tradeDate <= valuationDate);
  const market = useDeferredMarket<EquityQuotes>("/api/bonds/rse/quotes?kind=equities", status === "ready");
  const tickers = [...new Set(active.map((holding) => holding.ticker))].sort().join(",");
  const history = useDeferredMarket<{ available: boolean; resolution: "daily" | "monthly"; observations: EquityObservation[] }>(`/api/bonds/rse/equity-history?tickers=${encodeURIComponent(tickers)}&period=${period}`, status === "ready" && Boolean(market.data) && Boolean(tickers));
  const groups = new Map<string, EquityHolding[]>();
  for (const holding of active) { const key = `${holding.ticker}-${holding.currency}`; groups.set(key, [...(groups.get(key) ?? []), holding]); }
  const reset = () => { setStatus("loading"); setAttempt((value) => value + 1); };
  return <main className="bond-app min-h-screen bg-background pb-28 text-on-background">
    <BondPortfolioChrome active="/stocks" authenticated={authenticated} />
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><BarChart3 size={16} />Your stocks</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Stocks & market prices</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">Follow ten RSE companies and compare your shares with their purchase cost. Holdings load first; market tables and graphs follow when the page is idle. Estimated values exclude dividends and selling fees.</p>
      {status === "loading" && <p role="status" className="mt-8 rounded-2xl border border-outline/10 p-6">Loading your saved shares…</p>}
      {status === "signed-out" && <div className="mt-6 max-w-lg"><BondAccountAccess onAuthenticated={() => { setAuthenticated(true); reset(); }} /></div>}
      {status === "error" && <div role="alert" className="mt-8 rounded-2xl border border-outline/10 p-6">Your holdings could not be loaded. <button type="button" onClick={reset} className="font-bold underline">Try again</button></div>}
      {status === "ready" && (market.data || market.error ? <EquityMarket data={market.data} error={market.error} loading={market.loading} onRetry={() => { market.retry(); history.retry(); }} /> : <p role="status" className="mt-8 rounded-xl border border-outline/10 p-4 text-sm text-on-surface-variant">{market.loading ? "Loading optional RSE prices…" : "Market prices will load when the page is idle…"}</p>)}
      {status === "ready" && !active.length && <div className="mt-8 rounded-3xl border border-outline/10 p-8"><h2 className="text-xl font-black">No active stock holdings</h2><p className="mt-3 text-sm text-on-surface-variant">Your account has no saved active shares to chart. Your bonds remain available in the portfolio.</p><Link href="/portfolio" prefetch={false} className="mt-4 inline-block text-sm font-bold underline">Back to portfolio</Link></div>}
      {status === "ready" && active.length > 0 && <>
        <h2 className="mt-10 text-xl font-black">Your stock performance</h2>
        <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Chart time range">{([["month", "Last month"], ["year", "Last year"], ["all", "All collected"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} style={period === value ? { color: "var(--md-sys-color-on-primary)", backgroundColor: "var(--md-sys-color-primary)" } : undefined} className="rounded-xl border border-outline/15 px-4 py-2 text-xs font-bold">{label}</button>)}</div>
        <p className="mt-3 text-xs leading-5 text-on-surface-variant">Each company combines your purchases. Graphs start with recorded purchase costs and extend to today’s estimate using the latest RSE quote. Daily collection builds price history from RSE’s published market dates; dashed comparisons do not represent daily price history. Only currently active positions are included.</p>
        {history.data?.resolution === "monthly" && <p className="mt-2 text-xs text-on-surface-variant">Long histories show each month’s first and last recorded prices to keep the graph light. Choose Last month or Last year for daily observations.</p>}
        <div className="mt-6 space-y-5">{[...groups].map(([key, lots]) => {
          const holding = lots[0];
          const shares = lots.reduce((total, lot) => total + lot.shares, 0), cost = lots.reduce((total, lot) => total + lot.netAmountPayable, 0);
          const valued = market.data ? equityValuation({ ...holding, shares, netAmountPayable: cost }, market.data.quotes) : null;
          const source = market.data?.source;
          const currentDate = source?.publishedAt ? new Date(new Date(source.publishedAt).getTime() + 2 * 3600000).toISOString().slice(0, 10) : null;
          const observations = [...(history.data?.observations ?? []), ...(valued && currentDate && source ? [{ ticker: holding.ticker, closing: valued.quote.closing, date: currentDate, observedAt: source.checkedAt }] : [])];
          return <article key={key} className="rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5 sm:p-6">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-black">{holding.securityName}</h2><p className="font-mono text-xs text-on-surface-variant">{holding.ticker} · {shares.toLocaleString()} shares</p></div>
            <p className="mt-2 text-xs text-on-surface-variant">{lots.length} {lots.length === 1 ? "purchase" : "purchases"} · Average cash cost per share: <strong>{money(cost / shares, holding.currency)}</strong> (weighted by shares, including purchase fees)</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-on-surface-variant">Cash cost including purchase fees</p><p className="mt-1 text-lg font-black">{money(cost, holding.currency)}</p></div><div><p className="text-xs text-on-surface-variant">RSE estimated market value</p><p className="mt-1 text-lg font-black">{valued ? money(valued.value, holding.currency) : "Unavailable"}</p></div><div><p className="text-xs text-on-surface-variant">Unrealized gain / loss</p><p className={`mt-1 text-lg font-black ${valued && valued.gain < 0 ? "text-error" : "text-primary"}`}>{valued ? `${valued.gain >= 0 ? "+" : ""}${money(valued.gain)}${valued.gainPercent !== null ? ` (${valued.gainPercent >= 0 ? "+" : ""}${valued.gainPercent.toFixed(2)}%)` : ""}` : "Not enough price data"}</p></div></div>
            {valued && <div className="mt-5 space-y-2" aria-label="Purchase cost and current value comparison">{[["Purchase cost", cost], ["RSE value", valued.value]].map(([label, value]) => <div key={String(label)} className="flex items-center gap-3 text-xs"><span className="w-24 shrink-0">{label}</span><div className="h-3 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--md-sys-color-outline) 12%, transparent)" }}><div className="h-full rounded-full" style={{ width: `${Number(value) / Math.max(cost, valued.value, 1) * 100}%`, backgroundColor: label === "RSE value" ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline)" }} /></div><span className="w-28 shrink-0 text-right">{money(Number(value))}</span></div>)}</div>}
            {valued?.quote.volume === 0 && <p className="mt-3 text-xs text-on-surface-variant">No shares traded in RSE’s displayed update; the closing quote is not a fresh execution.</p>}
            {holding.currency !== "RWF" && <p className="mt-3 text-xs text-on-surface-variant">No currency conversion is applied to this holding.</p>}
            <div className="mt-6 border-t border-outline/10 pt-4"><h3 className="text-sm font-black">Purchase cost and estimated value</h3>{holding.currency !== "RWF" ? <p className="mt-3 text-xs text-on-surface-variant">An RWF chart cannot value holdings in another currency.</p> : market.data ? <HistoryChart observations={observations} holdings={lots} period={period} valuationDate={valuationDate} latestQuote={valued && currentDate ? { closing: valued.quote.closing, date: currentDate } : null} /> : <p className="mt-3 text-xs text-on-surface-variant">The graph will appear after market data loads.</p>}
              {history.loading && <p className="mt-3 text-xs text-on-surface-variant">Adding collected price history in the background…</p>}
              {history.data?.available && !history.data.observations.some((point) => point.ticker === holding.ticker) && <p className="mt-3 text-xs text-on-surface-variant">No saved prices in this range yet. History builds as daily RSE updates are collected; earlier prices cannot be reconstructed from today’s quote.</p>}
              {(history.error || history.data?.available === false) && <p className="mt-3 text-xs text-on-surface-variant">Saved history is unavailable. The current quote is still shown when available.</p>}
            </div>
          </article>;
        })}</div>
      </>}
    </section>
  </main>;
}

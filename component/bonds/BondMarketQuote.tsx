"use client";
import { bondQuoteRange, type BondQuotes } from "@/lib/bonds/market-quotes";
import type { BondPurchase } from "@/lib/bonds/types";

export function BondMarketQuote({ purchase, data, loading, error, retry }: { purchase: BondPurchase; data: BondQuotes | null; loading: boolean; error: boolean; retry: () => void }) {
  if (!data) return <div className="min-w-48 text-[11px] text-on-surface-variant">{error ? <><span>RSE unavailable</span><button type="button" onClick={retry} className="ml-2 underline">Retry</button></> : loading ? "Checking RSE quotes…" : "Market quotes load after your portfolio"}</div>;
  const range = bondQuoteRange(purchase, data);
  const source = data.source;
  if (source.status === "error") return <div className="min-w-48 text-[11px] text-on-surface-variant">RSE unavailable <button type="button" onClick={retry} className="ml-1 underline">Retry</button></div>;
  if (!range) return <div className="min-w-48 text-[11px] text-on-surface-variant">{source.status === "partial" || data.listingSource.status === "error" ? "RSE coverage incomplete" : "No matching trade listed"}<a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block underline">View RSE bond market</a></div>;
  const low = range.low - purchase.pricePercent, high = range.high - purchase.pricePercent;
  const format = (value: number) => value.toFixed(2);
  const delta = (value: number) => `${value > 0 ? "+" : ""}${format(value)}`;
  return <div className="min-w-52 space-y-1 text-[11px]">
    <strong className="block text-sm">{format(range.low)}{range.low !== range.high ? `–${format(range.high)}` : ""}% of face</strong>
    <p className={low > 0 ? "text-primary" : high < 0 ? "text-error" : "text-on-surface-variant"}>{delta(low)}{low !== high ? ` to ${delta(high)}` : ""} pp vs your price</p>
    <p className="text-on-surface-variant">{range.rows > 1 ? `${range.rows} listed rows · ` : ""}Trade date not provided</p>
    <a href={source.url} target="_blank" rel="noreferrer" className="block text-on-surface-variant underline">{source.stale ? "Cached" : "RSE"} · checked {new Date(source.checkedAt).toLocaleDateString()}</a>
    {(source.status === "partial" || data.listingSource.status === "partial") && <p className="text-on-surface-variant">Some RSE pages unavailable</p>}
  </div>;
}

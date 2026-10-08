import { ExternalLink, RadioTower } from "lucide-react";
import Image from "next/image";
import { formatPercent } from "@/lib/bonds/calculations";
import type { RseMarketData, RseOutstandingBond } from "@/lib/bonds/rse";
import { RseMarketErrorTable } from "./RseMarketErrorTable";
import { RseRankedBondTable } from "./RseRankedBondTable";

function formatMarketUpdated(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Kigali",
  }).format(new Date(value));
}

function rankedBonds(bonds: RseOutstandingBond[]) {
  return [...bonds].sort(
    (left, right) =>
      right.strategyScore - left.strategyScore ||
      right.netAnnualizedYield - left.netAnnualizedYield ||
      right.yearsRemaining - left.yearsRemaining,
  );
}

function MarketTile({
  label,
  value,
  detail,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-outline/10 bg-background/65 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      {loading ? (
        <>
          <span className="mt-3 block h-7 w-24 animate-pulse rounded-full bg-outline/10" />
          <span className="mt-3 block h-3 w-full animate-pulse rounded-full bg-outline/10" />
        </>
      ) : (
        <>
          <p className="mt-2 text-2xl font-black text-primary">{value}</p>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">{detail}</p>
        </>
      )}
    </div>
  );
}

function MarketHighlightsFrame({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-[0_28px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="border-b border-outline/10 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-outline/10 bg-white p-1.5">
              <Image
                src="/brands/bnr-logo.png"
                alt="National Bank of Rwanda logo"
                width={42}
                height={42}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                {loading ? "Loading RSE feed" : "Live market board"}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Current RSE signals
              </h2>
            </div>
          </div>
          <a
            href="https://www.bnr.rw/mminstruments"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline/10 text-on-surface-variant transition hover:border-primary/40 hover:text-primary"
            aria-label="Open BNR market instruments"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
      {children}
    </aside>
  );
}

export function RseMarketHighlightsFallback({
  fallbackFacts,
}: {
  fallbackFacts: { label: string; value: string; detail: string }[];
}) {
  return (
    <MarketHighlightsFrame loading>
      <div className="p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <MarketTile
            label="Top net annualized yield"
            value=""
            detail=""
            loading
          />
          <MarketTile label="Yield records" value="" detail="" loading />
          {fallbackFacts.map((fact) => (
            <MarketTile key={fact.label} {...fact} />
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-outline/10">
          <div className="flex items-center justify-between gap-3 border-b border-outline/10 bg-surface-container-low/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Top ranked bonds
            </p>
            <span className="text-[10px] font-black text-primary">
              Score · Net yield
            </span>
          </div>
          <div className="divide-y divide-outline/10">
            {[0, 1, 2].map((row) => (
              <div key={row} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                <span className="h-3 w-4 animate-pulse rounded-full bg-outline/10" />
                <div className="min-w-0">
                  <span className="block h-4 w-4/5 animate-pulse rounded-full bg-outline/10" />
                  <span className="mt-2 block h-3 w-32 animate-pulse rounded-full bg-outline/10" />
                </div>
                <span className="h-7 w-12 animate-pulse rounded-full bg-outline/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketHighlightsFrame>
  );
}

export async function RseMarketHighlights({
  fallbackFacts,
  marketDataPromise,
}: {
  fallbackFacts: { label: string; value: string; detail: string }[];
  marketDataPromise: Promise<RseMarketData>;
}) {
  const marketData = await marketDataPromise;
  const rankedPreview = rankedBonds(marketData.outstanding).slice(0, 3);
  const topOpportunity = rankedPreview[0] ?? null;
  const marketUpdated = formatMarketUpdated(marketData.fetchedAt);
  const highlights = [
    {
      label: "Top net annualized yield",
      value: topOpportunity
        ? formatPercent(topOpportunity.netAnnualizedYield, 2)
        : "Awaiting feed",
      detail: topOpportunity
        ? `${topOpportunity.code} · ${topOpportunity.yearsRemaining.toFixed(1)} years left`
        : "RSE data will appear when the source responds.",
    },
    {
      label: "Yield records",
      value:
        marketData.outstanding.length > 0
          ? String(marketData.outstanding.length)
          : "0",
      detail: `${marketData.treasuryRowsAnalyzed} Treasury rows analyzed from RSE.`,
    },
    ...fallbackFacts,
  ];

  return (
    <MarketHighlightsFrame>
      <div className="p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {highlights.map((fact) => (
            <MarketTile key={fact.label} {...fact} />
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-outline/10">
          <div className="flex items-center justify-between gap-3 border-b border-outline/10 bg-surface-container-low/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Top ranked bonds
            </p>
            <span className="text-[10px] font-black text-primary">
              {marketUpdated ? "Updated" : "Score · Net yield"}
            </span>
          </div>
          {rankedPreview.length > 0 ? (
            <div className="divide-y divide-outline/10">
              {rankedPreview.map((bond, index) => (
                <div key={`${bond.code}-${bond.yieldToMaturity}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <span className="font-mono text-xs text-outline">0{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-on-surface">
                      {bond.bond}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-on-surface-variant">
                      {bond.code} · {bond.yearsRemaining.toFixed(1)} years
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">{bond.strategyScore.toFixed(1)}</p>
                    <p className="text-[11px] font-bold text-on-surface-variant">
                      {formatPercent(bond.netAnnualizedYield, 2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm font-bold text-on-surface-variant">
              Market data is unavailable right now. The full source table below
              will show a fallback state.
            </div>
          )}
        </div>
      </div>
    </MarketHighlightsFrame>
  );
}

export function RseMarketTableFallback() {
  return (
    <div>
      <div className="border-b border-outline/10 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Treasury listings
            </p>
            <h3 className="mt-1 font-black">Fixed income board</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-outline/15 bg-surface-container px-4 py-2.5 text-xs font-black text-on-surface-variant">
            <RadioTower size={14} className="animate-pulse text-primary" />
            Loading RSE data
          </span>
        </div>
      </div>
      <div className="grid min-h-[320px] place-items-center px-5 py-10">
        <div className="w-full max-w-xl rounded-2xl border border-outline/10 bg-surface-container-low/70 p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <RadioTower size={22} className="animate-pulse" />
          </span>
          <p className="mt-5 text-sm font-black text-on-surface">
            Loading from RSE...
          </p>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            The market table will appear here when the fixed-income board responds.
          </p>
          <div className="mt-6 space-y-3" aria-hidden="true">
            <span className="mx-auto block h-3 w-full max-w-md animate-pulse rounded-full bg-outline/10" />
            <span className="mx-auto block h-3 w-4/5 max-w-sm animate-pulse rounded-full bg-outline/10" />
            <span className="mx-auto block h-3 w-3/5 max-w-xs animate-pulse rounded-full bg-outline/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function RseMarketTable({
  marketDataPromise,
}: {
  marketDataPromise: Promise<RseMarketData>;
}) {
  const marketData = await marketDataPromise;
  const marketUpdated = formatMarketUpdated(marketData.fetchedAt);

  if (marketData.outstanding.length === 0) {
    return (
      <RseMarketErrorTable
        sourceName="RSE Fixed Income Board"
        sourceUrl="https://rse.rw/fixed-income-board"
      />
    );
  }

  return (
    <RseRankedBondTable
      bonds={marketData.outstanding}
      pagesFetched={marketData.fixedIncomePagesFetched}
      rowsAnalyzed={marketData.treasuryRowsAnalyzed}
      marketUpdated={marketUpdated}
    />
  );
}

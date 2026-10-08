"use client";

import { AlertCircle, ExternalLink, RadioTower } from "lucide-react";
import Image from "next/image";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatPercent } from "@/lib/bonds/calculations";
import type { RseMarketData, RseOutstandingBond } from "@/lib/bonds/rse";
import { RseMarketErrorTable } from "./RseMarketErrorTable";
import { RseRankedBondTable } from "./RseRankedBondTable";

type RseMarketState = {
  data: RseMarketData | null;
  error: string | null;
  loading: boolean;
  marketUpdated: string | null;
  refresh: () => void;
};

const RseMarketContext = createContext<RseMarketState | null>(null);

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

function useRseMarket() {
  const context = useContext(RseMarketContext);
  if (!context) {
    throw new Error("RSE market components must be used inside RseMarketProvider.");
  }
  return context;
}

export function RseMarketProvider({
  children,
  forceRefresh = false,
}: {
  children: ReactNode;
  forceRefresh?: boolean;
}) {
  const [data, setData] = useState<RseMarketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(forceRefresh ? 1 : 0);

  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ handled?: boolean }>).detail;
      if (detail) detail.handled = true;
      setRefreshNonce((current) => current + 1);
    };
    window.addEventListener("rse-market-refresh", refresh);
    return () => window.removeEventListener("rse-market-refresh", refresh);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMarketData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (forceRefresh || refreshNonce > 0) {
          params.set("refresh", String(Date.now()));
        }
        const response = await fetch(`/api/bonds/rse/market?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`RSE feed returned ${response.status}.`);
        setData((await response.json()) as RseMarketData);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "RSE feed failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMarketData();
    return () => controller.abort();
  }, [forceRefresh, refreshNonce]);

  useEffect(() => {
    if (!forceRefresh) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("rseRefresh")) return;
    url.searchParams.delete("rseRefresh");
    window.history.replaceState(window.history.state, "", url);
  }, [forceRefresh]);

  const value = useMemo<RseMarketState>(
    () => ({
      data,
      error,
      loading,
      marketUpdated: formatMarketUpdated(data?.fetchedAt ?? null),
      refresh: () => setRefreshNonce((current) => current + 1),
    }),
    [data, error, loading],
  );

  return (
    <RseMarketContext.Provider value={value}>
      {children}
    </RseMarketContext.Provider>
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

export function RseMarketHighlights({
  fallbackFacts,
}: {
  fallbackFacts: { label: string; value: string; detail: string }[];
}) {
  const { data, loading, marketUpdated } = useRseMarket();
  const rankedPreview = rankedBonds(data?.outstanding ?? []).slice(0, 3);
  const topOpportunity = rankedPreview[0] ?? null;
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
      value: data?.outstanding.length ? String(data.outstanding.length) : "0",
      detail: `${data?.treasuryRowsAnalyzed ?? 0} Treasury rows analyzed from RSE.`,
    },
    ...fallbackFacts,
  ];

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

      <div className="p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {highlights.map((fact, index) => (
            <MarketTile
              key={fact.label}
              {...fact}
              loading={loading && index < 2}
            />
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
          {loading ? (
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
          ) : rankedPreview.length > 0 ? (
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
    </aside>
  );
}

function LoadingMarketTable() {
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

export function RseMarketTablePanel() {
  const { data, error, loading } = useRseMarket();

  if (loading) return <LoadingMarketTable />;

  if (error || !data || data.outstanding.length === 0) {
    return (
      <div>
        {error && (
          <div className="border-b border-outline/10 bg-error-container/30 p-4 text-xs font-bold text-[var(--md-sys-color-on-error-container)]">
            <span className="inline-flex items-center gap-2">
              <AlertCircle size={15} />
              {error}
            </span>
          </div>
        )}
        <RseMarketErrorTable
          columns={["Bond", "Code", "Maturity", "Coupon", "YTM"]}
          sourceName="RSE Fixed Income Board"
          sourceUrl="https://rse.rw/fixed-income-board"
        />
      </div>
    );
  }

  return (
    <RseRankedBondTable
      bonds={data.outstanding}
      pagesFetched={data.fixedIncomePagesFetched}
      rowsAnalyzed={data.treasuryRowsAnalyzed}
      marketUpdated={formatMarketUpdated(data.fetchedAt)}
    />
  );
}

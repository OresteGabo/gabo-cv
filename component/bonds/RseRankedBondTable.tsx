"use client";

import {
  ArrowDown,
  ArrowUp,
  Award,
  Check,
  ExternalLink,
  HelpCircle,
  Info,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { RseOutstandingBond } from "@/lib/bonds/rse";

type SortKey =
  | "bond"
  | "maturityDate"
  | "couponRate"
  | "grossYield"
  | "netAnnualizedYield"
  | "yearsRemaining"
  | "strategyScore";

function percent(value: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function SortButton({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-black hover:text-primary"
    >
      {label}
      {active &&
        (direction === "desc" ? (
          <ArrowDown size={11} />
        ) : (
          <ArrowUp size={11} />
        ))}
    </button>
  );
}

export function RseRankedBondTable({
  bonds,
  pagesFetched,
  rowsAnalyzed,
}: {
  bonds: RseOutstandingBond[];
  pagesFetched: number;
  rowsAnalyzed: number;
}) {
  const [optimized, setOptimized] = useState(true);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("strategyScore");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!formulaOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFormulaOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [formulaOpen]);

  const ranked = useMemo(
    () =>
      [...bonds]
        .filter((bond) => !optimized || bond.yearsRemaining >= 3)
        .sort((left, right) => {
          if (optimized) {
            return (
              right.strategyScore - left.strategyScore ||
              right.netAnnualizedYield - left.netAnnualizedYield ||
              right.yearsRemaining - left.yearsRemaining
            );
          }
          const leftValue =
            sortKey === "bond"
              ? left.bond
              : sortKey === "maturityDate"
                ? new Date(`${left.maturityDate} UTC`).getTime()
                : sortKey === "couponRate"
                  ? Number(left.couponRate.replace("%", ""))
                  : left[sortKey];
          const rightValue =
            sortKey === "bond"
              ? right.bond
              : sortKey === "maturityDate"
                ? new Date(`${right.maturityDate} UTC`).getTime()
                : sortKey === "couponRate"
                  ? Number(right.couponRate.replace("%", ""))
                  : right[sortKey];
          const comparison =
            typeof leftValue === "string"
              ? leftValue.localeCompare(String(rightValue))
              : Number(leftValue) - Number(rightValue);
          return direction === "asc" ? comparison : -comparison;
        }),
    [bonds, direction, optimized, sortKey],
  );

  function updateSort(key: SortKey) {
    setOptimized(false);
    if (sortKey === key) {
      setDirection((current) => (current === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  }

  return (
    <>
      <div
        className={`border-b px-5 py-4 transition-colors ${
          optimized
            ? "border-primary/25 bg-primary/10"
            : "border-outline/15 bg-surface-container-low/70"
        }`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
          <span className="rounded-full border border-outline/15 bg-background/70 px-2.5 py-1">
            {pagesFetched} RSE {pagesFetched === 1 ? "page" : "pages"} fetched
          </span>
          <span className="rounded-full border border-outline/15 bg-background/70 px-2.5 py-1">
            {rowsAnalyzed} Treasury rows analyzed
          </span>
          <span className="rounded-full border border-outline/15 bg-background/70 px-2.5 py-1">
            {bonds.length} unique yield records
          </span>
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={optimized}
            onClick={() => setOptimized((current) => !current)}
            className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <span className="flex min-w-0 items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                  optimized
                    ? "border-primary/30 bg-primary text-on-primary"
                    : "border-outline/20 bg-background text-on-surface-variant"
                }`}
              >
                <SlidersHorizontal size={18} />
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block text-xs font-black text-on-surface">
                    Optimize for Long-Term Compounding
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${
                      optimized
                        ? "bg-primary text-on-primary"
                        : "border border-outline/20 bg-background text-on-surface-variant"
                    }`}
                  >
                    {optimized ? "Active" : "Inactive"}
                  </span>
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-on-surface-variant">
                  {optimized
                    ? "Filtering short maturities and ranking by the long-term strategy score."
                    : "Showing every listing in your selected column order."}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={`relative h-10 w-[76px] rounded-full border-2 shadow-inner transition-colors ${
                  optimized
                    ? "border-primary bg-primary"
                    : "border-outline/40 bg-background"
                }`}
              >
                <span
                  className={`absolute top-1 grid h-7 w-7 place-items-center rounded-full shadow-md transition-all ${
                    optimized
                      ? "left-[42px] bg-on-primary text-primary"
                      : "left-1 bg-on-surface-variant text-surface"
                  }`}
                >
                  {optimized ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
                </span>
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-[0.16em] ${
                  optimized ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {optimized ? "On" : "Off"}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label="How the strategy score is calculated"
            onClick={() => setFormulaOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline/15 bg-surface-container-lowest/70 text-[var(--md-sys-color-primary)] shadow-sm transition hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <HelpCircle size={19} />
          </button>
        </div>
      </div>

      <div className="bond-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1040px] table-fixed border-collapse text-left">
          <thead className="bg-surface-container text-[9px] uppercase tracking-[0.12em] text-on-surface-variant">
            <tr>
              <th className="w-[24%] px-4 py-3"><SortButton label="Bond" sortKey="bond" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
              <th className="w-[10%] px-3 py-3">Closing</th>
              <th className="w-[11%] px-3 py-3"><SortButton label="Maturity" sortKey="maturityDate" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
              <th className="w-[9%] px-3 py-3"><SortButton label="Years left" sortKey="yearsRemaining" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
              <th className="w-[9%] px-3 py-3"><SortButton label="Coupon" sortKey="couponRate" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
              <th className="w-[12%] px-3 py-3"><SortButton label="Gross YTM" sortKey="grossYield" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
              <th className="w-[13%] px-3 py-3"><SortButton label="Net yield" sortKey="netAnnualizedYield" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
              <th className="w-[12%] px-3 py-3"><SortButton label="Score" sortKey="strategyScore" activeKey={sortKey} direction={direction} onSort={updateSort} /></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((bond, index) => {
              const highlighted = optimized && index < 2;
              return (
                <tr
                  key={`${bond.code}-${bond.yieldToMaturity}`}
                  className={`border-t border-outline/10 text-xs ${
                    highlighted ? "bg-primary/[0.07]" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2">
                      {highlighted && <Award size={17} className="mt-0.5 shrink-0 text-primary" />}
                      <div>
                        <p className="font-black">{bond.bond}</p>
                        <p className="mt-1 font-mono text-[9px] text-outline">{bond.code}</p>
                        {highlighted && (
                          <span className="mt-2 inline-flex rounded-full bg-primary px-2 py-1 text-[8px] font-black uppercase tracking-wider text-on-primary">
                            Top long-term fit
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black">
                    {bond.closingPrice?.toFixed(2) ?? "No recent trade"}
                  </td>
                  <td className="px-4 py-4">{bond.maturityDate}</td>
                  <td className="px-4 py-4 font-black">{bond.yearsRemaining.toFixed(1)}y</td>
                  <td className="px-4 py-4">{bond.couponRate}</td>
                  <td className="px-4 py-4">
                    <p className="font-black">{percent(bond.grossYield)}</p>
                    <p className="mt-1 text-[9px] text-outline">{bond.yieldSource}</p>
                  </td>
                  <td className="px-4 py-4 font-black text-primary">
                    {percent(bond.netAnnualizedYield)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-primary">
                        {bond.strategyScore.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-bold text-outline">/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-outline/10">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${bond.strategyScore}%` }}
                      />
                    </div>
                    <p
                      className="mt-2 text-[8px] leading-4 text-outline"
                      title="Yield · Duration · Price · Data confidence"
                    >
                      Y {bond.yieldScore.toFixed(0)} · D{" "}
                      {bond.durationScore.toFixed(0)} · P{" "}
                      {bond.priceScore.toFixed(0)} · C{" "}
                      {bond.confidenceScore.toFixed(0)}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 border-t border-outline/10 bg-surface-container-low/40 px-5 py-4 text-[10px] leading-4 text-on-surface-variant">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Strategy score = 60% net yield + 25% logistic duration + 10% price
          value + 5% data confidence. Open the formula guide beside the switch
          for the complete calculation. This is a transparent analytical screen,
          not personalized financial advice.
        </p>
      </div>

      {formulaOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-4 backdrop-blur-md"
          onMouseDown={() => setFormulaOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="strategy-formula-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="bond-scrollbar max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-outline/10 bg-surface-container-lowest/95 shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-outline/10 bg-surface-container-lowest/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-primary)]">
                  Ranking methodology
                </p>
                <h2 id="strategy-formula-title" className="mt-1 text-xl font-black text-on-surface">
                  Long-Term Compounding Strategy Score
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-on-surface-variant">
                  A 0–100 strategy-fit score that balances after-tax return,
                  remaining runway, purchase price, and freshness of market data.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close formula guide"
                onClick={() => setFormulaOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline/10 bg-surface-container-low text-on-surface-variant hover:text-primary"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-6 text-sm text-on-surface-variant">
              <blockquote className="rounded-3xl border border-primary/15 bg-primary/[0.06] p-5">
                <p className="font-black text-on-surface">Final allocation</p>
                <p className="mt-2 font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                  Score = (Net Yield × 60%) + (Duration × 25%) + (Price × 10%) + (Confidence × 5%)
                </p>
              </blockquote>

              <ol className="grid gap-4 md:grid-cols-2">
                <li className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5">
                  <p className="font-black text-on-surface">1. Net Yield Score · 60%</p>
                  <p className="mt-2 text-xs leading-5">
                    With a recent closing price, the model solves YTM from
                    semiannual after-tax coupon cash flows. Without a price, it
                    approximates net yield as published RSE YTM × 95%.
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-[var(--md-sys-color-primary)]">
                    min(100, Net Yield ÷ 14% × 100)
                  </p>
                </li>
                <li className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5">
                  <p className="font-black text-on-surface">2. Duration Score · 25%</p>
                  <p className="mt-2 text-xs leading-5">
                    An asymmetric logistic curve penalizes short runways and
                    gradually rewards longer maturities without a hard cutoff.
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-[var(--md-sys-color-primary)]">
                    100 ÷ (1 + e^(-0.35 × (Years Remaining - 10)))
                  </p>
                </li>
                <li className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5">
                  <p className="font-black text-on-surface">3. Price Score · 10%</p>
                  <p className="mt-2 text-xs leading-5">
                    Prices at or below par score 100. A premium above 100 creates
                    a proportional penalty. Missing prices receive a neutral 50.
                  </p>
                  <p className="mt-3 font-mono text-[11px] leading-5 text-[var(--md-sys-color-primary)]">
                    Price ≤ 100: 100<br />
                    Price &gt; 100: max(0, 100 - ((Price - 100) ÷ 100) × 500)
                  </p>
                </li>
                <li className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5">
                  <p className="font-black text-on-surface">4. Data Confidence · 5%</p>
                  <p className="mt-2 text-xs leading-5">
                    A recent market closing price scores 100. A row relying only
                    on RSE-published YTM scores 60 to reflect less current pricing.
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-[var(--md-sys-color-primary)]">
                    Recent price: 100 · Published YTM only: 60
                  </p>
                </li>
              </ol>

              <p className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-3 text-[11px] leading-5">
                When optimization is active, listings with fewer than three years
                remaining are excluded. The score is a comparative research tool,
                not a guarantee of return or personalized investment advice.
              </p>
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-outline/10 bg-surface-container-low/70 px-6 py-5">
              <span className="mr-auto text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
                Primary references
              </span>
              <a
                href="https://www.rse.rw/fixed-income-board"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-outline/15 bg-surface-container-lowest/70 px-3 py-2 text-[10px] font-black text-[var(--md-sys-color-primary)] hover:border-primary/35"
              >
                Rwanda Stock Exchange <ExternalLink size={12} />
              </a>
              <a
                href="https://www.bnr.rw/mminstruments"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-outline/15 bg-surface-container-lowest/70 px-3 py-2 text-[10px] font-black text-[var(--md-sys-color-primary)] hover:border-primary/35"
              >
                National Bank of Rwanda <ExternalLink size={12} />
              </a>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

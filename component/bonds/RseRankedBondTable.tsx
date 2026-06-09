"use client";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { RseOutstandingBond } from "@/lib/bonds/rse-types";

type OpportunitySignal = {
  label: string;
  explanation: string;
  classes: string;
};

function pricePosition(price: number | null) {
  if (price === null) {
    return {
      label: "Unavailable",
      shortLabel: "Unavailable",
      detail: "No price",
      classes: "border-outline/15 bg-surface-container text-on-surface-variant",
    };
  }

  const displayedPrice = Math.round(price * 100) / 100;
  if (displayedPrice < 100) {
    return {
      label: "Discount",
      shortLabel: `Discount -${(100 - displayedPrice).toFixed(2)}`,
      detail: `${(100 - displayedPrice).toFixed(2)} below par`,
      classes:
        "border-tertiary/25 bg-tertiary-container/45 text-[var(--md-sys-color-on-tertiary-container)]",
    };
  }
  if (displayedPrice > 100) {
    return {
      label: "Premium",
      shortLabel: `Premium +${(displayedPrice - 100).toFixed(2)}`,
      detail: `${(displayedPrice - 100).toFixed(2)} above par`,
      classes:
        "border-error/20 bg-error-container/30 text-[var(--md-sys-color-on-error-container)]",
    };
  }
  return {
    label: "At par",
    shortLabel: "At par",
    detail: "Exactly 100",
    classes:
      "border-primary/20 bg-primary-container/35 text-[var(--md-sys-color-on-primary-container)]",
  };
}

function percent(value: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function opportunitySignal(bond: RseOutstandingBond): OpportunitySignal {
  const hasLivePrice = bond.closingPrice !== null;
  const price = bond.closingPrice ?? 0;
  const strongYield = bond.netAnnualizedYield >= 0.115;
  const exceptionalYield = bond.netAnnualizedYield >= 0.125;
  const longRunway = bond.yearsRemaining >= 10;
  const exceptionalRunway = bond.yearsRemaining >= 15;

  if (
    hasLivePrice &&
    price < 100 &&
    exceptionalYield &&
    exceptionalRunway
  ) {
    return {
      label: "Exceptional setup",
      explanation:
        "Live discount price below par, at least 12.5% modeled net yield, and at least 15 years remaining.",
      classes:
        "border-tertiary/30 bg-tertiary-container/70 text-[var(--md-sys-color-on-tertiary-container)]",
    };
  }

  if (hasLivePrice && price <= 102 && strongYield && longRunway) {
    return {
      label: "Attractive setup",
      explanation:
        "Live price no higher than 102, at least 11.5% modeled net yield, and at least 10 years remaining.",
      classes:
        "border-tertiary/25 bg-tertiary-container/45 text-[var(--md-sys-color-on-tertiary-container)]",
    };
  }

  if (!hasLivePrice && strongYield && longRunway) {
    return {
      label: "Promising · verify price",
      explanation:
        "Yield and remaining maturity clear the screen, but there is no recent closing price. Confirm an executable price before judging the opportunity.",
      classes:
        "border-primary/25 bg-primary-container/40 text-[var(--md-sys-color-on-primary-container)]",
    };
  }

  if (
    bond.netAnnualizedYield < 0.11 ||
    bond.yearsRemaining < 5 ||
    (hasLivePrice && price >= 105)
  ) {
    return {
      label: "Below screen threshold",
      explanation:
        "Net yield is below 11%, fewer than five years remain, or the live price carries a premium of 105 or more.",
      classes:
        "border-error/25 bg-error-container/35 text-[var(--md-sys-color-on-error-container)]",
    };
  }

  return {
    label: "Fair · keep watching",
    explanation:
      "The bond is neither clearly weak nor strong enough to meet the attractive-opportunity thresholds.",
    classes:
      "border-outline/20 bg-surface-container text-on-surface-variant",
  };
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
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
        .filter((bond) => bond.yearsRemaining >= 3)
        .sort(
          (left, right) =>
            right.strategyScore - left.strategyScore ||
            right.netAnnualizedYield - left.netAnnualizedYield ||
            right.yearsRemaining - left.yearsRemaining,
        ),
    [bonds],
  );
  const visibleBonds = showAll ? ranked : ranked.slice(0, 5);
  const hasMoreBonds = ranked.length > 5;

  return (
    <>
      <div className="border-b border-primary/25 bg-primary/10 px-5 py-4">
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
          <span className="rounded-full border border-primary/20 bg-primary-container/35 px-2.5 py-1 text-[var(--md-sys-color-on-primary-container)]">
            {ranked.length} long-term candidates
          </span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="block text-xs font-black text-on-surface">
                  Optimized for Long-Term Compounding
                </span>
                <span className="rounded-full bg-[var(--md-sys-color-primary)] px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[var(--md-sys-color-on-primary)]">
                  Always on
                </span>
              </span>
            </span>
          </div>
          <button
            type="button"
            aria-label="How the strategy score is calculated"
            onClick={() => setFormulaOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline/15 bg-surface-container-lowest/70 text-[var(--md-sys-color-primary)] shadow-sm transition hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <HelpCircle size={19} />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-primary/15 pt-4 text-[9px] font-black uppercase tracking-[0.11em]">
          <span className="mr-1 text-on-surface-variant">Price guide</span>
          <span className="rounded-full border border-tertiary/25 bg-tertiary-container/45 px-2.5 py-1 text-[var(--md-sys-color-on-tertiary-container)]">
            Discount · below 100
          </span>
          <span className="rounded-full border border-primary/20 bg-primary-container/35 px-2.5 py-1 text-[var(--md-sys-color-on-primary-container)]">
            At par · exactly 100
          </span>
          <span className="rounded-full border border-error/20 bg-error-container/30 px-2.5 py-1 text-[var(--md-sys-color-on-error-container)]">
            Premium · above 100
          </span>
        </div>
      </div>

      <div className="bond-scrollbar hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
          <thead className="bg-surface-container text-[9px] uppercase tracking-[0.12em] text-on-surface-variant">
            <tr>
              <th className="w-[29%] px-4 py-3">Bond</th>
              <th className="w-[13%] px-3 py-3">Price / 100</th>
              <th className="w-[17%] px-3 py-3">Term</th>
              <th className="w-[24%] px-3 py-3">Returns</th>
              <th className="w-[17%] px-3 py-3">Strategy fit</th>
            </tr>
          </thead>
          <tbody id="fixed-income-ranked-bonds">
            {visibleBonds.map((bond, index) => {
              const highlighted = index < 2;
              const opportunity = opportunitySignal(bond);
              const displayedPrice =
                bond.closingPrice ?? bond.impliedCleanPrice;
              const priceStatus = pricePosition(displayedPrice);
              return (
                <tr
                  key={`${bond.code}-${bond.yieldToMaturity}`}
                  className={`border-t border-outline/10 align-top text-xs ${
                    highlighted ? "bg-primary/[0.07]" : ""
                  }`}
                >
                  <td className="px-4 py-5">
                    <p className="font-black leading-5">{bond.bond}</p>
                    <p className="mt-1 font-mono text-[9px] text-outline">
                      {bond.code}
                    </p>
                    {highlighted && (
                      <span
                        title={opportunity.explanation}
                        className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wider ${opportunity.classes}`}
                      >
                        {opportunity.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-5">
                    <p className="font-black leading-5">
                      {bond.closingPrice !== null
                        ? bond.closingPrice.toFixed(2)
                        : bond.impliedCleanPrice !== null
                          ? `≈ ${bond.impliedCleanPrice.toFixed(2)}`
                          : "Unavailable"}
                    </p>
                    <p className="mt-1 text-[9px] leading-4 text-outline">
                      {bond.closingPrice !== null
                        ? "RSE closing price"
                        : bond.impliedCleanPrice !== null
                          ? "Implied clean price"
                          : "Price not published"}
                    </p>
                    {displayedPrice !== null && (
                      <span
                        title={`${priceStatus.label}: ${priceStatus.detail}`}
                        className={`mt-2 inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wider ${priceStatus.classes}`}
                      >
                        {priceStatus.shortLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-5">
                    <p className="font-black">{bond.yearsRemaining.toFixed(1)} years</p>
                    <p className="mt-1 text-[10px] text-on-surface-variant">
                      Matures {bond.maturityDate}
                    </p>
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-primary">
                        {percent(bond.netAnnualizedYield)}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-outline">
                        Net yield
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-on-surface-variant">
                      <span>
                        <strong className="text-on-surface">{bond.couponRate}</strong>{" "}
                        coupon
                      </span>
                      <span>
                        <strong className="text-on-surface">
                          {percent(bond.grossYield)}
                        </strong>{" "}
                        gross YTM
                      </span>
                    </div>
                    <p className="mt-1.5 text-[8px] text-outline">
                      {bond.yieldSource}
                    </p>
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-primary">
                        {bond.strategyScore.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-bold text-outline">/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-outline/10">
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

      <div id="fixed-income-ranked-bonds-mobile" className="divide-y divide-outline/10 md:hidden">
        {visibleBonds.map((bond, index) => {
          const highlighted = index < 2;
          const opportunity = opportunitySignal(bond);
          const displayedPrice = bond.closingPrice ?? bond.impliedCleanPrice;
          const priceStatus = pricePosition(displayedPrice);
          return (
            <article
              key={`${bond.code}-${bond.yieldToMaturity}-mobile`}
              className={`p-5 ${highlighted ? "bg-primary/[0.07]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black leading-5 text-on-surface">{bond.bond}</p>
                  <p className="mt-1 font-mono text-[9px] text-outline">{bond.code}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-primary">
                    {bond.strategyScore.toFixed(1)}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-wider text-outline">
                    Strategy fit
                  </p>
                </div>
              </div>

              {highlighted && (
                <span
                  title={opportunity.explanation}
                  className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wider ${opportunity.classes}`}
                >
                  {opportunity.label}
                </span>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[8px] font-black uppercase tracking-wider text-outline">
                    Net yield
                  </p>
                  <p className="mt-1 text-base font-black text-primary">
                    {percent(bond.netAnnualizedYield)}
                  </p>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[8px] font-black uppercase tracking-wider text-outline">
                    Price / 100
                  </p>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {bond.closingPrice !== null
                      ? bond.closingPrice.toFixed(2)
                      : bond.impliedCleanPrice !== null
                        ? `≈ ${bond.impliedCleanPrice.toFixed(2)}`
                        : "Unavailable"}
                  </p>
                  <p className="mt-1 text-[9px] text-outline">
                    {bond.closingPrice !== null
                      ? "RSE closing"
                      : bond.impliedCleanPrice !== null
                        ? "Implied clean price"
                        : "Not published"}
                  </p>
                  {displayedPrice !== null && (
                    <span
                      title={`${priceStatus.label}: ${priceStatus.detail}`}
                      className={`mt-2 inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wider ${priceStatus.classes}`}
                    >
                      {priceStatus.shortLabel}
                    </span>
                  )}
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[8px] font-black uppercase tracking-wider text-outline">
                    Time remaining
                  </p>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {bond.yearsRemaining.toFixed(1)} years
                  </p>
                  <p className="mt-1 text-[9px] text-outline">{bond.maturityDate}</p>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[8px] font-black uppercase tracking-wider text-outline">
                    Coupon · Gross YTM
                  </p>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {bond.couponRate} · {percent(bond.grossYield)}
                  </p>
                  <p className="mt-1 text-[9px] text-outline">{bond.yieldSource}</p>
                </div>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-outline/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${bond.strategyScore}%` }}
                />
              </div>
              <p
                className="mt-2 text-[8px] leading-4 text-outline"
                title="Yield · Duration · Price · Data confidence"
              >
                Score components: Y {bond.yieldScore.toFixed(0)} · D{" "}
                {bond.durationScore.toFixed(0)} · P {bond.priceScore.toFixed(0)} · C{" "}
                {bond.confidenceScore.toFixed(0)}
              </p>
            </article>
          );
        })}
      </div>
      {hasMoreBonds && (
        <div className="flex flex-col gap-3 border-t border-outline/10 bg-surface-container-lowest/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">
            {showAll ? (
              <>
                Showing all{" "}
                <strong className="text-on-surface">{ranked.length}</strong>{" "}
                ranked bonds.
              </>
            ) : (
              <>
                Showing the top{" "}
                <strong className="text-on-surface">5</strong> of{" "}
                <strong className="text-on-surface">{ranked.length}</strong>{" "}
                ranked bonds.
              </>
            )}
          </p>
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls="fixed-income-ranked-bonds fixed-income-ranked-bonds-mobile"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline/15 bg-background px-4 py-2.5 text-xs font-black text-[var(--md-sys-color-primary)] transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {showAll ? (
              <>
                Show top 5 <ChevronUp size={15} />
              </>
            ) : (
              <>
                Show all {ranked.length} bonds <ChevronDown size={15} />
              </>
            )}
          </button>
        </div>
      )}
      <div className="flex gap-2 border-t border-outline/10 bg-surface-container-low/40 px-5 py-4 text-[10px] leading-4 text-on-surface-variant">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Strategy score = 60% net yield + 25% logistic duration + 10% price
          value + 5% data confidence. Open the formula guide above the table
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
                    a proportional penalty. Missing live prices receive a
                    neutral 50.
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

              <p className="rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-3 text-[11px] leading-5">
                When RSE has no recent closing trade, the table reconstructs an
                approximate clean price from the published YTM, coupon, maturity,
                today&apos;s date, and semiannual cash flows. The ≈ symbol marks
                this as an implied value, not a live broker quote. It does not
                receive live-price confidence in the strategy score.
              </p>

              <p className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-3 text-[11px] leading-5">
                Listings with fewer than three years remaining are always
                excluded. The score is a comparative research tool, not a
                guarantee of return or personalized investment advice.
              </p>

              <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5">
                <p className="font-black text-on-surface">
                  Opportunity labels are independent from rank
                </p>
                <p className="mt-2 text-xs leading-5">
                  Table position communicates relative rank. Colored labels are
                  limited to the first two rows and apply absolute
                  screen thresholds, so even the strongest current options can
                  still be marked below threshold.
                </p>
                <div className="mt-4 grid gap-2 text-[11px] leading-5 sm:grid-cols-2">
                  <p>
                    <strong className="text-on-surface">Exceptional:</strong>{" "}
                    live price below 100, net yield ≥ 12.5%, years ≥ 15.
                  </p>
                  <p>
                    <strong className="text-on-surface">Attractive:</strong>{" "}
                    live price ≤ 102, net yield ≥ 11.5%, years ≥ 10.
                  </p>
                  <p>
                    <strong className="text-on-surface">Promising:</strong>{" "}
                    attractive yield and runway, but no recent price.
                  </p>
                  <p>
                    <strong className="text-on-surface">Below threshold:</strong>{" "}
                    net yield &lt; 11%, years &lt; 5, or live price ≥ 105.
                  </p>
                </div>
              </div>
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

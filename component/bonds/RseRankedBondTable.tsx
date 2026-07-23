"use client";

import {
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  RadioTower,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { RseOutstandingBond } from "@/lib/bonds/rse";
import { RseRefreshButton } from "./RseRefreshButton";

type RankedBond = RseOutstandingBond & {
  impliedCleanPrice?: number | null;
};

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

function bkBondCode(bondName: string) {
  const match = bondName.match(/^(FXD\d+\/\d{4})\/(\d+)Yrs?/i);
  if (!match) return null;
  const issue = `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}`;
  return `${issue}/${match[2]}yr`;
}

function opportunitySignal(bond: RankedBond): OpportunitySignal {
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
        "border-tertiary/45 bg-tertiary-container text-[var(--md-sys-color-on-tertiary-container)] shadow-sm",
    };
  }

  if (hasLivePrice && price <= 102 && strongYield && longRunway) {
    return {
      label: "Attractive setup",
      explanation:
        "Live price no higher than 102, at least 11.5% modeled net yield, and at least 10 years remaining.",
      classes:
        "border-tertiary/35 bg-tertiary-container/80 text-[var(--md-sys-color-on-tertiary-container)] shadow-sm",
    };
  }

  if (!hasLivePrice && strongYield && longRunway) {
    return {
      label: "Promising · verify price",
      explanation:
        "Yield and remaining maturity clear the screen, but there is no recent closing price. Confirm an executable price before judging the opportunity.",
      classes:
        "border-primary/35 bg-primary-container/80 text-[var(--md-sys-color-on-primary-container)] shadow-sm",
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
        "border-error/35 bg-error-container/70 text-[var(--md-sys-color-on-error-container)] shadow-sm",
    };
  }

  return {
    label: "Fair · keep watching",
    explanation:
      "The bond is neither clearly weak nor strong enough to meet the attractive-opportunity thresholds.",
    classes:
      "border-outline/30 bg-surface-container-high text-on-surface shadow-sm",
  };
}

function tradeRecencyLabel(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Kigali",
  }).format(new Date(value));
}

function tradeRecencyDateTime(value: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Kigali",
  }).format(new Date(value));
}

function StrategyMathFormula({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <figure
      role="math"
      aria-label={label}
      className={`bond-strategy-math-card mt-4 rounded-2xl border border-primary/15 bg-surface-container px-4 py-4 ${
        compact ? "md:px-3" : "md:px-4"
      }`}
    >
      <div className="bond-strategy-math-frame">
        <math
          aria-hidden="true"
          display="block"
          className={`bond-strategy-math mx-auto ${
            compact ? "bond-strategy-math--compact" : ""
          }`}
        >
          {children}
        </math>
      </div>
    </figure>
  );
}

export function RseRankedBondTable({
  bonds,
  pagesFetched,
  rowsAnalyzed,
  marketUpdated,
}: {
  bonds: RankedBond[];
  pagesFetched: number;
  rowsAnalyzed: number;
  marketUpdated: string | null;
}) {
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [tradeDetailsOpen, setTradeDetailsOpen] = useState<RankedBond | null>(
    null,
  );
  const [showAll, setShowAll] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!formulaOpen && !tradeDetailsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFormulaOpen(false);
      if (event.key === "Escape") setTradeDetailsOpen(null);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [formulaOpen, tradeDetailsOpen]);

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
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const searchedBonds = useMemo(() => {
    if (!normalizedSearch) return ranked;

    return ranked.filter((bond) =>
      [
        bond.bond,
        bond.code,
        bond.issueDate,
        bond.maturityDate,
        bond.couponRate,
        bond.yieldToMaturity,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)),
    );
  }, [normalizedSearch, ranked]);
  const rankByBond = useMemo(
    () =>
      new Map(
        ranked.map((bond, index) => [
          `${bond.code}-${bond.yieldToMaturity}`,
          index,
        ]),
      ),
    [ranked],
  );
  const visibleBonds = normalizedSearch
    ? searchedBonds
    : showAll
      ? ranked
      : ranked.slice(0, 5);
  const hasMoreBonds = !normalizedSearch && ranked.length > 5;

  async function copyBkCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement("textarea");
      input.value = code;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopiedCode(code);
    window.setTimeout(
      () => setCopiedCode((current) => (current === code ? null : current)),
      1800,
    );
  }

  return (
    <>
      <div className="border-b border-outline/10 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Treasury listings
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h3 className="font-black">Fixed income board</h3>
              <button
                type="button"
                aria-label={searchOpen ? "Close Treasury bond search" : "Search Treasury bonds"}
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen((current) => !current);
                  if (searchOpen) setSearchQuery("");
                }}
                title={searchOpen ? "Close search" : "Search Treasury bonds"}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  searchOpen
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : "border-outline/10 bg-surface-container-low text-on-surface-variant hover:border-primary/30 hover:text-primary"
                }`}
              >
                {searchOpen ? <X size={15} /> : <Search size={15} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-[10px] font-bold text-on-surface-variant">
              {marketUpdated
                ? `Last refreshed ${marketUpdated} CAT`
                : "Last refresh unavailable"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <RseRefreshButton />
              <a
                href="https://rse.rw/fixed-income-board"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-outline/15 bg-background px-3 py-2.5 text-xs font-black text-primary transition hover:border-primary/35"
              >
                Open RSE <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="mt-4 flex flex-col gap-2 border-t border-outline/10 pt-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                ref={searchInputRef}
                id="treasury-bond-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                aria-label="Find a Treasury bond"
                placeholder="Bond name, code, maturity, coupon or YTM"
                autoComplete="off"
                className="h-10 w-full rounded-xl border border-outline/15 bg-background pl-10 pr-10 text-sm font-semibold text-on-surface outline-none transition placeholder:font-medium placeholder:text-on-surface-variant/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear Treasury bond search"
                className={`absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  searchQuery ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <X size={14} />
              </button>
            </div>
            {normalizedSearch && (
              <p
                role="status"
                className="shrink-0 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant"
              >
                {searchedBonds.length} {searchedBonds.length === 1 ? "match" : "matches"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-primary/25 bg-primary/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
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
          <button
            type="button"
            aria-label="How the strategy score is calculated"
            onClick={() => setFormulaOpen(true)}
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-outline/15 bg-surface-container-lowest/70 text-[var(--md-sys-color-primary)] shadow-sm transition hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <HelpCircle size={16} />
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
              const rankPosition =
                rankByBond.get(`${bond.code}-${bond.yieldToMaturity}`) ?? index;
              const highlighted = rankPosition < 2;
              const opportunity = opportunitySignal(bond);
              const codeForBk = rankPosition < 3 ? bkBondCode(bond.bond) : null;
              const displayedPrice =
                bond.closingPrice ?? bond.impliedCleanPrice ?? null;
              const priceStatus = pricePosition(displayedPrice);
              return (
                <tr
                  key={`${bond.code}-${bond.yieldToMaturity}`}
                  className={`border-t border-outline/10 align-top text-xs ${
                    highlighted ? "bg-primary/[0.07]" : ""
                  }`}
                >
                  <td className="px-4 py-5">
                    {codeForBk ? (
                      <button
                        type="button"
                        onClick={() => copyBkCode(codeForBk)}
                        className="group inline-flex max-w-full items-start gap-1.5 text-left font-black leading-5 text-on-surface transition hover:text-[var(--md-sys-color-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label={`Copy ${codeForBk} for BK Capital`}
                        title={`Copy ${codeForBk} for BK Capital`}
                      >
                        <span>{bond.bond}</span>
                        {copiedCode === codeForBk ? (
                          <Check
                            size={13}
                            strokeWidth={3}
                            className="mt-1 shrink-0 text-primary"
                          />
                        ) : (
                          <Copy
                            size={12}
                            className="mt-1 shrink-0 text-outline transition group-hover:text-primary"
                          />
                        )}
                      </button>
                    ) : (
                      <p className="font-black leading-5">{bond.bond}</p>
                    )}
                    <p className="mt-1 font-mono text-[10px] font-semibold text-on-surface-variant">
                      {bond.code}
                    </p>
                    {highlighted && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          title={opportunity.explanation}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${opportunity.classes}`}
                        >
                          <Sparkles size={11} strokeWidth={2.5} />
                          {opportunity.label}
                        </span>
                      </div>
                    )}
                    {rankPosition < 5 && bond.recentTradeCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setTradeDetailsOpen(bond)}
                        title="This bond appeared in recent RSE bond-market transactions, which can indicate secondary-market activity to verify with a broker."
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-container/45 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--md-sys-color-on-primary-container)] transition hover:border-primary/50 hover:bg-primary-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        <RadioTower size={11} strokeWidth={2.5} />
                        Recently traded
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-5">
                    <p className="font-black leading-5">
                      {bond.closingPrice !== null
                        ? bond.closingPrice.toFixed(2)
                        : bond.impliedCleanPrice != null
                          ? `≈ ${bond.impliedCleanPrice.toFixed(2)}`
                          : "Unavailable"}
                    </p>
                    <p className="mt-1 text-[10px] font-medium leading-4 text-on-surface-variant">
                      {bond.closingPrice !== null
                        ? "RSE closing price"
                        : bond.impliedCleanPrice != null
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
                      <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
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
                    <p className="mt-1.5 text-[9px] font-semibold text-on-surface-variant">
                      {bond.yieldSource}
                    </p>
                    {bond.recentTradeCount > 0 && (
                      <p className="mt-1.5 text-[9px] font-bold text-primary">
                        Seen {bond.recentTradeCount}x recently · last{" "}
                        {tradeRecencyLabel(bond.lastTradedAt) ?? "recently"}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-primary">
                        {bond.strategyScore.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-bold text-on-surface-variant">
                        /100
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-outline/10">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${bond.strategyScore}%` }}
                      />
                    </div>
                    <p
                      className="mt-2 text-[9px] font-medium leading-4 text-on-surface-variant"
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
            {visibleBonds.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <p className="font-black text-on-surface">No Treasury bonds found</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Try a shorter bond name, code, maturity year, coupon, or YTM.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div id="fixed-income-ranked-bonds-mobile" className="divide-y divide-outline/10 md:hidden">
        {visibleBonds.map((bond, index) => {
          const rankPosition =
            rankByBond.get(`${bond.code}-${bond.yieldToMaturity}`) ?? index;
          const highlighted = rankPosition < 2;
          const opportunity = opportunitySignal(bond);
          const codeForBk = rankPosition < 3 ? bkBondCode(bond.bond) : null;
          const displayedPrice =
            bond.closingPrice ?? bond.impliedCleanPrice ?? null;
          const priceStatus = pricePosition(displayedPrice);
          return (
            <article
              key={`${bond.code}-${bond.yieldToMaturity}-mobile`}
              className={`p-5 ${highlighted ? "bg-primary/[0.07]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {codeForBk ? (
                    <button
                      type="button"
                      onClick={() => copyBkCode(codeForBk)}
                      className="group inline-flex max-w-full items-start gap-1.5 text-left font-black leading-5 text-on-surface transition hover:text-[var(--md-sys-color-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      aria-label={`Copy ${codeForBk} for BK Capital`}
                      title={`Copy ${codeForBk} for BK Capital`}
                    >
                      <span>{bond.bond}</span>
                      {copiedCode === codeForBk ? (
                        <Check
                          size={13}
                          strokeWidth={3}
                          className="mt-1 shrink-0 text-primary"
                        />
                      ) : (
                        <Copy
                          size={12}
                          className="mt-1 shrink-0 text-outline transition group-hover:text-primary"
                        />
                      )}
                    </button>
                  ) : (
                    <p className="font-black leading-5 text-on-surface">
                      {bond.bond}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] font-semibold text-on-surface-variant">
                    {bond.code}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-primary">
                    {bond.strategyScore.toFixed(1)}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Strategy fit
                  </p>
                </div>
              </div>

              {highlighted && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    title={opportunity.explanation}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${opportunity.classes}`}
                  >
                    <Sparkles size={11} strokeWidth={2.5} />
                    {opportunity.label}
                  </span>
                </div>
              )}
              {rankPosition < 5 && bond.recentTradeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTradeDetailsOpen(bond)}
                  title="This bond appeared in recent RSE bond-market transactions, which can indicate secondary-market activity to verify with a broker."
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-container/45 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--md-sys-color-on-primary-container)] transition hover:border-primary/50 hover:bg-primary-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <RadioTower size={11} strokeWidth={2.5} />
                  Recently traded
                </button>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Net yield
                  </p>
                  <p className="mt-1 text-base font-black text-primary">
                    {percent(bond.netAnnualizedYield)}
                  </p>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Price / 100
                  </p>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {bond.closingPrice !== null
                      ? bond.closingPrice.toFixed(2)
                      : bond.impliedCleanPrice != null
                        ? `≈ ${bond.impliedCleanPrice.toFixed(2)}`
                        : "Unavailable"}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-on-surface-variant">
                    {bond.closingPrice !== null
                      ? "RSE closing"
                      : bond.impliedCleanPrice != null
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
                  <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Time remaining
                  </p>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {bond.yearsRemaining.toFixed(1)} years
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-on-surface-variant">
                    {bond.maturityDate}
                  </p>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/60 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Coupon · Gross YTM
                  </p>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {bond.couponRate} · {percent(bond.grossYield)}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-on-surface-variant">
                    {bond.yieldSource}
                  </p>
                  {bond.recentTradeCount > 0 && (
                    <p className="mt-1 text-[10px] font-bold text-primary">
                      Seen {bond.recentTradeCount}x recently · last{" "}
                      {tradeRecencyLabel(bond.lastTradedAt) ?? "recently"}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-outline/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${bond.strategyScore}%` }}
                />
              </div>
              <p
                className="mt-2 text-[9px] font-medium leading-4 text-on-surface-variant"
                title="Yield · Duration · Price · Data confidence"
              >
                Score components: Y {bond.yieldScore.toFixed(0)} · D{" "}
                {bond.durationScore.toFixed(0)} · P {bond.priceScore.toFixed(0)} · C{" "}
                {bond.confidenceScore.toFixed(0)}
              </p>
            </article>
          );
        })}
        {visibleBonds.length === 0 && (
          <div className="p-8 text-center">
            <p className="font-black text-on-surface">No Treasury bonds found</p>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              Try a shorter bond name, code, maturity year, coupon, or YTM.
            </p>
          </div>
        )}
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
          Strategy score = 70% net yield + 25% long-term runway + 5% price
          value. Twelve years remaining receives the full duration score, which
          places active 15-year and 20-year issues in the same long-term tier.
          Data confidence affects the label, not attractiveness. Recently
          traded means the bond appeared in saved RSE bond-market observations;
          it is a liquidity clue to verify, not a guarantee that a seller is
          still available.
        </p>
      </div>

      {formulaOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-background/95 p-3 backdrop-blur-lg md:p-6"
          onMouseDown={() => setFormulaOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="strategy-formula-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="bond-scrollbar max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-2xl"
          >
            <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-outline/15 bg-[var(--md-sys-color-surface-container-lowest)] px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] md:px-7">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-primary)]">
                  Ranking methodology
                </p>
                <h2 id="strategy-formula-title" className="mt-1 text-2xl font-black tracking-tight text-on-surface">
                  Long-Term Compounding Strategy Score
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                  A 0–100 strategy-fit score that balances after-tax return,
                  sufficient long-term runway, and purchase price. Data freshness
                  is shown separately so certainty cannot make a weaker return
                  look more attractive.
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

            <div className="space-y-5 p-5 text-sm text-on-surface-variant md:p-7">
              <blockquote className="rounded-2xl border border-primary/15 bg-surface-container-low p-5 md:grid md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:items-center md:gap-6">
                <div>
                  <p className="font-black text-on-surface">Final allocation</p>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                    The strategy score weights modeled return most heavily, then
                    rewards enough maturity runway and a fair entry price.
                  </p>
                </div>
                <StrategyMathFormula label="Score equals net yield score times seventy percent plus duration score times twenty five percent plus price score times five percent">
                  <mrow>
                    <mi>S</mi>
                    <mo>=</mo>
                    <mn>0.70</mn>
                    <mo>×</mo>
                    <msub>
                      <mi>Y</mi>
                      <mtext>net</mtext>
                    </msub>
                    <mo>+</mo>
                    <mn>0.25</mn>
                    <mo>×</mo>
                    <mi>D</mi>
                    <mo>+</mo>
                    <mn>0.05</mn>
                    <mo>×</mo>
                    <mi>P</mi>
                  </mrow>
                </StrategyMathFormula>
              </blockquote>

              <ol className="grid gap-4 md:grid-cols-2">
                <li className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
                  <p className="font-black text-on-surface">1. Net Yield Score · 70%</p>
                  <p className="mt-2 text-xs leading-5">
                    With a recent closing price, the model solves YTM from
                    semiannual after-tax coupon cash flows. Without a price, it
                    approximates net yield as published RSE YTM × 95%.
                  </p>
                  <StrategyMathFormula
                    compact
                    label="Net yield score equals the minimum of one hundred and net annualized yield divided by fourteen percent times one hundred"
                  >
                    <mrow>
                      <msub>
                        <mi>Y</mi>
                        <mtext>score</mtext>
                      </msub>
                      <mo>=</mo>
                      <mi>min</mi>
                      <mo>(</mo>
                      <mn>100</mn>
                      <mo>,</mo>
                      <mfrac>
                        <msub>
                          <mi>Y</mi>
                          <mtext>net</mtext>
                        </msub>
                        <mn>14%</mn>
                      </mfrac>
                      <mo>×</mo>
                      <mn>100</mn>
                      <mo>)</mo>
                    </mrow>
                  </StrategyMathFormula>
                </li>
                <li className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
                  <p className="font-black text-on-surface">2. Duration Score · 25%</p>
                  <p className="mt-2 text-xs leading-5">
                    Runway earns points proportionally until 12 years remaining.
                    Beyond that point, duration is already sufficient for this
                    long-term strategy. This prevents a recently issued 15-year
                    bond from losing to a 20-year bond solely because of tenor.
                  </p>
                  <StrategyMathFormula
                    compact
                    label="Duration score equals the minimum of one hundred and years remaining divided by twelve times one hundred"
                  >
                    <mrow>
                      <msub>
                        <mi>D</mi>
                        <mtext>score</mtext>
                      </msub>
                      <mo>=</mo>
                      <mi>min</mi>
                      <mo>(</mo>
                      <mn>100</mn>
                      <mo>,</mo>
                      <mfrac>
                        <msub>
                          <mi>Y</mi>
                          <mtext>remaining</mtext>
                        </msub>
                        <mn>12</mn>
                      </mfrac>
                      <mo>×</mo>
                      <mn>100</mn>
                      <mo>)</mo>
                    </mrow>
                  </StrategyMathFormula>
                </li>
                <li className="rounded-2xl border border-outline/10 bg-surface-container-low p-5 md:col-span-2 md:grid md:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] md:items-start md:gap-6">
                  <div>
                    <p className="font-black text-on-surface">3. Price Score · 5%</p>
                    <p className="mt-2 text-xs leading-5">
                      Prices at or below par score 100. A premium above 100
                      creates a proportional penalty. Missing live prices receive
                      a neutral 50.
                    </p>
                  </div>
                  <StrategyMathFormula
                    compact
                    label="Price score is one hundred when price is less than or equal to one hundred; otherwise it is the maximum of zero and one hundred minus price premium divided by one hundred times five hundred"
                  >
                    <mrow>
                      <msub>
                        <mi>P</mi>
                        <mtext>score</mtext>
                      </msub>
                      <mo>=</mo>
                      <mrow>
                        <mo>{`{`}</mo>
                        <mtable>
                          <mtr>
                            <mtd>
                              <mn>100</mn>
                            </mtd>
                            <mtd>
                              <mtext>if </mtext>
                              <mi>P</mi>
                              <mo>≤</mo>
                              <mn>100</mn>
                            </mtd>
                          </mtr>
                          <mtr>
                            <mtd>
                              <mi>max</mi>
                              <mo>(</mo>
                              <mn>0</mn>
                              <mo>,</mo>
                              <mn>100</mn>
                              <mo>−</mo>
                              <mfrac>
                                <mrow>
                                  <mi>P</mi>
                                  <mo>−</mo>
                                  <mn>100</mn>
                                </mrow>
                                <mn>100</mn>
                              </mfrac>
                              <mo>×</mo>
                              <mn>500</mn>
                              <mo>)</mo>
                            </mtd>
                            <mtd>
                              <mtext>if </mtext>
                              <mi>P</mi>
                              <mo>&gt;</mo>
                              <mn>100</mn>
                            </mtd>
                          </mtr>
                        </mtable>
                      </mrow>
                    </mrow>
                  </StrategyMathFormula>
                </li>
                <li className="rounded-2xl border border-outline/10 bg-surface-container-low p-5 md:col-span-2 md:grid md:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] md:items-start md:gap-6">
                  <div>
                    <p className="font-black text-on-surface">4. Data Confidence · diagnostic</p>
                    <p className="mt-2 text-xs leading-5">
                      A recent market closing price scores 100. A row relying
                      only on RSE-published YTM scores 60. Confidence is
                      displayed and changes the opportunity label, but it is
                      deliberately excluded from the strategy score.
                    </p>
                  </div>
                  <StrategyMathFormula
                    compact
                    label="Confidence score equals one hundred with recent price data and sixty with published yield only"
                  >
                    <mrow>
                      <msub>
                        <mi>C</mi>
                        <mtext>score</mtext>
                      </msub>
                      <mo>=</mo>
                      <mrow>
                        <mo>{`{`}</mo>
                        <mtable>
                          <mtr>
                            <mtd>
                              <mn>100</mn>
                            </mtd>
                            <mtd>
                              <mtext>recent price</mtext>
                            </mtd>
                          </mtr>
                          <mtr>
                            <mtd>
                              <mn>60</mn>
                            </mtd>
                            <mtd>
                              <mtext>published YTM only</mtext>
                            </mtd>
                          </mtr>
                        </mtable>
                      </mrow>
                    </mrow>
                  </StrategyMathFormula>
                </li>
              </ol>

              <div className="grid gap-3 md:grid-cols-2">
                <p className="rounded-2xl border border-primary/15 bg-surface-container-low px-4 py-3 text-[11px] leading-5">
                  When RSE has no recent closing trade, the table reconstructs
                  an approximate clean price from the published YTM, coupon,
                  maturity, today&apos;s date, and semiannual cash flows. The ≈
                  symbol marks this as an implied value, not a live broker quote.
                </p>

                <p className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-3 text-[11px] leading-5">
                  Listings with fewer than three years remaining are always
                  excluded. The score is a comparative research tool, not a
                  guarantee of return or personalized investment advice.
                </p>
              </div>

              <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
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

      {tradeDetailsOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-background/75 backdrop-blur-md"
          onMouseDown={() => setTradeDetailsOpen(null)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-trade-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="bond-scrollbar h-full w-full max-w-md overflow-y-auto border-l border-outline/10 bg-surface-container-lowest shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-outline/10 bg-surface-container-lowest/95 px-5 py-5 backdrop-blur">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  RSE trade observation
                </p>
                <h2 id="recent-trade-title" className="mt-1 text-xl font-black text-on-surface">
                  {tradeDetailsOpen.bond}
                </h2>
                <p className="mt-1 font-mono text-[10px] font-semibold text-on-surface-variant">
                  {tradeDetailsOpen.code}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close recent trade details"
                onClick={() => setTradeDetailsOpen(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline/10 bg-surface-container-low text-on-surface-variant hover:text-primary"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.07] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-on-surface">
                      Appeared in recent RSE bond-market transactions
                    </p>
                    <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                      This can indicate secondary-market activity, but it does
                      not prove a seller is still available. Treat it as a
                      broker-verification signal.
                    </p>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
                  <dt className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Recent sightings
                  </dt>
                  <dd className="mt-2 text-2xl font-black text-primary">
                    {tradeDetailsOpen.recentTradeCount}
                  </dd>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
                  <dt className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Last price / 100
                  </dt>
                  <dd className="mt-2 text-2xl font-black text-primary">
                    {tradeDetailsOpen.lastTradedPrice !== null
                      ? tradeDetailsOpen.lastTradedPrice.toFixed(2)
                      : "N/A"}
                  </dd>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
                  <dt className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Volume
                  </dt>
                  <dd className="mt-2 text-sm font-black text-on-surface">
                    {tradeDetailsOpen.lastTradeVolume || "Not published"}
                  </dd>
                </div>
                <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
                  <dt className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    Value
                  </dt>
                  <dd className="mt-2 text-sm font-black text-on-surface">
                    {tradeDetailsOpen.lastTradeValue || "Not published"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                  Last observed
                </p>
                <p className="mt-2 text-sm font-black text-on-surface">
                  {tradeRecencyDateTime(tradeDetailsOpen.lastTradedAt)}
                </p>
                {tradeDetailsOpen.lastTradeChange && (
                  <p className="mt-2 text-xs font-bold text-on-surface-variant">
                    RSE change: {tradeDetailsOpen.lastTradeChange}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4 text-xs leading-5 text-on-surface-variant">
                <p className="font-black text-on-surface">How to use this</p>
                <p className="mt-2">
                  Prioritize it as an availability clue only when the bond also
                  clears your yield, price, and maturity screen. Then ask BK
                  Capital or your broker whether this bond can still be sourced
                  near the observed price.
                </p>
              </div>

              <a
                href="https://rse.rw/bond-market"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:-translate-y-0.5"
              >
                Open RSE bond market <ExternalLink size={15} />
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

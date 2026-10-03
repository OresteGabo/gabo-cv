"use client";

import {
  ArrowDownToLine,
  BarChart3,
  BookOpenText,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Info,
  Landmark,
  Menu,
  Plus,
  RefreshCcw,
  Settings,
  Sparkles,
  Target,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  Fragment,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  calculateProjection,
  DEFAULT_ASSUMPTIONS,
  earliestActivePurchaseMonth,
  formatPercent,
  formatRwf,
  MAX_ANNUAL_COUPON_RATE,
  MIN_ANNUAL_COUPON_RATE,
  purchaseToStartingLot,
  SECONDARY_MARKET_COMMISSION_RATE,
  SIMULATION_TREASURY_BOND_TENORS,
  summarizeProjection,
  TREASURY_BOND_TENORS,
  WITHHOLDING_TAX_RATE,
} from "@/lib/bonds/calculations";
import type {
  BondAssumptions,
  BondPurchase,
  CashInjection,
  ContributionPeriod,
  ModeledBondPurchase,
} from "@/lib/bonds/types";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";

const STORAGE_KEY = "rwanda-bond-planner-assumptions-v2";
const INJECTIONS_STORAGE_KEY = "rwanda-bond-planner-injections-v1";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function simulationMonthDate(
  assumptions: Pick<BondAssumptions, "startMonth" | "startYear">,
  month: number,
) {
  return new Date(
    assumptions.startYear,
    assumptions.startMonth - 1 + month - 1,
    1,
  );
}

function simulationMonthLabel(
  assumptions: Pick<BondAssumptions, "startMonth" | "startYear">,
  month: number,
) {
  const date = simulationMonthDate(assumptions, month);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function normalizeContributionPeriods(
  assumptions: BondAssumptions,
): ContributionPeriod[] {
  const totalMonths = Math.max(1, Math.round(assumptions.horizonYears * 12));
  const source =
    assumptions.contributionPeriods?.length > 0
      ? assumptions.contributionPeriods
      : [
          {
            id: "default",
            amount: assumptions.monthlyContribution,
            startMonth: 1,
            endMonth: totalMonths,
          },
        ];

  return source
    .map((period, index) => {
      const startMonth = Math.min(
        totalMonths,
        Math.max(1, Math.round(period.startMonth || 1)),
      );
      const endMonth = Math.min(
        totalMonths,
        Math.max(startMonth, Math.round(period.endMonth || totalMonths)),
      );

      return {
        id: period.id || `period-${index + 1}`,
        amount: Math.max(0, Math.round(period.amount || 0)),
        startMonth,
        endMonth,
      };
    })
    .sort((a, b) => a.startMonth - b.startMonth || a.endMonth - b.endMonth);
}

function scheduledMonthlyContribution(
  periods: ContributionPeriod[],
  month: number,
) {
  return periods.reduce(
    (total, period) =>
      month >= period.startMonth && month <= period.endMonth
        ? total + period.amount
        : total,
    0,
  );
}

function NavLink({
  active,
  href,
  icon,
  children,
}: {
  active: boolean;
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-primary text-on-primary"
          : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-surface-container hover:text-on-surface"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="grid h-5 w-5 place-items-center rounded-full border border-[var(--md-sys-color-primary)]/35 bg-[var(--md-sys-color-primary)]/[0.07] text-[var(--md-sys-color-primary)] outline-none transition hover:border-[var(--md-sys-color-primary)]/70 focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/30"
      >
        <Info size={12} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-7 z-50 w-64 -translate-x-1/2 rounded-xl border border-outline/10 bg-surface-container-lowest p-3 text-left text-[11px] font-medium leading-5 text-on-surface-variant opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  prefix,
  hint,
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
  hint?: string;
  help?: ReactNode;
}) {
  return (
    <div className="block rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4">
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
          {label}
          {help && <InfoTip label={`About ${label}`}>{help}</InfoTip>}
        </span>
        <span className="rounded-lg bg-surface-container px-2.5 py-1 font-mono text-xs font-bold text-[var(--md-sys-color-primary)]">
          {prefix}
          {value.toLocaleString("en-RW")}
          {suffix}
        </span>
      </span>
      <input
        className="mt-4 w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <span className="mt-2 block text-[11px] text-[var(--md-sys-color-outline)]">{hint}</span>}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 md:p-6 ${
        accent
          ? "border-[var(--md-sys-color-primary)]/35 bg-[var(--md-sys-color-primary)]/10"
          : "border-outline/10 bg-surface-container-lowest"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.19em] text-[var(--md-sys-color-on-surface-variant)]">
        {label}
      </p>
      <p className="mt-3 break-words text-2xl font-black tracking-tight md:text-3xl">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">{detail}</p>}
    </article>
  );
}

function GrowthChart({
  values,
}: {
  values: {
    month: number;
    calendarMonth: number;
    calendarYear: number;
    portfolio: number;
    contributions: number;
  }[];
}) {
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const width = 760;
  const height = 300;
  const pad = 28;
  const max = Math.max(...values.flatMap((value) => [value.portfolio, value.contributions]), 1);
  const activeIndex =
    activeMonth === null
      ? Math.max(0, values.length - 1)
      : Math.max(
          0,
          values.findIndex((value) => value.month === activeMonth),
        );
  const activeValue = values[activeIndex];
  const point = (value: number, index: number) => {
    const x = pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2);
    const y = height - pad - (value / max) * (height - pad * 2);
    return { x, y };
  };
  const stepPath = (key: "portfolio" | "contributions") => {
    if (values.length === 0) return "";
    const first = point(values[0][key], 0);
    return values.slice(1).reduce((path, value, offset) => {
      const next = point(value[key], offset + 1);
      return `${path} H ${next.x} V ${next.y}`;
    }, `M ${first.x} ${first.y}`);
  };
  const portfolioPath = stepPath("portfolio");
  const contributionPath = stepPath("contributions");
  const activePortfolioPoint = activeValue
    ? point(activeValue.portfolio, activeIndex)
    : null;
  const activeContributionPoint = activeValue
    ? point(activeValue.contributions, activeIndex)
    : null;
  const activeMonthLabel = activeValue
    ? `${MONTH_NAMES[activeValue.calendarMonth - 1]} ${activeValue.calendarYear} (${Math.max(0, (activeValue.month - 1) / 12).toFixed(1)}Y)`
    : "";
  const tooltipX = activePortfolioPoint
    ? Math.min(Math.max(activePortfolioPoint.x - 104, 36), width - 246)
    : 0;
  const tooltipY = activePortfolioPoint
    ? Math.max(34, Math.min(activePortfolioPoint.y - 92, height - 112))
    : 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-outline/10 bg-[var(--md-sys-color-surface-container-lowest)] p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--md-sys-color-primary)]">
            Growth curve
          </p>
          <h3 className="mt-1 text-xl font-black">
            Monthly portfolio steps
          </h3>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[var(--md-sys-color-primary)]" /> Portfolio
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[var(--md-sys-color-tertiary)]" /> Contributions
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Monthly stepped portfolio value and personal contributions"
      >
        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={pad}
              x2={width - pad}
              y1={height - pad - tick * (height - pad * 2)}
              y2={height - pad - tick * (height - pad * 2)}
              stroke="rgba(145,168,210,.13)"
              strokeDasharray="4 7"
            />
            <text
              x={pad}
              y={height - pad - tick * (height - pad * 2) - 7}
              fill="var(--md-sys-color-outline)"
              fontSize="10"
            >
              {formatRwf(max * tick, true)}
            </text>
          </g>
        ))}
        <path
          d={contributionPath}
          fill="none"
          stroke="var(--md-sys-color-tertiary)"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d={portfolioPath}
          fill="none"
          stroke="var(--md-sys-color-primary)"
          strokeWidth="4"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        {activeValue && activePortfolioPoint && activeContributionPoint && (
          <g pointerEvents="none">
            <line
              x1={activePortfolioPoint.x}
              x2={activePortfolioPoint.x}
              y1={pad}
              y2={height - pad}
              stroke="var(--md-sys-color-outline)"
              strokeDasharray="4 5"
              opacity="0.45"
            />
            <circle
              cx={activeContributionPoint.x}
              cy={activeContributionPoint.y}
              r="5"
              fill="var(--md-sys-color-tertiary)"
              stroke="var(--md-sys-color-surface-container-lowest)"
              strokeWidth="3"
            />
            <circle
              cx={activePortfolioPoint.x}
              cy={activePortfolioPoint.y}
              r="6"
              fill="var(--md-sys-color-primary)"
              stroke="var(--md-sys-color-surface-container-lowest)"
              strokeWidth="3"
            />
            <g transform={`translate(${tooltipX} ${tooltipY})`}>
              <rect
                width="210"
                height="82"
                rx="14"
                fill="var(--md-sys-color-surface-container-lowest)"
                stroke="rgba(100,116,139,0.18)"
              />
              <text x="14" y="22" fill="var(--md-sys-color-on-surface)" fontSize="11" fontWeight="800">
                {activeMonthLabel}
              </text>
              <text x="14" y="43" fill="var(--md-sys-color-primary)" fontSize="11" fontWeight="800">
                Portfolio {formatRwf(activeValue.portfolio, true)}
              </text>
              <text x="14" y="64" fill="var(--md-sys-color-tertiary)" fontSize="11" fontWeight="800">
                Contributions {formatRwf(activeValue.contributions, true)}
              </text>
            </g>
          </g>
        )}
        {values.map((value, index) => {
          const portfolioPoint = point(value.portfolio, index);
          const xStep =
            values.length > 1 ? (width - pad * 2) / (values.length - 1) : 18;
          return (
            <rect
              key={value.month}
              x={portfolioPoint.x - Math.max(8, xStep / 2)}
              y={pad}
              width={Math.max(16, xStep)}
              height={height - pad * 2}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${MONTH_NAMES[value.calendarMonth - 1]} ${value.calendarYear}: portfolio ${formatRwf(value.portfolio)}, contributions ${formatRwf(value.contributions)}`}
              onMouseEnter={() => setActiveMonth(value.month)}
              onFocus={() => setActiveMonth(value.month)}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function BondSimulatorPlanner() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [assumptions, setAssumptions] =
    useState<BondAssumptions>(DEFAULT_ASSUMPTIONS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [cashInjections, setCashInjections] = useState<CashInjection[]>([]);
  const [realPurchases, setRealPurchases] = useState<BondPurchase[]>([]);
  const [injectionDraft, setInjectionDraft] = useState({
    label: "",
    amount: 1_000_000,
    year: 1,
    monthInYear: 1,
  });
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(),
  );
  const assumptionsHydrated = useRef(false);
  const realPurchaseStartApplied = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = { ...DEFAULT_ASSUMPTIONS, ...JSON.parse(stored) };
          setAssumptions({
            ...parsed,
            contributionPeriods: normalizeContributionPeriods(parsed),
          });
        }
        const storedInjections = window.localStorage.getItem(INJECTIONS_STORAGE_KEY);
        if (storedInjections) {
          setCashInjections(JSON.parse(storedInjections));
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        assumptionsHydrated.current = true;
      }
    });
  }, []);

  useEffect(() => {
    if (!assumptionsHydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assumptions));
  }, [assumptions]);

  useEffect(() => {
    if (!assumptionsHydrated.current) return;
    window.localStorage.setItem(
      INJECTIONS_STORAGE_KEY,
      JSON.stringify(cashInjections),
    );
  }, [cashInjections]);

  useEffect(() => {
    let active = true;

    fetch("/api/bonds/purchases", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return [];
        if (!response.ok) return [];

        const data = await response.json().catch(() => ({}));
        return Array.isArray(data.purchases) ? data.purchases : [];
      })
      .then((purchases) => {
        if (active) setRealPurchases(purchases);
      })
      .catch(() => {
        if (active) setRealPurchases([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (realPurchaseStartApplied.current || realPurchases.length === 0) return;

    const realStart = earliestActivePurchaseMonth(realPurchases);
    if (!realStart) return;

    realPurchaseStartApplied.current = true;
    setAssumptions((current) => {
      const currentStartIndex = current.startYear * 12 + current.startMonth;
      const realStartIndex = realStart.year * 12 + realStart.month;

      if (currentStartIndex <= realStartIndex) return current;

      return {
        ...current,
        startMonth: realStart.month,
        startYear: realStart.year,
      };
    });
  }, [realPurchases]);

  const contributionPeriods = useMemo(
    () => normalizeContributionPeriods(assumptions),
    [assumptions],
  );
  const currentMonthlyContribution = scheduledMonthlyContribution(
    contributionPeriods,
    1,
  );
  const contributionLabel =
    contributionPeriods.length === 1
      ? `${formatRwf(contributionPeriods[0].amount)} each month`
      : `${contributionPeriods.length} contribution periods`;
  const totalSimulationMonths = Math.max(
    1,
    Math.round(assumptions.horizonYears * 12),
  );
  const contributionGapCount = Array.from(
    { length: totalSimulationMonths },
    (_, index) => scheduledMonthlyContribution(contributionPeriods, index + 1),
  ).filter((amount) => amount === 0).length;
  const modeledAssumptions = useMemo(
    () => ({
      ...assumptions,
      monthlyContribution: currentMonthlyContribution,
      contributionPeriods,
    }),
    [assumptions, contributionPeriods, currentMonthlyContribution],
  );
  const actualStartingLots = useMemo(
    () =>
      realPurchases
        .map((item) => purchaseToStartingLot(item, modeledAssumptions))
        .filter((lot): lot is ModeledBondPurchase => Boolean(lot)),
    [modeledAssumptions, realPurchases],
  );
  const projection = useMemo(
    () =>
      calculateProjection(
        modeledAssumptions,
        cashInjections,
        actualStartingLots.length > 0 ? actualStartingLots : undefined,
      ),
    [actualStartingLots, modeledAssumptions, cashInjections],
  );
  const baselineProjection = useMemo(
    () =>
      calculateProjection(
        modeledAssumptions,
        [],
        actualStartingLots.length > 0 ? actualStartingLots : undefined,
      ),
    [actualStartingLots, modeledAssumptions],
  );
  const summary = useMemo(
    () => summarizeProjection(projection, modeledAssumptions),
    [projection, modeledAssumptions],
  );
  const baselineSummary = useMemo(
    () => summarizeProjection(baselineProjection, modeledAssumptions),
    [baselineProjection, modeledAssumptions],
  );
  const annualProjection = useMemo(
    () =>
      projection
        .filter((row) => row.month % 12 === 0)
        .map((row, index) => {
          const periodStart = projection[index * 12];
          return {
            year: row.year,
            periodStartMonth: periodStart.calendarMonth,
            periodStartYear: periodStart.calendarYear,
            periodEndMonth: row.calendarMonth,
            periodEndYear: row.calendarYear,
            portfolio: row.totalAccountValue,
            bondHoldings: row.closingPortfolio,
            cashBalance: row.closingCashBalance,
            annualContributions:
              row.totalContributions -
              (index > 0 ? projection[index * 12 - 1].totalContributions : 0),
            annualIncome:
              row.totalCoupons -
              (index > 0 ? projection[index * 12 - 1].totalCoupons : 0),
            passiveIncome: row.annualPassiveIncome,
          };
        }),
    [projection],
  );
  const chartProjection = useMemo(
    () =>
      projection.map((row) => ({
        month: row.month,
        calendarMonth: row.calendarMonth,
        calendarYear: row.calendarYear,
        portfolio: row.totalAccountValue,
        contributions: row.totalContributions,
      })),
    [projection],
  );
  const modeledCouponRate = Math.min(
    MAX_ANNUAL_COUPON_RATE,
    Math.max(MIN_ANNUAL_COUPON_RATE, assumptions.annualCouponRate),
  );
  const netAnnualRate = modeledCouponRate * (1 - WITHHOLDING_TAX_RATE);
  const allowedSimulationTenors =
    assumptions.allowedTenors?.length > 0
      ? assumptions.allowedTenors
      : DEFAULT_ASSUMPTIONS.allowedTenors;
  const totalCashInjected = cashInjections.reduce(
    (total, injection) => total + injection.amount,
    0,
  );
  const projectionStartingPrincipal =
    actualStartingLots.length > 0
      ? actualStartingLots.reduce((total, lot) => total + lot.amount, 0)
      : assumptions.startingPortfolio;
  const growthStartingPrincipal =
    actualStartingLots.length > 0 ? 0 : assumptions.startingPortfolio;
  const injectionFinalImpact =
    summary.finalAccountValue - baselineSummary.finalAccountValue;
  const simulationEnd = projection.at(-1);
  const selectedInjectionMonth = Math.min(
    projection.length,
    Math.max(
      1,
      (injectionDraft.year - 1) * 12 + injectionDraft.monthInYear,
    ),
  );
  const selectedInjectionRow = projection[selectedInjectionMonth - 1];
  const waitingCash = selectedInjectionRow?.closingCashBalance ?? 0;
  const draftInjectionAmount = Math.max(0, injectionDraft.amount);
  const additionalBondPurchase =
    selectedInjectionRow?.auctionEligible
      ? Math.floor(
          ((waitingCash + draftInjectionAmount) *
            Math.max(0, Math.min(1, assumptions.auctionFillRate)) +
            0.001) /
            assumptions.purchaseMinimum,
        ) * assumptions.purchaseMinimum
      : 0;
  const cashAfterDraftInjection =
    Math.round(
      (waitingCash + draftInjectionAmount - additionalBondPurchase) * 100,
    ) / 100;

  function update<K extends keyof BondAssumptions>(
    key: K,
    value: BondAssumptions[K],
  ) {
    setAssumptions((current) => {
      if (key !== "horizonYears") return { ...current, [key]: value };

      const previousTotalMonths = Math.max(
        1,
        Math.round(current.horizonYears * 12),
      );
      const nextHorizonYears = Number(value);
      const nextTotalMonths = Math.max(1, Math.round(nextHorizonYears * 12));
      const nextPeriods = normalizeContributionPeriods(current).map(
        (period) => ({
          ...period,
          endMonth:
            period.startMonth === 1 && period.endMonth === previousTotalMonths
              ? nextTotalMonths
              : Math.min(period.endMonth, nextTotalMonths),
          startMonth: Math.min(period.startMonth, nextTotalMonths),
        }),
      );

      return {
        ...current,
        horizonYears: nextHorizonYears,
        contributionPeriods: nextPeriods.map((period) => ({
          ...period,
          endMonth: Math.max(period.startMonth, period.endMonth),
        })),
      };
    });
  }

  function toggleAllowedTenor(tenor: number) {
    setAssumptions((current) => {
      const currentTenors =
        current.allowedTenors?.length > 0
          ? current.allowedTenors
          : DEFAULT_ASSUMPTIONS.allowedTenors;
      const nextTenors = currentTenors.includes(tenor)
        ? currentTenors.filter((item) => item !== tenor)
        : [...currentTenors, tenor].sort((a, b) => a - b);

      return {
        ...current,
        allowedTenors: nextTenors,
      };
    });
  }

  function updateTenorCouponRate(tenor: number, ratePercent: number) {
    setAssumptions((current) => ({
      ...current,
      tenorCouponRates: {
        ...DEFAULT_ASSUMPTIONS.tenorCouponRates,
        ...current.tenorCouponRates,
        [String(tenor)]: Math.max(0, ratePercent) / 100,
      },
    }));
  }

  function updateContributionPeriod(
    id: string,
    updates: Partial<Omit<ContributionPeriod, "id">>,
  ) {
    setAssumptions((current) => {
      const totalMonths = Math.max(1, Math.round(current.horizonYears * 12));
      const nextPeriods = normalizeContributionPeriods(current).map((period) => {
        if (period.id !== id) return period;

        const amount =
          updates.amount === undefined
            ? period.amount
            : Math.max(0, Math.round(updates.amount));
        const startMonth =
          updates.startMonth === undefined
            ? period.startMonth
            : Math.min(totalMonths, Math.max(1, Math.round(updates.startMonth)));
        const endMonth =
          updates.endMonth === undefined
            ? period.endMonth
            : Math.min(totalMonths, Math.max(1, Math.round(updates.endMonth)));

        return {
          ...period,
          amount,
          startMonth: Math.min(startMonth, endMonth),
          endMonth: Math.max(startMonth, endMonth),
        };
      });
      const primaryPeriod = nextPeriods[0];

      return {
        ...current,
        monthlyContribution: primaryPeriod?.amount ?? 0,
        contributionPeriods: nextPeriods,
      };
    });
  }

  function addContributionPeriod() {
    setAssumptions((current) => {
      const totalMonths = Math.max(1, Math.round(current.horizonYears * 12));
      const periods = normalizeContributionPeriods(current);
      const lastPeriod = periods.at(-1);
      const startMonth = lastPeriod
        ? Math.min(totalMonths, lastPeriod.endMonth + 1)
        : 1;

      return {
        ...current,
        contributionPeriods: [
          ...periods,
          {
            id: crypto.randomUUID(),
            amount: lastPeriod?.amount ?? current.monthlyContribution,
            startMonth,
            endMonth: totalMonths,
          },
        ],
      };
    });
  }

  function removeContributionPeriod(id: string) {
    setAssumptions((current) => {
      const periods = normalizeContributionPeriods(current);
      if (periods.length <= 1) return current;
      const nextPeriods = periods.filter((period) => period.id !== id);

      return {
        ...current,
        monthlyContribution: nextPeriods[0]?.amount ?? 0,
        contributionPeriods: nextPeriods,
      };
    });
  }

  function resetScenario() {
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setCashInjections([]);
    setInjectionDraft({
      label: "",
      amount: 1_000_000,
      year: 1,
      monthInYear: 1,
    });
    setExpandedYears(new Set());
    setAdvancedSettingsOpen(false);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_ASSUMPTIONS),
    );
    window.localStorage.removeItem(INJECTIONS_STORAGE_KEY);
  }

  function addCashInjection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const year = Math.min(
      assumptions.horizonYears,
      Math.max(1, injectionDraft.year),
    );
    const monthInYear = Math.min(12, Math.max(1, injectionDraft.monthInYear));
    if (injectionDraft.amount <= 0) return;

    setCashInjections((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: injectionDraft.label.trim() || "Extra cash",
        amount: injectionDraft.amount,
        month: (year - 1) * 12 + monthInYear,
      },
    ]);
    setInjectionDraft((current) => ({
      ...current,
      label: "",
      amount: 1_000_000,
    }));
  }

  function removeCashInjection(id: string) {
    setCashInjections((current) =>
      current.filter((injection) => injection.id !== id),
    );
  }

  function toggleYear(year: number) {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function injectionCalendarDate(year: number, monthInYear: number) {
    return new Date(
      assumptions.startYear,
      assumptions.startMonth - 1 + (year - 1) * 12 + monthInYear - 1,
      1,
    );
  }

  function exportProjection() {
    const header = [
      "Month",
      "Calendar Month",
      "Calendar Year",
      "Year",
      "Opening Portfolio",
      "Opening Cash Balance",
      "Personal Contribution",
      "Extra Cash Injection",
      "Auction Tenor",
      "Auction Eligible",
      "Coupon Payment",
      "Matured Principal",
      "Reinvested Coupon",
      "Available Cash",
      "Intended Bond Bid",
      "Unfilled Bond Bid",
      "New Bond Purchase",
      "Active Bond Lots",
      "Closing Cash Balance",
      "Closing Portfolio",
      "Total Account Value",
      "Total Contributions",
      "Total Coupons",
      "Annual Passive Income",
      "Monthly Passive Income",
    ];
    const rows = projection.map((row) => [
      row.month,
      row.calendarMonth,
      row.calendarYear,
      row.year,
      row.openingPortfolio,
      row.openingCashBalance,
      row.personalContribution,
      row.cashInjection,
      row.auctionTenorYears,
      row.auctionEligible,
      row.couponPayment,
      row.maturedPrincipal,
      row.reinvestedCoupon,
      row.availableCash,
      row.intendedBondBid,
      row.unfilledBondBid,
      row.newBondPurchase,
      row.activeBondCount,
      row.closingCashBalance,
      row.closingPortfolio,
      row.totalAccountValue,
      row.totalContributions,
      row.totalCoupons,
      row.annualPassiveIncome,
      row.monthlyPassiveIncome,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => JSON.stringify(value)).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rwanda-treasury-bond-projection.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="bond-app relative min-h-screen overflow-x-clip bg-background font-sans text-on-background">
      <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-outline/5 bg-background/80 px-1 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <span className="hidden sm:block"><GaboBrand /></span>
            <span className="sm:hidden"><GaboBrand compact /></span>
            <span className="hidden h-5 w-px bg-outline/20 sm:block" />
            <span className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant sm:block">
              Treasury Bond Lab
            </span>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink active={false} href="/portfolio" icon={<WalletCards size={15} />}>
              Portfolio
            </NavLink>
            <NavLink active={false} href="/calendar" icon={<CalendarClock size={15} />}>
              Calendar
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <BondThemeToggle />
            <button
              onClick={exportProjection}
              className="hidden items-center gap-2 rounded-xl border border-outline/10 px-3 py-2 text-xs font-black text-[var(--md-sys-color-on-surface)] transition hover:border-[var(--md-sys-color-primary)]/40 hover:text-[var(--md-sys-color-primary)] sm:flex"
            >
              <ArrowDownToLine size={15} /> Export CSV
            </button>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open navigation"
              className="rounded-xl border border-outline/10 p-2.5 lg:hidden"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="grid grid-cols-2 gap-2 border-t border-outline/10 p-3 lg:hidden">
            <NavLink active={false} href="/portfolio" icon={<WalletCards size={15} />}>Portfolio</NavLink>
            <NavLink active={false} href="/calendar" icon={<CalendarClock size={15} />}>Calendar</NavLink>
          </nav>
        )}
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:px-8 md:pb-28 md:pt-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                Personal Finance System · Rwanda
              </span>
            </div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-on-surface-variant">
              Designed and built by Gabo
            </p>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
              Treasury
              <span className="block text-primary">Bonds.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed text-on-surface-variant md:text-xl">
              A personal planning system for building long-term RWF income through
              government bonds, monthly discipline, and transparent coupon tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#simulator"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-on-primary shadow-lg shadow-primary/15 transition hover:-translate-y-0.5"
              >
                Adjust my plan <ChevronRight size={17} />
              </a>
              <a
                href="#projection"
                className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-surface-container-low/60 px-5 py-3 text-sm font-black text-on-surface transition hover:border-primary/30 hover:text-primary"
              >
                View yearly projection <BarChart3 size={16} />
              </a>
            </div>
          </div>

          <article className="relative overflow-hidden rounded-[2.5rem] border-2 border-primary/30 bg-surface-container-high/80 shadow-2xl shadow-primary/10 backdrop-blur-3xl">
            <div className="border-b border-outline/10 p-6 md:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Current scenario · Live model
              </p>
              <p className="mt-3 text-xl font-black leading-snug md:text-2xl">
                Invest {contributionLabel} for {assumptions.horizonYears} years
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                Starting {MONTH_NAMES[assumptions.startMonth - 1]}{" "}
                {assumptions.startYear}, at a {formatPercent(modeledCouponRate)} annual
                coupon rate with {formatPercent(assumptions.reinvestmentRate)} of net
                coupons reinvested and {formatPercent(assumptions.auctionFillRate)} expected
                auction fill. Uninvested cash is held at 0% return.
              </p>
              {actualStartingLots.length > 0 && (
                <p className="mt-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
                  Using {actualStartingLots.length} saved bond lots as the opening portfolio
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-6 md:p-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">
                  You contribute
                </p>
                <p className="mt-2 text-xl font-black md:text-2xl">
                  {formatRwf(summary.totalContributions, true)}
                </p>
                <p className="mt-1 text-xs text-[var(--md-sys-color-outline)]">
                  Including extra cash
                </p>
              </div>
              <ChevronRight className="text-[var(--md-sys-color-primary)]" size={24} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                  Projected value
                </p>
                <p className="mt-2 text-2xl font-black text-primary md:text-3xl">
                  {formatRwf(summary.finalAccountValue, true)}
                </p>
                <p className="mt-1 text-xs text-[var(--md-sys-color-outline)]">
                  {simulationEnd
                    ? `${formatRwf(summary.finalPortfolio, true)} in bonds + ${formatRwf(summary.finalCashBalance, true)} in Cash by ${MONTH_NAMES[simulationEnd.calendarMonth - 1]} ${simulationEnd.calendarYear}`
                    : "At the end of the plan"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-outline/10 bg-surface-container-lowest/70">
              <div className="border-r border-outline/10 p-5 md:px-7">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">
                  Potential annual income
                </p>
                <p className="mt-2 text-lg font-black text-tertiary md:text-xl">
                  {formatRwf(summary.annualPassiveIncome, true)}
                </p>
              </div>
              <div className="p-5 md:px-7">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">
                  Potential monthly income
                </p>
                <p className="mt-2 text-lg font-black text-tertiary md:text-xl">
                  {formatRwf(summary.monthlyPassiveIncome, true)}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="simulator" className="scroll-mt-24 border-y border-outline/10 bg-[var(--md-sys-color-surface-container-low)]/72">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">Assumptions</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Tune the model</h2>
            </div>
            <button
              type="button"
              onClick={resetScenario}
              className="flex items-center gap-2 rounded-xl border border-outline/10 px-3 py-2.5 text-xs font-black text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-primary)]/30 hover:text-on-surface"
              aria-label="Reset entire simulation"
            >
              <RefreshCcw size={16} />
              Reset all
            </button>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4 md:col-span-2 xl:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Monthly contribution schedule
                  </span>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--md-sys-color-outline)]">
                    Default is one amount for the full horizon. Add periods for salary changes,
                    pauses, or temporary boosts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addContributionPeriod}
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-on-primary transition hover:opacity-90"
                >
                  <Plus size={15} />
                  Add period
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {contributionPeriods.map((period, index) => (
                  <div
                    key={period.id}
                    className="grid gap-3 rounded-xl border border-outline/10 bg-surface-container/45 p-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                      Amount
                      <input
                        type="number"
                        min={0}
                        step={50_000}
                        value={period.amount}
                        onChange={(event) =>
                          updateContributionPeriod(period.id, {
                            amount: Number(event.target.value),
                          })
                        }
                        className="mt-1.5 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
                      />
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                      From
                      <select
                        value={period.startMonth}
                        onChange={(event) =>
                          updateContributionPeriod(period.id, {
                            startMonth: Number(event.target.value),
                          })
                        }
                        className="mt-1.5 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
                      >
                        {Array.from({ length: totalSimulationMonths }, (_, monthIndex) => monthIndex + 1).map((month) => (
                          <option key={month} value={month}>
                            {simulationMonthLabel(assumptions, month)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                      Until
                      <select
                        value={period.endMonth}
                        onChange={(event) =>
                          updateContributionPeriod(period.id, {
                            endMonth: Number(event.target.value),
                          })
                        }
                        className="mt-1.5 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
                      >
                        {Array.from({ length: totalSimulationMonths }, (_, monthIndex) => monthIndex + 1).map((month) => (
                          <option key={month} value={month}>
                            {simulationMonthLabel(assumptions, month)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <span className="text-[11px] font-bold text-on-surface-variant">
                        {index === 0 ? "Base" : "Period"} ·{" "}
                        {period.endMonth - period.startMonth + 1} mo.
                      </span>
                      <button
                        type="button"
                        onClick={() => removeContributionPeriod(period.id)}
                        disabled={contributionPeriods.length <= 1}
                        aria-label="Remove contribution period"
                        className="inline-grid h-10 w-10 place-items-center rounded-xl border border-error/10 text-error transition hover:border-error/25 hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                <span>Current month: {formatRwf(currentMonthlyContribution)}</span>
                <span>Total periods: {contributionPeriods.length}</span>
                <span>
                  {contributionGapCount > 0
                    ? `${contributionGapCount} months with no scheduled contribution`
                    : "Every month has a scheduled contribution"}
                </span>
              </div>
            </div>
            <NumberControl
              label="Investment horizon"
              value={assumptions.horizonYears}
              onChange={(value) => update("horizonYears", value)}
              min={1}
              max={40}
              step={1}
              suffix=" years"
              help="How long you plan to follow the overall investment strategy."
            />
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Investment start</span>
              <div className="mt-3 grid grid-cols-[1fr_110px] gap-3">
                <select
                  aria-label="Investment start month"
                  value={assumptions.startMonth}
                  onChange={(event) => update("startMonth", Number(event.target.value))}
                  className="w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-3 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
                <input
                  aria-label="Investment start year"
                  type="number"
                  min={2020}
                  max={2100}
                  value={assumptions.startYear}
                  onChange={(event) => update("startYear", Number(event.target.value))}
                  className="w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-3 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
                />
              </div>
              <p className="mt-2 text-[11px] text-[var(--md-sys-color-outline)]">
                The {assumptions.horizonYears}-year projection ends in{" "}
                {simulationEnd
                  ? `${MONTH_NAMES[simulationEnd.calendarMonth - 1]} ${simulationEnd.calendarYear}`
                  : "the selected horizon"}.
              </p>
            </div>
            <div className="block rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4">
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  Fallback bond tenor
                  <InfoTip label="About fallback bond tenor">
                    The lifetime of one specific bond before its principal is repaid.
                  </InfoTip>
                </span>
                <span className="text-[11px] text-[var(--md-sys-color-outline)]">Official options</span>
              </span>
              <select
                aria-label="Fallback bond tenor"
                value={assumptions.tenorYears}
                onChange={(event) => update("tenorYears", Number(event.target.value))}
                className="mt-3 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-3 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
              >
                {TREASURY_BOND_TENORS.map((tenor) => (
                  <option key={tenor} value={tenor}>{tenor} years</option>
                ))}
              </select>
            </div>
            <NumberControl
              label="Fallback annual coupon rate"
              value={Math.round(modeledCouponRate * 10_000) / 100}
              onChange={(value) => update("annualCouponRate", value / 100)}
              min={MIN_ANNUAL_COUPON_RATE * 100}
              max={MAX_ANNUAL_COUPON_RATE * 100}
              step={0.05}
              suffix="% p.a."
              hint={`BK Capital range: ${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)}-${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}.`}
            />
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setAdvancedSettingsOpen((open) => !open)}
                aria-expanded={advancedSettingsOpen}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest/70 px-4 py-3 text-left transition hover:border-[var(--md-sys-color-primary)]/35"
              >
                <span className="flex items-center gap-2 text-xs font-black text-on-surface">
                  <Settings size={16} />
                  More assumptions
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${advancedSettingsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {advancedSettingsOpen && (
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <NumberControl label="Coupon reinvestment" value={Math.round(assumptions.reinvestmentRate * 100)} onChange={(value) => update("reinvestmentRate", value / 100)} min={0} max={100} step={5} suffix="%" />
                  <NumberControl
                    label="Expected auction fill"
                    value={Math.round(assumptions.auctionFillRate * 100)}
                    onChange={(value) => update("auctionFillRate", value / 100)}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                  <NumberControl label="Starting portfolio" value={assumptions.startingPortfolio} onChange={(value) => update("startingPortfolio", value)} min={0} max={15_000_000} step={50_000} prefix="RWF " />
                  <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4 md:col-span-2 xl:col-span-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                          Bond tenors to buy
                        </span>
                        <p className="mt-1 text-[11px] leading-5 text-[var(--md-sys-color-outline)]">
                          The projection repeats the current 12-month issuance
                          calendar. Contributions wait as 0% cash until a checked
                          tenor appears.
                        </p>
                      </div>
                      <span className="rounded-lg bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase text-on-surface-variant">
                        {allowedSimulationTenors.length} selected
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {SIMULATION_TREASURY_BOND_TENORS.map((tenor) => {
                        const checked = allowedSimulationTenors.includes(tenor);
                        const couponRate =
                          assumptions.tenorCouponRates?.[String(tenor)] ??
                          DEFAULT_ASSUMPTIONS.tenorCouponRates[String(tenor)] ??
                          assumptions.annualCouponRate;

                        return (
                          <label
                            key={tenor}
                            className={`rounded-xl border p-3 transition ${
                              checked
                                ? "border-primary/30 bg-primary/5"
                                : "border-outline/10 bg-surface-container/35"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-sm font-black">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAllowedTenor(tenor)}
                                  className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                />
                                {tenor}Y bond
                              </span>
                              <span className="text-[10px] font-bold text-on-surface-variant">
                                {checked ? "Buy" : "Skip"}
                              </span>
                            </span>
                            <span className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                              Coupon assumption
                            </span>
                            <input
                              type="number"
                              min={MIN_ANNUAL_COUPON_RATE * 100}
                              max={MAX_ANNUAL_COUPON_RATE * 100}
                              step={0.05}
                              value={Math.round(couponRate * 10_000) / 100}
                              onChange={(event) =>
                                updateTenorCouponRate(
                                  tenor,
                                  Number(event.target.value),
                                )
                              }
                              className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary/60"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[var(--md-sys-color-tertiary)]/20 bg-[var(--md-sys-color-tertiary)]/[0.05] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-tertiary)]">Extra cash</p>
                <h3 className="mt-1 font-black">One-time injections</h3>
              </div>
              <span className="rounded-lg bg-[var(--md-sys-color-tertiary)]/10 px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-tertiary)]">
                {cashInjections.length} added
              </span>
            </div>
            <form onSubmit={addCashInjection} className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.15fr_auto] lg:items-end">
              <input
                aria-label="Extra cash source"
                placeholder="Source, e.g. bonus"
                value={injectionDraft.label}
                onChange={(event) => setInjectionDraft((current) => ({ ...current, label: event.target.value }))}
                className="w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-tertiary)]/50"
              />
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                Amount
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={injectionDraft.amount}
                  onChange={(event) => setInjectionDraft((current) => ({ ...current, amount: Number(event.target.value) }))}
                  className="mt-1.5 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm text-on-surface outline-none focus:border-[var(--md-sys-color-tertiary)]/50"
                />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                Simulation year
                <input
                  type="number"
                  min={1}
                  max={assumptions.horizonYears}
                  required
                  value={injectionDraft.year}
                  onChange={(event) => setInjectionDraft((current) => ({ ...current, year: Number(event.target.value) }))}
                  className="mt-1.5 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm text-on-surface outline-none focus:border-[var(--md-sys-color-tertiary)]/50"
                />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">
                Month in that year
                <select
                  value={injectionDraft.monthInYear}
                  onChange={(event) => setInjectionDraft((current) => ({ ...current, monthInYear: Number(event.target.value) }))}
                  className="mt-1.5 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm text-on-surface outline-none focus:border-[var(--md-sys-color-tertiary)]/50"
                >
                  {MONTH_NAMES.map((_month, index) => {
                    const date = injectionCalendarDate(
                      injectionDraft.year,
                      index + 1,
                    );
                    return (
                      <option key={index} value={index + 1}>
                        {MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
                      </option>
                    );
                  })}
                </select>
              </label>
              <button className="flex h-full min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-tertiary)] px-4 py-3 text-xs font-black text-[var(--md-sys-color-on-primary)] hover:bg-[var(--md-sys-color-primary)]">
                <Plus size={15} /> Add
              </button>
            </form>
            <div className="mt-3 grid gap-2 rounded-xl border border-[var(--md-sys-color-tertiary)]/15 bg-surface-container-lowest p-3 text-[10px] leading-4 text-on-surface-variant sm:grid-cols-2">
              <span>
                Cash balance already waiting
                <strong className="mt-0.5 block text-on-surface">
                  {formatRwf(waitingCash)}
                </strong>
              </span>
              <span>
                Cash after draft
                <strong className="mt-0.5 block text-on-surface">
                  {formatRwf(cashAfterDraftInjection)}
                </strong>
              </span>
            </div>
            {cashInjections.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-outline/10 pt-4">
                {cashInjections
                  .slice()
                  .sort((a, b) => a.month - b.month)
                  .map((injection) => (
                    <div key={injection.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{injection.label}</p>
                        <p className="mt-1 text-[10px] text-[var(--md-sys-color-outline)]">
                          {formatRwf(injection.amount)} ·{" "}
                          {simulationMonthLabel(assumptions, injection.month)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCashInjection(injection.id)}
                        aria-label={`Remove ${injection.label}`}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-error/10 px-2.5 py-2 text-[10px] font-black uppercase tracking-wider text-error hover:border-error/25 hover:bg-error-container/30"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="mt-8 min-w-0">
            <GrowthChart values={chartProjection} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric
                label="Total cash invested"
                value={formatRwf(summary.totalContributions)}
                detail={
                  actualStartingLots.length > 0
                    ? "Saved bonds plus monthly plan and one-time injections"
                    : "Monthly plan plus one-time injections"
                }
              />
              <Metric label="Modeled bond purchases" value={String(projection.filter((row) => row.newBondPurchaseLot).length)} detail="Each monthly pooled purchase is tracked as one lot" />
              <Metric label="Net coupons earned" value={formatRwf(summary.totalCoupons)} detail={`${formatPercent(netAnnualRate)} net annual rate`} />
              <Metric label="Coupons reinvested" value={formatRwf(summary.totalReinvested)} detail={`${formatPercent(assumptions.reinvestmentRate)} reinvested`} />
              {actualStartingLots.length > 0 && (
                <Metric
                  label="Opening real bonds"
                  value={formatRwf(projectionStartingPrincipal)}
                  detail={`${actualStartingLots.length} saved active lots`}
                />
              )}
              <Metric label="Growth above contributions" value={formatRwf(summary.finalAccountValue - summary.totalContributions - growthStartingPrincipal)} accent />
            </div>
            {cashInjections.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Extra cash injected" value={formatRwf(totalCashInjected)} />
                <Metric
                  label="Final portfolio impact"
                  value={`+${formatRwf(injectionFinalImpact)}`}
                  detail="Extra cash plus the additional coupons it earns"
                  accent
                />
                <Metric
                  label="Compounding added"
                  value={`+${formatRwf(injectionFinalImpact - totalCashInjected)}`}
                />
              </div>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["RWF 50M", summary.milestone50m],
                ["RWF 100M", summary.milestone100m],
                ["RWF 200M", summary.milestone200m],
              ].map(([label, month]) => (
                <div key={String(label)} className="flex items-center gap-4 rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--md-sys-color-tertiary)]/10 text-[var(--md-sys-color-tertiary)]">
                    <Target size={18} />
                  </span>
                  <span>
                    <strong className="block text-sm">{label}</strong>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {month
                        ? `${MONTH_NAMES[projection[Number(month) - 1].calendarMonth - 1]} ${projection[Number(month) - 1].calendarYear} · Month ${month}`
                        : "Not reached"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="projection" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">Projection</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Annual view</h2>
          </div>
          <div className="rounded-2xl border border-[var(--md-sys-color-tertiary)]/20 bg-[var(--md-sys-color-tertiary)]/[0.07] px-4 py-3 text-xs text-[var(--md-sys-color-on-secondary-container)]">
            Passive income exceeds current annual contributions in{" "}
            <strong className="text-[var(--md-sys-color-on-primary-container)]">
              {summary.passiveIncomeCrossoverYear
                ? `Year ${summary.passiveIncomeCrossoverYear}`
                : "no modeled year"}
            </strong>
          </div>
        </div>

        <div className="bond-scrollbar mt-5 max-h-[72vh] overflow-auto rounded-3xl border border-outline/10 lg:max-h-none lg:overflow-visible">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="text-[10px] uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)]">
              <tr>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Year</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Invested this year</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Income this year</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Account value</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Annual passive income</th>
                <th className="sticky top-0 z-30 w-16 bg-[var(--md-sys-color-surface-container)] px-5 py-4 text-right shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Months</th>
              </tr>
            </thead>
            <tbody>
              {annualProjection.map((row) => {
                const isExpanded = expandedYears.has(row.year);
                const months = projection.slice((row.year - 1) * 12, row.year * 12);
                return (
                  <Fragment key={row.year}>
                    <tr className={`border-t border-outline/10 text-sm transition hover:bg-surface-container-low ${isExpanded ? "bg-surface-container-low" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="font-black text-[var(--md-sys-color-primary)]">
                          Year {row.year}
                        </span>
                        <span className="mt-1 block text-[10px] font-medium text-on-surface-variant">
                          {MONTH_NAMES[row.periodStartMonth - 1]}{" "}
                          {row.periodStartYear} -{" "}
                          {MONTH_NAMES[row.periodEndMonth - 1]}{" "}
                          {row.periodEndYear}
                        </span>
                      </td>
                      <td className="px-5 py-4">{formatRwf(row.annualContributions)}</td>
                      <td className="px-5 py-4 text-[var(--md-sys-color-on-surface-variant)]">
                        {formatRwf(row.annualIncome)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block font-bold">
                          {formatRwf(row.portfolio)}
                        </span>
                        {row.cashBalance > 0 && (
                          <span className="mt-1 block text-[9px] text-on-surface-variant">
                            {formatRwf(row.bondHoldings)} bonds ·{" "}
                            {formatRwf(row.cashBalance)} Cash
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[var(--md-sys-color-tertiary)]">
                        {formatRwf(row.passiveIncome)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleYear(row.year)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} year ${row.year}`}
                          className="inline-grid h-9 w-9 place-items-center rounded-xl border border-outline/10 text-[var(--md-sys-color-on-surface-variant)] transition hover:border-[var(--md-sys-color-primary)]/40 hover:text-[var(--md-sys-color-primary)]"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-[var(--md-sys-color-primary)]/10 bg-[var(--md-sys-color-surface-container-lowest)]">
                        <td colSpan={6} className="p-0">
                          <div className="px-4 py-4 md:px-6">
                            <table className="w-full min-w-[720px] border-collapse text-left">
                              <thead className="text-[9px] uppercase tracking-[0.14em] text-[var(--md-sys-color-outline)]">
                                <tr>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Month</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Contribution</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Bond purchase</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Coupons</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Cash</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Account value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {months.map((month, monthIndex) => (
                                  <tr
                                    key={month.month}
                                    className={`text-xs ${
                                      monthIndex % 2 === 0
                                        ? "bg-[var(--md-sys-color-surface-container-lowest)]"
                                        : "bg-[var(--md-sys-color-surface-container)]/35"
                                    }`}
                                  >
                                    <td className="px-3 py-3 font-bold">
                                      {MONTH_NAMES[month.calendarMonth - 1].slice(0, 3)}{" "}
                                      {month.calendarYear}
                                    </td>
                                    <td className="px-3 py-3">{formatRwf(month.personalContribution + month.cashInjection + month.realBondPurchase)}</td>
                                    <td className="px-3 py-3 font-black text-primary">
                                      {formatRwf(month.newBondPurchase + month.realBondPurchase)}
                                      <span className="mt-1 block text-[9px] font-bold text-on-surface-variant">
                                        {month.realBondPurchase > 0
                                          ? "saved bond"
                                          : `${month.auctionTenorYears}Y ${
                                              month.auctionEligible
                                                ? "allowed"
                                                : "skipped"
                                            }`}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3">{formatRwf(month.couponPayment)}</td>
                                    <td className="px-3 py-3">{formatRwf(month.closingCashBalance)}</td>
                                    <td className="px-3 py-3 font-black">{formatRwf(month.totalAccountValue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="guide" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">Model guide</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Useful, transparent, intentionally conservative.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)]">
              This planner models monthly contributions, partial Treasury bond
              auction allocation, and uninvested cash at 0% return.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Market price risk", "Bond prices can fluctuate if sold before maturity."],
              ["Holding to maturity", "Holding to maturity avoids market-price loss if the issuer pays as agreed."],
              ["Coupon and tenor", `BK Capital states tenors of ${TREASURY_BOND_TENORS.join(", ")} years and annual coupon rates from ${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)} to ${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}, depending on the issuance.`],
              ["Auction fill risk", `The model defaults to ${formatPercent(DEFAULT_ASSUMPTIONS.auctionFillRate, 0)} allocation based on the BNR historical sold/applied pattern, not 100% allocation.`],
              ["Uninvested cash", "Unfilled bond money stays as cash at 0% return until it is used for another bid."],
              ["Secondary market", `Buying or selling before maturity carries a ${formatPercent(SECONDARY_MARKET_COMMISSION_RATE, 3)} commission on turnover on each side.`],
            ].map(([title, copy], index) => (
              <article key={title} className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)]">0{index + 1}</span>
                <h3 className="mt-3 font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-outline/10 bg-surface-container-lowest/30">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 md:flex-row md:items-center md:px-8">
          <div>
            <GaboBrand />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
              Personal finance systems · Built with care
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black text-on-surface-variant md:justify-end">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-outline/10 px-3 py-2 transition hover:border-primary/30 hover:text-primary">
              <Landmark size={14} />
              Bonds
            </Link>
            <Link href="/simulator" className="inline-flex items-center gap-1.5 rounded-xl border border-outline/10 px-3 py-2 transition hover:border-primary/30 hover:text-primary">
              <Sparkles size={14} />
              Simulator
            </Link>
            <Link href="/education" className="inline-flex items-center gap-1.5 rounded-xl border border-outline/10 px-3 py-2 transition hover:border-primary/30 hover:text-primary">
              <BookOpenText size={14} />
              Courses
            </Link>
          </div>
          <div className="text-xs text-on-surface-variant md:text-right">
            <p>Rwanda Treasury Bond Planner</p>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-2xl border border-outline/10 bg-[var(--md-sys-color-background)]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden">
        <Link href="/portfolio" aria-label="Open portfolio" className="rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <WalletCards size={18} />
        </Link>
        <Link href="/calendar" aria-label="Open issuance calendar" className="rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <CalendarClock size={18} />
        </Link>
      </nav>
    </main>
  );
}

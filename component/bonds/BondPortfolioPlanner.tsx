"use client";

import {
  BarChart3,
  BookOpenText,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  FileText,
  Landmark,
  Settings,
  LockKeyhole,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  Sparkles,
  Target,
  Trash2,
  WalletCards,
  UserPlus,
  Users,
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
import {
  BNR_TREASURY_BOND_ISSUANCE_CALENDAR,
  formatCalendarDate,
  getIssuanceAlert,
  getIssuanceStatus,
  getNextIssuanceEvent,
} from "@/lib/bonds/issuance-calendar";
import {
  formatFxEstimateAssumption,
  formatHardCurrency,
  rwfToEstimatedHardCurrency,
} from "@/lib/bonds/fx";
import type {
  BondAssumptions,
  CashInjection,
  BondPurchase,
  BondPurchaseInput,
  ContributionPeriod,
  EquityHolding,
  ModeledBondPurchase,
} from "@/lib/bonds/types";
import {
  catalogEntryForPurchase,
} from "@/lib/bonds/catalog";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { BondPortfolioChrome, GaboBrand } from "./BondSiteChrome";
import { calculateBondTracking } from "@/lib/bonds/tracking";
import { BondAccountAccess, type BondAccountUser } from "./BondAccountAccess";
import { BondRegistrationSettings } from "./BondRegistrationSettings";
import { BondAccountManagement } from "./BondAccountManagement";
import { BondMarketQuote } from "./BondMarketQuote";
import { useDeferredMarket } from "./useDeferredMarket";
import type { BondQuotes } from "@/lib/bonds/market-quotes";
import { BondPdfUpload } from "./BondPdfUpload";
import { BondPurchaseDialog } from "./BondPurchaseDialog";
import { EquityPurchaseReview } from "./EquityPurchaseReview";
import { bondPurchaseKey, sameEquityPurchase } from "@/lib/bonds/purchase-identity";
import { parseEquityPurchase } from "@/lib/bonds/equity-validation";
import type { PurchasePdfImport, EquityPdfImport } from "@/lib/bonds/equity-pdf-parser";
import type { BondPdfImport } from "@/lib/bonds/pdf-import-parser";

type PlannerView = "simulator" | "portfolio";

const STORAGE_KEY = "rwanda-bond-planner-assumptions-v2";
const INJECTIONS_STORAGE_KEY = "rwanda-bond-planner-injections-v1";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EMPTY_PURCHASE: BondPurchaseInput = {
  instrumentType: "treasury", issuer: "Government of Rwanda", currency: "RWF", market: "primary",
  purchaseDate: "", settlementDate: "", bondName: "", isin: "", tenorYears: 0,
  faceValue: 0, pricePercent: 0, accruedInterestPaid: 0, feesPaid: 0, amountInvested: 0,
  couponRate: 0, withholdingTaxRate: WITHHOLDING_TAX_RATE, maturityDate: "", firstCouponDate: "",
  couponDates: [], couponFrequency: 2, scheduleConfidence: "estimated", broker: "",
  accountReference: "", sourceUrl: "", status: "active", notes: "",
};

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

function Metric({
  label,
  value,
  detail,
  accent = false,
  compact = false,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <article
      className={`border ${compact ? "min-w-0 rounded-xl p-3 sm:rounded-3xl sm:p-5 md:p-6" : "rounded-3xl p-5 md:p-6"} ${
        accent
          ? "border-[var(--md-sys-color-primary)]/35 bg-[var(--md-sys-color-primary)]/10"
          : "border-outline/10 bg-surface-container-lowest"
      }`}
    >
      <p className={`${compact ? "text-[11px] font-bold leading-4 sm:text-[10px] sm:font-black sm:uppercase sm:tracking-[0.19em]" : "text-[10px] font-black uppercase tracking-[0.19em]"} text-[var(--md-sys-color-on-surface-variant)]`}>
        {label}
      </p>
      <p className={`${compact ? "mt-1.5 text-[clamp(0.875rem,3.8vw,1.125rem)] leading-snug tabular-nums sm:mt-3 sm:text-2xl md:text-3xl" : "mt-3 text-2xl md:text-3xl"} break-words font-black tracking-tight`}>
        {compact ? value.split(/\s+/).map((part, index) => <Fragment key={index}>{index > 0 && " "}<span className="inline-block">{part}</span></Fragment>) : value}
      </p>
      {detail && <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">{detail}</p>}
    </article>
  );
}

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline/10 bg-[var(--md-sys-color-surface-container-lowest)]/85 p-4 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-outline)]">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function HoldingDisclosure({ label, expanded, controls, onToggle }: { label: string; expanded: boolean; controls: string; onToggle: () => void }) {
  return <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={controls} aria-label={`${expanded ? "Hide" : "Show"} details for ${label}`} className="holding-disclosure flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-sm font-black sm:hidden">
    <span className="min-w-0 break-words">{label}</span>
    <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
  </button>;
}

function HoldingAmount({ value }: { value: number }) {
  return <>{formatRwf(value).split(/\s+/).map((part, index) => <Fragment key={index}>{index > 0 && " "}<span className="inline-block">{part}</span></Fragment>)}</>;
}

function formatHoldingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Date unavailable";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-on-surface-variant">{label}</span>
      <strong className="text-right text-on-surface">{value}</strong>
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline/10 bg-surface-container-low px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-on-surface">
        {value || "-"}
      </p>
    </div>
  );
}

function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="grid h-5 w-5 place-items-center rounded-full border border-[var(--md-sys-color-primary)]/35 bg-[var(--md-sys-color-primary)]/[0.07] text-[11px] font-black text-[var(--md-sys-color-primary)] outline-none transition hover:border-[var(--md-sys-color-primary)]/70 hover:bg-[var(--md-sys-color-primary)]/10 focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/30"
      >
        !
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-7 z-50 w-64 -translate-x-1/2 rounded-xl border border-outline/10 bg-surface-container-lowest p-3 text-left text-[11px] font-medium leading-5 text-on-surface-variant opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        style={{
          backgroundColor:
            "var(--md-sys-color-surface-container-lowest)",
        }}
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

function GrowthChart({
  values,
}: {
  values: {
    month: number;
    calendarMonth: number;
    calendarYear: number;
    portfolio: number;
    contributions: number;
    monthlyIncome: number;
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
  const firstPortfolioPoint = point(values[0]?.portfolio ?? 0, 0);
  const lastPortfolioPoint = point(
    values.at(-1)?.portfolio ?? 0,
    Math.max(0, values.length - 1),
  );
  const portfolioSteps = portfolioPath.includes(" H")
    ? portfolioPath.slice(portfolioPath.indexOf(" H"))
    : "";
  const areaPath = `M ${firstPortfolioPoint.x} ${height - pad} L ${firstPortfolioPoint.x} ${firstPortfolioPoint.y}${portfolioSteps} L ${lastPortfolioPoint.x} ${height - pad} Z`;
  const activePortfolioPoint = activeValue
    ? point(activeValue.portfolio, activeIndex)
    : null;
  const activeContributionPoint = activeValue
    ? point(activeValue.contributions, activeIndex)
    : null;
  const activeMonthLabel = activeValue
    ? `${MONTH_NAMES[activeValue.calendarMonth - 1]} ${activeValue.calendarYear} (${Math.max(0, (activeValue.month - 1) / 12).toFixed(1)}Y)`
    : "";
  const activeElapsedMonths = activeValue ? activeValue.month - 1 : 0;
  const activeMonthlyIncomeUsd = activeValue
    ? rwfToEstimatedHardCurrency(
        activeValue.monthlyIncome,
        "USD",
        activeElapsedMonths,
      )
    : 0;
  const activeMonthlyIncomeEur = activeValue
    ? rwfToEstimatedHardCurrency(
        activeValue.monthlyIncome,
        "EUR",
        activeElapsedMonths,
      )
    : 0;
  const tooltipX = activePortfolioPoint
    ? Math.min(Math.max(activePortfolioPoint.x - 112, 36), width - 260)
    : 0;
  const tooltipY = activePortfolioPoint
    ? Math.max(34, Math.min(activePortfolioPoint.y - 132, height - 146))
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
        <path d={areaPath} fill="rgba(122,162,247,.09)" />
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
          shapeRendering="geometricPrecision"
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
                width="224"
                height="126"
                rx="14"
                fill="var(--md-sys-color-surface-container-lowest)"
                stroke="rgba(100,116,139,0.18)"
              />
              <text
                x="14"
                y="22"
                fill="var(--md-sys-color-on-surface)"
                fontSize="11"
                fontWeight="800"
              >
                {activeMonthLabel}
              </text>
              <text
                x="14"
                y="43"
                fill="var(--md-sys-color-primary)"
                fontSize="11"
                fontWeight="800"
              >
                Portfolio {formatRwf(activeValue.portfolio, true)}
              </text>
              <text
                x="14"
                y="64"
                fill="var(--md-sys-color-tertiary)"
                fontSize="11"
                fontWeight="800"
              >
                Contributions {formatRwf(activeValue.contributions, true)}
              </text>
              <text
                x="14"
                y="85"
                fill="var(--md-sys-color-on-surface-variant)"
                fontSize="11"
                fontWeight="800"
              >
                Avg monthly income ≈ {formatRwf(activeValue.monthlyIncome, true)}
              </text>
              <text
                x="14"
                y="106"
                fill="var(--md-sys-color-outline)"
                fontSize="11"
                fontWeight="800"
              >
                FX estimate ≈ {formatHardCurrency(activeMonthlyIncomeUsd, "USD", true)}
                {" / "}
                {formatHardCurrency(activeMonthlyIncomeEur, "EUR", true)}
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
              aria-label={`${MONTH_NAMES[value.calendarMonth - 1]} ${value.calendarYear}: portfolio ${formatRwf(value.portfolio)}, contributions ${formatRwf(value.contributions)}, average monthly income about ${formatRwf(value.monthlyIncome)}`}
              onMouseEnter={() => setActiveMonth(value.month)}
              onFocus={() => setActiveMonth(value.month)}
            />
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-bold text-[var(--md-sys-color-outline)]">
        <span>
          {MONTH_NAMES[(values[0]?.calendarMonth ?? 1) - 1]}{" "}
          {values[0]?.calendarYear ?? ""}
        </span>
        <span>
          {MONTH_NAMES[(values.at(-1)?.calendarMonth ?? 1) - 1]}{" "}
          {values.at(-1)?.calendarYear ?? ""}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-bold text-[var(--md-sys-color-outline)]">
        {formatFxEstimateAssumption()}
      </p>
    </div>
  );
}


export function BondPortfolioPlanner({ view = "portfolio" }: { view?: PlannerView }) {
  const [assumptions, setAssumptions] =
    useState<BondAssumptions>(DEFAULT_ASSUMPTIONS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [cashInjections, setCashInjections] = useState<CashInjection[]>([]);
  const [injectionDraft, setInjectionDraft] = useState({
    label: "",
    amount: 1_000_000,
    year: 1,
    monthInYear: 1,
  });
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set([1]),
  );
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(
    () => new Set(),
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [accountUser, setAccountUser] = useState<BondAccountUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [purchases, setPurchases] = useState<BondPurchase[]>([]);
  const [equities, setEquities] = useState<EquityHolding[]>([]);
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(() => new Set());
  function toggleHolding(key: string) {
    setExpandedHoldings((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  const [portfolioError, setPortfolioError] = useState("");
  const [purchase, setPurchase] = useState<BondPurchaseInput>(() => ({
    ...EMPTY_PURCHASE,
  }));
  const [purchasePanelOpen, setPurchasePanelOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(
    null,
  );
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [importingPdf, setImportingPdf] = useState(false);
  const [pdfReview, setPdfReview] = useState<(BondPdfImport & { fileName: string }) | null>(null);
  const [equityReview, setEquityReview] = useState<(EquityPdfImport & { fileName: string }) | null>(null);
  const [pdfReviewed, setPdfReviewed] = useState(false);
  const [additionalCouponDate, setAdditionalCouponDate] = useState("");
  const [portfolioSettingsOpen, setPortfolioSettingsOpen] = useState(false);
  const [portfolioLoadedFor, setPortfolioLoadedFor] = useState<BondAccountUser | null>(null);
  const [accountManagementOpen, setAccountManagementOpen] = useState(false);
  const [purchasePendingDelete, setPurchasePendingDelete] =
    useState<BondPurchase | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [copiedSecurityCode, setCopiedSecurityCode] = useState("");
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(
    null,
  );
  const assumptionsHydrated = useRef<string | null>(null);
  const prefillApplied = useRef("");
  const storageScope = accountUser?.id ?? "public";
  const assumptionsKey = `${STORAGE_KEY}:${storageScope}`;
  const injectionsKey = `${INJECTIONS_STORAGE_KEY}:${storageScope}`;

  useEffect(() => {
    assumptionsHydrated.current = null;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = window.localStorage.getItem(assumptionsKey) || (storageScope === "owner" ? window.localStorage.getItem(STORAGE_KEY) : null);
        const parsed = { ...DEFAULT_ASSUMPTIONS, ...(stored ? JSON.parse(stored) : {}) };
        setAssumptions({ ...parsed, contributionPeriods: normalizeContributionPeriods(parsed) });
        const injections = window.localStorage.getItem(injectionsKey) || (storageScope === "owner" ? window.localStorage.getItem(INJECTIONS_STORAGE_KEY) : null);
        setCashInjections(injections ? JSON.parse(injections) : []);
      } catch {
        window.localStorage.removeItem(assumptionsKey);
        window.localStorage.removeItem(injectionsKey);
        setAssumptions(DEFAULT_ASSUMPTIONS);
        setCashInjections([]);
      } finally { assumptionsHydrated.current = storageScope; }
    });
    return () => { active = false; };
  }, [assumptionsKey, injectionsKey, storageScope]);

  useEffect(() => {
    if (assumptionsHydrated.current !== storageScope) return;
    window.localStorage.setItem(assumptionsKey, JSON.stringify(assumptions));
  }, [assumptions, assumptionsKey, storageScope]);

  useEffect(() => {
    if (assumptionsHydrated.current !== storageScope) return;
    window.localStorage.setItem(injectionsKey, JSON.stringify(cashInjections));
  }, [cashInjections, injectionsKey, storageScope]);

  useEffect(() => {
    if (view !== "portfolio" || editingPurchaseId) return;
    const search = window.location.search;
    if (!search || prefillApplied.current === search) return;

    if (new URLSearchParams(search).get("prefill") !== "calendar") return;
    prefillApplied.current = search;
    queueMicrotask(() => {
      setPurchase({ ...EMPTY_PURCHASE, couponDates: [] });
      setPdfReview(null);
      setEquityReview(null);
      setPdfReviewed(false);
      setPurchasePanelOpen(true);
    });
  }, [editingPurchaseId, view]);

  useEffect(() => {
    fetch("/api/bonds/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { setAuthenticated(Boolean(data.authenticated)); setAccountUser(data.user ?? null); })
      .catch(() => { setAuthenticated(false); setAccountUser(null); })
      .finally(() => setSessionLoading(false));
  }, [view]);

  useEffect(() => {
    if (!authenticated || !accountUser) return;
    const controller = new AbortController();
    const load = async (path: string) => {
      const response = await fetch(path, { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load portfolio records.");
      return data;
    };
    const bondsRequest = load("/api/bonds/purchases").then((data) => { if (!controller.signal.aborted) setPurchases(data.purchases); });
    const stocksRequest = load("/api/bonds/equities").then((data) => { if (!controller.signal.aborted) setEquities(data.holdings); });
    void Promise.allSettled([bondsRequest, stocksRequest]).then(([bonds, stocks]) => {
      if (controller.signal.aborted) return;
      if (bonds.status === "rejected" || stocks.status === "rejected") setPortfolioError("Some portfolio records could not be loaded. Reload to try again.");
      setPortfolioLoadedFor(accountUser);
    });
    return () => controller.abort();
  }, [authenticated, accountUser]);

  const bondMarket = useDeferredMarket<BondQuotes>("/api/bonds/rse/quotes?kind=bonds", view === "portfolio" && authenticated && portfolioLoadedFor === accountUser && purchases.length > 0 && !portfolioError && !purchasePanelOpen && !portfolioSettingsOpen && !accountManagementOpen && !importingPdf && !savingPurchase && !deletingPurchaseId && !purchasePendingDelete);

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
      purchases
        .map((item) => purchaseToStartingLot(item, modeledAssumptions))
        .filter((lot): lot is ModeledBondPurchase => Boolean(lot)),
    [modeledAssumptions, purchases],
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
            completionYear: row.calendarYear,
            periodStartMonth: periodStart.calendarMonth,
            periodStartYear: periodStart.calendarYear,
            periodEndMonth: row.calendarMonth,
            periodEndYear: row.calendarYear,
            portfolio: row.totalAccountValue,
            bondHoldings: row.closingPortfolio,
            cashBalance: row.closingCashBalance,
            contributions: row.totalContributions,
            annualContributions:
              row.totalContributions -
              (index > 0 ? projection[index * 12 - 1].totalContributions : 0),
            annualCashInjections: projection
              .slice(index * 12, index * 12 + 12)
              .reduce((total, month) => total + month.cashInjection, 0),
            coupons: row.totalCoupons,
            annualCoupons:
              row.totalCoupons -
              (index > 0 ? projection[index * 12 - 1].totalCoupons : 0),
            passiveIncome: row.annualPassiveIncome,
            bondPassiveIncome: row.annualBondPassiveIncome,
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
        monthlyIncome: row.monthlyPassiveIncome,
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
  const actualPortfolio = purchases.reduce(
    (total, item) => total + (item.status === "active" ? item.faceValue : 0),
    0,
  );
  const actualCashCost = purchases.reduce(
    (total, item) => total + item.amountInvested,
    0,
  );
  const actualEquityCost = equities.reduce(
    (total, item) => total + item.netAmountPayable,
    0,
  );
  const actualEquityShares = equities.reduce(
    (total, item) => total + item.shares,
    0,
  );
  const actualInvestmentCashCost = actualCashCost + actualEquityCost;
  const totalCashInjected = cashInjections.reduce(
    (total, injection) => total + injection.amount,
    0,
  );
  const injectionFinalImpact =
    summary.finalAccountValue - baselineSummary.finalAccountValue;
  const simulationEnd = projection.at(-1);
  const nextIssuance = getNextIssuanceEvent(
    BNR_TREASURY_BOND_ISSUANCE_CALENDAR,
  );
  const nextIssuanceStatus = nextIssuance
    ? getIssuanceStatus(nextIssuance)
    : null;
  const nextIssuanceAlert = nextIssuance
    ? getIssuanceAlert(nextIssuance)
    : null;
  const actualAnnualIncome = purchases.reduce(
    (total, item) =>
      total +
      (item.status === "active"
        ? item.faceValue * item.couponRate * (1 - item.withholdingTaxRate)
        : 0),
    0,
  );
  const projectionStartingPrincipal = actualStartingLots.reduce(
    (total, lot) => total + lot.amount,
    0,
  );
  const purchaseCashCost =
    Math.round(
      (purchase.faceValue * (purchase.pricePercent / 100) +
        purchase.accruedInterestPaid +
        purchase.feesPaid) *
        100,
    ) / 100;
  const duplicateImport = equityReview ? equities.some((item) => sameEquityPurchase(item, { ...equityReview.fields, id: "", createdAt: "" })) : pdfReview ? purchases.some((item) => item.id !== editingPurchaseId && bondPurchaseKey(item) === bondPurchaseKey({ ...purchase, amountInvested: purchaseCashCost })) : false;
  const purchaseAnnualNetCoupon =
    purchase.status === "submitted" && purchase.couponRate === 0
      ? 0
      : purchase.faceValue * purchase.couponRate * (1 - WITHHOLDING_TAX_RATE);
  const purchaseTermsLocked =
    Boolean(editingPurchaseId) && purchase.status !== "submitted";
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
  const combinedBondPurchase =
    (selectedInjectionRow?.newBondPurchase ?? 0) + additionalBondPurchase;
  const cashAfterDraftInjection =
    Math.round(
      (waitingCash + draftInjectionAmount - additionalBondPurchase) * 100,
    ) / 100;
  const amountNeededForNextLot =
    waitingCash > 0 ? assumptions.purchaseMinimum - waitingCash : 0;

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
      const nextPeriod = {
        id: crypto.randomUUID(),
        amount: lastPeriod?.amount ?? current.monthlyContribution,
        startMonth,
        endMonth: totalMonths,
      };

      return {
        ...current,
        contributionPeriods: [...periods, nextPeriod],
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
    setExpandedYears(new Set([1]));
    setExpandedMonths(new Set());
    setAdvancedSettingsOpen(false);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_ASSUMPTIONS),
    );
    window.localStorage.removeItem(INJECTIONS_STORAGE_KEY);
  }

  function removeCashInjection(id: string) {
    const next = cashInjections.filter((injection) => injection.id !== id);
    setCashInjections(next);
    window.localStorage.setItem(
      INJECTIONS_STORAGE_KEY,
      JSON.stringify(next),
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

  function toggleMonth(month: number) {
    setExpandedMonths((current) => {
      const next = new Set(current);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
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

  function injectionCalendarDate(year: number, monthInYear: number) {
    return new Date(
      assumptions.startYear,
      assumptions.startMonth - 1 + (year - 1) * 12 + monthInYear - 1,
      1,
    );
  }

  async function logout() {
    try {
      const response = await fetch("/api/bonds/auth/logout", { method: "POST" });
      if (!response.ok) { setPortfolioError("Sign-out failed. Please try again."); return; }
      setAuthenticated(false);
      setAccountUser(null);
      setPurchases([]);
      setEquities([]);
      setExpandedHoldings(new Set());
      setPurchasePanelOpen(false);
      setPurchase({ ...EMPTY_PURCHASE, couponDates: [] });
      setPdfReview(null);
      setEquityReview(null);
      setPurchasePendingDelete(null);
      setPortfolioSettingsOpen(false);
      setPortfolioLoadedFor(null);
      setAccountManagementOpen(false);
      setPortfolioError("");
    } catch { setPortfolioError("Sign-out failed. Please try again."); }
  }

  async function savePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (equityReview) {
      if (savingPurchase || importingPdf || !pdfReviewed || duplicateImport) return;
      const input = parseEquityPurchase(equityReview.fields);
      if (!input) { setPortfolioError("Check the share details, dates and fee totals before saving."); return; }
      setSavingPurchase(true);
      setPortfolioError("");
      try {
        const response = await fetch("/api/bonds/equities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
        const data = await response.json();
        if (!response.ok) { setPortfolioError(data.error ?? "The share purchase could not be saved."); return; }
        setEquities((current) => [data.holding, ...current]);
        setEquityReview(null);
        setPurchasePanelOpen(false);
      } catch { setPortfolioError("The share purchase could not be saved. Please try again."); }
      finally { setSavingPurchase(false); }
      return;
    }
    if (duplicateImport || (!editingPurchaseId && !pdfReview)) return;
    if (savingPurchase || importingPdf || (pdfReview && !pdfReviewed)) return;
    setSavingPurchase(true);
    setPortfolioError("");
    const couponDates = purchase.couponDates;
    try {
      const response = await fetch(
        editingPurchaseId
          ? `/api/bonds/purchases/${editingPurchaseId}`
          : "/api/bonds/purchases",
        {
          method: editingPurchaseId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...purchase,
            instrumentType: "treasury",
            issuer: "Government of Rwanda",
            currency: "RWF",
            market: "primary",
            broker: "BK Capital",
            withholdingTaxRate: WITHHOLDING_TAX_RATE,
            couponFrequency: 2,
            scheduleConfidence:
              purchase.status === "submitted"
                ? "estimated"
                : purchase.scheduleConfidence,
            couponDates: purchase.status === "submitted" ? [] : couponDates,
            amountInvested: purchaseCashCost,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setPortfolioError(data.error ?? "The purchase could not be saved.");
        return;
      }
      setPurchases((current) =>
        editingPurchaseId
          ? current.map((item) =>
              item.id === editingPurchaseId ? data.purchase : item,
            )
          : [data.purchase, ...current],
      );
      setPurchase({ ...EMPTY_PURCHASE });
      setEditingPurchaseId(null);
      setPurchasePanelOpen(false);
    } catch {
      setPortfolioError("The purchase could not be saved. Please try again.");
    } finally {
      setSavingPurchase(false);
    }
  }

  function closePurchaseDialog() {
    if (savingPurchase) return;
    setPurchasePanelOpen(false);
    setEditingPurchaseId(null);
  }

  function editPurchase(item: BondPurchase) {
    setPortfolioError("");
    setPdfReview(null);
    setEquityReview(null);
    setPdfReviewed(false);
    const { id, createdAt, ...input } = item;
    void id;
    void createdAt;
    setPurchase({
      ...input,
      instrumentType: "treasury",
      issuer: "Government of Rwanda",
      currency: "RWF",
      market: "primary",
      broker: "BK Capital",
      withholdingTaxRate: WITHHOLDING_TAX_RATE,
      couponFrequency: 2,
      scheduleConfidence:
        input.status === "submitted" ? "estimated" : input.scheduleConfidence,
    });
    setEditingPurchaseId(item.id);
    setPurchasePanelOpen(true);
  }

  function startNewPurchase() {
    setPortfolioError("");
    setEditingPurchaseId(null);
    setPdfReview(null);
    setEquityReview(null);
    setPdfReviewed(false);
    setAdditionalCouponDate("");
    setPurchase({ ...EMPTY_PURCHASE, couponDates: [] });
    setPurchasePanelOpen(true);
  }

  function applyPdfImport(result: PurchasePdfImport, fileName: string) {
    setPdfReviewed(false);
    setPortfolioError("");
    if (result.kind === "equity") {
      setPdfReview(null);
      setEquityReview({ ...result, fileName });
      return;
    }
    setEquityReview(null);
    setAdditionalCouponDate("");
    setPurchase({ ...EMPTY_PURCHASE, couponDates: [], ...result.fields });
    setPdfReview({ ...result, fileName });
    setPdfReviewed(false);
    setPortfolioError("");
  }

  async function removePurchase() {
    if (!purchasePendingDelete) return;
    const { id } = purchasePendingDelete;
    setDeletingPurchaseId(id);
    setPortfolioError("");
    try {
      const response = await fetch(`/api/bonds/purchases/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPurchases((current) => current.filter((item) => item.id !== id));
        if (editingPurchaseId === id) {
          setPurchase({ ...EMPTY_PURCHASE });
          setEditingPurchaseId(null);
          setPurchasePanelOpen(false);
        }
        setPurchasePendingDelete(null);
        setDeleteConfirmation("");
        if (purchases.length <= 1) setPortfolioSettingsOpen(false);
      } else {
        const data = await response.json().catch(() => ({}));
        setPortfolioError(
          data.error ?? "Could not delete the purchase record.",
        );
      }
    } catch {
      setPortfolioError("Could not delete the purchase record.");
    } finally {
      setDeletingPurchaseId(null);
    }
  }

  function requestPurchaseDelete(item: BondPurchase) {
    setPurchasePendingDelete(item);
    setDeleteConfirmation("");
  }

  async function copySecurityCode(code: string) {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedSecurityCode(code);
    window.setTimeout(() => setCopiedSecurityCode(""), 1400);
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
      "Purchase Charge",
      "Modeled Purchase Lot",
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
      row.purchaseCharge,
      row.newBondPurchaseLot?.id ?? "",
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
      <ImigongoBackground />
      <BondPortfolioChrome active={view === "portfolio" ? "/portfolio" : "/simulator"} actions={view === "simulator" ? <button onClick={exportProjection} className="rounded-lg border border-outline/15 px-3 py-2 text-xs font-bold">Export CSV</button> : undefined} />

      {view === "simulator" && (
        <>
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
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rotate-45 border border-primary/15" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rotate-45 border border-primary/20" />
            <div className="border-b border-outline/10 p-6 md:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Current scenario · Live model
              </p>
              <p className="mt-3 text-xl font-black leading-snug md:text-2xl">
                Invest {contributionLabel} for{" "}
                {assumptions.horizonYears} years
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                Starting {MONTH_NAMES[assumptions.startMonth - 1]}{" "}
                {assumptions.startYear}, at a {formatPercent(modeledCouponRate)} annual
                coupon rate with {formatPercent(assumptions.reinvestmentRate)} of net
                coupons reinvested and {formatPercent(assumptions.auctionFillRate)} expected
                auction fill. Uninvested cash is held at 0% return.
              </p>
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

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--md-sys-color-outline)]">
          <span>Net coupon rate: {formatPercent(netAnnualRate, 2)}</span>
          <span>Expected auction fill: {formatPercent(assumptions.auctionFillRate, 0)}</span>
          <span>Uninvested cash return: 0%</span>
          <span>Government withholding tax: {formatPercent(WITHHOLDING_TAX_RATE, 0)}</span>
          <span>Projection, not a guaranteed return</span>
        </div>
      </section>

      <section id="simulator" className="scroll-mt-24 border-y border-outline/10 bg-[var(--md-sys-color-surface-container-low)]/72">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">Assumptions</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Tune the model</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Set the core strategy once, then use extra cash separately
                  when gifts, bonuses, coupons, or idle Cash balances change
                  your next bid.
                </p>
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
                      school fees seasons, pauses, or temporary boosts.
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
                help="How long you plan to follow the overall investment strategy. A 20-year horizon can include several individual bonds that mature and are replaced."
              />
              <NumberControl
                label="Fallback annual coupon rate"
                value={Math.round(modeledCouponRate * 10_000) / 100}
                onChange={(value) => update("annualCouponRate", value / 100)}
                min={MIN_ANNUAL_COUPON_RATE * 100}
                max={MAX_ANNUAL_COUPON_RATE * 100}
                step={0.05}
                suffix="% p.a."
                hint={`BK Capital range: ${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)}–${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}. Use the rate published for the specific NBR issuance.`}
              />
              <p className="flex items-center justify-between gap-3 rounded-xl bg-surface-container/55 px-4 py-3 text-xs text-on-surface-variant xl:col-span-3">
                <span>
                  Withholding tax is fixed in this model at{" "}
                  <strong className="text-on-surface">
                    {formatPercent(WITHHOLDING_TAX_RATE)}
                  </strong>{" "}
                  on coupon interest.
                </span>
                <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-outline)] sm:inline">
                  Reference
                </span>
              </p>
              <div className="xl:col-span-3">
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
                  <span className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                    <span className="hidden sm:inline">
                      Reinvestment, fill rate, starting portfolio
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${advancedSettingsOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {advancedSettingsOpen && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                    <NumberControl label="Coupon reinvestment" value={Math.round(assumptions.reinvestmentRate * 100)} onChange={(value) => update("reinvestmentRate", value / 100)} min={0} max={100} step={5} suffix="%" />
                    <NumberControl
                      label="Expected auction fill"
                      value={Math.round(assumptions.auctionFillRate * 100)}
                      onChange={(value) => update("auctionFillRate", value / 100)}
                      min={0}
                      max={100}
                      step={5}
                      suffix="%"
                      help="Estimated share of your intended Treasury bond bid that actually gets allocated. BNR history since 2008 implies roughly 67% market-wide sold/applied, while recent periods can be lower."
                    />
                    <NumberControl
                      label="Purchase charges"
                      value={assumptions.purchaseCharge}
                      onChange={(value) => update("purchaseCharge", value)}
                      min={0}
                      max={100_000}
                      step={1_000}
                      prefix="RWF "
                      help="Extra cash paid whenever the model successfully buys a new bond. It is counted in total contributions, but it does not earn coupons or become principal."
                    />
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
              <p className="mt-2 text-[11px] leading-5 text-[var(--md-sys-color-on-surface-variant)]">
                Model gifts, bonuses, or other occasional money separately from your monthly plan.
              </p>
              <form onSubmit={addCashInjection} className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.15fr_auto] lg:items-end">
                <input
                  aria-label="Extra cash source"
                  placeholder="Source, e.g. Gift from a friend"
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
                <div className="grid grid-cols-2 gap-3 lg:contents">
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
                </div>
                <div className="rounded-xl border border-[var(--md-sys-color-tertiary)]/15 bg-surface-container-lowest p-3 text-[10px] leading-4 text-on-surface-variant lg:col-span-4">
                  <div className="flex items-center justify-between gap-3">
                    <span>Cash balance already waiting</span>
                    <strong className="text-on-surface">
                      {formatRwf(waitingCash)}
                    </strong>
                  </div>
                  {amountNeededForNextLot > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setInjectionDraft((current) => ({
                          ...current,
                          amount: amountNeededForNextLot,
                        }))
                      }
                      className="mt-2 flex w-full items-center justify-between rounded-lg bg-[var(--md-sys-color-tertiary)]/10 px-2.5 py-2 font-bold text-[var(--md-sys-color-tertiary)] transition hover:bg-[var(--md-sys-color-tertiary)]/15"
                    >
                      <span>Top up the next RWF 100K lot</span>
                      <span>{formatRwf(amountNeededForNextLot)}</span>
                    </button>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 border-t border-outline/10 pt-2">
                    <span>
                      Combined monthly purchase
                      <strong className="mt-0.5 block text-on-surface">
                        {formatRwf(combinedBondPurchase)}
                      </strong>
                    </span>
                    <span>
                      Cash after draft
                      <strong className="mt-0.5 block text-on-surface">
                        {formatRwf(cashAfterDraftInjection)}
                      </strong>
                    </span>
                  </div>
                  <p className="mt-2">
                    Deposits can be any positive amount. Only the resulting
                    bond purchase is constrained by the auction-fill assumption;
                    unallocated money remains in Cash.
                  </p>
                </div>
                <button className="flex h-full min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-tertiary)] px-4 py-3 text-xs font-black text-[var(--md-sys-color-on-primary)] hover:bg-[var(--md-sys-color-primary)]">
                  <Plus size={15} /> Add to scenario
                </button>
              </form>

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
                            {MONTH_NAMES[
                              new Date(
                                assumptions.startYear,
                                assumptions.startMonth - 1 + injection.month - 1,
                                1,
                              ).getMonth()
                            ]}{" "}
                            {new Date(
                              assumptions.startYear,
                              assumptions.startMonth - 1 + injection.month - 1,
                              1,
                            ).getFullYear()}
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
          </div>

          <div className="mt-8 min-w-0">
            <GrowthChart values={chartProjection} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric
                label="Total cash invested"
                value={formatRwf(summary.totalContributions)}
                detail={
                  actualStartingLots.length > 0
                    ? "Saved bonds, charges, monthly plan, and one-time injections"
                    : "Monthly plan, charges, and one-time injections"
                }
              />
              <Metric
                label="Modeled bond purchases"
                value={String(
                  projection.filter((row) => row.newBondPurchaseLot).length,
                )}
                detail="Each monthly pooled purchase is tracked as one independent lot"
              />
              <Metric label="Net coupons earned" value={formatRwf(summary.totalCoupons)} detail={`${formatPercent(netAnnualRate)} net annual rate`} />
              <Metric label="Coupons reinvested" value={formatRwf(summary.totalReinvested)} detail={`${formatPercent(assumptions.reinvestmentRate)} reinvested`} />
              <Metric label="Growth above contributions" value={formatRwf(summary.finalAccountValue - summary.totalContributions - projectionStartingPrincipal)} accent />
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
                  detail="Growth attributable to those injections"
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
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">See where every franc goes</h2>
          </div>
          <div className="rounded-2xl border border-[var(--md-sys-color-tertiary)]/20 bg-[var(--md-sys-color-tertiary)]/[0.07] px-4 py-3 text-xs text-[var(--md-sys-color-on-secondary-container)]">
            Passive income exceeds annual contributions in{" "}
            <strong className="text-[var(--md-sys-color-on-primary-container)]">
              {summary.passiveIncomeCrossoverYear
                ? `Year ${summary.passiveIncomeCrossoverYear} · ${MONTH_NAMES[annualProjection[summary.passiveIncomeCrossoverYear - 1]?.periodStartMonth - 1]} ${annualProjection[summary.passiveIncomeCrossoverYear - 1]?.periodStartYear}–${MONTH_NAMES[annualProjection[summary.passiveIncomeCrossoverYear - 1]?.periodEndMonth - 1]} ${annualProjection[summary.passiveIncomeCrossoverYear - 1]?.periodEndYear}`
                : "no modeled year"}
            </strong>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--md-sys-color-primary)]/15 bg-[var(--md-sys-color-primary)]/[0.05] px-4 py-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <CalendarDays size={16} className="shrink-0 text-[var(--md-sys-color-primary)]" />
          <div>
            <p>
              Suggested routine: invest on the <strong className="text-on-surface">5th of every month</strong>,
              or the next business day.
            </p>
            <p className="mt-1 text-[10px] leading-4">
              Coupon dates are issuance-specific, not universally January and
              July. The projection estimates each monthly purchase as a separate
              issuance with its first coupon six months later. Use the bond&apos;s
              NBR prospectus for its exact payment dates.
            </p>
          </div>
        </div>

        {nextIssuance && (
          <div className="mt-4 rounded-2xl border border-[var(--md-sys-color-tertiary)]/20 bg-[var(--md-sys-color-tertiary)]/[0.07] px-4 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--md-sys-color-tertiary)]/12 text-[var(--md-sys-color-tertiary)]">
                  <CalendarClock size={18} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--md-sys-color-tertiary)]">
                      Next BNR auction
                    </p>
                    {nextIssuanceStatus && (
                      <span className="rounded-full bg-surface-container px-2 py-1 text-[9px] font-black uppercase text-on-surface-variant">
                        {nextIssuanceStatus.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-black text-on-surface">
                    {nextIssuance.title} · {nextIssuance.tenorYears}Y
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-on-surface-variant">
                    Book opens {formatCalendarDate(nextIssuance.openBookDate)},
                    closes {formatCalendarDate(nextIssuance.closingBookDate)},
                    settles {formatCalendarDate(nextIssuance.settlementDate)}.
                  </p>
                  {nextIssuanceAlert && (
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 text-[11px] leading-5 ${
                        nextIssuanceAlert.level === "urgent"
                          ? "border-error/25 bg-error-container/35 text-on-error-container"
                          : nextIssuanceAlert.level === "warning"
                            ? "border-[var(--md-sys-color-tertiary)]/30 bg-[var(--md-sys-color-tertiary)]/10 text-on-surface"
                            : "border-[var(--md-sys-color-primary)]/20 bg-[var(--md-sys-color-primary)]/10 text-on-surface"
                      }`}
                    >
                      <p className="font-black">{nextIssuanceAlert.title}</p>
                      <p className="mt-0.5 opacity-80">
                        {nextIssuanceAlert.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Link
                href="/calendar"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-outline/10 bg-surface-container-lowest px-3 py-2 text-xs font-black text-on-surface transition hover:border-[var(--md-sys-color-tertiary)]/40 hover:text-[var(--md-sys-color-tertiary)]"
              >
                Full calendar <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        )}

        <div className="bond-scrollbar mt-5 max-h-[72vh] overflow-auto rounded-3xl border border-outline/10 lg:max-h-none lg:overflow-visible">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead className="text-[10px] uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)]">
              <tr>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Year</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Invested this year</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Extra deposits</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Income this year</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Account value</th>
                <th className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] px-5 py-4 shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Annual passive income</th>
                <th className="sticky top-0 z-30 w-16 bg-[var(--md-sys-color-surface-container)] px-5 py-4 text-right shadow-[0_1px_0_rgba(100,116,139,0.18)] lg:top-[73px]">Details</th>
              </tr>
            </thead>
            <tbody>
              {annualProjection.map((row) => {
                const isExpanded = expandedYears.has(row.year);
                const months = projection.slice((row.year - 1) * 12, row.year * 12);
                const yearInjections = cashInjections.filter(
                  (injection) => Math.ceil(injection.month / 12) === row.year,
                );
                return (
                  <Fragment key={row.year}>
                    <tr className={`border-t border-outline/10 text-sm transition hover:bg-surface-container-low ${isExpanded ? "bg-surface-container-low" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="font-black text-[var(--md-sys-color-primary)]">
                          Year {row.year}
                        </span>
                        <span className="mt-1 block text-[10px] font-medium text-on-surface-variant">
                          {MONTH_NAMES[row.periodStartMonth - 1]}{" "}
                          {row.periodStartYear} –{" "}
                          {MONTH_NAMES[row.periodEndMonth - 1]}{" "}
                          {row.periodEndYear}
                        </span>
                        {yearInjections.length > 0 && (
                          <span className="ml-2 rounded-full bg-[var(--md-sys-color-tertiary)]/10 px-2 py-1 text-[9px] font-black uppercase text-[var(--md-sys-color-tertiary)]">
                            {yearInjections.length} extra {yearInjections.length === 1 ? "deposit" : "deposits"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">{formatRwf(row.annualContributions)}</td>
                      <td className="px-5 py-4">
                        <span className={row.annualCashInjections > 0 ? "font-bold text-[var(--md-sys-color-tertiary)]" : "text-on-surface-variant"}>
                          {formatRwf(row.annualCashInjections)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--md-sys-color-on-surface-variant)]">
                        {formatRwf(row.annualCoupons)}
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
                        <td colSpan={7} className="p-0">
                          <div className="px-4 py-4 md:px-6">
                            <div className="contents">
                            <table className="w-full min-w-[900px] border-collapse text-left">
                              <thead className="text-[9px] uppercase tracking-[0.14em] text-[var(--md-sys-color-outline)]">
                                <tr>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Month</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Funding</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Bid result</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Bond purchase</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Cash balance</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Account value</th>
                                  <th className="sticky top-[53px] z-20 w-14 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 text-right shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">More</th>
                                </tr>
                              </thead>
                              <tbody>
                                {months.map((month, monthIndex) => {
                                  const isMonthExpanded = expandedMonths.has(
                                    month.month,
                                  );
                                  const monthLabel = new Intl.DateTimeFormat(
                                    "en",
                                    {
                                      month: "short",
                                      year: "numeric",
                                    },
                                  ).format(
                                    new Date(
                                      month.calendarYear,
                                      month.calendarMonth - 1,
                                      1,
                                    ),
                                  );

                                  return (
                                    <Fragment key={month.month}>
                                      <tr
                                        className={`text-xs transition hover:bg-surface-container-low ${
                                          month.couponPayment > 0
                                            ? "bg-[var(--md-sys-color-primary)]/[0.06]"
                                            : monthIndex % 2 === 0
                                              ? "bg-[var(--md-sys-color-surface-container-lowest)]"
                                              : "bg-[var(--md-sys-color-surface-container)]/35"
                                        }`}
                                      >
                                        <td className="px-3 py-3 font-bold">
                                          {monthLabel}
                                          {month.couponPayment > 0 && (
                                            <span className="ml-2 inline-block rounded-full bg-[var(--md-sys-color-primary)]/10 px-2 py-1 text-[9px] font-black uppercase text-[var(--md-sys-color-primary)]">
                                              coupon
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-3">
                                          <span className="block font-bold">
                                            {formatRwf(month.personalContribution)}
                                          </span>
                                          {month.cashInjection > 0 && (
                                            <span className="mt-1 block text-[9px] font-black text-[var(--md-sys-color-tertiary)]">
                                              +{formatRwf(month.cashInjection)} extra
                                            </span>
                                          )}
                                          {month.cashInjectionLabels.length > 0 && (
                                            <span className="mt-1 block text-[9px] font-medium text-on-surface-variant">
                                              {month.cashInjectionLabels.join(", ")}
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-on-surface-variant">
                                          <span className="block font-bold text-on-surface">
                                            {month.auctionTenorYears}Y{" "}
                                            {month.auctionEligible ? "auction" : "skipped"}
                                          </span>
                                          <span className="mt-1 block">
                                            {month.auctionEligible
                                              ? formatRwf(month.intendedBondBid)
                                              : "Holding cash"}
                                          </span>
                                          {month.unfilledBondBid > 0 && (
                                            <span className="mt-1 block text-[9px] font-bold text-[var(--md-sys-color-tertiary)]">
                                              {formatRwf(month.unfilledBondBid)}{" "}
                                              unfilled
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-3 font-black text-primary">
                                          {month.newBondPurchaseLot ? (
                                            <Link
                                              href={`/modeled-purchase?${new URLSearchParams({
                                                label: `Pooled purchase lot ${String(month.month).padStart(3, "0")}`,
                                                amount: String(
                                                  month.newBondPurchaseLot
                                                    .amount,
                                                ),
                                                date:
                                                  month.newBondPurchaseLot
                                                    .purchaseDate,
                                                tenor: String(
                                                  month.newBondPurchaseLot
                                                    .tenorYears,
                                                ),
                                                rate: String(
                                                  month.newBondPurchaseLot
                                                    .annualCouponRate,
                                                ),
                                                lot:
                                                  month.newBondPurchaseLot.id,
                                              })}`}
                                              className="underline decoration-dotted underline-offset-4"
                                            >
                                              {formatRwf(month.newBondPurchase)}
                                              <span className="mt-1 block text-[9px] font-bold text-on-surface-variant">
                                                {month.newBondPurchaseLot.tenorYears}Y lot{" "}
                                                {String(month.month).padStart(3, "0")}
                                              </span>
                                            </Link>
                                          ) : month.realBondPurchase > 0 ? (
                                            <>
                                              {formatRwf(month.realBondPurchase)}
                                              <span className="mt-1 block text-[9px] font-bold text-on-surface-variant">
                                                saved bond
                                              </span>
                                            </>
                                          ) : (
                                            formatRwf(0)
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-on-surface-variant">
                                          {formatRwf(month.closingCashBalance)}
                                        </td>
                                        <td className="px-3 py-3 font-black">
                                          {formatRwf(month.totalAccountValue)}
                                          <span className="mt-1 block text-[9px] font-medium text-on-surface-variant">
                                            {formatRwf(month.closingPortfolio)}{" "}
                                            bonds
                                          </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleMonth(month.month)
                                            }
                                            aria-expanded={isMonthExpanded}
                                            aria-label={`${isMonthExpanded ? "Collapse" : "Expand"} ${monthLabel}`}
                                            className="inline-grid h-8 w-8 place-items-center rounded-lg border border-outline/10 text-[var(--md-sys-color-on-surface-variant)] transition hover:border-[var(--md-sys-color-primary)]/40 hover:text-[var(--md-sys-color-primary)]"
                                          >
                                            <ChevronDown
                                              size={15}
                                              className={`transition-transform ${isMonthExpanded ? "rotate-180" : ""}`}
                                            />
                                          </button>
                                        </td>
                                      </tr>
                                      {isMonthExpanded && (
                                        <tr className="bg-surface-container-low text-xs">
                                          <td colSpan={7} className="px-4 py-4">
                                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                              <DetailPanel title="Funding">
                                                <DetailLine
                                                  label="Monthly contribution"
                                                  value={formatRwf(
                                                    month.personalContribution,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Opening Cash"
                                                  value={formatRwf(
                                                    month.openingCashBalance,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Extra cash"
                                                  value={formatRwf(
                                                    month.cashInjection,
                                                  )}
                                                />
                                              </DetailPanel>
                                              <DetailPanel title="Income">
                                                <DetailLine
                                                  label="Coupon paid"
                                                  value={formatRwf(
                                                    month.couponPayment,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Reinvested"
                                                  value={formatRwf(
                                                    month.reinvestedCoupon,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Matured principal"
                                                  value={formatRwf(
                                                    month.maturedPrincipal,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Coupon lots"
                                                  value={`${month.couponPayments.length}`}
                                                />
                                                {month.couponPayments.some(
                                                  (payment) =>
                                                    payment.couponDate,
                                                ) && (
                                                  <DetailLine
                                                    label="Coupon dates"
                                                    value={month.couponPayments
                                                      .map(
                                                        (payment) =>
                                                          payment.couponDate,
                                                      )
                                                      .filter(Boolean)
                                                      .join(", ")}
                                                  />
                                                )}
                                              </DetailPanel>
                                              <DetailPanel title="Auction">
                                                <DetailLine
                                                  label="Calendar tenor"
                                                  value={`${month.auctionTenorYears}Y`}
                                                />
                                                <DetailLine
                                                  label="Strategy"
                                                  value={
                                                    month.auctionEligible
                                                      ? "Allowed"
                                                      : "Skipped"
                                                  }
                                                />
                                                <DetailLine
                                                  label="Intended bid"
                                                  value={formatRwf(
                                                    month.intendedBondBid,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Allocated"
                                                  value={formatRwf(
                                                    month.newBondPurchase,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Charges"
                                                  value={formatRwf(
                                                    month.purchaseCharge,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Unfilled"
                                                  value={formatRwf(
                                                    month.unfilledBondBid,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Available cash"
                                                  value={formatRwf(
                                                    month.availableCash,
                                                  )}
                                                />
                                              </DetailPanel>
                                              <DetailPanel title="Portfolio">
                                                <DetailLine
                                                  label="Opening bonds"
                                                  value={formatRwf(
                                                    month.openingPortfolio,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Closing bonds"
                                                  value={formatRwf(
                                                    month.closingPortfolio,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Active lots"
                                                  value={`${month.activeBondCount}`}
                                                />
                                                <DetailLine
                                                  label="Closing Cash"
                                                  value={formatRwf(
                                                    month.closingCashBalance,
                                                  )}
                                                />
                                              </DetailPanel>
                                            </div>
                                            {month.cashInjectionLabels.length >
                                              0 && (
                                              <p className="mt-3 text-[10px] text-on-surface-variant">
                                                Extra cash labels:{" "}
                                                {month.cashInjectionLabels.join(
                                                  ", ",
                                                )}
                                              </p>
                                            )}
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                            </div>
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
        </>
      )}

      {view === "portfolio" && (
      <section id="portfolio" className="scroll-mt-24 border-y border-outline/10 bg-[var(--md-sys-color-surface-container-low)]/72">
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-14 md:px-8 md:py-20">
          <div className="flex items-start justify-between gap-3 md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)]">
                <LockKeyhole size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.22em]">Private portfolio</p>
              </div>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:mt-2 sm:text-3xl md:text-4xl"><span className="sm:hidden">Your portfolio</span><span className="hidden sm:inline">Track real bond purchases</span></h2>
              {accountUser && <p className="mt-1 break-all text-[11px] text-on-surface-variant sm:mt-2 sm:text-xs"><span className="hidden sm:inline">Signed in as </span>{accountUser.email}</p>}
            </div>
            {authenticated && (
              <button onClick={logout} className="flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg border border-outline/10 px-3 py-2 text-xs font-black text-[var(--md-sys-color-on-surface-variant)] hover:text-on-surface sm:rounded-xl">
                <LogOut size={15} /> Sign out
              </button>
            )}
          </div>

          {portfolioError && (
            <div className="mt-6 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
              {portfolioError}
            </div>
          )}

          {sessionLoading ? (
            <div className="mt-4 rounded-xl border border-outline/10 p-4 text-sm text-[var(--md-sys-color-on-surface-variant)] sm:mt-8 sm:rounded-3xl sm:p-8">Checking private session…</div>
          ) : !authenticated ? (
            <BondAccountAccess onAuthenticated={(user) => {
              setPurchases([]); setEquities([]); setExpandedHoldings(new Set()); setAccountUser(user); setAuthenticated(true); setPortfolioError("");
            }} />
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 xl:grid-cols-4">
                <Metric label="Bond principal" value={formatRwf(actualPortfolio)} accent compact />
                <Metric label="RSE equity cost" value={formatRwf(actualEquityCost)} compact />
                <Metric label="Total cash cost" value={formatRwf(actualInvestmentCashCost)} compact />
                <Metric label="Saved annual net coupons" value={formatRwf(actualAnnualIncome)} compact />
              </div>
              <div className="portfolio-actions mt-4 flex flex-wrap gap-2 sm:mt-6 sm:justify-end">
                <button
                  type="button"
                  onClick={startNewPurchase}
                  disabled={importingPdf}
                  className="order-last ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-3 text-sm font-black text-[var(--md-sys-color-on-primary)] transition hover:opacity-90 sm:order-none sm:ml-0"
                >
                  <Plus size={17} />
                  Add purchase
                </button>
                {accountUser?.isOwner && <button type="button" onClick={() => setPortfolioSettingsOpen(true)} className="hidden items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-black text-primary sm:inline-flex"><UserPlus size={17} />Invite a friend</button>}
                {accountUser?.isOwner && <button type="button" onClick={() => setAccountManagementOpen((open) => !open)} aria-expanded={accountManagementOpen} aria-controls="account-management" className="hidden items-center gap-2 rounded-xl border border-outline/10 px-4 py-3 text-sm font-black text-on-surface-variant transition hover:border-primary/30 hover:text-primary sm:inline-flex"><Users size={17} />Manage accounts</button>}
                <Link
                  href="/documents"
                  aria-label="Documents"
                  title="Documents"
                  className="inline-flex items-center gap-2 rounded-xl border border-outline/10 px-4 py-3 text-sm font-black text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                >
                  <FileText size={17} />
                  <span className="sr-only sm:not-sr-only">Documents</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setPortfolioSettingsOpen((open) => !open)}
                  aria-label="Portfolio settings"
                  aria-expanded={portfolioSettingsOpen}
                  aria-controls="portfolio-settings"
                  title="Portfolio settings"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition ${
                    portfolioSettingsOpen
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-outline/10 text-on-surface-variant hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <Settings size={17} />
                  <span className="sr-only sm:not-sr-only">Settings</span>
                </button>
              </div>
              {accountManagementOpen && accountUser?.isOwner && <BondAccountManagement />}
              {portfolioSettingsOpen && (
                <div id="portfolio-settings" className="mt-4 rounded-xl border border-outline/10 bg-surface-container-lowest/75 p-3 sm:rounded-3xl sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                        Portfolio settings
                      </p>
                      <h3 className="mt-1 font-black">Records</h3>
                    </div>
                    <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase text-on-surface-variant">
                      {purchases.length + equities.length} saved
                    </span>
                  </div>
                  {accountUser?.isOwner && <><button type="button" onClick={() => setAccountManagementOpen((open) => !open)} aria-expanded={accountManagementOpen} aria-controls="account-management" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline/15 px-3 py-2 text-xs font-bold sm:hidden"><Users size={16} />Manage accounts</button><BondRegistrationSettings /></>}
                  {purchases.length === 0 ? (
                    <p className="mt-4 text-sm text-on-surface-variant">
                      No saved records.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-2">
                      {purchases.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-2xl border border-outline/10 bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-black text-on-surface">
                              {item.bondName}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {formatRwf(item.faceValue)} · {item.settlementDate}
                            </p>
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer rounded-xl border border-outline/15 px-3 py-2 font-bold">More actions</summary>
                            <button type="button" aria-label={`Edit purchase details for ${item.bondName}`} onClick={() => editPurchase(item)} className="mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold hover:bg-primary/10"><Pencil size={14} />Edit purchase details</button>
                          </details>
                          <button
                            type="button"
                            onClick={() => requestPurchaseDelete(item)}
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-error/20 px-3 py-2 text-xs font-black text-error transition hover:bg-error-container/30"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {equities.length > 0 && (
                <section className="mt-4 overflow-hidden rounded-lg border border-outline/10 bg-surface-container-lowest/75 sm:rounded-3xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline/10 p-3 sm:items-end sm:p-5">
                    <div>
                      <div className="flex items-center gap-2 text-primary">
                        <Landmark size={16} />
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                          RSE equities
                        </p>
                      </div>
                      <h3 className="mt-1 text-base font-black sm:text-xl">Listed shares</h3>
                    </div>
                    <Link href="/stocks" prefetch={false} aria-label="Stock performance" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline/15 px-3 py-2 text-xs font-black text-primary sm:min-h-0 sm:rounded-xl"><BarChart3 size={15} /><span className="min-[375px]:hidden">Performance</span><span className="hidden min-[375px]:inline">Stock performance</span></Link>
                    <span className="hidden rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase text-on-surface-variant sm:inline">
                      {actualEquityShares.toLocaleString()} shares
                    </span>
                  </div>
                  <div className="bond-scrollbar sm:overflow-x-auto">
                    <table role="table" aria-label="Listed shares" className="portfolio-table w-full border-collapse text-left sm:min-w-[780px]">
                      <thead role="rowgroup" className="bg-[var(--md-sys-color-surface-container)] text-[10px] uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
                        <tr role="row">
                          <th scope="col" role="columnheader" className="px-4 py-3">Security</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Shares / price</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Cash cost</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Trade</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Broker note</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody role="rowgroup">
                        {equities.map((item) => (
                          <tr role="row" key={item.id} data-expanded={expandedHoldings.has(`equity-${item.id}`)} className="border-t border-outline/10 text-xs">
                            <td role="cell" aria-colindex={1} data-label="Security" className="px-4 py-4">
                              <HoldingDisclosure label={item.securityName} expanded={expandedHoldings.has(`equity-${item.id}`)} controls={`equity-${item.id}-identity equity-${item.id}-trade equity-${item.id}-broker equity-${item.id}-status`} onToggle={() => toggleHolding(`equity-${item.id}`)} />
                              <span className="holding-tile-caption hidden">{item.shares.toLocaleString()} shares</span>
                              <strong className="hidden text-sm text-on-surface sm:block">
                                {item.securityName}
                              </strong>
                              {item.status !== "active" && <span className="text-[10px] font-bold uppercase text-on-surface-variant sm:hidden">{item.status}</span>}
                              <span id={`equity-${item.id}-identity`} data-mobile-detail className="mt-1 block text-[10px] text-on-surface-variant">
                                {item.exchange} · {item.isin}
                              </span>
                            </td>
                            <td role="cell" aria-colindex={2} data-label="Shares / price" className="px-4 py-4">
                              <strong className="block">{item.shares.toLocaleString()}</strong>
                              <span data-mobile-detail className="text-[10px] text-on-surface-variant">
                                {formatRwf(item.pricePerShare)} per share
                              </span>
                            </td>
                            <td role="cell" aria-colindex={3} data-label="Cash cost" data-tile-caption={formatHoldingDate(item.tradeDate)} className="px-4 py-4">
                              <strong className="block"><HoldingAmount value={item.netAmountPayable} /></strong>
                              <span data-mobile-detail className="text-[10px] text-on-surface-variant">
                                {formatRwf(item.totalCharges)} charges
                              </span>
                            </td>
                            <td id={`equity-${item.id}-trade`} data-mobile-detail role="cell" aria-colindex={4} data-label="Trade" className="px-4 py-4">
                              <strong className="block">{item.tradeDate}</strong>
                              <span className="text-[10px] text-on-surface-variant">
                                Settled {item.settlementDate}
                              </span>
                            </td>
                            <td id={`equity-${item.id}-broker`} data-mobile-detail role="cell" aria-colindex={5} data-label="Broker note" className="px-4 py-4">
                              <strong className="block">{item.broker}</strong>
                              <span className="text-[10px] text-on-surface-variant">
                                {item.contractNote}
                              </span>
                            </td>
                            <td id={`equity-${item.id}-status`} data-mobile-detail role="cell" aria-colindex={6} data-label="Status" className="px-4 py-4">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black uppercase text-primary">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              <div className="mt-4">
                {purchasePanelOpen && (
                <BondPurchaseDialog onDismiss={closePurchaseDialog} saving={savingPurchase}>
                <form id="portfolio-transaction-form" onSubmit={savePurchase} className="p-5">
                  <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-3 border-b border-outline/10 bg-[var(--md-sys-color-surface-container-lowest)] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Plus size={18} className="text-[var(--md-sys-color-primary)]" />
                    <div>
                      <h3 id="purchase-dialog-title" tabIndex={-1} className="font-black outline-none">
                        {editingPurchaseId
                          ? purchaseTermsLocked
                            ? "Update purchase record"
                            : "Edit Treasury bond purchase"
                          : "Add purchase"}
                      </h3>
                      <p className="mt-1 text-xs text-on-surface-variant">{importingPdf ? "Reading your PDF. Details will appear below when ready." : editingPurchaseId || pdfReview || equityReview ? "Review the purchase details, then confirm to save." : "Upload a bond result or share contract note to get started."}</p>
                    </div>
                    </div>
                    <button
                      type="button"
                      onClick={closePurchaseDialog}
                      disabled={savingPurchase}
                      aria-label="Close purchase dialog"
                      className="rounded-xl p-2 text-outline transition hover:bg-surface-container hover:text-on-surface"
                    >
                      <X size={17} />
                    </button>
                  </div>
                  {portfolioError && <p role="alert" className="mt-4 rounded-xl border border-error/20 bg-error-container/20 p-3 text-sm text-error">{portfolioError}</p>}
                  {!editingPurchaseId && <BondPdfUpload onImport={applyPdfImport} onBusyChange={setImportingPdf} onSelectFile={() => { setPdfReview(null); setEquityReview(null); setPdfReviewed(false); setPortfolioError(""); }} />}
                  {duplicateImport && <p role="alert" className="mt-4 rounded-lg border border-error/25 p-3 text-sm text-error">This purchase is already saved in your portfolio. You can close this dialog or choose another PDF.</p>}
                  {equityReview && <>
                    <div className="mt-4 rounded-xl border border-primary/20 p-3" role="status">
                      <p className="text-sm font-black">Share purchase detected</p>
                      <p className="mt-1 break-all text-xs text-on-surface-variant">{equityReview.fileName} · {equityReview.usedOcr ? "Text recognition" : "PDF text"}</p>
                      {equityReview.missingFields.length > 0 && <p className="mt-2 text-xs text-error">Complete missing values: {equityReview.missingFields.join(", ")}.</p>}
                      {equityReview.warnings.map((warning) => <p key={warning} className="mt-2 text-xs text-on-surface-variant">{warning}</p>)}
                    </div>
                    <EquityPurchaseReview value={equityReview.fields} onChange={(fields) => { setEquityReview({ ...equityReview, fields }); setPdfReviewed(false); }} disabled={savingPurchase || importingPdf} />
                  </>}
                  {pdfReview && !editingPurchaseId && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4" role="status">
                      <p className="text-sm font-black">Review imported details</p>
                      <p className="mt-1 break-all text-xs text-on-surface-variant">{pdfReview.fileName} · {pdfReview.usedOcr ? "Text recognition" : "PDF text"} · {pdfReview.fields.couponDates?.length ?? 0} coupon dates extracted</p>
                      {pdfReview.missingFields.length > 0 && <p className="mt-2 text-xs text-error">Not found — enter manually: {pdfReview.missingFields.join(", ")}.</p>}
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-on-surface-variant">
                        <li>Check principal, price, dates, fees, and the security code against your original PDF.</li>
                        {pdfReview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    </div>
                  )}
                  {(editingPurchaseId || pdfReview) && (
                  <fieldset disabled={importingPdf || savingPurchase} aria-busy={importingPdf || savingPurchase}>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {purchaseTermsLocked ? (
                      <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                        <LockedField label="Bond" value={purchase.bondName} />
                        <LockedField label="Code" value={purchase.isin} />
                        <LockedField label="Trade date" value={purchase.purchaseDate} />
                        <LockedField label="Settlement" value={purchase.settlementDate} />
                        <LockedField label="Maturity" value={purchase.maturityDate} />
                        <LockedField label="Tenor" value={`${purchase.tenorYears} years`} />
                        <LockedField label="Principal" value={formatRwf(purchase.faceValue)} />
                        <LockedField label="Price" value={`${purchase.pricePercent.toFixed(3)}%`} />
                        <LockedField label="Coupon" value={formatPercent(purchase.couponRate, 2)} />
                        <LockedField label="Cash cost" value={formatRwf(purchaseCashCost)} />
                      </div>
                    ) : (
                      <>
                        {[
                          ["Bond name", "bondName", "text", true],
                          ["ISIN / security code", "isin", "text", false],
                          ["Trade date", "purchaseDate", "date", true],
                          ["Settlement date", "settlementDate", "date", true],
                          ["Maturity date", "maturityDate", "date", true],
                        ].map(([label, key, type, required]) => {
                          const fieldKey =
                            String(key) as keyof BondPurchaseInput;
                          return (
                            <label key={fieldKey} className={`text-[11px] font-bold text-on-surface-variant ${fieldKey === "bondName" ? "sm:col-span-2" : ""}`}>
                              {label}
                              <input
                                type={String(type)}
                                required={Boolean(required)}
                                value={String(purchase[fieldKey])}
                                onChange={(event) =>
                                  setPurchase((current) => ({
                                    ...current,
                                    [fieldKey]: event.target.value,
                                    ...(fieldKey === "maturityDate"
                                      ? { couponDates: [] }
                                      : {}),
                                  }))
                                }
                                className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60"
                              />
                            </label>
                          );
                        })}
                        {[
                          ["Face value / principal", "faceValue", 1],
                          ["Executed price (% of face)", "pricePercent", 0.001],
                          ["Accrued interest paid", "accruedInterestPaid", 1],
                          ["Fees and commission", "feesPaid", 1],
                          ["Coupon rate (%)", "couponRate", 0.001],
                        ].map(([label, key, step]) => {
                          const fieldKey =
                            String(key) as keyof BondPurchaseInput;
                          const couponPending =
                            fieldKey === "couponRate" &&
                            purchase.status === "submitted" &&
                            purchase.couponRate === 0;
                          return (
                            <label key={fieldKey} className="text-[11px] font-bold text-on-surface-variant">
                              {label}
                              <input
                                type="number"
                                min={0}
                                step={Number(step)}
                                required={fieldKey !== "couponRate" || purchase.status !== "submitted"}
                                value={
                                  couponPending
                                    ? ""
                                    : fieldKey === "couponRate"
                                    ? purchase.couponRate * 100
                                    : Number(purchase[fieldKey])
                                }
                                onChange={(event) => {
                                  const value =
                                    event.target.value === ""
                                      ? 0
                                      : Number(event.target.value);
                                  setPurchase((current) => ({
                                    ...current,
                                    [fieldKey]:
                                      fieldKey === "couponRate"
                                        ? value / 100
                                        : value,
                                  }));
                                }}
                                className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60"
                              />
                            </label>
                          );
                        })}
                        <label className="text-[11px] font-bold text-on-surface-variant">
                          Tenor
                          <select
                            required
                            value={purchase.tenorYears}
                            onChange={(event) =>
                              setPurchase((current) => ({
                                ...current,
                                tenorYears: Number(event.target.value),
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface"
                          >
                            {!TREASURY_BOND_TENORS.some((tenor) => tenor === purchase.tenorYears) && <option value={purchase.tenorYears}>{purchase.tenorYears > 0 ? `${purchase.tenorYears} years` : "Select tenor"}</option>}
                            {TREASURY_BOND_TENORS.map((tenor) => (
                              <option key={tenor} value={tenor}>
                                {tenor} years
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                    <label className="text-[11px] font-bold text-on-surface-variant">
                      Position status
                      <select value={purchase.status} onChange={(event) => setPurchase((current) => ({ ...current, status: event.target.value as BondPurchaseInput["status"] }))} className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface">
                        {!purchaseTermsLocked && (
                          <option value="submitted">Submitted</option>
                        )}
                        <option value="active">Active</option>
                        <option value="sold">Sold</option>
                        <option value="matured">Matured</option>
                      </select>
                    </label>
                    <div className="sm:col-span-2 rounded-2xl border border-outline/10 bg-surface-container-low/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                            Coupon schedule
                          </p>
                        </div>
                        <CalendarDays size={18} className="shrink-0 text-primary" />
                      </div>
                      {!purchaseTermsLocked && (
                        <div className="mt-4">
                          <label className="text-[11px] font-bold text-on-surface-variant">
                            First coupon payment
                            <input
                              type="date"
                              required={purchase.status !== "submitted"}
                              value={purchase.firstCouponDate}
                              onChange={(event) =>
                                setPurchase((current) => ({
                                  ...current,
                                  firstCouponDate: event.target.value,
                                  couponDates: current.couponDates.map((date) => date === current.firstCouponDate ? event.target.value : date).filter(Boolean).sort(),
                                  scheduleConfidence: "estimated",
                                }))
                              }
                              className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60"
                            />
                          </label>
                        </div>
                      )}

                      {purchase.couponDates.length > 0 ? (
                        <div className="bond-scrollbar mt-4 max-h-64 overflow-y-auto pr-1">
                          <div className="grid gap-2 sm:grid-cols-2">
                            {purchase.couponDates.map((date, index) => (
                              <div
                                key={`${date}-${index}`}
                                className="flex items-center gap-2 rounded-xl border border-outline/10 bg-background/80 p-2"
                              >
                                <span className="w-7 text-center text-[9px] font-black text-outline">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                {purchaseTermsLocked ? (
                                  <span className="min-w-0 flex-1 text-xs font-bold text-on-surface">
                                    {date}
                                  </span>
                                ) : (
                                  <>
                                    <input
                                      type="date"
                                      required
                                      value={date}
                                      onChange={(event) =>
                                        setPurchase((current) => ({
                                          ...current,
                                          couponDates: current.couponDates
                                            .map((item, itemIndex) =>
                                              itemIndex === index
                                                ? event.target.value
                                                : item,
                                            )
                                            .filter(Boolean)
                                            .sort(),
                                        }))
                                      }
                                      className="min-w-0 flex-1 bg-transparent text-xs font-bold text-on-surface outline-none"
                                    />
                                    <button
                                      type="button"
                                      aria-label={`Remove coupon date ${date}`}
                                      onClick={() =>
                                        setPurchase((current) => ({
                                          ...current,
                                          couponDates: current.couponDates.filter(
                                            (_, itemIndex) => itemIndex !== index,
                                          ),
                                        }))
                                      }
                                      className="rounded-lg p-1.5 text-outline transition hover:bg-error-container/30 hover:text-error"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-xl border border-dashed border-outline/20 px-3 py-4 text-center text-[10px] text-on-surface-variant">
                          No coupon dates were extracted. Add missing dates from your PDF before saving.
                        </p>
                      )}
                      {!purchaseTermsLocked && (
                        <div className="mt-3 flex items-end gap-2">
                          <label className="min-w-0 flex-1 text-[11px] font-bold text-on-surface-variant">
                            Add a missing coupon date
                            <input type="date" value={additionalCouponDate} min={purchase.settlementDate} max={purchase.maturityDate} onChange={(event) => setAdditionalCouponDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface" />
                          </label>
                          <button type="button" disabled={!additionalCouponDate || purchase.couponDates.includes(additionalCouponDate) || additionalCouponDate <= purchase.purchaseDate || additionalCouponDate > purchase.maturityDate} onClick={() => {
                            setPurchase((current) => {
                              const dates = [...new Set([...current.couponDates, additionalCouponDate])].sort();
                              return { ...current, couponDates: dates, firstCouponDate: dates[0], scheduleConfidence: "estimated" };
                            });
                            setAdditionalCouponDate("");
                            setPdfReviewed(false);
                          }} className="rounded-xl border border-primary/20 px-3 py-2.5 text-xs font-black text-primary disabled:opacity-40">Add date</button>
                        </div>
                      )}
                      {!purchaseTermsLocked && (
                        <label className="mt-3 block text-[11px] font-bold text-on-surface-variant">
                          Schedule accuracy
                          <select value={purchase.scheduleConfidence} onChange={(event) => setPurchase((current) => ({ ...current, scheduleConfidence: event.target.value as BondPurchaseInput["scheduleConfidence"] }))} className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface">
                            <option value="estimated">Estimated / needs checking</option>
                            <option value="confirmed">Confirmed against official schedule</option>
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="sm:col-span-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-primary">Transaction cost</p>
                          <p className="mt-1 text-xl font-black">{formatRwf(purchaseCashCost)}</p>
                        </div>
                        <div className="border-t border-primary/10 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-primary">Net annual coupon</p>
                          <p className="mt-1 text-xl font-black">
                            {purchaseAnnualNetCoupon > 0
                              ? formatRwf(purchaseAnnualNetCoupon)
                              : "Pending"}
                          </p>
                        </div>
                        <div className="border-t border-primary/10 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-primary">Net semiannual coupon</p>
                          <p className="mt-1 text-xl font-black">
                            {purchaseAnnualNetCoupon > 0
                              ? formatRwf(purchaseAnnualNetCoupon / 2)
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  </fieldset>
                  )}
                  <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-4 space-y-3 border-t border-outline/10 bg-[var(--md-sys-color-surface-container-lowest)] px-5 py-4">
                    {(pdfReview || equityReview) && !editingPurchaseId && (
                      <label className="flex items-start gap-2 text-xs font-bold">
                        <input type="checkbox" checked={pdfReviewed} disabled={importingPdf || savingPurchase} onChange={(event) => setPdfReviewed(event.target.checked)} className="mt-0.5 shrink-0 accent-primary" />
                        I have checked the imported details and completed any missing values.
                      </label>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={closePurchaseDialog}
                        disabled={savingPurchase}
                        className="rounded-xl border border-outline/10 px-4 py-3 text-sm font-black text-on-surface-variant"
                      >
                        Cancel
                      </button>
                    {(editingPurchaseId || pdfReview || equityReview) && <button disabled={duplicateImport || savingPurchase || importingPdf || Boolean((pdfReview || equityReview) && !pdfReviewed)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-3 text-sm font-black text-[var(--md-sys-color-on-primary)] transition hover:opacity-90 disabled:opacity-50">
                      <Database size={16} />{" "}
                      {savingPurchase
                        ? "Saving…"
                        : editingPurchaseId
                          ? "Update transaction"
                          : "Confirm and save purchase"}
                    </button>}
                    </div>
                  </div>
                </form>
                </BondPurchaseDialog>
                )}

                <div className="bond-scrollbar order-1 overflow-hidden rounded-lg border border-outline/10 sm:overflow-x-auto sm:rounded-3xl">
                  {purchases.length === 0 ? (
                    <div className="grid min-h-36 place-items-center p-4 text-center sm:min-h-64 sm:p-8">
                      <div>
                        <WalletCards className="mx-auto text-[var(--md-sys-color-outline)]" />
                        <p className="mt-3 font-bold">No purchases recorded yet</p>
                      </div>
                    </div>
                  ) : (
                    <table role="table" aria-label="Bond purchases" className="portfolio-table portfolio-table--bonds w-full border-collapse text-left sm:min-w-[980px]">
                      <thead role="rowgroup" className="bg-[var(--md-sys-color-surface-container)] text-[10px] uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
                        <tr role="row">
                          <th scope="col" role="columnheader" className="px-4 py-3">Bond</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Principal / cost</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Price</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Expected coupon</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Next payment</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">Schedule</th>
                          <th scope="col" role="columnheader" className="px-4 py-3">RSE listed price</th>
                        </tr>
                      </thead>
                      <tbody role="rowgroup">
                        {purchases.map((item) => {
                          const catalogEntry = catalogEntryForPurchase(item);
                          const displayItem = item;
                          const couponPending =
                            displayItem.status === "submitted" ||
                            displayItem.couponRate === 0;
                          const issuanceNumber =
                            catalogEntry?.issuanceNumber ?? displayItem.bondName;
                          const netRate =
                            displayItem.couponRate *
                            (1 - displayItem.withholdingTaxRate);
                          const tracking = couponPending
                            ? null
                            : calculateBondTracking(
                                displayItem,
                                new Date().toISOString().slice(0, 10),
                              );
                          const nextCouponDate = displayItem.status === "sold" || displayItem.status === "matured" ? null : tracking?.nextCouponDate;
                          const nextCouponAmount = !couponPending && nextCouponDate ? displayItem.faceValue * netRate / displayItem.couponFrequency : null;
                          const nextPaymentLabel = nextCouponDate ? formatHoldingDate(nextCouponDate) : (couponPending ? "Pending issuance" : "No future coupons");
                          return (
                            <tr role="row" key={item.id} data-expanded={expandedHoldings.has(`bond-${item.id}`)} className="border-t border-outline/10 text-xs">
                              <td role="cell" aria-colindex={1} data-label="Bond" className="px-4 py-4">
                                <HoldingDisclosure label={issuanceNumber} expanded={expandedHoldings.has(`bond-${item.id}`)} controls={`bond-${item.id}-links bond-${item.id}-price bond-${item.id}-schedule bond-${item.id}-market`} onToggle={() => toggleHolding(`bond-${item.id}`)} />
                                <span className="holding-tile-caption hidden">
                                  {couponPending ? "Coupon pending" : nextCouponAmount !== null ? <span className="inline-block">({formatPercent(netRate)}) <HoldingAmount value={nextCouponAmount} /></span> : "No future coupons"}
                                  {nextCouponDate && <> · <time dateTime={nextCouponDate} className="inline-block">{formatHoldingDate(nextCouponDate)}</time></>}
                                </span>
                                {displayItem.status !== "active" && <span className="text-[10px] font-bold uppercase text-on-surface-variant sm:hidden">{displayItem.status}</span>}
                                <div id={`bond-${item.id}-links`} data-mobile-detail>
                                <Link
                                  href={`/purchases/${item.id}`}
                                  className="inline-flex items-center gap-1.5 text-sm font-black text-on-surface hover:text-[var(--md-sys-color-primary)]"
                                >
                                  <span className="hidden sm:inline">{issuanceNumber}</span><span className="sm:hidden">Open purchase</span>
                                  <ChevronRight size={14} />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => copySecurityCode(issuanceNumber)}
                                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg text-[10px] font-black text-outline transition hover:text-primary"
                                  aria-label={`Copy ${issuanceNumber}`}
                                >
                                  {copiedSecurityCode === issuanceNumber ? (
                                    <Check size={12} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                                </div>
                              </td>
                              <td role="cell" aria-colindex={2} data-label="Principal / cost" className="px-4 py-4">
                                <strong className="hidden sm:block">{formatRwf(displayItem.faceValue)}</strong>
                                <strong className="block sm:hidden"><HoldingAmount value={displayItem.amountInvested} /></strong>
                                <span className="hidden text-[10px] text-on-surface-variant sm:inline">{formatRwf(displayItem.amountInvested)} cash cost</span>
                                <span data-mobile-detail className="block text-[10px] text-on-surface-variant sm:hidden">{formatRwf(displayItem.faceValue)} principal</span>
                              </td>
                              <td id={`bond-${item.id}-price`} data-mobile-detail role="cell" aria-colindex={3} data-label="Price" className="px-4 py-4">{displayItem.pricePercent.toFixed(3)}%</td>
                              <td role="cell" aria-colindex={4} data-label="Expected coupon" className="px-4 py-4">
                                <strong className="block sm:hidden">{couponPending ? "Pending" : nextCouponAmount !== null ? <HoldingAmount value={nextCouponAmount} /> : "—"}</strong>
                                <div data-mobile-detail>
                                {couponPending ? (
                                  <>
                                    <strong className="hidden text-tertiary sm:block">Coupon pending</strong>
                                    <span className="text-[10px] text-on-surface-variant">Update after issuance</span>
                                  </>
                                ) : (
                                  <>
                                    <strong className="hidden text-primary sm:block">{formatRwf(displayItem.faceValue * netRate / displayItem.couponFrequency)}</strong>
                                    {!nextCouponDate && <span className="block text-[10px] text-on-surface-variant sm:hidden">Per coupon: <HoldingAmount value={displayItem.faceValue * netRate / displayItem.couponFrequency} /></span>}
                                    <span className="text-[10px] text-on-surface-variant">{formatPercent(netRate)} net rate</span>
                                  </>
                                )}
                                </div>
                              </td>
                              <td role="cell" aria-colindex={5} data-label="Next payment" className="px-4 py-4 text-on-surface-variant">
                                <span className="hidden sm:inline">{tracking?.nextCouponDate ?? "Pending issuance"}</span>
                                <span className="sm:hidden">{nextPaymentLabel}</span>
                              </td>
                              <td id={`bond-${item.id}-schedule`} data-mobile-detail role="cell" aria-colindex={6} data-label="Schedule" className="px-4 py-4">
                                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${displayItem.scheduleConfidence === "confirmed" ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"}`}>
                                  {displayItem.scheduleConfidence}
                                </span>
                              </td>
                              <td id={`bond-${item.id}-market`} data-mobile-detail role="cell" aria-colindex={7} data-label="RSE listed price" className="px-4 py-4">
                                <BondMarketQuote purchase={item} {...bondMarket} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      )}

      {purchasePendingDelete && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-purchase-title"
            className="w-full max-w-md rounded-3xl border border-error/20 bg-surface-container-lowest p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-error-container/50 text-error">
                <Trash2 size={20} />
              </span>
              <button
                type="button"
                onClick={() => {
                  setPurchasePendingDelete(null);
                  setDeleteConfirmation("");
                }}
                aria-label="Cancel delete"
                disabled={deletingPurchaseId === purchasePendingDelete.id}
                className="rounded-xl p-2 text-outline transition hover:bg-surface-container hover:text-on-surface disabled:pointer-events-none disabled:opacity-45"
              >
                <X size={18} />
              </button>
            </div>
            <h2
              id="delete-purchase-title"
              className="mt-4 text-xl font-black tracking-tight text-on-surface"
            >
              Delete this purchase record?
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              This will permanently remove {purchasePendingDelete.bondName} from
              your portfolio records.
            </p>
            <div className="mt-4 rounded-2xl border border-outline/10 bg-surface-container-low p-4 text-sm">
              <p className="font-black text-on-surface">
                {formatRwf(purchasePendingDelete.faceValue)}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Settlement {purchasePendingDelete.settlementDate} · Maturity{" "}
                {purchasePendingDelete.maturityDate}
              </p>
            </div>
            <label className="mt-4 block text-xs font-bold text-on-surface-variant">
              Type DELETE {purchasePendingDelete.bondName}
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-outline/10 bg-background px-3 py-3 text-sm font-black text-on-surface outline-none focus:border-error/50"
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPurchasePendingDelete(null);
                  setDeleteConfirmation("");
                }}
                disabled={deletingPurchaseId === purchasePendingDelete.id}
                className="rounded-xl border border-outline/10 px-4 py-3 text-sm font-black text-on-surface-variant transition hover:text-on-surface disabled:pointer-events-none disabled:opacity-45"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removePurchase}
                disabled={
                  deletingPurchaseId === purchasePendingDelete.id ||
                  deleteConfirmation !== `DELETE ${purchasePendingDelete.bondName}`
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-error px-4 py-3 text-sm font-black text-on-error transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-70"
              >
                <Trash2 size={16} />
                {deletingPurchaseId === purchasePendingDelete.id
                  ? "Deleting..."
                  : "Delete record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "simulator" && (
      <section id="guide" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">Model guide</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Useful, transparent, intentionally conservative.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)]">
              This planner models monthly contributions, partial Treasury bond
              auction allocation, and uninvested cash at 0% return. Coupons,
              unfilled bids, and matured principal are pooled into
              future bid attempts.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Market price risk", "Bond prices can fluctuate if sold before maturity."],
              ["Holding to maturity", "Holding to maturity avoids market-price loss if the issuer pays as agreed."],
              ["Coupon and tenor", `BK Capital states tenors of ${TREASURY_BOND_TENORS.join(", ")} years and annual coupon rates from ${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)} to ${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}, depending on the issuance.`],
              ["Auction fill risk", `The model defaults to ${formatPercent(DEFAULT_ASSUMPTIONS.auctionFillRate, 0)} allocation based on the BNR historical sold/applied pattern, not 100% allocation.`],
              ["Uninvested cash", "Unfilled bond money stays as cash at 0% return until it is used for another bid."],
              ["Secondary market", `Buying or selling before maturity carries a ${formatPercent(SECONDARY_MARKET_COMMISSION_RATE, 3)} commission on turnover on each side, according to BK Capital.`],
              ["Projection only", "This model is educational and does not guarantee future returns."],
              ["Privacy boundary", "Simulation inputs remain on your device; only authenticated purchases are stored in the private portfolio database."],
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
      )}

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


    </main>
  );
}

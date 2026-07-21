"use client";

import {
  ArrowDownToLine,
  BarChart3,
  BookOpenText,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Settings,
  LockKeyhole,
  LogOut,
  Menu,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
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
  formatPercent,
  formatRwf,
  MAX_ANNUAL_COUPON_RATE,
  MIN_ANNUAL_COUPON_RATE,
  SECONDARY_MARKET_COMMISSION_RATE,
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
import type {
  BondAssumptions,
  CashInjection,
  BondPurchase,
  BondPurchaseInput,
} from "@/lib/bonds/types";
import bondCatalog from "@/lib/bonds/bond-catalog.json";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";
import { calculateBondTracking } from "@/lib/bonds/tracking";

type PlannerView = "simulator" | "portfolio";
type BondCatalogEntry = (typeof bondCatalog)[number];

const STORAGE_KEY = "rwanda-bond-planner-assumptions-v2";
const INJECTIONS_STORAGE_KEY = "rwanda-bond-planner-injections-v1";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function purchaseFromCatalogEntry(
  entry: BondCatalogEntry,
  overrides: Partial<BondPurchaseInput> = {},
): BondPurchaseInput {
  const faceValue = overrides.faceValue ?? entry.defaultFaceValue;
  const pricePercent = overrides.pricePercent ?? entry.pricePercent;
  const accruedInterestPaid = overrides.accruedInterestPaid ?? 0;
  const feesPaid = overrides.feesPaid ?? 0;

  return {
    instrumentType: "treasury",
    issuer: "Government of Rwanda",
    currency: "RWF",
    market: "primary",
    purchaseDate: entry.purchaseDate,
    settlementDate: entry.settlementDate,
    bondName: entry.issuanceNumber,
    isin: entry.isin,
    tenorYears: entry.tenorYears,
    faceValue,
    pricePercent,
    accruedInterestPaid,
    feesPaid,
    amountInvested:
      faceValue * (pricePercent / 100) + accruedInterestPaid + feesPaid,
    couponRate: entry.couponRate,
    withholdingTaxRate: WITHHOLDING_TAX_RATE,
    maturityDate: entry.maturityDate,
    firstCouponDate: entry.firstCouponDate,
    couponDates: entry.couponDates,
    couponFrequency: 2,
    scheduleConfidence: "confirmed",
    broker: entry.broker,
    accountReference: entry.accountReference,
    sourceUrl: "",
    status: "active",
    notes: entry.notes,
    ...overrides,
  };
}

const JULY_2026_ACCEPTED_PURCHASE: BondPurchaseInput = purchaseFromCatalogEntry(
  bondCatalog[0],
);

const EMPTY_PURCHASE = JULY_2026_ACCEPTED_PURCHASE;

function normalizedBondIdentity(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function issuanceNumberForPurchase(
  purchase: Pick<
    BondPurchase,
    | "bondName"
    | "isin"
    | "tenorYears"
    | "couponRate"
    | "settlementDate"
    | "maturityDate"
  >,
) {
  const purchaseCode = normalizedBondIdentity(purchase.isin);
  const purchaseName = normalizedBondIdentity(purchase.bondName);
  return (
    bondCatalog.find(
      (entry) =>
        normalizedBondIdentity(entry.isin) === purchaseCode ||
        normalizedBondIdentity(entry.issuanceNumber) === purchaseName ||
        (
          entry.tenorYears === purchase.tenorYears &&
          entry.maturityDate === purchase.maturityDate &&
          entry.settlementDate === purchase.settlementDate &&
          Math.abs(entry.couponRate - purchase.couponRate) < 0.000001
        ),
    )?.issuanceNumber ?? purchase.bondName
  );
}

function generateSemiannualCouponDates(
  firstCouponDate: string,
  maturityDate: string,
) {
  if (!firstCouponDate || !maturityDate) return [];
  const first = new Date(`${firstCouponDate}T00:00:00Z`);
  const maturity = new Date(`${maturityDate}T00:00:00Z`);
  if (
    Number.isNaN(first.getTime()) ||
    Number.isNaN(maturity.getTime()) ||
    first > maturity
  ) {
    return [];
  }

  const dates: string[] = [];
  for (let date = first; date <= maturity; ) {
    dates.push(date.toISOString().slice(0, 10));
    const next = new Date(date);
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + 6);
    const finalDay = new Date(
      Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
    ).getUTCDate();
    next.setUTCDate(Math.min(day, finalDay));
    date = next;
  }

  const maturityValue = maturity.toISOString().slice(0, 10);
  if (dates.at(-1) !== maturityValue) dates.push(maturityValue);
  return dates;
}

function validIsoDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function purchaseFromCalendarPrefill(params: URLSearchParams): BondPurchaseInput | null {
  if (params.get("prefill") !== "calendar") return null;

  const tenorYears = Number(params.get("tenorYears"));
  const purchaseDate = validIsoDate(params.get("purchaseDate"));
  const settlementDate = validIsoDate(params.get("settlementDate"));
  const maturityDate = validIsoDate(params.get("maturityDate"));
  const sourceDescription = params.get("sourceDescription")?.trim();

  if (!purchaseDate || !settlementDate || !maturityDate) return null;

  return {
    ...EMPTY_PURCHASE,
    purchaseDate,
    settlementDate,
    bondName: params.get("bondName")?.trim().slice(0, 120) || "Treasury bond",
    isin: "",
    tenorYears:
      Number.isFinite(tenorYears) && tenorYears > 0
        ? tenorYears
        : EMPTY_PURCHASE.tenorYears,
    faceValue: 100_000,
    pricePercent: 100,
    accruedInterestPaid: 0,
    feesPaid: 0,
    amountInvested: 100_000,
    couponRate: 0,
    maturityDate,
    firstCouponDate: "",
    couponDates: [],
    scheduleConfidence: "estimated",
    accountReference: "",
    sourceUrl: "",
    status: "submitted",
    notes: sourceDescription
      ? `From BNR calendar: ${sourceDescription}. Add amount, fees, and coupon after issuance.`
      : "From BNR calendar. Add amount, fees, and coupon after issuance.",
  };
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
    ? `${MONTH_NAMES[activeValue.calendarMonth - 1]} ${activeValue.calendarYear}`
    : "";
  const tooltipX = activePortfolioPoint
    ? Math.min(Math.max(activePortfolioPoint.x - 88, 36), width - 214)
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
                width="178"
                height="82"
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
    </div>
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

export function BondPlanner({ view = "simulator" }: { view?: PlannerView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [assumptions, setAssumptions] =
    useState<BondAssumptions>(DEFAULT_ASSUMPTIONS);
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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [purchases, setPurchases] = useState<BondPurchase[]>([]);
  const [portfolioError, setPortfolioError] = useState("");
  const [purchase, setPurchase] = useState<BondPurchaseInput>(() => ({
    ...EMPTY_PURCHASE,
  }));
  const [purchasePanelOpen, setPurchasePanelOpen] = useState(false);
  const [selectedCatalogBondId, setSelectedCatalogBondId] = useState(
    bondCatalog[0]?.id ?? "",
  );
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(
    null,
  );
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [portfolioSettingsOpen, setPortfolioSettingsOpen] = useState(false);
  const [purchasePendingDelete, setPurchasePendingDelete] =
    useState<BondPurchase | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [copiedSecurityCode, setCopiedSecurityCode] = useState("");
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(
    null,
  );
  const assumptionsHydrated = useRef(false);
  const prefillApplied = useRef("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...JSON.parse(stored) });
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
    if (view !== "portfolio" || editingPurchaseId) return;
    const search = window.location.search;
    if (!search || prefillApplied.current === search) return;

    const prefilledPurchase = purchaseFromCalendarPrefill(
      new URLSearchParams(search),
    );
    if (!prefilledPurchase) return;

    prefillApplied.current = search;
    setPurchase(prefilledPurchase);
    setPurchasePanelOpen(true);
    window.setTimeout(() => {
      document
        .getElementById("portfolio-transaction-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [editingPurchaseId, view]);

  useEffect(() => {
    if (view !== "portfolio") {
      setSessionLoading(false);
      return;
    }
    fetch("/api/bonds/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .finally(() => setSessionLoading(false));
  }, [view]);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    fetch("/api/bonds/purchases", { cache: "no-store" })
      .then(async (response) => ({
        ok: response.ok,
        data: await response.json(),
      }))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          setPortfolioError(data.error ?? "Could not load the portfolio.");
          return;
        }
        setPurchases(data.purchases);
      });
    return () => {
      active = false;
    };
  }, [authenticated]);

  const projection = useMemo(
    () => calculateProjection(assumptions, cashInjections),
    [assumptions, cashInjections],
  );
  const baselineProjection = useMemo(
    () => calculateProjection(assumptions),
    [assumptions],
  );
  const summary = useMemo(
    () => summarizeProjection(projection, assumptions),
    [projection, assumptions],
  );
  const baselineSummary = useMemo(
    () => summarizeProjection(baselineProjection, assumptions),
    [baselineProjection, assumptions],
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
            agukaInterest: row.totalAgukaInterest,
            contributions: row.totalContributions,
            annualContributions:
              row.totalContributions -
              (index > 0 ? projection[index * 12 - 1].totalContributions : 0),
            coupons: row.totalCoupons,
            annualCoupons:
              row.totalCoupons -
              (index > 0 ? projection[index * 12 - 1].totalCoupons : 0),
            annualAgukaInterest:
              row.totalAgukaInterest -
              (index > 0 ? projection[index * 12 - 1].totalAgukaInterest : 0),
            passiveIncome: row.annualPassiveIncome,
            bondPassiveIncome: row.annualBondPassiveIncome,
            agukaPassiveIncome: row.annualAgukaIncome,
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
  const actualPortfolio = purchases.reduce(
    (total, item) =>
      total + (item.status === "active" ? item.faceValue : 0),
    0,
  );
  const actualCashCost = purchases.reduce(
    (total, item) => total + item.amountInvested,
    0,
  );
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
        ? item.faceValue *
          item.couponRate *
          (1 - item.withholdingTaxRate)
        : 0),
    0,
  );
  const purchaseCashCost =
    Math.round(
      (purchase.faceValue * (purchase.pricePercent / 100) +
        purchase.accruedInterestPaid +
        purchase.feesPaid) *
        100,
    ) / 100;
  const purchaseAnnualNetCoupon =
    purchase.status === "submitted" && purchase.couponRate === 0
      ? 0
      : purchase.faceValue * purchase.couponRate * (1 - WITHHOLDING_TAX_RATE);
  const purchaseTermsLocked =
    Boolean(editingPurchaseId) && purchase.status !== "submitted";
  const calendarPrefilledPurchase =
    purchase.status === "submitted" &&
    purchase.notes.startsWith("From BNR calendar");
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
    Math.floor(
      ((waitingCash + draftInjectionAmount) *
        Math.max(0, Math.min(1, assumptions.auctionFillRate)) +
        0.001) /
        assumptions.purchaseMinimum,
    ) * assumptions.purchaseMinimum;
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
    setAssumptions((current) => ({ ...current, [key]: value }));
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

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPortfolioError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/bonds/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPortfolioError(data.error ?? "Sign-in failed.");
      return;
    }
    setAuthenticated(true);
    formElement.reset();
  }

  async function logout() {
    await fetch("/api/bonds/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setPurchases([]);
  }

  async function savePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPurchase(true);
    setPortfolioError("");
    const couponDates =
      purchase.couponDates.length > 0
        ? purchase.couponDates
        : generateSemiannualCouponDates(
            purchase.firstCouponDate,
            purchase.maturityDate,
          );
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
    });
    const data = await response.json();
    setSavingPurchase(false);
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
  }

  function editPurchase(item: BondPurchase) {
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
    document
      .getElementById("portfolio-transaction-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startNewPurchase() {
    const catalogEntry =
      bondCatalog.find((entry) => entry.id === selectedCatalogBondId) ??
      bondCatalog[0];
    setEditingPurchaseId(null);
    setPurchase(purchaseFromCatalogEntry(catalogEntry));
    setPurchasePanelOpen(true);
    window.setTimeout(() => {
      document
        .getElementById("portfolio-transaction-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function applyCatalogBond(id: string) {
    const catalogEntry = bondCatalog.find((entry) => entry.id === id);
    if (!catalogEntry) return;
    setSelectedCatalogBondId(id);
    setPurchase((current) =>
      purchaseFromCatalogEntry(catalogEntry, {
        faceValue: current.faceValue,
        feesPaid: current.feesPaid,
        accruedInterestPaid: current.accruedInterestPaid,
        status: current.status,
        sourceUrl: current.sourceUrl,
        notes: catalogEntry.notes,
      }),
    );
  }

  function useAcceptedJulyResult() {
    setEditingPurchaseId(null);
    setSelectedCatalogBondId(bondCatalog[0]?.id ?? "");
    setPurchase({ ...JULY_2026_ACCEPTED_PURCHASE });
    setPurchasePanelOpen(true);
    document
      .getElementById("portfolio-transaction-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      "Coupon Payment",
      "Aguka Interest",
      "Aguka Distribution",
      "Matured Principal",
      "Reinvested Coupon",
      "Available Cash",
      "Intended Bond Bid",
      "Unfilled Bond Bid",
      "New Bond Purchase",
      "Modeled Purchase Lot",
      "Active Bond Lots",
      "Closing Aguka Balance",
      "Closing Portfolio",
      "Total Account Value",
      "Total Contributions",
      "Total Coupons",
      "Total Aguka Interest",
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
      row.couponPayment,
      row.agukaInterest,
      row.agukaDistribution,
      row.maturedPrincipal,
      row.reinvestedCoupon,
      row.availableCash,
      row.intendedBondBid,
      row.unfilledBondBid,
      row.newBondPurchase,
      row.newBondPurchaseLot?.id ?? "",
      row.activeBondCount,
      row.closingCashBalance,
      row.closingPortfolio,
      row.totalAccountValue,
      row.totalContributions,
      row.totalCoupons,
      row.totalAgukaInterest,
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
            <NavLink active={view === "portfolio"} href="/" icon={<WalletCards size={15} />}>
              Portfolio
            </NavLink>
            <NavLink active={false} href="/calendar" icon={<CalendarClock size={15} />}>
              Calendar
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <BondThemeToggle />
            {view === "simulator" && (
              <button
                onClick={exportProjection}
                className="hidden items-center gap-2 rounded-xl border border-outline/10 px-3 py-2 text-xs font-black text-[var(--md-sys-color-on-surface)] transition hover:border-[var(--md-sys-color-primary)]/40 hover:text-[var(--md-sys-color-primary)] sm:flex"
              >
                <ArrowDownToLine size={15} /> Export CSV
              </button>
            )}
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
            <NavLink active={view === "portfolio"} href="/" icon={<WalletCards size={15} />}>Portfolio</NavLink>
            <NavLink active={false} href="/calendar" icon={<CalendarClock size={15} />}>Calendar</NavLink>
          </nav>
        )}
      </header>

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
                Invest {formatRwf(assumptions.monthlyContribution)} each month for{" "}
                {assumptions.horizonYears} years
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                Starting {MONTH_NAMES[assumptions.startMonth - 1]}{" "}
                {assumptions.startYear}, at a {formatPercent(modeledCouponRate)} annual
                coupon rate with {formatPercent(assumptions.reinvestmentRate)} of net
                coupons reinvested, {formatPercent(assumptions.auctionFillRate)} expected
                auction fill, and idle cash earning {formatPercent(assumptions.agukaAnnualRate)} p.a.
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
                    ? `${formatRwf(summary.finalPortfolio, true)} in bonds + ${formatRwf(summary.finalCashBalance, true)} in Aguka by ${MONTH_NAMES[simulationEnd.calendarMonth - 1]} ${simulationEnd.calendarYear}`
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
          <span>Aguka idle return: {formatPercent(assumptions.agukaAnnualRate, 1)} tax-exempt p.a.</span>
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
                  when gifts, bonuses, coupons, or idle Aguka balances change
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
              <NumberControl label="Monthly contribution" value={assumptions.monthlyContribution} onChange={(value) => update("monthlyContribution", value)} min={0} max={2_000_000} step={50_000} prefix="RWF " />
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
                    Bond tenor
                    <InfoTip label="About bond tenor">
                      The lifetime of one specific bond before its principal is repaid.
                      For example, a 10-year bond bought in 2026 matures in 2036.
                    </InfoTip>
                  </span>
                  <span className="text-[11px] text-[var(--md-sys-color-outline)]">Official options</span>
                </span>
                <select
                  aria-label="Bond tenor"
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
                label="Annual coupon rate"
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
                label="Aguka idle cash return"
                value={Math.round(assumptions.agukaAnnualRate * 10_000) / 100}
                onChange={(value) => update("agukaAnnualRate", value / 100)}
                min={0}
                max={15}
                step={0.25}
                suffix="% p.a."
                help="Tax-exempt annual return assumption for unallocated cash parked in Aguka between bond bids. Update this when BK Capital changes the quoted rate."
              />
              <NumberControl label="Starting portfolio" value={assumptions.startingPortfolio} onChange={(value) => update("startingPortfolio", value)} min={0} max={15_000_000} step={50_000} prefix="RWF " />
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
                    <span>Aguka balance already waiting</span>
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
                      Aguka after draft
                      <strong className="mt-0.5 block text-on-surface">
                        {formatRwf(cashAfterDraftInjection)}
                      </strong>
                    </span>
                  </div>
                  <p className="mt-2">
                    Deposits can be any positive amount. Only the resulting
                    bond purchase is constrained by the auction-fill assumption;
                    unallocated money remains in Aguka.
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
              <Metric label="Total cash invested" value={formatRwf(summary.totalContributions)} detail="Monthly plan plus one-time injections" />
              <Metric
                label="Modeled bond purchases"
                value={String(
                  projection.filter((row) => row.newBondPurchaseLot).length,
                )}
                detail="Each monthly pooled purchase is tracked as one independent lot"
              />
              <Metric label="Net coupons earned" value={formatRwf(summary.totalCoupons)} detail={`${formatPercent(netAnnualRate)} net annual rate`} />
              <Metric label="Coupons reinvested" value={formatRwf(summary.totalReinvested)} detail={`${formatPercent(assumptions.reinvestmentRate)} reinvested`} />
              <Metric label="Aguka interest earned" value={formatRwf(summary.totalAgukaInterest)} detail={`${formatPercent(assumptions.agukaAnnualRate, 1)} tax-exempt p.a. on idle cash`} />
              <Metric label="Growth above contributions" value={formatRwf(summary.finalAccountValue - summary.totalContributions - assumptions.startingPortfolio)} accent />
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
                      <td className="px-5 py-4 text-[var(--md-sys-color-on-surface-variant)]">
                        {formatRwf(row.annualCoupons + row.annualAgukaInterest)}
                        {row.annualAgukaInterest > 0 && (
                          <span className="mt-1 block text-[9px] text-on-surface-variant">
                            {formatRwf(row.annualCoupons)} coupons ·{" "}
                            {formatRwf(row.annualAgukaInterest)} Aguka
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block font-bold">
                          {formatRwf(row.portfolio)}
                        </span>
                        {row.cashBalance > 0 && (
                          <span className="mt-1 block text-[9px] text-on-surface-variant">
                            {formatRwf(row.bondHoldings)} bonds ·{" "}
                            {formatRwf(row.cashBalance)} Aguka
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[var(--md-sys-color-tertiary)]">
                        {formatRwf(row.passiveIncome)}
                        {row.agukaPassiveIncome > 0 && (
                          <span className="mt-1 block text-[9px] text-on-surface-variant">
                            {formatRwf(row.bondPassiveIncome)} bonds ·{" "}
                            {formatRwf(row.agukaPassiveIncome)} Aguka
                          </span>
                        )}
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
                            <div className="contents">
                            <table className="w-full min-w-[780px] border-collapse text-left">
                              <thead className="text-[9px] uppercase tracking-[0.14em] text-[var(--md-sys-color-outline)]">
                                <tr>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Month</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Bid result</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Bond purchase</th>
                                  <th className="sticky top-[53px] z-20 bg-[var(--md-sys-color-surface-container-lowest)] px-3 py-2 shadow-[0_1px_0_rgba(100,116,139,0.14)] lg:top-[126px]">Aguka balance</th>
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
                                        <td className="px-3 py-3 text-on-surface-variant">
                                          {formatRwf(month.intendedBondBid)}
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
                                                Lot{" "}
                                                {String(month.month).padStart(
                                                  3,
                                                  "0",
                                                )}
                                              </span>
                                            </Link>
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
                                          <td colSpan={6} className="px-4 py-4">
                                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                              <DetailPanel title="Funding">
                                                <DetailLine
                                                  label="Monthly contribution"
                                                  value={formatRwf(
                                                    month.personalContribution,
                                                  )}
                                                />
                                                <DetailLine
                                                  label="Opening Aguka"
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
                                                <DetailLine
                                                  label="Aguka interest"
                                                  value={formatRwf(
                                                    month.agukaInterest,
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
                                              </DetailPanel>
                                              <DetailPanel title="Auction">
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
                                                  label="Closing Aguka"
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
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)]">
                <LockKeyhole size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.22em]">Private portfolio</p>
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Track real bond purchases</h2>
            </div>
            {authenticated && (
              <button onClick={logout} className="flex w-fit items-center gap-2 rounded-xl border border-outline/10 px-3 py-2 text-xs font-black text-[var(--md-sys-color-on-surface-variant)] hover:text-on-surface">
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
            <div className="mt-8 rounded-3xl border border-outline/10 p-8 text-sm text-[var(--md-sys-color-on-surface-variant)]">Checking private session…</div>
          ) : !authenticated ? (
            <form onSubmit={login} className="mt-8 max-w-lg rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5 md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]"><ShieldCheck size={21} /></span>
                <div>
                  <h3 className="font-black">Owner access</h3>
                </div>
              </div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Email
                <input name="email" type="email" required autoComplete="username" defaultValue="orestegabo@icloud.com" className="mt-2 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-4 py-3 text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60" />
              </label>
              <label className="mt-4 block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Password
                <input name="password" type="password" required minLength={12} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-4 py-3 text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60" />
              </label>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:opacity-90">
                Open private portfolio <ChevronRight size={16} />
              </button>
            </form>
          ) : (
            <>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Principal held" value={formatRwf(actualPortfolio)} accent />
                <Metric label="Total cash cost" value={formatRwf(actualCashCost)} />
                <Metric label="Saved annual net coupons" value={formatRwf(actualAnnualIncome)} />
                <Metric label="Recorded transactions" value={String(purchases.length)} />
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPortfolioSettingsOpen((open) => !open)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition ${
                    portfolioSettingsOpen
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-outline/10 text-on-surface-variant hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <Settings size={17} />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={startNewPurchase}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:opacity-90"
                >
                  <Plus size={17} />
                  Add purchase
                </button>
              </div>
              {portfolioSettingsOpen && (
                <div className="mt-4 rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                        Portfolio settings
                      </p>
                      <h3 className="mt-1 font-black">Records</h3>
                    </div>
                    <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase text-on-surface-variant">
                      {purchases.length} saved
                    </span>
                  </div>
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
              <div className={`mt-4 grid gap-6 ${purchasePanelOpen ? "xl:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
                {purchasePanelOpen && (
                <form id="portfolio-transaction-form" onSubmit={savePurchase} className="order-2 scroll-mt-24 rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Plus size={18} className="text-[var(--md-sys-color-primary)]" />
                    <div>
                      <h3 className="font-black">
                        {editingPurchaseId
                          ? purchaseTermsLocked
                            ? "Update purchase record"
                            : "Edit Treasury bond purchase"
                          : "Record Treasury bond purchase"}
                      </h3>
                    </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPurchasePanelOpen(false);
                        setEditingPurchaseId(null);
                      }}
                      aria-label="Close purchase panel"
                      className="rounded-xl p-2 text-outline transition hover:bg-surface-container hover:text-on-surface"
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {!editingPurchaseId && (
                      <label className="sm:col-span-2 text-[11px] font-bold text-on-surface-variant">
                        Bond
                        <select
                          value={selectedCatalogBondId}
                          onChange={(event) => applyCatalogBond(event.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface"
                        >
                          {bondCatalog.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.issuanceNumber} · {formatPercent(entry.couponRate, 2)} · {entry.maturityDate}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {!editingPurchaseId && calendarPrefilledPurchase ? (
                      <div className="sm:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                          Prefilled from calendar
                        </p>
                      </div>
                    ) : !editingPurchaseId ? (
                      <div className="sm:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                              Accepted July 2026 result loaded
                            </p>
                            <p className="mt-2 text-sm font-black text-on-surface">
                              RWF 2.2M · FXD2/2026/7YR · 11.50%
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={useAcceptedJulyResult}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-background/70 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-primary transition hover:bg-primary/10"
                          >
                            <RefreshCcw size={13} />
                            Reload result
                          </button>
                        </div>
                      </div>
                    ) : null}
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
                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
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
                                  couponDates: [],
                                }))
                              }
                              className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={!purchase.firstCouponDate || !purchase.maturityDate}
                            onClick={() =>
                              setPurchase((current) => ({
                                ...current,
                                couponDates: generateSemiannualCouponDates(
                                  current.firstCouponDate,
                                  current.maturityDate,
                                ),
                              }))
                            }
                            className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-xs font-black text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Generate dates
                          </button>
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
                          No coupon dates generated yet.
                        </p>
                      )}
                    </div>
                    <label className="text-[11px] font-bold text-on-surface-variant">
                      Account reference
                      <input value={purchase.accountReference} onChange={(event) => setPurchase((current) => ({ ...current, accountReference: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface" />
                    </label>
                    <label className="sm:col-span-2 text-[11px] font-bold text-on-surface-variant">
                      Prospectus or source URL
                      <input type="url" value={purchase.sourceUrl} onChange={(event) => setPurchase((current) => ({ ...current, sourceUrl: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-outline/10 bg-background px-3 py-2.5 text-sm text-on-surface" />
                    </label>
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
                    <label className="sm:col-span-2 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      Notes
                      <textarea value={purchase.notes} maxLength={1000} onChange={(event) => setPurchase((current) => ({ ...current, notes: event.target.value }))} className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-2.5 text-sm text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60" />
                    </label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {editingPurchaseId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPurchaseId(null);
                          setPurchase({ ...EMPTY_PURCHASE });
                        }}
                        className="rounded-xl border border-outline/10 px-4 py-3 text-sm font-black text-on-surface-variant"
                      >
                        Cancel
                      </button>
                    )}
                    <button disabled={savingPurchase} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:opacity-90 disabled:opacity-50">
                      <Database size={16} />{" "}
                      {savingPurchase
                        ? "Saving…"
                        : editingPurchaseId
                          ? "Update transaction"
                          : "Save transaction"}
                    </button>
                  </div>
                </form>
                )}

                <div className="bond-scrollbar order-1 overflow-x-auto rounded-3xl border border-outline/10">
                  {purchases.length === 0 ? (
                    <div className="grid min-h-64 place-items-center p-8 text-center">
                      <div>
                        <WalletCards className="mx-auto text-[var(--md-sys-color-outline)]" />
                        <p className="mt-3 font-bold">No purchases recorded yet</p>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full min-w-[980px] border-collapse text-left">
                      <thead className="bg-[var(--md-sys-color-surface-container)] text-[10px] uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
                        <tr>
                          <th className="px-4 py-3">Bond</th>
                          <th className="px-4 py-3">Principal / cost</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Expected coupon</th>
                          <th className="px-4 py-3">Next payment</th>
                          <th className="px-4 py-3">Schedule</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((item) => {
                          const couponPending =
                            item.status === "submitted" || item.couponRate === 0;
                          const issuanceNumber = issuanceNumberForPurchase(item);
                          const netRate =
                            item.couponRate *
                            (1 - item.withholdingTaxRate);
                          const tracking = couponPending
                            ? null
                            : calculateBondTracking(
                                item,
                                new Date().toISOString().slice(0, 10),
                              );
                          return (
                            <tr key={item.id} className="border-t border-outline/10 text-xs">
                              <td className="px-4 py-4">
                                <Link
                                  href={`/purchases/${item.id}`}
                                  className="inline-flex items-center gap-1.5 text-sm font-black text-on-surface hover:text-[var(--md-sys-color-primary)]"
                                >
                                  {issuanceNumber}
                                  <ChevronRight size={14} />
                                </Link>
                                {item.isin && (
                                  <button
                                    type="button"
                                    onClick={() => copySecurityCode(item.isin)}
                                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg text-[10px] font-black text-outline transition hover:text-primary"
                                    aria-label={`Copy ${item.isin}`}
                                  >
                                    {copiedSecurityCode === item.isin ? (
                                      <Check size={12} />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                    {item.isin}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <strong className="block">{formatRwf(item.faceValue)}</strong>
                                <span className="text-[10px] text-on-surface-variant">{formatRwf(item.amountInvested)} cash cost</span>
                              </td>
                              <td className="px-4 py-4">{item.pricePercent.toFixed(3)}%</td>
                              <td className="px-4 py-4">
                                {couponPending ? (
                                  <>
                                    <strong className="block text-tertiary">Coupon pending</strong>
                                    <span className="text-[10px] text-on-surface-variant">Update after issuance</span>
                                  </>
                                ) : (
                                  <>
                                    <strong className="block text-primary">{formatRwf(item.faceValue * netRate / item.couponFrequency)}</strong>
                                    <span className="text-[10px] text-on-surface-variant">{formatPercent(netRate)} net rate</span>
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-4 text-on-surface-variant">
                                {tracking?.nextCouponDate ?? "Pending issuance"}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${item.scheduleConfidence === "confirmed" ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"}`}>
                                  {item.scheduleConfidence}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => editPurchase(item)}
                                  aria-label={`Edit ${item.bondName}`}
                                  className="mr-1 rounded-lg p-2 text-outline hover:bg-primary/10 hover:text-primary"
                                >
                                  <Pencil size={15} />
                                </button>
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
              auction allocation, and Aguka as the idle-cash parking layer. Coupons,
              unfilled bids, Aguka returns, and matured principal are pooled into
              future bid attempts.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Market price risk", "Bond prices can fluctuate if sold before maturity."],
              ["Holding to maturity", "Holding to maturity avoids market-price loss if the issuer pays as agreed."],
              ["Coupon and tenor", `BK Capital states tenors of ${TREASURY_BOND_TENORS.join(", ")} years and annual coupon rates from ${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)} to ${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}, depending on the issuance.`],
              ["Auction fill risk", `The model defaults to ${formatPercent(DEFAULT_ASSUMPTIONS.auctionFillRate, 0)} allocation based on the BNR historical sold/applied pattern, not 100% allocation.`],
              ["Aguka idle cash", `Unfilled bond money is modeled in Aguka at ${formatPercent(DEFAULT_ASSUMPTIONS.agukaAnnualRate, 1)} tax-exempt annual return until it is used for another bid.`],
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
        <Link href="/" aria-label="Open portfolio" className={`rounded-xl p-3 ${view === "portfolio" ? "bg-primary text-on-primary" : "text-[var(--md-sys-color-outline)]"}`}>
          <WalletCards size={18} />
        </Link>
        <Link href="/calendar" aria-label="Open issuance calendar" className="rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <CalendarClock size={18} />
        </Link>
      </nav>
    </main>
  );
}

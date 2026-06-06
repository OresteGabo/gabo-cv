"use client";

import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Landmark,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
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
import type {
  BondAssumptions,
  CashInjection,
  BondPurchase,
  BondPurchaseInput,
} from "@/lib/bonds/types";

type Section = "simulator" | "projection" | "portfolio" | "guide";

const STORAGE_KEY = "rwanda-bond-planner-assumptions-v1";
const INJECTIONS_STORAGE_KEY = "rwanda-bond-planner-injections-v1";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const EMPTY_PURCHASE: BondPurchaseInput = {
  purchaseDate: "",
  bondName: "",
  isin: "",
  tenorYears: 5,
  amountInvested: 100_000,
  couponRate: 0.12,
  maturityDate: "",
  couponFrequency: 2,
  notes: "",
};

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
          ? "border-[#8ce6aa]/35 bg-[#8ce6aa]/10"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.19em] text-[#a8bdb0]">
        {label}
      </p>
      <p className="mt-3 break-words text-2xl font-black tracking-tight md:text-3xl">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-[#a8bdb0]">{detail}</p>}
    </article>
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
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/10 p-4">
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#d7e6dc]">{label}</span>
        <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-xs font-bold text-[#8ce6aa]">
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
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <span className="mt-2 block text-[11px] text-[#81988a]">{hint}</span>}
    </label>
  );
}

function GrowthChart({
  values,
}: {
  values: { year: number; portfolio: number; contributions: number }[];
}) {
  const width = 760;
  const height = 300;
  const pad = 28;
  const max = Math.max(...values.flatMap((value) => [value.portfolio, value.contributions]), 1);
  const point = (value: number, index: number) => {
    const x = pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2);
    const y = height - pad - (value / max) * (height - pad * 2);
    return `${x},${y}`;
  };
  const portfolioPoints = values.map((v, i) => point(v.portfolio, i)).join(" ");
  const contributionPoints = values
    .map((v, i) => point(v.contributions, i))
    .join(" ");
  const areaPoints = `${pad},${height - pad} ${portfolioPoints} ${width - pad},${height - pad}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#091e17] p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ce6aa]">
            Growth curve
          </p>
          <h3 className="mt-1 text-xl font-black">Portfolio vs contributions</h3>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-[#a8bdb0]">
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[#8ce6aa]" /> Portfolio
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[#e8c66a]" /> Contributions
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Projected portfolio value and personal contributions by year"
      >
        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={pad}
              x2={width - pad}
              y1={height - pad - tick * (height - pad * 2)}
              y2={height - pad - tick * (height - pad * 2)}
              stroke="rgba(176,218,194,.13)"
              strokeDasharray="4 7"
            />
            <text
              x={pad}
              y={height - pad - tick * (height - pad * 2) - 7}
              fill="#81988a"
              fontSize="10"
            >
              {formatRwf(max * tick, true)}
            </text>
          </g>
        ))}
        <polygon points={areaPoints} fill="rgba(140,230,170,.08)" />
        <polyline
          points={contributionPoints}
          fill="none"
          stroke="#e8c66a"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <polyline
          points={portfolioPoints}
          fill="none"
          stroke="#8ce6aa"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-bold text-[#81988a]">
        <span>Year 1</span>
        <span>Year {values.at(-1)?.year ?? 1}</span>
      </div>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-[#8ce6aa] text-[#071812]"
          : "text-[#a8bdb0] hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function BondPlanner() {
  const [activeSection, setActiveSection] = useState<Section>("simulator");
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
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [purchases, setPurchases] = useState<BondPurchase[]>([]);
  const [portfolioError, setPortfolioError] = useState("");
  const [purchase, setPurchase] = useState<BondPurchaseInput>(EMPTY_PURCHASE);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const assumptionsHydrated = useRef(false);

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
    fetch("/api/bonds/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .finally(() => setSessionLoading(false));
  }, []);

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
        .map((row, index) => ({
          year: row.year,
          portfolio: row.closingPortfolio,
          contributions: row.totalContributions,
          annualContributions:
            row.totalContributions -
            (index > 0 ? projection[index * 12 - 1].totalContributions : 0),
          coupons: row.totalCoupons,
          annualCoupons:
            row.totalCoupons -
            (index > 0 ? projection[index * 12 - 1].totalCoupons : 0),
          passiveIncome: row.annualPassiveIncome,
        })),
    [projection],
  );
  const modeledCouponRate = Math.min(
    MAX_ANNUAL_COUPON_RATE,
    Math.max(MIN_ANNUAL_COUPON_RATE, assumptions.annualCouponRate),
  );
  const netAnnualRate = modeledCouponRate * (1 - WITHHOLDING_TAX_RATE);
  const actualPortfolio = purchases.reduce(
    (total, item) => total + item.amountInvested,
    0,
  );
  const totalCashInjected = cashInjections.reduce(
    (total, injection) => total + injection.amount,
    0,
  );
  const injectionFinalImpact =
    summary.finalPortfolio - baselineSummary.finalPortfolio;
  const actualAnnualIncome = purchases.reduce(
    (total, item) =>
      total +
      item.amountInvested *
        item.couponRate *
        (1 - WITHHOLDING_TAX_RATE),
    0,
  );

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

  function goTo(section: Section) {
    setActiveSection(section);
    setMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  function toggleYear(year: number) {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
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
    if (
      injectionDraft.amount < assumptions.purchaseMinimum ||
      injectionDraft.amount % assumptions.purchaseMinimum !== 0
    ) {
      return;
    }

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

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPortfolioError("");
    const form = new FormData(event.currentTarget);
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
    event.currentTarget.reset();
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
    const response = await fetch("/api/bonds/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchase),
    });
    const data = await response.json();
    setSavingPurchase(false);
    if (!response.ok) {
      setPortfolioError(data.error ?? "The purchase could not be saved.");
      return;
    }
    setPurchases((current) => [data.purchase, ...current]);
    setPurchase(EMPTY_PURCHASE);
  }

  async function removePurchase(id: string) {
    const response = await fetch(`/api/bonds/purchases/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setPurchases((current) => current.filter((item) => item.id !== id));
    }
  }

  function exportProjection() {
    const header = [
      "Month",
      "Year",
      "Opening Portfolio",
      "Personal Contribution",
      "Extra Cash Injection",
      "Coupon Payment",
      "Reinvested Coupon",
      "Closing Portfolio",
      "Total Contributions",
      "Total Coupons",
      "Annual Passive Income",
      "Monthly Passive Income",
    ];
    const rows = projection.map((row) => [
      row.month,
      row.year,
      row.openingPortfolio,
      row.personalContribution,
      row.cashInjection,
      row.couponPayment,
      row.reinvestedCoupon,
      row.closingPortfolio,
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
    <main className="bond-app font-sans">
      <div className="bond-grid pointer-events-none absolute inset-0 h-[920px] opacity-20" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071812]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8ce6aa] text-[#071812]">
              <Landmark size={20} strokeWidth={2.6} />
            </span>
            <span>
              <strong className="block text-sm font-black tracking-tight">Rwanda Bond Planner</strong>
              <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#81988a]">
                by Gabo
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavButton active={activeSection === "simulator"} onClick={() => goTo("simulator")} icon={<Sparkles size={15} />}>
              Simulator
            </NavButton>
            <NavButton active={activeSection === "projection"} onClick={() => goTo("projection")} icon={<BarChart3 size={15} />}>
              Projection
            </NavButton>
            <NavButton active={activeSection === "portfolio"} onClick={() => goTo("portfolio")} icon={<WalletCards size={15} />}>
              Portfolio
            </NavButton>
            <NavButton active={activeSection === "guide"} onClick={() => goTo("guide")} icon={<ShieldCheck size={15} />}>
              Guide
            </NavButton>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={exportProjection}
              className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-[#d7e6dc] transition hover:border-[#8ce6aa]/40 hover:text-[#8ce6aa] sm:flex"
            >
              <ArrowDownToLine size={15} /> Export CSV
            </button>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open navigation"
              className="rounded-xl border border-white/10 p-2.5 lg:hidden"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="grid grid-cols-2 gap-2 border-t border-white/10 p-3 lg:hidden">
            <NavButton active={activeSection === "simulator"} onClick={() => goTo("simulator")} icon={<Sparkles size={15} />}>Simulator</NavButton>
            <NavButton active={activeSection === "projection"} onClick={() => goTo("projection")} icon={<BarChart3 size={15} />}>Projection</NavButton>
            <NavButton active={activeSection === "portfolio"} onClick={() => goTo("portfolio")} icon={<WalletCards size={15} />}>Portfolio</NavButton>
            <NavButton active={activeSection === "guide"} onClick={() => goTo("guide")} icon={<ShieldCheck size={15} />}>Guide</NavButton>
          </nav>
        )}
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 md:px-8 md:pb-24 md:pt-24">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8ce6aa]/25 bg-[#8ce6aa]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8ce6aa]">
            <Check size={13} /> Transparent monthly compounding model
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl md:text-8xl">
            Build a long-term
            <span className="block text-[#8ce6aa]">RWF income engine.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#a8bdb0] md:text-lg">
            Explore contributions, net coupon income, reinvestment, and portfolio
            milestones with a model you can inspect month by month.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <Metric label="Final portfolio" value={formatRwf(summary.finalPortfolio)} accent />
          <Metric label="Annual passive income" value={formatRwf(summary.annualPassiveIncome)} />
          <Metric label="Monthly passive income" value={formatRwf(summary.monthlyPassiveIncome)} />
        </div>
      </section>

      <section id="simulator" className="scroll-mt-24 border-y border-white/10 bg-[#0a1d16]/72">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[390px_1fr]">
          <aside>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8ce6aa]">Assumptions</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Tune the model</h2>
              </div>
              <button
                type="button"
                onClick={resetScenario}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-black text-[#a8bdb0] hover:border-[#8ce6aa]/30 hover:text-white"
                aria-label="Reset entire simulation"
              >
                <RefreshCcw size={16} />
                Reset all
              </button>
            </div>
            <div className="mt-7 space-y-3">
              <NumberControl label="Monthly contribution" value={assumptions.monthlyContribution} onChange={(value) => update("monthlyContribution", value)} min={0} max={2_000_000} step={50_000} prefix="RWF " />
              <NumberControl label="Investment horizon" value={assumptions.horizonYears} onChange={(value) => update("horizonYears", value)} min={1} max={40} step={1} suffix=" years" />
              <label className="block rounded-2xl border border-white/10 bg-black/10 p-4">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#d7e6dc]">Bond tenor</span>
                  <span className="text-[11px] text-[#81988a]">Official options</span>
                </span>
                <select
                  value={assumptions.tenorYears}
                  onChange={(event) => update("tenorYears", Number(event.target.value))}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#8ce6aa]/60"
                >
                  {TREASURY_BOND_TENORS.map((tenor) => (
                    <option key={tenor} value={tenor}>{tenor} years</option>
                  ))}
                </select>
              </label>
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
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div>
                  <p className="text-xs font-bold text-[#d7e6dc]">Withholding tax</p>
                  <p className="mt-1 text-[11px] text-[#81988a]">Fixed government rate</p>
                </div>
                <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-xs font-bold text-[#8ce6aa]">
                  {formatPercent(WITHHOLDING_TAX_RATE)}
                </span>
              </div>
              <NumberControl label="Coupon reinvestment" value={Math.round(assumptions.reinvestmentRate * 100)} onChange={(value) => update("reinvestmentRate", value / 100)} min={0} max={100} step={5} suffix="%" />
              <NumberControl label="Starting portfolio" value={assumptions.startingPortfolio} onChange={(value) => update("startingPortfolio", value)} min={0} max={5_000_000} step={50_000} prefix="RWF " />
            </div>

            <div className="mt-6 rounded-3xl border border-[#e8c66a]/20 bg-[#e8c66a]/[0.05] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e8c66a]">Extra cash</p>
                  <h3 className="mt-1 font-black">One-time injections</h3>
                </div>
                <span className="rounded-lg bg-[#e8c66a]/10 px-2 py-1 text-[10px] font-bold text-[#e8c66a]">
                  {cashInjections.length} added
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#a8bdb0]">
                Model gifts, bonuses, or other occasional money separately from your monthly plan.
              </p>
              <form onSubmit={addCashInjection} className="mt-4 grid gap-3">
                <input
                  aria-label="Extra cash source"
                  placeholder="Source, e.g. Gift from a friend"
                  value={injectionDraft.label}
                  onChange={(event) => setInjectionDraft((current) => ({ ...current, label: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#62766a] focus:border-[#e8c66a]/50"
                />
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#81988a]">
                  Amount
                  <input
                    type="number"
                    min={100_000}
                    step={100_000}
                    required
                    value={injectionDraft.amount}
                    onChange={(event) => setInjectionDraft((current) => ({ ...current, amount: Number(event.target.value) }))}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none focus:border-[#e8c66a]/50"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#81988a]">
                    Year
                    <input
                      type="number"
                      min={1}
                      max={assumptions.horizonYears}
                      required
                      value={injectionDraft.year}
                      onChange={(event) => setInjectionDraft((current) => ({ ...current, year: Number(event.target.value) }))}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none focus:border-[#e8c66a]/50"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#81988a]">
                    Month
                    <select
                      value={injectionDraft.monthInYear}
                      onChange={(event) => setInjectionDraft((current) => ({ ...current, monthInYear: Number(event.target.value) }))}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none focus:border-[#e8c66a]/50"
                    >
                      {MONTH_NAMES.map((month, index) => (
                        <option key={month} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-[#e8c66a] px-4 py-3 text-xs font-black text-[#30260a] hover:bg-[#f1d987]">
                  <Plus size={15} /> Add to scenario
                </button>
              </form>

              {cashInjections.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {cashInjections
                    .slice()
                    .sort((a, b) => a.month - b.month)
                    .map((injection) => (
                      <div key={injection.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{injection.label}</p>
                          <p className="mt-1 text-[10px] text-[#81988a]">
                            {formatRwf(injection.amount)} · Year {Math.ceil(injection.month / 12)}, {MONTH_NAMES[(injection.month - 1) % 12]}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCashInjection(injection.id)}
                          aria-label={`Remove ${injection.label}`}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300/10 px-2.5 py-2 text-[10px] font-black uppercase tracking-wider text-red-200/70 hover:border-red-300/25 hover:bg-red-300/10 hover:text-red-100"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            <GrowthChart values={annualProjection} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total cash invested" value={formatRwf(summary.totalContributions)} detail="Monthly plan plus one-time injections" />
              <Metric label="Net coupons earned" value={formatRwf(summary.totalCoupons)} detail={`${formatPercent(netAnnualRate)} net annual rate`} />
              <Metric label="Coupons reinvested" value={formatRwf(summary.totalReinvested)} detail={`${formatPercent(assumptions.reinvestmentRate)} reinvested`} />
              <Metric label="Growth above contributions" value={formatRwf(summary.finalPortfolio - summary.totalContributions - assumptions.startingPortfolio)} accent />
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
                <div key={String(label)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8c66a]/10 text-[#e8c66a]">
                    <Target size={18} />
                  </span>
                  <span>
                    <strong className="block text-sm">{label}</strong>
                    <span className="text-xs text-[#a8bdb0]">
                      {month ? `Month ${month} · Year ${Math.ceil(Number(month) / 12)}` : "Not reached"}
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
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8ce6aa]">Projection</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">See where every franc goes</h2>
          </div>
          <div className="rounded-2xl border border-[#e8c66a]/20 bg-[#e8c66a]/[0.07] px-4 py-3 text-xs text-[#d9ca9b]">
            Passive income exceeds annual contributions in{" "}
            <strong className="text-[#f2dfa6]">
              {summary.passiveIncomeCrossoverYear ? `year ${summary.passiveIncomeCrossoverYear}` : "no modeled year"}
            </strong>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#8ce6aa]/15 bg-[#8ce6aa]/[0.05] px-4 py-3 text-xs text-[#a8bdb0]">
          <CalendarDays size={16} className="shrink-0 text-[#8ce6aa]" />
          <p>
            Suggested routine: invest on the <strong className="text-white">5th of every month</strong>,
            or the next business day. This gives salary transfers time to settle while keeping the habit consistent.
          </p>
        </div>

        <div className="bond-scrollbar mt-5 overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead className="bg-[#123127] text-[10px] uppercase tracking-[0.15em] text-[#a8bdb0]">
              <tr>
                <th className="px-5 py-4">Year</th>
                <th className="px-5 py-4">Invested this year</th>
                <th className="px-5 py-4">Coupons this year</th>
                <th className="px-5 py-4">Closing portfolio</th>
                <th className="px-5 py-4">Annual passive income</th>
                <th className="w-16 px-5 py-4 text-right">Details</th>
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
                    <tr className={`border-t border-white/[0.07] text-sm transition hover:bg-white/[0.025] ${isExpanded ? "bg-white/[0.025]" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="font-black text-[#8ce6aa]">Year {row.year}</span>
                        {yearInjections.length > 0 && (
                          <span className="ml-2 rounded-full bg-[#e8c66a]/10 px-2 py-1 text-[9px] font-black uppercase text-[#e8c66a]">
                            {yearInjections.length} extra {yearInjections.length === 1 ? "deposit" : "deposits"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">{formatRwf(row.annualContributions)}</td>
                      <td className="px-5 py-4 text-[#a8bdb0]">{formatRwf(row.annualCoupons)}</td>
                      <td className="px-5 py-4 font-bold">{formatRwf(row.portfolio)}</td>
                      <td className="px-5 py-4 text-[#e8c66a]">{formatRwf(row.passiveIncome)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleYear(row.year)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} year ${row.year}`}
                          className="inline-grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-[#a8bdb0] transition hover:border-[#8ce6aa]/40 hover:text-[#8ce6aa]"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-[#8ce6aa]/10 bg-[#061510]">
                        <td colSpan={6} className="p-0">
                          <div className="overflow-x-auto px-4 py-4 md:px-6">
                            <table className="w-full min-w-[960px] border-collapse text-left">
                              <thead className="text-[9px] uppercase tracking-[0.14em] text-[#81988a]">
                                <tr>
                                  <th className="px-3 py-2">Month</th>
                                  <th className="px-3 py-2">Suggested date</th>
                                  <th className="px-3 py-2">Opening</th>
                                  <th className="px-3 py-2">Monthly plan</th>
                                  <th className="px-3 py-2">Extra cash</th>
                                  <th className="px-3 py-2">Coupon paid</th>
                                  <th className="px-3 py-2">Reinvested</th>
                                  <th className="px-3 py-2">Closing</th>
                                </tr>
                              </thead>
                              <tbody>
                                {months.map((month) => (
                                  <tr
                                    key={month.month}
                                    className={`border-t border-white/[0.05] text-xs ${month.couponPayment > 0 ? "bg-[#8ce6aa]/[0.05]" : ""}`}
                                  >
                                    <td className="px-3 py-3 font-bold">
                                      {new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2026, month.monthInYear - 1, 1))}
                                    </td>
                                    <td className="px-3 py-3 text-[#a8bdb0]">
                                      5th
                                      {month.couponPayment > 0 && (
                                        <span className="ml-2 rounded-full bg-[#8ce6aa]/10 px-2 py-1 text-[9px] font-black uppercase text-[#8ce6aa]">
                                          Coupon month
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-[#81988a]">{formatRwf(month.openingPortfolio)}</td>
                                    <td className="px-3 py-3 font-bold">{formatRwf(month.personalContribution)}</td>
                                    <td className="px-3 py-3">
                                      {month.cashInjection > 0 ? (
                                        <>
                                          <span className="font-bold text-[#e8c66a]">{formatRwf(month.cashInjection)}</span>
                                          <span className="mt-1 block max-w-36 truncate text-[9px] text-[#a89459]">
                                            {month.cashInjectionLabels.join(", ")}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-[#566b5e]">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-[#8ce6aa]">{formatRwf(month.couponPayment)}</td>
                                    <td className="px-3 py-3 text-[#a8bdb0]">{formatRwf(month.reinvestedCoupon)}</td>
                                    <td className="px-3 py-3 font-bold">{formatRwf(month.closingPortfolio)}</td>
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

      <section id="portfolio" className="scroll-mt-24 border-y border-white/10 bg-[#0a1d16]/72">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[#8ce6aa]">
                <LockKeyhole size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.22em]">Private portfolio</p>
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Track real bond purchases</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#a8bdb0]">
                Simulation is public. Actual purchases are stored in Neon and only returned after your signed admin session is verified.
              </p>
            </div>
            {authenticated && (
              <button onClick={logout} className="flex w-fit items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-[#a8bdb0] hover:text-white">
                <LogOut size={15} /> Sign out
              </button>
            )}
          </div>

          {portfolioError && (
            <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">
              {portfolioError}
            </div>
          )}

          {sessionLoading ? (
            <div className="mt-8 rounded-3xl border border-white/10 p-8 text-sm text-[#a8bdb0]">Checking private session…</div>
          ) : !authenticated ? (
            <form onSubmit={login} className="mt-8 max-w-lg rounded-3xl border border-white/10 bg-black/10 p-5 md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8ce6aa]/10 text-[#8ce6aa]"><ShieldCheck size={21} /></span>
                <div>
                  <h3 className="font-black">Owner access</h3>
                  <p className="text-xs text-[#81988a]">Use the email and password configured in Vercel.</p>
                </div>
              </div>
              <label className="block text-xs font-bold text-[#a8bdb0]">
                Email
                <input name="email" type="email" required autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071812] px-4 py-3 text-white outline-none focus:border-[#8ce6aa]/60" />
              </label>
              <label className="mt-4 block text-xs font-bold text-[#a8bdb0]">
                Password
                <input name="password" type="password" required minLength={12} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071812] px-4 py-3 text-white outline-none focus:border-[#8ce6aa]/60" />
              </label>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8ce6aa] px-4 py-3 text-sm font-black text-[#071812] hover:bg-[#a3efbb]">
                Open private portfolio <ChevronRight size={16} />
              </button>
            </form>
          ) : (
            <>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Metric label="Actual invested" value={formatRwf(actualPortfolio)} accent />
                <Metric label="Expected annual net coupons" value={formatRwf(actualAnnualIncome)} />
                <Metric label="Recorded bonds" value={String(purchases.length)} />
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
                <form onSubmit={savePurchase} className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <div className="flex items-center gap-3">
                    <Plus size={18} className="text-[#8ce6aa]" />
                    <h3 className="font-black">Add a purchase</h3>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="text-[11px] font-bold text-[#a8bdb0]">
                      Tenor years
                      <select
                        value={purchase.tenorYears}
                        onChange={(event) => setPurchase((current) => ({ ...current, tenorYears: Number(event.target.value) }))}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none focus:border-[#8ce6aa]/60"
                      >
                        {TREASURY_BOND_TENORS.map((tenor) => (
                          <option key={tenor} value={tenor}>{tenor} years</option>
                        ))}
                      </select>
                    </label>
                    {[
                      ["Purchase date", "purchaseDate", "date"],
                      ["Maturity date", "maturityDate", "date"],
                      ["Bond name", "bondName", "text"],
                      ["ISIN", "isin", "text"],
                      ["Amount invested", "amountInvested", "number"],
                      ["Coupon rate (%)", "couponRate", "number"],
                      ["Coupon frequency", "couponFrequency", "number"],
                    ].map(([label, key, type]) => {
                      const current = purchase[key as keyof BondPurchaseInput];
                      const displayValue = key === "couponRate" ? Number(current) * 100 : current;
                      return (
                        <label key={key} className={`text-[11px] font-bold text-[#a8bdb0] ${key === "bondName" || key === "isin" ? "sm:col-span-2" : ""}`}>
                          {label}
                          <input
                            type={type}
                            required={!["isin"].includes(key)}
                            value={displayValue}
                            min={
                              key === "couponRate"
                                ? MIN_ANNUAL_COUPON_RATE * 100
                                : key === "amountInvested"
                                  ? 100_000
                                  : type === "number"
                                    ? 0
                                    : undefined
                            }
                            max={key === "couponRate" ? MAX_ANNUAL_COUPON_RATE * 100 : undefined}
                            step={
                              key === "couponRate"
                                ? "0.01"
                                : key === "amountInvested"
                                  ? "100000"
                                  : "1"
                            }
                            onChange={(event) => {
                              const value = type === "number" ? Number(event.target.value) : event.target.value;
                              setPurchase((currentPurchase) => ({
                                ...currentPurchase,
                                [key]: key === "couponRate" ? Number(value) / 100 : value,
                              }));
                            }}
                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none focus:border-[#8ce6aa]/60"
                          />
                        </label>
                      );
                    })}
                    <label className="sm:col-span-2 text-[11px] font-bold text-[#a8bdb0]">
                      Notes
                      <textarea value={purchase.notes} maxLength={1000} onChange={(event) => setPurchase((current) => ({ ...current, notes: event.target.value }))} className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-white/10 bg-[#071812] px-3 py-2.5 text-sm text-white outline-none focus:border-[#8ce6aa]/60" />
                    </label>
                  </div>
                  <button disabled={savingPurchase} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8ce6aa] px-4 py-3 text-sm font-black text-[#071812] disabled:opacity-50">
                    <Database size={16} /> {savingPurchase ? "Saving…" : "Save to Neon"}
                  </button>
                </form>

                <div className="bond-scrollbar overflow-x-auto rounded-3xl border border-white/10">
                  {purchases.length === 0 ? (
                    <div className="grid min-h-64 place-items-center p-8 text-center">
                      <div>
                        <WalletCards className="mx-auto text-[#81988a]" />
                        <p className="mt-3 font-bold">No purchases recorded yet</p>
                        <p className="mt-1 text-xs text-[#81988a]">Add your first treasury bond using the form.</p>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead className="bg-[#123127] text-[10px] uppercase tracking-[0.14em] text-[#a8bdb0]">
                        <tr>
                          <th className="px-4 py-3">Bond</th>
                          <th className="px-4 py-3">Invested</th>
                          <th className="px-4 py-3">Net rate</th>
                          <th className="px-4 py-3">Semiannual coupon</th>
                          <th className="px-4 py-3">Maturity</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((item) => {
                          const netRate = item.couponRate * (1 - WITHHOLDING_TAX_RATE);
                          return (
                            <tr key={item.id} className="border-t border-white/[0.07] text-xs">
                              <td className="px-4 py-4">
                                <strong className="block text-sm">{item.bondName}</strong>
                                <span className="text-[#81988a]">{item.isin || item.purchaseDate}</span>
                              </td>
                              <td className="px-4 py-4 font-bold">{formatRwf(item.amountInvested)}</td>
                              <td className="px-4 py-4 text-[#8ce6aa]">{formatPercent(netRate)}</td>
                              <td className="px-4 py-4">{formatRwf(item.amountInvested * netRate / item.couponFrequency)}</td>
                              <td className="px-4 py-4 text-[#a8bdb0]">{item.maturityDate}</td>
                              <td className="px-4 py-4">
                                <button onClick={() => removePurchase(item.id)} aria-label={`Delete ${item.bondName}`} className="rounded-lg p-2 text-[#81988a] hover:bg-red-300/10 hover:text-red-200">
                                  <Trash2 size={15} />
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

      <section id="guide" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8ce6aa]">Model guide</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Useful, transparent, intentionally conservative.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#a8bdb0]">
              This planner follows the spreadsheet logic: contributions enter monthly,
              coupons are based on the opening portfolio in payment months, tax is
              deducted before reinvestment, and passive income is estimated from the
              closing portfolio.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Market price risk", "Bond prices can fluctuate if sold before maturity."],
              ["Holding to maturity", "Holding to maturity avoids market-price loss if the issuer pays as agreed."],
              ["Coupon and tenor", `BK Capital states tenors of ${TREASURY_BOND_TENORS.join(", ")} years and annual coupon rates from ${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)} to ${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}, depending on the issuance.`],
              ["Secondary market", `Buying or selling before maturity carries a ${formatPercent(SECONDARY_MARKET_COMMISSION_RATE, 3)} commission on turnover on each side, according to BK Capital.`],
              ["Projection only", "This model is educational and does not guarantee future returns."],
              ["Privacy boundary", "Simulation inputs remain on your device; only authenticated purchases are stored in Neon."],
            ].map(([title, copy], index) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[10px] font-mono text-[#8ce6aa]">0{index + 1}</span>
                <h3 className="mt-3 font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#a8bdb0]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-8 text-xs text-[#81988a] md:flex-row md:px-8">
          <span>Rwanda Treasury Bond Planner · RWF projections</span>
          <span>Built by <Link href="https://orestegabo.dev" className="font-bold text-[#a8bdb0] hover:text-[#8ce6aa]">Oreste Gabo</Link> · Not financial advice</span>
        </div>
      </footer>

      <nav className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-2xl border border-white/10 bg-[#071812]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden">
        {[
          ["simulator", Sparkles],
          ["projection", TrendingUp],
          ["portfolio", WalletCards],
          ["guide", CalendarDays],
        ].map(([section, Icon]) => (
          <button key={String(section)} onClick={() => goTo(section as Section)} aria-label={String(section)} className={`rounded-xl p-3 ${activeSection === section ? "bg-[#8ce6aa] text-[#071812]" : "text-[#81988a]"}`}>
            <Icon size={18} />
          </button>
        ))}
      </nav>
    </main>
  );
}

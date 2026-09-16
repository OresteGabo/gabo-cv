import {
  ArrowRight,
  BadgePercent,
  Banknote,
  BookOpenText,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Landmark,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import {
  MAX_ANNUAL_COUPON_RATE,
  MIN_ANNUAL_COUPON_RATE,
  SECONDARY_MARKET_COMMISSION_RATE,
  TREASURY_BOND_TENORS,
  WITHHOLDING_TAX_RATE,
  formatPercent,
  formatRwf,
} from "@/lib/bonds/calculations";
import { getRseMarketData } from "@/lib/bonds/rse";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";
import { RseMarketErrorTable } from "./RseMarketErrorTable";
import { RseRankedBondTable } from "./RseRankedBondTable";

const steps = [
  {
    icon: Landmark,
    title: "Choose an issuance",
    copy: "Review the BNR prospectus, tenor, coupon rate, auction dates, maturity date, and exact coupon schedule.",
  },
  {
    icon: Banknote,
    title: "Purchase the bond",
    copy: `Treasury bond face value starts at ${formatRwf(100_000)} and purchases are made in multiples of ${formatRwf(100_000)}.`,
  },
  {
    icon: CalendarClock,
    title: "Receive coupons",
    copy: "Interest is normally paid semiannually. Payment dates belong to each issuance, so they are not universally January and July.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Hold, reinvest, or sell",
    copy: "Hold to maturity for principal repayment, reinvest coupon cash, or sell earlier on the secondary market at the available market price.",
  },
];

const facts = [
  {
    label: "Published coupon range",
    value: `${formatPercent(MIN_ANNUAL_COUPON_RATE, 2)}–${formatPercent(MAX_ANNUAL_COUPON_RATE, 2)}`,
    detail: "The actual rate depends on the specific issuance and tenor.",
  },
  {
    label: "Treasury withholding tax",
    value: formatPercent(WITHHOLDING_TAX_RATE, 0),
    detail: "Applied to coupon interest in the current model.",
  },
  {
    label: "Available tenors",
    value: TREASURY_BOND_TENORS.map((tenor) => `${tenor}Y`).join(" · "),
    detail: "Use the tenor printed in the prospectus for a real purchase.",
  },
  {
    label: "Secondary-market commission",
    value: formatPercent(SECONDARY_MARKET_COMMISSION_RATE, 3),
    detail: "Of turnover on each buy or sell side, based on the BK Capital information supplied.",
  },
];

const labPaths = [
  {
    href: "/education",
    icon: BookOpenText,
    label: "Education",
    title: "Learn the bond mechanics",
    copy: "Face value, clean price, coupon tax, YTM, and reinvestment explained from first principles.",
  },
  {
    href: "/calendar",
    icon: CalendarClock,
    label: "Calendar",
    title: "Follow BNR issuance dates",
    copy: "Track reopening windows, auction days, settlement timing, and maturity dates in one place.",
  },
  {
    href: "/documents",
    icon: FileText,
    label: "Documents",
    title: "Keep source files close",
    copy: "Prospectuses, investor results, application records, and supporting PDFs for private review.",
  },
  {
    href: "/portfolio",
    icon: LockKeyhole,
    label: "Private",
    title: "Record owned positions",
    copy: "Owner-only purchase history, coupon schedules, fees, and source evidence for real holdings.",
  },
];

export async function BondLanding({
  forceMarketRefresh = false,
}: {
  forceMarketRefresh?: boolean;
}) {
  const marketData = await getRseMarketData(forceMarketRefresh);
  const marketUpdated = marketData.fetchedAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Kigali",
      }).format(new Date(marketData.fetchedAt))
    : null;
  const rankedPreview = [...marketData.outstanding]
    .sort(
      (left, right) =>
        right.strategyScore - left.strategyScore ||
        right.netAnnualizedYield - left.netAnnualizedYield ||
        right.yearsRemaining - left.yearsRemaining,
    )
    .slice(0, 3);
  const topOpportunity = rankedPreview[0] ?? null;
  const marketHighlights = [
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
    ...facts.slice(0, 2),
  ];

  return (
    <main className="bond-app relative min-h-screen overflow-x-hidden bg-background font-sans text-on-background">
      <ImigongoBackground />
      <header className="sticky top-0 z-50 border-b border-outline/5 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <span className="hidden sm:block"><GaboBrand /></span>
            <span className="sm:hidden"><GaboBrand compact /></span>
            <span className="hidden h-5 w-px bg-outline/20 sm:block" />
            <span className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant sm:block">
              Treasury Bond Lab
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/calendar" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container md:block">
              Calendar
            </Link>
            <Link href="/education" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container md:block">
              Education
            </Link>
            <Link href="/simulator" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container sm:block">
              Simulator
            </Link>
            <Link href="/portfolio" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container sm:block">
              Portfolio
            </Link>
            <Link href="/documents" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container sm:block">
              Documents
            </Link>
            <BondThemeToggle />
          </nav>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-12 pt-16 md:px-8 md:pb-16 md:pt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
              Rwanda fixed-income lab
            </p>
            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
              Treasury bonds,
              <span className="block text-primary">without the fog.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-on-surface-variant">
              A focused workspace for understanding Rwanda Treasury Bonds,
              reading live RSE signals, modeling long-term coupon income, and
              keeping private purchase records behind owner-only access.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/simulator" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-black text-on-primary shadow-lg shadow-primary/15 transition hover:-translate-y-0.5">
                Run a simulation <ArrowRight size={17} />
              </Link>
              <Link href="#rse-market" className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline/15 bg-surface-container-lowest/70 px-5 py-3.5 text-sm font-black text-on-surface transition hover:border-primary/40 hover:text-primary">
                View market ranking <ChartNoAxesCombined size={17} />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-on-surface-variant">
              <Link href="/portfolio" className="inline-flex items-center gap-2 text-primary transition hover:opacity-75">
                <LockKeyhole size={15} />
                Private portfolio
              </Link>
              <span>
                {marketUpdated
                  ? `RSE snapshot refreshed ${marketUpdated}`
                  : "RSE source status shown below"}
              </span>
            </div>
          </div>

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
                      Live market board
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
                {marketHighlights.map((fact) => (
                  <div key={fact.label} className="rounded-xl border border-outline/10 bg-background/65 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                      {fact.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-primary">{fact.value}</p>
                    <p className="mt-2 text-xs leading-5 text-on-surface-variant">{fact.detail}</p>
                  </div>
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
          </aside>
        </div>
      </section>

      <section className="border-y border-outline/10 bg-surface-container-low/60">
        <div className="mx-auto grid max-w-7xl gap-3 px-6 py-5 md:grid-cols-2 md:px-8 xl:grid-cols-4">
          {labPaths.map(({ href, icon: Icon, label, title, copy }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-outline/10 bg-background/65 p-5 transition hover:border-primary/35 hover:bg-surface-container-lowest"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                  <Icon size={15} />
                  {label}
                </span>
                <ArrowRight size={15} className="text-outline transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">{copy}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="rse-market" className="scroll-mt-20 border-y border-outline/10 bg-surface-container-low/70">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Rwanda Stock Exchange
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Current fixed-income market data
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Read directly from the official RSE market pages on every page load.
                Always open the source before making an investment decision.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
            <a
              href="https://www.bnr.rw/mminstruments"
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-primary/20 bg-background/75 p-5 transition hover:border-primary/45"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-outline/10 bg-white p-1.5">
                  <Image
                    src="/brands/bnr-logo.png"
                    alt="National Bank of Rwanda logo"
                    width={42}
                    height={42}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                    Primary source
                    <ExternalLink size={13} className="transition group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="mt-2 font-black">BNR market instruments</h3>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                    Prospectus PDFs, application forms, investor results, and
                    official auction publications.
                  </p>
                </div>
              </div>
            </a>

            {[
              ["Bond market", "https://rse.rw/bond-market", "Trades, prices, volume, and value."],
              ["Fixed income board", "https://rse.rw/fixed-income-board", "Security codes, maturity, coupons, and YTM."],
              ["Outstanding bonds", "https://rse.rw/outstanding-bonds", "Listed debt instruments and market statistics."],
            ].map(([title, href, copy]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-outline/10 bg-background/75 p-5 transition hover:border-primary/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                    RSE source
                  </span>
                  <ExternalLink size={14} className="text-outline transition group-hover:text-primary" />
                </div>
                <h3 className="mt-4 font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">{copy}</p>
              </a>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            <article className="overflow-hidden rounded-3xl border border-outline/10 bg-background/75">
              {marketData.outstanding.length > 0 ? (
                <RseRankedBondTable
                  bonds={marketData.outstanding}
                  pagesFetched={marketData.fixedIncomePagesFetched}
                  rowsAnalyzed={marketData.treasuryRowsAnalyzed}
                  marketUpdated={marketUpdated}
                />
              ) : (
                <RseMarketErrorTable
                  columns={["Bond", "Code", "Maturity", "Coupon", "YTM"]}
                  sourceName="RSE Fixed Income Board"
                  sourceUrl="https://rse.rw/fixed-income-board"
                />
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-outline/10 bg-surface-container-low/70">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">How it works</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
            One purchase, its own terms and payment calendar.
          </h2>
          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(({ icon: Icon, title, copy }, index) => (
              <article key={title} className="rounded-3xl border border-outline/10 bg-background/75 p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={20} /></span>
                  <span className="font-mono text-xs text-outline">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-primary/20 bg-primary/5 p-7 md:p-9">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-on-primary"><CircleDollarSign size={22} /></span>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Planning workspace</p>
            <h2 className="mt-3 text-3xl font-black">Test a future strategy</h2>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              Change monthly contributions, start date, tenor, coupon rate,
              reinvestment, starting capital, and occasional cash injections. See
              annual and monthly outcomes without creating real transactions.
            </p>
            <Link href="/simulator" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-primary">
              Go to simulator <ArrowRight size={16} />
            </Link>
          </article>

          <article className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest/75 p-7 md:p-9">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-container text-on-surface"><WalletCards size={22} /></span>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Private records</p>
            <h2 className="mt-3 text-3xl font-black">Track bonds you actually bought</h2>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              Store face value, executed price, fees, accrued interest, issuer,
              maturity, exact coupon dates, and source documents. Every position keeps
              its own schedule and detail page.
            </p>
            <Link href="/portfolio" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-primary">
              Open private portfolio <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>

      <section className="border-y border-outline/10 bg-surface-container-low/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Terms worth knowing</p>
            <h2 className="mt-3 text-3xl font-black">The numbers are related, but not interchangeable.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [BadgePercent, "Coupon rate", "The annual interest rate applied to face value, not necessarily the cash price paid."],
              [ReceiptText, "Coupons received", "The cumulative coupon payments whose scheduled dates have already occurred."],
              [CircleDollarSign, "Annual passive income", "A forward-looking estimate of one year of coupon income from current principal."],
              [CalendarClock, "Bond tenor", "The life of one bond issuance. Your investment horizon can include many bonds with different tenors."],
            ].map(([Icon, title, copy]) => {
              const TermIcon = Icon as typeof ShieldCheck;
              return (
                <article key={String(title)} className="rounded-2xl border border-outline/10 bg-background/70 p-5">
                  <TermIcon size={18} className="text-primary" />
                  <h3 className="mt-4 font-black">{String(title)}</h3>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-8">
        <div className="flex gap-4 rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-6">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={22} />
          <div>
            <h2 className="font-black">Important context</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">
              Bond prices can move if you sell before maturity. Holding to maturity
              avoids market-price loss only if the issuer pays as agreed. Simulations
              are educational projections, not guaranteed returns. Always use the
              prospectus and broker confirmation for a real transaction.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline/10 bg-surface-container-lowest/30">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 md:flex-row md:items-center md:px-8">
          <GaboBrand />
          <div className="flex flex-wrap gap-2 text-xs font-black text-on-surface-variant md:justify-end">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-outline/10 px-3 py-2 text-primary transition hover:border-primary/30">
              <Landmark size={14} />
              Bonds
            </Link>
            <Link href="/simulator" className="inline-flex items-center gap-1.5 rounded-xl border border-outline/10 px-3 py-2 transition hover:border-primary/30 hover:text-primary">
              <CircleDollarSign size={14} />
              Simulator
            </Link>
            <Link href="/education" className="inline-flex items-center gap-1.5 rounded-xl border border-outline/10 px-3 py-2 transition hover:border-primary/30 hover:text-primary">
              <BookOpenText size={14} />
              Courses
            </Link>
          </div>
          <p className="text-xs text-on-surface-variant md:text-right">Rwanda Treasury Bond Lab · Educational information, simulation, and private tracking</p>
        </div>
      </footer>
    </main>
  );
}

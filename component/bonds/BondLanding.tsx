import {
  ArrowRight,
  BadgePercent,
  Banknote,
  BookOpenText,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  ExternalLink,
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
import { RseRefreshButton } from "./RseRefreshButton";

const steps = [
  {
    icon: Landmark,
    title: "Choose an issuance",
    copy: "Review the NBR prospectus, tenor, coupon rate, auction dates, maturity date, and exact coupon schedule.",
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
            <Link href="/bonds/education" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container md:block">
              Education
            </Link>
            <Link href="/bonds/simulator" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container sm:block">
              Simulator
            </Link>
            <Link href="/bonds/portfolio" className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container sm:block">
              Portfolio
            </Link>
            <BondThemeToggle />
          </nav>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:px-8 md:pb-28 md:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
              Understand · Plan · Track
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
              Rwanda Treasury
              <span className="block text-primary">Bonds, clearly.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-on-surface-variant">
              Learn how coupon income, maturity, taxes, purchase price, and
              reinvestment work. Then model a long-term strategy or privately track
              every bond you actually own.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/bonds/simulator" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-black text-on-primary shadow-lg shadow-primary/15 transition hover:-translate-y-0.5">
                Run a simulation <ArrowRight size={17} />
              </Link>
              <Link href="/bonds/portfolio" className="inline-flex items-center gap-2 rounded-2xl border border-outline/15 bg-surface-container-lowest/70 px-5 py-3.5 text-sm font-black text-on-surface transition hover:border-primary/40 hover:text-primary">
                Open my portfolio <LockKeyhole size={16} />
              </Link>
              <Link href="/bonds/education" className="inline-flex items-center gap-2 rounded-2xl px-3 py-3.5 text-sm font-black text-primary transition hover:bg-primary/10">
                Learn bond mechanics <BookOpenText size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <article key={fact.label} className="rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  {fact.label}
                </p>
                <p className="mt-3 text-2xl font-black text-primary">{fact.value}</p>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">{fact.detail}</p>
              </article>
            ))}
          </div>
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
                Read directly from the official RSE market pages and cached for 15
                minutes. Always open the source before making an investment decision.
              </p>
            </div>
          </div>

          <article className="mt-7 rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-6">
            <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-primary)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--md-sys-color-primary)]" />
                  Primary Source of Truth
                </span>
                <div className="mt-5 flex items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-outline/10 bg-white p-1.5 shadow-sm">
                    <Image
                      src="/brands/bnr-logo.png"
                      alt="National Bank of Rwanda logo"
                      width={44}
                      height={44}
                      className="h-full w-full object-contain"
                    />
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                      Live BNR Market Feed
                    </p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight text-on-surface">
                      Official BNR Market Monitor
                    </h3>
                  </div>
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-on-surface-variant">
                  Track newly issued bonds, active re-openings, official
                  application forms, and real-time market auction results
                  directly from the central bank the exact minute they drop.
                </p>
                <p className="mt-3 text-xs font-bold text-on-surface">
                  Prospectus PDFs · Application Forms · Auction Results
                </p>
              </div>
              <a
                href="https://www.bnr.rw/mminstruments"
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-3 text-center font-bold text-[var(--md-sys-color-on-primary)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 lg:min-w-72"
              >
                Go to Live BNR Instruments Board ↗
              </a>
            </div>
          </article>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Bond market",
                href: "https://rse.rw/bond-market",
                copy: "Latest traded closing prices, previous prices, changes, volume, and value.",
                status: "Live source",
              },
              {
                title: "Fixed income board",
                href: "https://rse.rw/fixed-income-board",
                copy: "Security codes, issue and maturity dates, coupon rates, and yield to maturity.",
                status: "Live source",
              },
              {
                title: "Outstanding bonds",
                href: "https://rse.rw/outstanding-bonds",
                copy: "RSE market-statistics view of outstanding Treasury and other listed debt instruments.",
                status: "Live source",
              },
            ].map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-outline/10 bg-background/75 p-5 transition hover:border-primary/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                    {source.status}
                  </span>
                  <ExternalLink size={14} className="text-outline transition group-hover:text-primary" />
                </div>
                <h3 className="mt-4 font-black">{source.title}</h3>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                  {source.copy}
                </p>
              </a>
            ))}
          </div>

          <div className="mt-6 space-y-6">


            <article className="overflow-hidden rounded-3xl border border-outline/10 bg-background/75">
              <div className="flex flex-col gap-4 border-b border-outline/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    Treasury listings
                  </p>
                  <h3 className="mt-1 font-black">Fixed income board</h3>
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
              {marketData.outstanding.length > 0 ? (
                <RseRankedBondTable
                  bonds={marketData.outstanding}
                  pagesFetched={marketData.fixedIncomePagesFetched}
                  rowsAnalyzed={marketData.treasuryRowsAnalyzed}
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
            <Link href="/bonds/simulator" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-primary">
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
            <Link href="/bonds/portfolio" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-primary">
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
          <p className="text-xs text-on-surface-variant">Rwanda Treasury Bond Lab · Educational information, simulation, and private tracking</p>
        </div>
      </footer>
    </main>
  );
}

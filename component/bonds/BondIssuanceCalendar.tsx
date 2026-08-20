"use client";

import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  FileText,
  Landmark,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { formatPercent, formatRwf } from "@/lib/bonds/calculations";
import {
  BNR_ISSUANCE_CALENDAR_SOURCE,
  BNR_TREASURY_BOND_ISSUANCE_CALENDAR,
  formatCalendarDate,
  getIssuanceAlert,
  getIssuanceStatus,
  getNextIssuanceEvent,
} from "@/lib/bonds/issuance-calendar";
import type { BondIssuanceEvent } from "@/lib/bonds/issuance-calendar";
import type { BondPurchase } from "@/lib/bonds/types";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";

function NavLink({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      }`}
    >
      {children}
    </Link>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  const className =
    tone === "open"
      ? "bg-primary text-on-primary"
      : tone === "settling"
        ? "bg-tertiary/15 text-tertiary"
        : tone === "completed"
          ? "bg-surface-container text-on-surface-variant"
          : "bg-primary/10 text-primary";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${className}`}>
      {label}
    </span>
  );
}

function DateBlock({ label, date }: { label: string; date: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-on-surface">
        {formatCalendarDate(date)}
      </p>
    </div>
  );
}

function AlertCard({
  title,
  message,
  level,
}: {
  title: string;
  message: string;
  level: string;
}) {
  const className =
    level === "urgent"
      ? "border-error/25 bg-error-container/35 text-on-error-container"
      : level === "warning"
        ? "border-tertiary/30 bg-tertiary/10 text-on-surface"
        : "border-primary/20 bg-primary/10 text-on-surface";

  return (
    <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${className}`}>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 opacity-85">{message}</p>
    </div>
  );
}

function purchaseMatchesEvent(
  purchase: BondPurchase,
  event: BondIssuanceEvent,
) {
  const purchaseInAuctionWindow =
    purchase.purchaseDate >= event.openBookDate &&
    purchase.purchaseDate <= event.settlementDate;

  return (
    purchase.settlementDate === event.settlementDate ||
    purchase.maturityDate === event.maturityDate ||
    (purchase.tenorYears === event.tenorYears && purchaseInAuctionWindow)
  );
}

function portfolioPrefillHref(event: BondIssuanceEvent) {
  const params = new URLSearchParams({
    prefill: "calendar",
    eventId: event.id,
    bondName: event.title,
    tenorYears: String(event.tenorYears),
    purchaseDate: event.openBookDate,
    settlementDate: event.settlementDate,
    maturityDate: event.maturityDate,
    sourceDescription: event.sourceDescription,
  });
  return `/?${params.toString()}#portfolio-transaction-form`;
}

export function BondIssuanceCalendar() {
  const today = new Date();
  const [portfolioState, setPortfolioState] = useState<{
    loading: boolean;
    authenticated: boolean;
    purchases: BondPurchase[];
    error: string;
  }>({
    loading: true,
    authenticated: false,
    purchases: [],
    error: "",
  });
  const nextEvent = getNextIssuanceEvent(
    BNR_TREASURY_BOND_ISSUANCE_CALENDAR,
    today,
  );
  const nextAlert = nextEvent ? getIssuanceAlert(nextEvent, today) : null;
  const longTermCount = BNR_TREASURY_BOND_ISSUANCE_CALENDAR.filter(
    (event) => event.tenorYears >= 10,
  ).length;
  const reopenCount = BNR_TREASURY_BOND_ISSUANCE_CALENDAR.filter(
    (event) => event.kind === "reopen",
  ).length;
  const purchasesByEvent = useMemo(
    () =>
      new Map(
        BNR_TREASURY_BOND_ISSUANCE_CALENDAR.map((event) => [
          event.id,
          portfolioState.purchases.filter((purchase) =>
            purchaseMatchesEvent(purchase, event),
          ),
        ]),
      ),
    [portfolioState.purchases],
  );
  const submittedPrincipal = portfolioState.purchases.reduce(
    (total, purchase) => total + purchase.faceValue,
    0,
  );

  const loadPortfolioState = useCallback(async (signal?: AbortSignal) => {
    try {
      const sessionResponse = await fetch("/api/bonds/auth/session", {
        cache: "no-store",
        signal,
      });
      const session = await sessionResponse.json();
      if (!session.authenticated) {
        setPortfolioState({
          loading: false,
          authenticated: false,
          purchases: [],
          error: "",
        });
        return;
      }

      const response = await fetch("/api/bonds/purchases", {
        cache: "no-store",
        signal,
      });
      const data = await response.json();
      setPortfolioState({
        loading: false,
        authenticated: true,
        purchases: response.ok ? data.purchases : [],
        error: response.ok ? "" : data.error ?? "Could not load purchases.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPortfolioState({
        loading: false,
        authenticated: false,
        purchases: [],
        error: "Could not check calendar access.",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      void loadPortfolioState(controller.signal);
    });

    return () => {
      controller.abort();
    };
  }, [loadPortfolioState]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPortfolioState((current) => ({
      ...current,
      loading: true,
      error: "",
    }));

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
      setPortfolioState({
        loading: false,
        authenticated: false,
        purchases: [],
        error: data.error ?? "Sign-in failed.",
      });
      return;
    }

    formElement.reset();
    await loadPortfolioState();
  }

  async function logout() {
    await fetch("/api/bonds/auth/logout", { method: "POST" });
    setPortfolioState({
      loading: false,
      authenticated: false,
      purchases: [],
      error: "",
    });
  }

  return (
    <main className="bond-app relative min-h-screen overflow-x-clip bg-background font-sans text-on-background">
      <ImigongoBackground />
      <header className="sticky top-0 z-50 border-b border-outline/5 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <span className="hidden sm:block">
              <GaboBrand />
            </span>
            <span className="sm:hidden">
              <GaboBrand compact />
            </span>
            <span className="hidden h-5 w-px bg-outline/20 sm:block" />
            <span className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant sm:block">
              Treasury Bond Lab
            </span>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="/portfolio">Portfolio</NavLink>
            <NavLink href="/calendar" active>
              Calendar
            </NavLink>
            <NavLink href="/documents">Documents</NavLink>
          </nav>
          <BondThemeToggle />
        </div>
      </header>

      {portfolioState.loading ? (
        <section className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-28">
          <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest/80 p-6 text-sm text-on-surface-variant md:p-8">
            Checking private calendar access...
          </div>
        </section>
      ) : !portfolioState.authenticated ? (
        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <LockKeyhole size={18} />
              <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                Private calendar
              </p>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
              Sign in to view your bond calendar.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-on-surface-variant md:text-base">
              This calendar includes your recorded applications, purchase links,
              and portfolio amounts, so it uses the same owner password as the
              private portfolio.
            </p>
            {portfolioState.error && (
              <div className="mt-6 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
                {portfolioState.error}
              </div>
            )}
          </div>

          <form
            onSubmit={login}
            className="rounded-3xl border border-outline/10 bg-surface-container-lowest/80 p-5 shadow-sm md:p-7"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck size={21} />
              </span>
              <div>
                <h2 className="font-black">Protected access</h2>
                <p className="text-xs text-on-surface-variant">
                  Unlock private calendar records.
                </p>
              </div>
            </div>
            <label className="block text-xs font-bold text-on-surface-variant">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                defaultValue="orestegabo@icloud.com"
                className="mt-2 w-full rounded-xl border border-outline/10 bg-background px-4 py-3 text-on-surface outline-none focus:border-primary/60"
              />
            </label>
            <label className="mt-4 block text-xs font-bold text-on-surface-variant">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-outline/10 bg-background px-4 py-3 text-on-surface outline-none focus:border-primary/60"
              />
            </label>
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:opacity-90">
              Open private calendar <ArrowRight size={16} />
            </button>
          </form>
        </section>
      ) : (
        <>
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16 md:px-8 md:pb-14 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <CalendarClock size={18} />
              <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                BNR primary market calendar
              </p>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
              Treasury bond issuance calendar.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-on-surface-variant md:text-base">
              Official FY 2026/2027 auction dates extracted from the BNR PDF:
              announcement, book opening, book closing, settlement, tenor, and
              maturity. Use this to plan when cash should leave Aguka and move
              into a bond bid.
            </p>
            <button
              onClick={logout}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-outline/10 px-3 py-2 text-xs font-black text-on-surface-variant transition hover:text-on-surface"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
          {nextEvent && (
            <article className="rounded-3xl border border-primary/20 bg-primary/10 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    Next actionable auction
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {nextEvent.title}
                  </h2>
                </div>
                <span className="rounded-2xl bg-primary px-3 py-2 text-sm font-black text-on-primary">
                  {nextEvent.tenorYears}Y
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <DateBlock label="Open book" date={nextEvent.openBookDate} />
                <DateBlock label="Closing book" date={nextEvent.closingBookDate} />
                <DateBlock label="Settlement" date={nextEvent.settlementDate} />
                <DateBlock label="Maturity" date={nextEvent.maturityDate} />
              </div>
              {nextAlert && (
                <AlertCard
                  title={nextAlert.title}
                  message={nextAlert.message}
                  level={nextAlert.level}
                />
              )}
              <Link
                href="/simulator"
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary"
              >
                Use in simulator <ArrowRight size={16} />
              </Link>
            </article>
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
              Total auctions
            </p>
            <p className="mt-2 text-3xl font-black text-primary">
              {BNR_TREASURY_BOND_ISSUANCE_CALENDAR.length}
            </p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
              Long-term 10Y+
            </p>
            <p className="mt-2 text-3xl font-black text-primary">
              {longTermCount}
            </p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
              Reopenings
            </p>
            <p className="mt-2 text-3xl font-black text-primary">
              {reopenCount}
            </p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
              Your recorded principal
            </p>
            <p className="mt-2 text-3xl font-black text-primary">
              {formatRwf(submittedPrincipal, true)}
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-outline/10 bg-surface-container-low/70">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          <div className="bond-scrollbar overflow-x-auto rounded-3xl border border-outline/10 bg-surface-container-lowest/75">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">
                <tr>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Issuance</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Announcement</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Open book</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Closing book</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Settlement</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Maturity</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Your purchase</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {BNR_TREASURY_BOND_ISSUANCE_CALENDAR.map((event, index) => {
                  const status = getIssuanceStatus(event, today);
                  const matchingPurchases = purchasesByEvent.get(event.id) ?? [];
                  return (
                    <tr
                      key={event.id}
                      className={`border-t border-outline/10 text-sm ${
                        matchingPurchases.length > 0
                          ? "bg-primary/5"
                          : index % 2 === 0
                          ? "bg-surface-container-lowest"
                          : "bg-surface-container-low/60"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                            <Landmark size={18} />
                          </span>
                          <div>
                            <p className="font-black text-on-surface">
                              {event.title}
                            </p>
                            <p className="mt-1 text-[10px] text-on-surface-variant">
                              {event.kind === "new" ? "New issue" : "Reopening"} ·{" "}
                              {event.tenorYears}Y · {event.sourceDescription}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{formatCalendarDate(event.announcementDate)}</td>
                      <td className="px-5 py-4 font-bold text-primary">{formatCalendarDate(event.openBookDate)}</td>
                      <td className="px-5 py-4 font-bold">{formatCalendarDate(event.closingBookDate)}</td>
                      <td className="px-5 py-4">{formatCalendarDate(event.settlementDate)}</td>
                      <td className="px-5 py-4">{formatCalendarDate(event.maturityDate)}</td>
                      <td className="px-5 py-4">
                        {portfolioState.error ? (
                          <span className="text-xs text-error">
                            {portfolioState.error}
                          </span>
                        ) : matchingPurchases.length === 0 ? (
                          <Link
                            href={portfolioPrefillHref(event)}
                            className="text-xs font-bold text-on-surface-variant transition hover:text-primary"
                          >
                            No recorded purchase
                          </Link>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
                            {matchingPurchases.slice(0, 2).map((purchase) => {
                              const couponPending =
                                purchase.status === "submitted" ||
                                purchase.couponRate === 0;
                              const netRate =
                                purchase.couponRate *
                                (1 - purchase.withholdingTaxRate);
                              return (
                                <Link
                                  key={purchase.id}
                                  href={`/purchases/${purchase.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-black text-primary"
                                >
                                  <span>{formatRwf(purchase.faceValue, true)}</span>
                                  <span className="text-on-surface-variant">
                                    {couponPending
                                      ? "submitted"
                                      : formatPercent(netRate)}
                                  </span>
                                </Link>
                              );
                            })}
                            {matchingPurchases.length > 2 && (
                              <span className="text-[10px] font-black text-on-surface-variant">
                                +{matchingPurchases.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={status.label} tone={status.tone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5 text-sm leading-6 text-on-surface-variant">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-primary" size={18} />
              <div>
                <p className="font-black text-on-surface">
                  Source: {BNR_ISSUANCE_CALENDAR_SOURCE.label}
                </p>
                <p className="mt-1 text-xs">
                  {BNR_ISSUANCE_CALENDAR_SOURCE.fileName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
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

      <nav className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-2xl border border-outline/10 bg-[var(--md-sys-color-background)]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden">
        <Link href="/portfolio" aria-label="Portfolio" className="grid place-items-center rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <WalletCards size={18} />
        </Link>
        <Link href="/calendar" aria-label="Calendar" className="grid place-items-center rounded-xl bg-primary p-3 text-on-primary">
          <CalendarClock size={18} />
        </Link>
        <Link href="/documents" aria-label="Documents" className="grid place-items-center rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <FileText size={18} />
        </Link>
      </nav>
    </main>
  );
}

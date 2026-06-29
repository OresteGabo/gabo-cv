import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  Landmark,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import {
  BNR_ISSUANCE_CALENDAR_SOURCE,
  BNR_TREASURY_BOND_ISSUANCE_CALENDAR,
  formatCalendarDate,
  getIssuanceAlert,
  getIssuanceStatus,
  getNextIssuanceEvent,
} from "@/lib/bonds/issuance-calendar";
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

export function BondIssuanceCalendar() {
  const today = new Date();
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
            <NavLink href="/bonds">Market</NavLink>
            <NavLink href="/bonds/calendar" active>
              Calendar
            </NavLink>
            <NavLink href="/bonds/education">Education</NavLink>
            <NavLink href="/bonds/simulator">Simulator</NavLink>
            <NavLink href="/bonds/portfolio">Portfolio</NavLink>
          </nav>
          <BondThemeToggle />
        </div>
      </header>

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
                href="/bonds/simulator"
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary"
              >
                Use in simulator <ArrowRight size={16} />
              </Link>
            </article>
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
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
        </div>
      </section>

      <section className="border-y border-outline/10 bg-surface-container-low/70">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          <div className="bond-scrollbar overflow-x-auto rounded-3xl border border-outline/10 bg-surface-container-lowest/75">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">
                <tr>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Issuance</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Announcement</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Open book</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Closing book</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Settlement</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Maturity</th>
                  <th className="sticky top-0 bg-surface-container px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {BNR_TREASURY_BOND_ISSUANCE_CALENDAR.map((event, index) => {
                  const status = getIssuanceStatus(event, today);
                  return (
                    <tr
                      key={event.id}
                      className={`border-t border-outline/10 text-sm ${
                        index % 2 === 0
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
                <p className="font-black text-on-surface">Source and model use</p>
                <p className="mt-1">
                  Source: {BNR_ISSUANCE_CALENDAR_SOURCE.label}. The data is
                  stored locally in the app from{" "}
                  <span className="font-bold">{BNR_ISSUANCE_CALENDAR_SOURCE.fileName}</span>.
                  Use BNR or your broker confirmation for final auction details,
                  coupon rates, and prospectus terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-outline/10 bg-background/92 px-2 py-2 backdrop-blur-xl lg:hidden">
        <Link href="/bonds" aria-label="Market" className="grid place-items-center rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <ShieldCheck size={18} />
        </Link>
        <Link href="/bonds/calendar" aria-label="Calendar" className="grid place-items-center rounded-xl bg-primary p-3 text-on-primary">
          <CalendarClock size={18} />
        </Link>
        <Link href="/bonds/education" aria-label="Education" className="grid place-items-center rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <BookOpenText size={18} />
        </Link>
        <Link href="/bonds/simulator" aria-label="Simulator" className="grid place-items-center rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <Sparkles size={18} />
        </Link>
        <Link href="/bonds/portfolio" aria-label="Portfolio" className="grid place-items-center rounded-xl p-3 text-[var(--md-sys-color-outline)]">
          <WalletCards size={18} />
        </Link>
      </nav>
    </main>
  );
}

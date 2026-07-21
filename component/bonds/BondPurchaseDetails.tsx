"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  LockKeyhole,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatPercent,
  formatRwf,
} from "@/lib/bonds/calculations";
import { calculateBondTracking } from "@/lib/bonds/tracking";
import type { BondPurchase } from "@/lib/bonds/types";
import { documentsForPurchase } from "@/lib/bonds/document-metadata";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";

function localToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function displayDate(value: string | null) {
  if (!value) return "None";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function DetailMetric({
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
      className={`rounded-3xl border p-5 ${
        accent
          ? "border-[var(--md-sys-color-primary)]/25 bg-[var(--md-sys-color-primary)]/[0.06]"
          : "border-outline/10 bg-surface-container-lowest"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-on-surface">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs leading-5 text-on-surface-variant">{detail}</p>}
    </article>
  );
}

export function BondPurchaseDetails({
  purchaseId,
  initialPurchase = null,
  modeled = false,
}: {
  purchaseId?: string;
  initialPurchase?: BondPurchase | null;
  modeled?: boolean;
}) {
  const [purchase, setPurchase] = useState<BondPurchase | null>(initialPurchase);
  const [valuationDate, setValuationDate] = useState(localToday);
  const [loading, setLoading] = useState(!initialPurchase);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialPurchase || !purchaseId) return;
    let active = true;
    fetch(`/api/bonds/purchases/${purchaseId}`, { cache: "no-store" })
      .then(async (response) => ({
        ok: response.ok,
        status: response.status,
        data: await response.json(),
      }))
      .then(({ ok, status, data }) => {
        if (!active) return;
        if (!ok) {
          setError(
            status === 401
              ? "Sign in through the private portfolio to view this bond."
              : data.error ?? "The bond could not be loaded.",
          );
          return;
        }
        setPurchase(data.purchase);
      })
      .catch(() => {
        if (active) setError("The bond could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialPurchase, purchaseId]);

  const tracking = useMemo(
    () => (purchase ? calculateBondTracking(purchase, valuationDate) : null),
    [purchase, valuationDate],
  );

  if (loading) {
    return (
      <main className="bond-app grid min-h-screen place-items-center bg-background px-4 text-on-background">
        <p className="text-sm font-bold text-on-surface-variant">Loading bond details...</p>
      </main>
    );
  }

  if (!purchase || !tracking) {
    return (
      <main className="bond-app grid min-h-screen place-items-center bg-background px-4 text-on-background">
        <div className="max-w-md rounded-3xl border border-outline/10 bg-surface-container-lowest p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto text-[var(--md-sys-color-primary)]" />
          <h1 className="mt-4 text-xl font-black">Private bond details</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{error}</p>
          <Link
            href={modeled ? "/simulator#projection" : "/"}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary"
          >
            <ArrowLeft size={16} /> Return to planner
          </Link>
        </div>
      </main>
    );
  }

  const netRate =
    purchase.couponRate * (1 - purchase.withholdingTaxRate);
  const documents = modeled ? [] : documentsForPurchase(purchase);

  return (
    <main className="bond-app relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <ImigongoBackground />
      <header className="sticky top-0 z-50 border-b border-outline/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <GaboBrand />
            <Link
              href={modeled ? "/simulator#projection" : "/"}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary"
            >
              <ArrowLeft size={15} /> {modeled ? "Projection" : "Portfolio"}
            </Link>
          </div>
          <BondThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <section className="grid gap-8 lg:grid-cols-[1fr_310px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--md-sys-color-primary)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-primary)]">
                {modeled ? "Modeled bond purchase" : "Individual bond"}
              </span>
              {tracking.matured && (
                <span className="rounded-full bg-[var(--md-sys-color-tertiary)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-tertiary)]">
                  Matured
                </span>
              )}
            </div>
            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.9] tracking-tighter text-on-surface md:text-7xl">
              {purchase.bondName}
            </h1>
            <p className="mt-3 text-sm text-on-surface-variant">
              {purchase.isin || "No ISIN recorded"} · Purchased{" "}
              {displayDate(purchase.purchaseDate)}
            </p>
            {modeled && (
              <p className="mt-3 max-w-2xl rounded-xl bg-primary-container/40 px-4 py-3 text-xs leading-5 text-on-primary-container">
                This page represents a projected purchase from the simulator. It is
                not saved in your private portfolio.
              </p>
            )}
            {!modeled && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${purchase.scheduleConfidence === "confirmed" ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"}`}>
                  {purchase.scheduleConfidence} coupon schedule
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                  {purchase.market} market
                </span>
              </div>
            )}
          </div>

          <label className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm">
            <span className="flex items-center gap-2 text-xs font-black text-on-surface">
              <CalendarDays size={16} className="text-[var(--md-sys-color-primary)]" />
              Calculate benefits as of
            </span>
            <input
              type="date"
              required
              value={valuationDate}
              onChange={(event) =>
                setValuationDate(event.target.value || localToday())
              }
              className="mt-3 w-full rounded-xl border border-outline/10 bg-[var(--md-sys-color-background)] px-3 py-3 text-sm font-bold text-on-surface outline-none focus:border-[var(--md-sys-color-primary)]/60"
            />
            <p className="mt-2 text-[10px] leading-4 text-on-surface-variant">
              Today is selected automatically. Change it to review another date.
            </p>
          </label>
        </section>

        {tracking.beforePurchase && (
          <div className="mt-7 rounded-2xl border border-secondary/20 bg-secondary-container/40 px-4 py-3 text-sm text-on-secondary-container">
            The selected valuation date is before this bond was purchased, so no
            benefit has been earned yet.
          </div>
        )}

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailMetric
            label="Face value"
            value={formatRwf(purchase.faceValue)}
            detail={`${purchase.tenorYears}-year tenor · ${purchase.instrumentType}`}
          />
          <DetailMetric
            label="Net coupons scheduled"
            value={formatRwf(tracking.couponsPaid)}
            detail={`${tracking.paidCouponCount} coupon dates reached`}
          />
          <DetailMetric
            label="Accrued, not yet paid"
            value={formatRwf(tracking.accruedCoupon)}
            detail="Proportional estimate toward the next coupon"
          />
          <DetailMetric
            label="Scheduled benefit to date"
            value={formatRwf(tracking.benefitToDate)}
            detail="Coupons due plus estimated accrued coupon"
            accent
          />
        </section>

        {!modeled && (
          <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailMetric label="Issuer" value={purchase.issuer} />
            <DetailMetric label="Currency" value={purchase.currency} />
            <DetailMetric label="Market" value={purchase.market} />
            <DetailMetric label="Status" value={purchase.status} />
          </section>
        )}

        {!modeled && documents.length > 0 && (
          <section className="mt-6 rounded-3xl border border-outline/10 bg-surface-container-lowest p-5 md:p-7">
            <div className="flex items-center gap-3">
              <ReceiptText size={20} className="text-[var(--md-sys-color-primary)]" />
              <h2 className="text-xl font-black">Documents</h2>
            </div>
            <div className="mt-4 grid gap-2">
              {documents.map((document) => (
                <a
                  key={document.id}
                  href={`/api/bonds/documents/${document.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-outline/10 bg-background/70 p-4 text-sm transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <strong className="block text-on-surface">
                      {document.label}
                    </strong>
                    <span className="mt-1 block text-xs text-on-surface-variant">
                      {document.originalFileName}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-black text-primary">
                    <Download size={15} />
                    Download
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-5 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">
                  Holding progress
                </p>
                <h2 className="mt-2 text-2xl font-black">Purchase to maturity</h2>
              </div>
              <span className="text-sm font-black text-[var(--md-sys-color-primary)]">
                {formatPercent(tracking.holdingProgress, 1)}
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-[var(--md-sys-color-primary)]"
                style={{ width: `${tracking.holdingProgress * 100}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-on-surface-variant">
              <span>{displayDate(purchase.purchaseDate)}</span>
              <span>{displayDate(purchase.maturityDate)}</span>
            </div>

            <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-outline/10 pt-6 text-sm">
              <div>
                <dt className="text-xs text-on-surface-variant">Days held</dt>
                <dd className="mt-1 font-black">{tracking.daysHeld.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Next coupon</dt>
                <dd className="mt-1 font-black">
                  {displayDate(tracking.nextCouponDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Gross coupon rate</dt>
                <dd className="mt-1 font-black">
                  {formatPercent(purchase.couponRate, 2)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Net coupon rate</dt>
                <dd className="mt-1 font-black">{formatPercent(netRate, 2)}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-5 md:p-7">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-[var(--md-sys-color-tertiary)]" />
              <h2 className="text-xl font-black">Remaining value</h2>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-on-surface-variant">Net coupon per payment</dt>
                <dd className="font-black">
                  {formatRwf(tracking.netCouponPerPayment)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-on-surface-variant">Future coupon payments</dt>
                <dd className="font-black">{tracking.remainingCouponCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-on-surface-variant">Future net coupons</dt>
                <dd className="font-black text-[var(--md-sys-color-tertiary)]">
                  {formatRwf(tracking.remainingCoupons)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-outline/10 pt-4">
                <dt className="text-on-surface-variant">Principal at maturity</dt>
                <dd className="font-black">{formatRwf(purchase.faceValue)}</dd>
              </div>
            </dl>
            <div className="mt-6 rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                Executed transaction
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-on-surface-variant">Cash cost</dt>
                  <dd className="mt-1 font-black">{formatRwf(purchase.amountInvested)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Price</dt>
                  <dd className="mt-1 font-black">{purchase.pricePercent.toFixed(3)}%</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Accrued interest</dt>
                  <dd className="mt-1 font-black">{formatRwf(purchase.accruedInterestPaid)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Fees</dt>
                  <dd className="mt-1 font-black">{formatRwf(purchase.feesPaid)}</dd>
                </div>
              </dl>
            </div>
            {purchase.notes && (
              <div className="mt-6 rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                  Notes
                </p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-on-surface-variant">
                  {purchase.notes}
                </p>
              </div>
            )}
          </article>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest">
          <div className="flex flex-col justify-between gap-3 border-b border-outline/10 p-5 md:flex-row md:items-end md:p-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">
                Coupon timeline
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {purchase.scheduleConfidence === "confirmed"
                  ? "Confirmed payment schedule"
                  : "Estimated payment schedule"}
              </h2>
            </div>
            <p className="max-w-md text-xs leading-5 text-on-surface-variant">
              {purchase.scheduleConfidence === "confirmed"
                ? "These exact dates were recorded from the prospectus or broker confirmation."
                : "Dates are estimates. Confirm them with the prospectus or broker statement before relying on the forecast."}
            </p>
          </div>
          <div className="bond-scrollbar max-h-[480px] overflow-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[var(--md-sys-color-surface-container)] text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">Coupon date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Gross coupon</th>
                  <th className="px-5 py-3">Tax</th>
                  <th className="px-5 py-3">Net payment</th>
                </tr>
              </thead>
              <tbody>
                {tracking.events.map((event) => (
                  <tr key={event.date} className="border-t border-outline/10 text-xs">
                    <td className="px-5 py-4 font-bold">{displayDate(event.date)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-black ${
                          event.status === "paid"
                            ? "bg-tertiary-container/50 text-on-tertiary-container"
                            : event.status === "accruing"
                              ? "bg-primary-container/40 text-on-primary-container"
                              : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {event.status === "paid" ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock3 size={12} />
                        )}
                        {event.status === "paid" ? "date reached" : event.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {formatRwf(
                        purchase.faceValue *
                          purchase.couponRate /
                          purchase.couponFrequency,
                      )}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {formatRwf(
                        purchase.faceValue *
                          purchase.couponRate /
                          purchase.couponFrequency *
                          purchase.withholdingTaxRate,
                      )}
                    </td>
                    <td className="px-5 py-4 font-black text-[var(--md-sys-color-tertiary)]">
                      {formatRwf(event.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

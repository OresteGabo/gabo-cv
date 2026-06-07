import type { BondPurchase } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CouponEvent = {
  date: string;
  status: "paid" | "accruing" | "future";
  netAmount: number;
};

export type BondTrackingSummary = {
  valuationDate: string;
  effectiveValuationDate: string;
  netAnnualRate: number;
  netCouponPerPayment: number;
  paidCouponCount: number;
  couponsPaid: number;
  accruedCoupon: number;
  benefitToDate: number;
  remainingCouponCount: number;
  remainingCoupons: number;
  nextCouponDate: string | null;
  previousCouponDate: string | null;
  daysHeld: number;
  holdingProgress: number;
  matured: boolean;
  beforePurchase: boolean;
  events: CouponEvent[];
};

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const originalDay = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(originalDay, lastDay));
  return next;
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));
}

export function couponSchedule(purchase: BondPurchase): Date[] {
  const purchaseDate = parseDate(purchase.purchaseDate);
  const maturityDate = parseDate(purchase.maturityDate);
  const intervalMonths = Math.round(12 / Math.max(1, purchase.couponFrequency));
  const dates: Date[] = [];

  if (purchase.couponDates.length > 0) {
    return purchase.couponDates
      .map(parseDate)
      .filter((date) => date > purchaseDate && date <= maturityDate)
      .sort((a, b) => a.getTime() - b.getTime());
  }

  if (purchase.firstCouponDate) {
    for (
      let date = parseDate(purchase.firstCouponDate);
      date <= maturityDate;
      date = addMonths(date, intervalMonths)
    ) {
      if (date > purchaseDate) dates.push(date);
    }
    if (
      dates.length > 0 &&
      dates.at(-1)?.getTime() !== maturityDate.getTime()
    ) {
      dates.push(maturityDate);
    }
  } else {
    for (
      let date = maturityDate;
      date > purchaseDate;
      date = addMonths(date, -intervalMonths)
    ) {
      dates.push(date);
    }
    dates.reverse();
  }

  return dates;
}

export function calculateBondTracking(
  purchase: BondPurchase,
  valuationDate: string,
): BondTrackingSummary {
  const purchaseDate = parseDate(purchase.purchaseDate);
  const maturityDate = parseDate(purchase.maturityDate);
  const requestedValuation = parseDate(valuationDate);
  const effectiveValuation =
    requestedValuation > maturityDate ? maturityDate : requestedValuation;
  const schedule = couponSchedule(purchase);
  const netAnnualRate =
    purchase.couponRate * (1 - purchase.withholdingTaxRate);
  const netCouponPerPayment =
    purchase.faceValue * netAnnualRate / purchase.couponFrequency;
  const beforePurchase = requestedValuation < purchaseDate;
  const completed = beforePurchase
    ? []
    : schedule.filter((date) => date <= effectiveValuation);
  const future = beforePurchase
    ? schedule
    : schedule.filter((date) => date > effectiveValuation);
  const previousCoupon = completed.at(-1) ?? purchaseDate;
  const nextCoupon = future[0] ?? null;

  let accruedCoupon = 0;
  if (!beforePurchase && nextCoupon && effectiveValuation > previousCoupon) {
    const periodDays = Math.max(1, daysBetween(previousCoupon, nextCoupon));
    accruedCoupon =
      netCouponPerPayment *
      Math.min(1, daysBetween(previousCoupon, effectiveValuation) / periodDays);
  }

  const totalHoldingDays = Math.max(1, daysBetween(purchaseDate, maturityDate));
  const elapsedHoldingDays = beforePurchase
    ? 0
    : daysBetween(purchaseDate, effectiveValuation);
  const paidCouponCount = completed.length;
  const couponsPaid = paidCouponCount * netCouponPerPayment;

  return {
    valuationDate,
    effectiveValuationDate: formatDate(effectiveValuation),
    netAnnualRate,
    netCouponPerPayment,
    paidCouponCount,
    couponsPaid,
    accruedCoupon,
    benefitToDate: couponsPaid + accruedCoupon,
    remainingCouponCount: future.length,
    remainingCoupons: future.length * netCouponPerPayment,
    nextCouponDate: nextCoupon ? formatDate(nextCoupon) : null,
    previousCouponDate:
      previousCoupon > purchaseDate ? formatDate(previousCoupon) : null,
    daysHeld: elapsedHoldingDays,
    holdingProgress: Math.min(1, elapsedHoldingDays / totalHoldingDays),
    matured: requestedValuation >= maturityDate,
    beforePurchase,
    events: schedule.map((date) => ({
      date: formatDate(date),
      status:
        beforePurchase
          ? "future"
          : date <= effectiveValuation
          ? "paid"
          : nextCoupon && date.getTime() === nextCoupon.getTime()
            ? "accruing"
            : "future",
      netAmount: netCouponPerPayment,
    })),
  };
}

import type {
  BondAssumptions,
  CashInjection,
  ModeledBondPurchase,
  ModeledCouponPayment,
  MonthlyProjection,
  ProjectionSummary,
} from "./types";

export const DEFAULT_ASSUMPTIONS: BondAssumptions = {
  monthlyContribution: 300_000,
  horizonYears: 20,
  startMonth: 6,
  startYear: 2026,
  tenorYears: 10,
  annualCouponRate: 0.12,
  couponPaymentsPerYear: 2,
  reinvestmentRate: 1,
  auctionFillRate: 0.67,
  agukaAnnualRate: 0.1,
  startingPortfolio: 0,
  purchaseMinimum: 100_000,
};

export const WITHHOLDING_TAX_RATE = 0.05;
export const MIN_ANNUAL_COUPON_RATE = 0.1065;
export const MAX_ANNUAL_COUPON_RATE = 0.135;
export const TREASURY_BOND_TENORS = [3, 5, 7, 10, 15, 20] as const;
export const SECONDARY_MARKET_COMMISSION_RATE = 0.00049;

export function calculateProjection(
  assumptions: BondAssumptions,
  cashInjections: CashInjection[] = [],
): MonthlyProjection[] {
  const totalMonths = Math.max(1, Math.round(assumptions.horizonYears * 12));
  const paymentsPerYear = Math.max(1, assumptions.couponPaymentsPerYear);
  const paymentInterval = 12 / paymentsPerYear;
  const auctionFillRate = Math.max(0, Math.min(1, assumptions.auctionFillRate));
  const agukaAnnualRate = Math.max(0, assumptions.agukaAnnualRate);
  const agukaMonthlyRate = (1 + agukaAnnualRate) ** (1 / 12) - 1;
  const annualCouponRate = Math.min(
    MAX_ANNUAL_COUPON_RATE,
    Math.max(MIN_ANNUAL_COUPON_RATE, assumptions.annualCouponRate),
  );
  const netAnnualRate = annualCouponRate * (1 - WITHHOLDING_TAX_RATE);

  const modeledPurchaseDate = (month: number) => {
    const date = new Date(
      assumptions.startYear,
      assumptions.startMonth - 1 + month - 1,
      5,
    );
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      "05",
    ].join("-");
  };
  const makeLot = (
    purchaseMonth: number,
    amount: number,
    id: string,
  ): ModeledBondPurchase => {
    const maturityMonth = purchaseMonth + assumptions.tenorYears * 12;
    return {
      id,
      purchaseMonth,
      purchaseDate: modeledPurchaseDate(purchaseMonth),
      maturityMonth,
      maturityDate: modeledPurchaseDate(maturityMonth),
      amount,
      tenorYears: assumptions.tenorYears,
      annualCouponRate,
      netAnnualCouponRate: netAnnualRate,
      couponFrequency: paymentsPerYear,
    };
  };

  let activeLots: ModeledBondPurchase[] =
    assumptions.startingPortfolio > 0
      ? [makeLot(0, assumptions.startingPortfolio, "starting-portfolio")]
      : [];
  let cashBalance = 0;
  let totalContributions = 0;
  let totalCoupons = 0;
  let totalReinvested = 0;
  let totalAgukaInterest = 0;

  return Array.from({ length: totalMonths }, (_, index) => {
    const month = index + 1;
    const calendarDate = new Date(
      assumptions.startYear,
      assumptions.startMonth - 1 + index,
      1,
    );
    const openingPortfolio = activeLots.reduce(
      (total, lot) => total + lot.amount,
      0,
    );
    const openingCashBalance = cashBalance;
    const agukaInterest =
      Math.round(openingCashBalance * agukaMonthlyRate * 100) / 100;
    const agukaDistribution =
      month % 6 === 0 ? agukaInterest : 0;
    const personalContribution = assumptions.monthlyContribution;
    const monthlyInjections = cashInjections.filter(
      (injection) => injection.month === month,
    );
    const cashInjection = monthlyInjections.reduce(
      (total, injection) => total + injection.amount,
      0,
    );
    const couponPayments: ModeledCouponPayment[] = Number.isInteger(
      paymentInterval,
    )
      ? activeLots
          .filter(
            (lot) =>
              month > lot.purchaseMonth &&
              month <= lot.maturityMonth &&
              (month - lot.purchaseMonth) % paymentInterval === 0,
          )
          .map((lot) => ({
            lotId: lot.id,
            purchaseDate: lot.purchaseDate,
            amountInvested: lot.amount,
            couponAmount:
              lot.amount *
              (lot.netAnnualCouponRate / lot.couponFrequency),
          }))
      : [];
    const couponPayment = couponPayments.reduce(
      (total, payment) => total + payment.couponAmount,
      0,
    );
    const maturedLots = activeLots.filter(
      (lot) => lot.maturityMonth === month,
    );
    const maturedPrincipal = maturedLots.reduce(
      (total, lot) => total + lot.amount,
      0,
    );
    activeLots = activeLots.filter((lot) => lot.maturityMonth !== month);
    const reinvestedCoupon = couponPayment * assumptions.reinvestmentRate;
    const availableCash =
      Math.round(
        (openingCashBalance +
          agukaInterest +
          personalContribution +
          cashInjection +
          reinvestedCoupon +
          maturedPrincipal) *
          100,
      ) / 100;
    const intendedBondBid =
      Math.floor((availableCash + 0.001) / assumptions.purchaseMinimum) *
      assumptions.purchaseMinimum;
    const filledBondPurchase =
      Math.floor(
        (intendedBondBid * auctionFillRate + 0.001) /
          assumptions.purchaseMinimum,
      ) * assumptions.purchaseMinimum;
    const newBondPurchase = Math.min(intendedBondBid, filledBondPurchase);
    const unfilledBondBid = intendedBondBid - newBondPurchase;

    const newBondPurchaseLot =
      newBondPurchase > 0
        ? makeLot(month, newBondPurchase, `modeled-${month}`)
        : null;
    if (newBondPurchaseLot) activeLots.push(newBondPurchaseLot);
    cashBalance =
      Math.round((availableCash - newBondPurchase) * 100) / 100;
    const portfolio = activeLots.reduce(
      (total, lot) => total + lot.amount,
      0,
    );
    totalContributions += personalContribution + cashInjection;
    totalCoupons += couponPayment;
    totalReinvested += reinvestedCoupon;
    totalAgukaInterest += agukaInterest;
    const annualBondPassiveIncome = activeLots.reduce(
      (total, lot) => total + lot.amount * lot.netAnnualCouponRate,
      0,
    );
    const annualAgukaIncome = cashBalance * agukaAnnualRate;

    return {
      month,
      year: Math.ceil(month / 12),
      monthInYear: ((month - 1) % 12) + 1,
      calendarMonth: calendarDate.getMonth() + 1,
      calendarYear: calendarDate.getFullYear(),
      openingPortfolio,
      openingCashBalance,
      personalContribution,
      cashInjection,
      cashInjectionLabels: monthlyInjections.map((injection) => injection.label),
      couponPayment,
      couponPayments,
      reinvestedCoupon,
      agukaInterest,
      agukaDistribution,
      maturedPrincipal,
      availableCash,
      intendedBondBid,
      unfilledBondBid,
      newBondPurchase,
      newBondPurchaseLot,
      activeBondCount: activeLots.length,
      closingCashBalance: cashBalance,
      closingPortfolio: portfolio,
      totalAccountValue: portfolio + cashBalance,
      totalContributions,
      totalCoupons,
      totalReinvested,
      totalAgukaInterest,
      annualBondPassiveIncome,
      annualAgukaIncome,
      annualPassiveIncome: annualBondPassiveIncome + annualAgukaIncome,
      monthlyPassiveIncome: (annualBondPassiveIncome + annualAgukaIncome) / 12,
    };
  });
}

export function summarizeProjection(
  projection: MonthlyProjection[],
  assumptions: BondAssumptions,
): ProjectionSummary {
  const final = projection.at(-1);
  const firstMonthAt = (amount: number) =>
    projection.find((row) => row.totalAccountValue >= amount)?.month ?? null;
  const annualContributions = assumptions.monthlyContribution * 12;
  const crossoverMonth =
    projection.find(
      (row) => row.annualPassiveIncome > annualContributions,
    )?.month ?? null;

  return {
    finalPortfolio: final?.closingPortfolio ?? assumptions.startingPortfolio,
    finalCashBalance: final?.closingCashBalance ?? 0,
    finalAccountValue:
      final?.totalAccountValue ?? assumptions.startingPortfolio,
    totalContributions: final?.totalContributions ?? 0,
    totalCoupons: final?.totalCoupons ?? 0,
    totalReinvested: final?.totalReinvested ?? 0,
    totalAgukaInterest: final?.totalAgukaInterest ?? 0,
    annualBondPassiveIncome: final?.annualBondPassiveIncome ?? 0,
    annualAgukaIncome: final?.annualAgukaIncome ?? 0,
    annualPassiveIncome: final?.annualPassiveIncome ?? 0,
    monthlyPassiveIncome: final?.monthlyPassiveIncome ?? 0,
    milestone50m: firstMonthAt(50_000_000),
    milestone100m: firstMonthAt(100_000_000),
    milestone200m: firstMonthAt(200_000_000),
    passiveIncomeCrossoverYear: crossoverMonth
      ? Math.ceil(crossoverMonth / 12)
      : null,
  };
}

export function formatRwf(value: number, compact = false): string {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    currencyDisplay: "code",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

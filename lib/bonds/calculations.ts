import type {
  BondAssumptions,
  CashInjection,
  MonthlyProjection,
  ProjectionSummary,
} from "./types";

export const DEFAULT_ASSUMPTIONS: BondAssumptions = {
  monthlyContribution: 300_000,
  horizonYears: 20,
  tenorYears: 10,
  annualCouponRate: 0.12,
  couponPaymentsPerYear: 2,
  reinvestmentRate: 1,
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
  const annualCouponRate = Math.min(
    MAX_ANNUAL_COUPON_RATE,
    Math.max(MIN_ANNUAL_COUPON_RATE, assumptions.annualCouponRate),
  );
  const netAnnualRate = annualCouponRate * (1 - WITHHOLDING_TAX_RATE);
  const couponRatePerPayment = netAnnualRate / paymentsPerYear;

  let portfolio = assumptions.startingPortfolio;
  let totalContributions = 0;
  let totalCoupons = 0;
  let totalReinvested = 0;

  return Array.from({ length: totalMonths }, (_, index) => {
    const month = index + 1;
    const openingPortfolio = portfolio;
    const personalContribution = assumptions.monthlyContribution;
    const monthlyInjections = cashInjections.filter(
      (injection) => injection.month === month,
    );
    const cashInjection = monthlyInjections.reduce(
      (total, injection) => total + injection.amount,
      0,
    );
    const newBondPurchase =
      personalContribution + cashInjection >= assumptions.purchaseMinimum
        ? personalContribution + cashInjection
        : 0;
    const isCouponMonth =
      Number.isInteger(paymentInterval) && month % paymentInterval === 0;
    const couponPayment = isCouponMonth
      ? openingPortfolio * couponRatePerPayment
      : 0;
    const reinvestedCoupon = couponPayment * assumptions.reinvestmentRate;

    portfolio =
      openingPortfolio + personalContribution + cashInjection + reinvestedCoupon;
    totalContributions += personalContribution + cashInjection;
    totalCoupons += couponPayment;
    totalReinvested += reinvestedCoupon;

    return {
      month,
      year: Math.ceil(month / 12),
      monthInYear: ((month - 1) % 12) + 1,
      openingPortfolio,
      personalContribution,
      cashInjection,
      cashInjectionLabels: monthlyInjections.map((injection) => injection.label),
      newBondPurchase,
      couponPayment,
      reinvestedCoupon,
      closingPortfolio: portfolio,
      totalContributions,
      totalCoupons,
      totalReinvested,
      annualPassiveIncome: portfolio * netAnnualRate,
      monthlyPassiveIncome: (portfolio * netAnnualRate) / 12,
    };
  });
}

export function summarizeProjection(
  projection: MonthlyProjection[],
  assumptions: BondAssumptions,
): ProjectionSummary {
  const final = projection.at(-1);
  const firstMonthAt = (amount: number) =>
    projection.find((row) => row.closingPortfolio >= amount)?.month ?? null;
  const annualContributions = assumptions.monthlyContribution * 12;
  const crossoverMonth =
    projection.find(
      (row) => row.annualPassiveIncome > annualContributions,
    )?.month ?? null;

  return {
    finalPortfolio: final?.closingPortfolio ?? assumptions.startingPortfolio,
    totalContributions: final?.totalContributions ?? 0,
    totalCoupons: final?.totalCoupons ?? 0,
    totalReinvested: final?.totalReinvested ?? 0,
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

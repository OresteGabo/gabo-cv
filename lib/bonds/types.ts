export type BondAssumptions = {
  monthlyContribution: number;
  horizonYears: number;
  startMonth: number;
  startYear: number;
  tenorYears: number;
  annualCouponRate: number;
  couponPaymentsPerYear: number;
  reinvestmentRate: number;
  startingPortfolio: number;
  purchaseMinimum: number;
};

export type CashInjection = {
  id: string;
  label: string;
  month: number;
  amount: number;
};

export type ModeledBondPurchase = {
  id: string;
  purchaseMonth: number;
  purchaseDate: string;
  maturityMonth: number;
  maturityDate: string;
  amount: number;
  tenorYears: number;
  annualCouponRate: number;
  netAnnualCouponRate: number;
  couponFrequency: number;
};

export type ModeledCouponPayment = {
  lotId: string;
  purchaseDate: string;
  amountInvested: number;
  couponAmount: number;
};

export type MonthlyProjection = {
  month: number;
  year: number;
  monthInYear: number;
  calendarMonth: number;
  calendarYear: number;
  openingPortfolio: number;
  openingCashBalance: number;
  personalContribution: number;
  cashInjection: number;
  cashInjectionLabels: string[];
  couponPayment: number;
  couponPayments: ModeledCouponPayment[];
  reinvestedCoupon: number;
  maturedPrincipal: number;
  availableCash: number;
  newBondPurchase: number;
  newBondPurchaseLot: ModeledBondPurchase | null;
  activeBondCount: number;
  closingCashBalance: number;
  closingPortfolio: number;
  totalAccountValue: number;
  totalContributions: number;
  totalCoupons: number;
  totalReinvested: number;
  annualPassiveIncome: number;
  monthlyPassiveIncome: number;
};

export type ProjectionSummary = {
  finalPortfolio: number;
  finalCashBalance: number;
  finalAccountValue: number;
  totalContributions: number;
  totalCoupons: number;
  totalReinvested: number;
  annualPassiveIncome: number;
  monthlyPassiveIncome: number;
  milestone50m: number | null;
  milestone100m: number | null;
  milestone200m: number | null;
  passiveIncomeCrossoverYear: number | null;
};

export type BondPurchase = {
  id: string;
  instrumentType:
    | "treasury"
    | "government"
    | "corporate"
    | "municipal"
    | "other";
  issuer: string;
  currency: string;
  market: "primary" | "secondary" | "other";
  purchaseDate: string;
  settlementDate: string;
  bondName: string;
  isin: string;
  tenorYears: number;
  faceValue: number;
  pricePercent: number;
  accruedInterestPaid: number;
  feesPaid: number;
  amountInvested: number;
  couponRate: number;
  withholdingTaxRate: number;
  maturityDate: string;
  firstCouponDate: string;
  couponDates: string[];
  couponFrequency: number;
  scheduleConfidence: "confirmed" | "estimated";
  broker: string;
  accountReference: string;
  sourceUrl: string;
  status: "active" | "sold" | "matured";
  notes: string;
  createdAt: string;
};

export type BondPurchaseInput = Omit<BondPurchase, "id" | "createdAt">;

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

export type MonthlyProjection = {
  month: number;
  year: number;
  monthInYear: number;
  calendarMonth: number;
  calendarYear: number;
  openingPortfolio: number;
  personalContribution: number;
  cashInjection: number;
  cashInjectionLabels: string[];
  newBondPurchase: number;
  couponPayment: number;
  reinvestedCoupon: number;
  closingPortfolio: number;
  totalContributions: number;
  totalCoupons: number;
  totalReinvested: number;
  annualPassiveIncome: number;
  monthlyPassiveIncome: number;
};

export type ProjectionSummary = {
  finalPortfolio: number;
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
  purchaseDate: string;
  bondName: string;
  isin: string;
  tenorYears: number;
  amountInvested: number;
  couponRate: number;
  maturityDate: string;
  couponFrequency: number;
  notes: string;
  createdAt: string;
};

export type BondPurchaseInput = Omit<BondPurchase, "id" | "createdAt">;

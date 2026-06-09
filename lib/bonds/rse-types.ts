export type RseOutstandingBond = {
  bond: string;
  code: string;
  issueDate: string;
  maturityDate: string;
  couponRate: string;
  yieldToMaturity: string;
  closingPrice: number | null;
  impliedCleanPrice: number | null;
  grossYield: number;
  netAnnualizedYield: number;
  yearsRemaining: number;
  strategyScore: number;
  yieldScore: number;
  durationScore: number;
  priceScore: number;
  confidenceScore: number;
  yieldSource: "closing-price estimate" | "RSE published YTM";
};

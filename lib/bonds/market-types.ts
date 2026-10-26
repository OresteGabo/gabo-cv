export type RseMarketTrade = {
  bond: string;
  closing: string;
  previous: string;
  change: string;
  volume: string;
  value: string;
};

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
  recentTradeCount: number;
  lastTradedAt: string | null;
  lastTradedPrice: number | null;
  lastTradeChange: string;
  lastTradeVolume: string;
  lastTradeValue: string;
};

export type RseMarketData = {
  trades: RseMarketTrade[];
  tradesStatus: "available" | "empty" | "error";
  outstanding: RseOutstandingBond[];
  fixedIncomePagesFetched: number;
  treasuryRowsAnalyzed: number;
  fetchedAt: string | null;
};


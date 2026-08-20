import equityPortfolio from "../../.data/equity-portfolio.json";
import type { EquityHolding } from "./types";

type EquityPortfolioFile = {
  holdings: EquityHolding[];
};

const portfolio = equityPortfolio as EquityPortfolioFile;

export function listEquityHoldings() {
  return [...portfolio.holdings].sort(
    (a, b) =>
      b.tradeDate.localeCompare(a.tradeDate) ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

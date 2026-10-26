import "server-only";
import { portfolioApiOrigin } from "../portfolio-api-origin";
import type { RseMarketData } from "./market-types";

/** Server-rendered market content comes from the same Spring API as the app. */
export async function getRseMarketData(forceRefresh = false): Promise<RseMarketData> {
  try {
    const response = await fetch(`${portfolioApiOrigin()}/api/bonds/rse/market${forceRefresh ? "?refresh=1" : ""}`, {
      cache: "no-store", signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) throw new Error("Market API unavailable.");
    const result = await response.json() as RseMarketData;
    if (!Array.isArray(result.trades) || !Array.isArray(result.outstanding)) throw new Error("Invalid market response.");
    return result;
  } catch {
    return { trades: [], tradesStatus: "error", outstanding: [], fixedIncomePagesFetched: 0, treasuryRowsAnalyzed: 0, fetchedAt: null };
  }
}

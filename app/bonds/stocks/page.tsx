import type { Metadata } from "next";
import { StockPerformance } from "@/component/bonds/StockPerformance";

export const metadata: Metadata = {
  title: "Stocks & market prices | Gabo",
  description: "Follow ten RSE companies, browse saved daily closing prices, and compare your shares with market history.",
  robots: { index: false, follow: false },
};
export default function StockPerformancePage() { return <StockPerformance />; }

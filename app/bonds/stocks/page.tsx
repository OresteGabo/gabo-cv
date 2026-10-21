import type { Metadata } from "next";
import { StockPerformance } from "@/component/bonds/StockPerformance";

export const metadata: Metadata = {
  title: "Stock performance | Gabo",
  description: "Compare your saved shares with RSE closing prices and collected market history.",
  robots: { index: false, follow: false },
};
export default function StockPerformancePage() { return <StockPerformance />; }

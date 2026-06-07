import type { Metadata } from "next";
import { BondPlanner } from "@/component/bonds/BondPlanner";

export const metadata: Metadata = {
  title: "Private Bond Portfolio | Gabo",
  description:
    "Privately record and track individual bond purchases, coupon schedules, maturity dates, prices, fees, and expected income.",
  robots: { index: false, follow: false },
};

export default function BondPortfolioPage() {
  return <BondPlanner view="portfolio" />;
}

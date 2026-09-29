import type { Metadata } from "next";
import { BondPortfolioPlanner } from "@/component/bonds/BondPortfolioPlanner";

export const metadata: Metadata = {
  title: "Private Bond Portfolio | Gabo",
  description:
    "Privately record and track individual bond purchases, coupon schedules, maturity dates, prices, fees, and expected income.",
  alternates: { canonical: "/portfolio" },
  robots: { index: false, follow: false },
};

export default function BondPortfolioPage() {
  return <BondPortfolioPlanner view="portfolio" />;
}

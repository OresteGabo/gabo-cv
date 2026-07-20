import type { Metadata } from "next";
import { BondPlanner } from "@/component/bonds/BondPlanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Bond Portfolio | Gabo",
  description:
    "Privately record and track Rwanda Treasury Bond purchases, coupon schedules, settlement dates, and maturity dates.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

export default function BondsPage() {
  return <BondPlanner view="portfolio" />;
}

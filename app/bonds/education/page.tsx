import type { Metadata } from "next";
import { BondEducation } from "@/component/bonds/BondEducation";

export const metadata: Metadata = {
  title: "Rwanda Treasury Bonds from Zero | Bond Education",
  description:
    "Learn Rwanda Treasury bonds from absolute beginner definitions through prices, coupons, YTM, tax, premium risk, discounts, reopenings, and advanced RSE analysis.",
  alternates: { canonical: "/bonds/education" },
};

export default function BondEducationPage() {
  return <BondEducation />;
}

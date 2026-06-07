import type { Metadata } from "next";
import { BondEducation } from "@/component/bonds/BondEducation";

export const metadata: Metadata = {
  title: "Bond Trading Education | Rwanda Treasury Bond Lab",
  description:
    "A detailed guide to bond prices, coupons, yield to maturity, accrued interest, tax, premium risk, reinvestment risk, discounts, and reopened Rwanda Treasury bond issues.",
  alternates: { canonical: "/bonds/education" },
};

export default function BondEducationPage() {
  return <BondEducation />;
}

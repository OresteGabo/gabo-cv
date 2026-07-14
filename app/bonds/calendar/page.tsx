import type { Metadata } from "next";
import { BondIssuanceCalendar } from "@/component/bonds/BondIssuanceCalendar";

export const metadata: Metadata = {
  title: "Private Treasury Bond Calendar | Gabo",
  description:
    "Private Rwanda Treasury Bond calendar with recorded applications, purchase status, settlement dates, and maturity tracking.",
  alternates: { canonical: "/calendar" },
  robots: { index: false, follow: false },
};

export default function BondCalendarPage() {
  return <BondIssuanceCalendar />;
}

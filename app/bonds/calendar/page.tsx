import type { Metadata } from "next";
import { BondIssuanceCalendar } from "@/component/bonds/BondIssuanceCalendar";

export const metadata: Metadata = {
  title: "BNR Treasury Bond Calendar | Gabo",
  description:
    "Official BNR Rwanda Treasury Bond issuance calendar with open book, closing book, settlement, tenor, and maturity dates.",
  alternates: { canonical: "/calendar" },
};

export default function BondCalendarPage() {
  return <BondIssuanceCalendar />;
}

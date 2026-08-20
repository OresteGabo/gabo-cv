import type { Metadata } from "next";
import { BondDocumentsLibrary } from "@/component/bonds/BondDocumentsLibrary";

export const metadata: Metadata = {
  title: "Private Investment Documents | Gabo",
  description:
    "Private investment document library for bond results, bond applications, and equity contract notes.",
  alternates: { canonical: "/documents" },
  robots: { index: false, follow: false },
};

export default function BondDocumentsPage() {
  return <BondDocumentsLibrary />;
}

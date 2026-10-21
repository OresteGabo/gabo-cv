import type { Metadata } from "next";
import { BondPasswordSetup } from "@/component/bonds/BondPasswordSetup";

export const metadata: Metadata = {
  title: "Choose your portfolio password | Gabo",
  description: "Create a private password hash to send to the portfolio owner.",
  robots: { index: false, follow: false },
};

export default function CreatePasswordPage() {
  return <BondPasswordSetup />;
}

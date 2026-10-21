import type { Metadata } from "next";
import { BondJoinAccount } from "@/component/bonds/BondJoinAccount";

export const metadata: Metadata = {
  title: "Join your private portfolio | Gabo",
  description: "Accept a private invitation and create your own bond portfolio account.",
  robots: { index: false, follow: false },
};

export default function JoinPortfolioPage() {
  return <BondJoinAccount />;
}

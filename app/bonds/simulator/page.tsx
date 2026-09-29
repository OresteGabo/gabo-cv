import type { Metadata } from "next";
import { BondSimulatorPlanner } from "@/component/bonds/BondSimulatorPlanner";

export const metadata: Metadata = {
  title: "Treasury Bond Simulator | Gabo",
  description:
    "Simulate monthly Rwanda Treasury Bond investing, coupon reinvestment, cash injections, milestones, and long-term income.",
  alternates: { canonical: "/simulator" },
};

export default function BondSimulatorPage() {
  return <BondSimulatorPlanner />;
}

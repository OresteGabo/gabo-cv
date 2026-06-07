import type { Metadata } from "next";
import { BondPlanner } from "@/component/bonds/BondPlanner";

export const metadata: Metadata = {
  title: "Treasury Bond Simulator | Gabo",
  description:
    "Simulate monthly Rwanda Treasury Bond investing, coupon reinvestment, cash injections, milestones, and long-term income.",
};

export default function BondSimulatorPage() {
  return <BondPlanner view="simulator" />;
}

import { notFound } from "next/navigation";
import { BondPurchaseDetails } from "@/component/bonds/BondPurchaseDetails";
import {
  MAX_ANNUAL_COUPON_RATE,
  MIN_ANNUAL_COUPON_RATE,
  TREASURY_BOND_TENORS,
} from "@/lib/bonds/calculations";
import type { BondPurchase } from "@/lib/bonds/types";

function addYears(dateValue: string, years: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year + years, month - 1, day));
  return date.toISOString().slice(0, 10);
}

export default async function ModeledPurchasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const label = String(params.label ?? "Modeled bond purchase").slice(0, 120);
  const amount = Number(params.amount);
  const date = String(params.date ?? "");
  const tenor = Number(params.tenor);
  const rate = Number(params.rate);
  const lotId = String(params.lot ?? "modeled").slice(0, 80);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  if (
    !Number.isFinite(amount) ||
    amount < 100_000 ||
    amount % 100_000 !== 0 ||
    !validDate ||
    !TREASURY_BOND_TENORS.includes(
      tenor as (typeof TREASURY_BOND_TENORS)[number],
    ) ||
    !Number.isFinite(rate) ||
    rate < MIN_ANNUAL_COUPON_RATE ||
    rate > MAX_ANNUAL_COUPON_RATE
  ) {
    notFound();
  }

  const purchase: BondPurchase = {
    id: lotId || "modeled",
    instrumentType: "treasury",
    issuer: "Government of Rwanda",
    currency: "RWF",
    market: "primary",
    purchaseDate: date,
    settlementDate: date,
    bondName: label || "Modeled bond purchase",
    isin: lotId ? `Projection lot ${lotId}` : "",
    tenorYears: tenor,
    faceValue: amount,
    pricePercent: 100,
    accruedInterestPaid: 0,
    feesPaid: 0,
    amountInvested: amount,
    couponRate: rate,
    withholdingTaxRate: 0.05,
    maturityDate: addYears(date, tenor),
    firstCouponDate: (() => {
      const [year, month, day] = date.split("-").map(Number);
      const next = new Date(Date.UTC(year, month - 1 + 6, day));
      return next.toISOString().slice(0, 10);
    })(),
    couponDates: [],
    couponFrequency: 2,
    scheduleConfidence: "estimated",
    broker: "",
    accountReference: "",
    sourceUrl: "",
    status: "active",
    notes:
      "Generated from the projection using the simulator assumptions active when this page was opened.",
    createdAt: new Date().toISOString(),
  };

  return <BondPurchaseDetails initialPurchase={purchase} modeled />;
}

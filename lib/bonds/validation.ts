import { WITHHOLDING_TAX_RATE } from "./calculations";
import type { BondPurchaseInput } from "./types";

export function parsePurchase(value: unknown): BondPurchaseInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const instrumentType = String(input.instrumentType ?? "treasury");
  const issuer = String(
    input.issuer ??
      (instrumentType === "treasury" ? "Government of Rwanda" : ""),
  ).trim();
  const currency = String(input.currency ?? "RWF").trim().toUpperCase();
  const market = String(input.market ?? "primary");
  const purchaseDate = String(input.purchaseDate ?? "");
  const settlementDate = String(input.settlementDate ?? purchaseDate);
  const bondName = String(input.bondName ?? "").trim();
  const isin = String(input.isin ?? "").trim().toUpperCase();
  const tenorYears = Number(input.tenorYears);
  const faceValue = Number(input.faceValue);
  const pricePercent = Number(input.pricePercent);
  const accruedInterestPaid = Number(input.accruedInterestPaid ?? 0);
  const feesPaid = Number(input.feesPaid ?? 0);
  const amountInvested =
    Math.round(
      (faceValue * (pricePercent / 100) +
        accruedInterestPaid +
        feesPaid) *
        100,
    ) / 100;
  const couponRate = Number(input.couponRate);
  const withholdingTaxRate =
    instrumentType === "treasury"
      ? WITHHOLDING_TAX_RATE
      : Number(input.withholdingTaxRate ?? 0);
  const maturityDate = String(input.maturityDate ?? "");
  const firstCouponDate = String(input.firstCouponDate ?? "");
  const couponDates = Array.isArray(input.couponDates)
    ? [...new Set(input.couponDates.map(String).filter(Boolean))].sort()
    : [];
  const couponFrequency = Number(input.couponFrequency);
  const scheduleConfidence = String(
    input.scheduleConfidence ??
      (instrumentType === "treasury" ? "confirmed" : "estimated"),
  );
  const broker = String(input.broker ?? "").trim();
  const accountReference = String(input.accountReference ?? "").trim();
  const sourceUrl = String(input.sourceUrl ?? "").trim();
  const status = String(input.status ?? "active");
  const notes = String(input.notes ?? "").trim();

  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  const validOptionalUrl =
    sourceUrl === "" ||
    (() => {
      try {
        const url = new URL(sourceUrl);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    })();

  if (
    !["treasury", "government", "corporate", "municipal", "other"].includes(
      instrumentType,
    ) ||
    issuer.length < 1 ||
    issuer.length > 160 ||
    !/^[A-Z]{3}$/.test(currency) ||
    !["primary", "secondary", "other"].includes(market) ||
    !validDate.test(purchaseDate) ||
    !validDate.test(settlementDate) ||
    !validDate.test(maturityDate) ||
    new Date(maturityDate) <= new Date(purchaseDate) ||
    (firstCouponDate !== "" &&
      (!validDate.test(firstCouponDate) ||
        new Date(firstCouponDate) <= new Date(purchaseDate) ||
        new Date(firstCouponDate) > new Date(maturityDate))) ||
    couponDates.some(
      (date) =>
        !validDate.test(date) ||
        new Date(date) <= new Date(purchaseDate) ||
        new Date(date) > new Date(maturityDate),
    ) ||
    bondName.length < 1 ||
    bondName.length > 120 ||
    isin.length > 32 ||
    !Number.isFinite(tenorYears) ||
    tenorYears <= 0 ||
    tenorYears > 100 ||
    !Number.isFinite(faceValue) ||
    faceValue <= 0 ||
    (instrumentType === "treasury" &&
      (faceValue < 100_000 || faceValue % 100_000 !== 0)) ||
    !Number.isFinite(pricePercent) ||
    pricePercent <= 0 ||
    pricePercent > 1000 ||
    !Number.isFinite(accruedInterestPaid) ||
    accruedInterestPaid < 0 ||
    !Number.isFinite(feesPaid) ||
    feesPaid < 0 ||
    !Number.isFinite(couponRate) ||
    couponRate < 0 ||
    couponRate > 1 ||
    !Number.isFinite(withholdingTaxRate) ||
    withholdingTaxRate < 0 ||
    withholdingTaxRate > 1 ||
    !Number.isInteger(couponFrequency) ||
    couponFrequency < 1 ||
    couponFrequency > 12 ||
    !["confirmed", "estimated"].includes(scheduleConfidence) ||
    (scheduleConfidence === "confirmed" && couponDates.length === 0) ||
    broker.length > 120 ||
    accountReference.length > 120 ||
    sourceUrl.length > 1000 ||
    !validOptionalUrl ||
    !["submitted", "active", "sold", "matured"].includes(status) ||
    notes.length > 1000
  ) {
    return null;
  }

  return {
    instrumentType: instrumentType as BondPurchaseInput["instrumentType"],
    issuer,
    currency,
    market: market as BondPurchaseInput["market"],
    purchaseDate,
    settlementDate,
    bondName,
    isin,
    tenorYears,
    faceValue,
    pricePercent,
    accruedInterestPaid,
    feesPaid,
    amountInvested,
    couponRate,
    withholdingTaxRate,
    maturityDate,
    firstCouponDate,
    couponDates,
    couponFrequency,
    scheduleConfidence:
      scheduleConfidence as BondPurchaseInput["scheduleConfidence"],
    broker,
    accountReference,
    sourceUrl,
    status: status as BondPurchaseInput["status"],
    notes,
  };
}

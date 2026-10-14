export type HardCurrency = "USD" | "EUR";

export const FX_ESTIMATE = {
  baseYear: 2026,
  baseMonth: 10,
  rwfPerUsd: 1475,
  rwfPerEur: 1710,
  annualRwfDepreciationRate: 0.045,
};

export function estimatedRwfPerHardCurrency(
  currency: HardCurrency,
  elapsedMonths: number,
) {
  const baseRate =
    currency === "USD" ? FX_ESTIMATE.rwfPerUsd : FX_ESTIMATE.rwfPerEur;
  const elapsedYears = Math.max(0, elapsedMonths) / 12;

  return baseRate * (1 + FX_ESTIMATE.annualRwfDepreciationRate) ** elapsedYears;
}

export function rwfToEstimatedHardCurrency(
  rwfAmount: number,
  currency: HardCurrency,
  elapsedMonths: number,
) {
  return rwfAmount / estimatedRwfPerHardCurrency(currency, elapsedMonths);
}

export function formatHardCurrency(
  value: number,
  currency: HardCurrency,
  compact = false,
) {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IE", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}

export function formatFxEstimateAssumption() {
  const depreciation = new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(FX_ESTIMATE.annualRwfDepreciationRate);

  return `Estimate: 1 USD ~= RWF ${FX_ESTIMATE.rwfPerUsd.toLocaleString("en-RW")}, 1 EUR ~= RWF ${FX_ESTIMATE.rwfPerEur.toLocaleString("en-RW")}, then RWF weakens ${depreciation}/year.`;
}

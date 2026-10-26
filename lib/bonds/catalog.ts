import bondCatalog from "./bond-catalog.json";
import type { BondPurchase } from "./types";

export type BondCatalogEntry = (typeof bondCatalog)[number];

export function normalizedBondIdentity(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function catalogEntryForPurchase(
  purchase: Pick<
    BondPurchase,
    | "bondName"
    | "isin"
    | "tenorYears"
    | "purchaseDate"
    | "settlementDate"
    | "maturityDate"
    | "faceValue"
  >,
) {
  const purchaseCode = normalizedBondIdentity(purchase.isin);
  const purchaseName = normalizedBondIdentity(purchase.bondName);

  return bondCatalog.find(
    (entry) =>
      normalizedBondIdentity(entry.isin) === purchaseCode ||
      normalizedBondIdentity(entry.issuanceNumber) === purchaseName ||
      (
        entry.tenorYears === purchase.tenorYears &&
        entry.maturityDate === purchase.maturityDate &&
        entry.settlementDate === purchase.settlementDate
      ) ||
      (
        entry.tenorYears === purchase.tenorYears &&
        entry.purchaseDate === purchase.purchaseDate &&
        entry.settlementDate === purchase.settlementDate
      ),
  );
}

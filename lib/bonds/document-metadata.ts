import bondDocuments from "./bond-documents.json";
import bondCatalog from "./bond-catalog.json";
import type { BondPurchase } from "./types";

export type BondDocument = (typeof bondDocuments)[number];

function normalizedBondIdentity(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function catalogIssuanceNumberForPurchase(purchase: BondPurchase) {
  return (
    bondCatalog.find(
      (entry) =>
        normalizedBondIdentity(entry.isin) ===
          normalizedBondIdentity(purchase.isin) ||
        normalizedBondIdentity(entry.issuanceNumber) ===
          normalizedBondIdentity(purchase.bondName) ||
        (
          entry.tenorYears === purchase.tenorYears &&
          entry.maturityDate === purchase.maturityDate &&
          entry.settlementDate === purchase.settlementDate
        ),
    )?.issuanceNumber ?? purchase.bondName
  );
}

export function documentsForPurchase(purchase: BondPurchase) {
  const issuanceNumber = catalogIssuanceNumberForPurchase(purchase);
  return bondDocuments.filter((document) => {
    const matcher = document.purchaseMatcher;
    return (
      matcher.issuanceNumber === issuanceNumber &&
      matcher.settlementDate === purchase.settlementDate &&
      matcher.maturityDate === purchase.maturityDate &&
      matcher.faceValue === purchase.faceValue
    );
  });
}

export function getBondDocument(id: string) {
  return bondDocuments.find((document) => document.id === id) ?? null;
}

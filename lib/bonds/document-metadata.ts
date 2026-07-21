import bondDocuments from "./bond-documents.json";
import { catalogEntryForPurchase } from "./catalog";
import type { BondPurchase } from "./types";

export type BondDocument = (typeof bondDocuments)[number];

export function documentsForPurchase(purchase: BondPurchase) {
  const issuanceNumber =
    catalogEntryForPurchase(purchase)?.issuanceNumber ?? purchase.bondName;
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

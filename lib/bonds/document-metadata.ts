import bondDocuments from "./bond-documents.json";
import { catalogEntryForPurchase } from "./catalog";
import type { BondPurchase } from "./types";

export type DocumentPurchaseMatcher = {
  issuanceNumber: string;
  settlementDate: string;
  maturityDate: string;
  faceValue: number;
};

export type BondDocument = {
  id: string;
  purchaseMatcher?: DocumentPurchaseMatcher;
  label: string;
  documentDate: string;
  category: string;
  instrumentName: string;
  issuer: string;
  description: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  storedPath: string;
};

export type BondDocumentSummary = Pick<
  BondDocument,
  | "id"
  | "label"
  | "documentDate"
  | "category"
  | "instrumentName"
  | "issuer"
  | "description"
  | "originalFileName"
> & {
  downloadUrl: string;
};

const documents = bondDocuments as BondDocument[];

export function documentSummary(document: BondDocument): BondDocumentSummary {
  return {
    id: document.id,
    label: document.label,
    documentDate: document.documentDate,
    category: document.category,
    instrumentName: document.instrumentName,
    issuer: document.issuer,
    description: document.description,
    originalFileName: document.originalFileName,
    downloadUrl: `/api/bonds/documents/${document.id}`,
  };
}

export function listBondDocuments() {
  return [...documents].sort(
    (a, b) =>
      b.documentDate.localeCompare(a.documentDate) ||
      a.instrumentName.localeCompare(b.instrumentName) ||
      a.label.localeCompare(b.label),
  );
}

export function documentsForPurchase(purchase: BondPurchase) {
  const issuanceNumber =
    catalogEntryForPurchase(purchase)?.issuanceNumber ?? purchase.bondName;
  return documents.filter((document) => {
    const matcher = document.purchaseMatcher;
    if (!matcher) return false;
    return (
      matcher.issuanceNumber === issuanceNumber &&
      matcher.settlementDate === purchase.settlementDate &&
      matcher.maturityDate === purchase.maturityDate &&
      matcher.faceValue === purchase.faceValue
    );
  });
}

export function getBondDocument(id: string) {
  return documents.find((document) => document.id === id) ?? null;
}

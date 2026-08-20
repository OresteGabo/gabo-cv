import { readFile } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import type { BondDocument } from "./document-metadata";
export {
  documentSummary,
  getBondDocument,
  listBondDocuments,
} from "./document-metadata";

export async function readBondDocumentFile(document: BondDocument) {
  const root = process.cwd();
  const safeFileName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const absolutePath = normalize(
    join(root, "private", "bonds", "documents", safeFileName),
  );
  const relativePath = relative(root, absolutePath);

  if (
    relativePath.startsWith("..") ||
    relativePath.startsWith("/") ||
    safeFileName !== document.fileName
  ) {
    throw new Error("Invalid document path.");
  }

  return readFile(absolutePath);
}

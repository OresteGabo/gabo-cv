export const MAX_BOND_PDF_BYTES = 10 * 1024 * 1024;

const MESSAGES = {
  file_type: "Choose a PDF document. Other file types are not accepted.",
  file_size: "Choose a non-empty PDF smaller than 10 MB.",
  invalid_pdf: "This is not a valid PDF document. Export a new PDF and try again.",
  unreadable: "We couldn’t read this PDF. Please export a new plain PDF and try again.",
  password: "Unlock the password-protected PDF before importing it.",
  unsafe_content: "Only plain PDFs without scripts, attachments or interactive annotations can be imported. Export a flattened PDF and try again.",
  page_limit: "Use a bond result PDF with at most 10 pages.",
  scan_limit: "Use a PDF with at most 5 scanned pages. Split a larger document first.",
  text_limit: "This PDF contains too much text. Use the bond result document only.",
  not_bond_result: "This PDF doesn’t look like a supported bond result. Please choose your BNR bond result PDF.",
  cancelled: "PDF import was cancelled or took too long. You can try again with a smaller document.",
} as const;

export class BondPdfImportError extends Error {
  constructor(readonly code: keyof typeof MESSAGES) {
    super(MESSAGES[code]);
    this.name = "BondPdfImportError";
  }
}

// Display only our fixed messages, never dependency errors or document content.
export function bondPdfImportErrorMessage(error: unknown) {
  return error instanceof BondPdfImportError && Object.hasOwn(MESSAGES, error.code)
    ? MESSAGES[error.code] : MESSAGES.unreadable;
}

export function validateBondPdfMetadata(file: Pick<File, "name" | "type" | "size">) {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) throw new BondPdfImportError("file_type");
  if (!file.size || file.size > MAX_BOND_PDF_BYTES) throw new BondPdfImportError("file_size");
}

export function validateBondPdfEnvelope(bytes: Uint8Array) {
  const decode = new TextDecoder();
  if (bytes.length > MAX_BOND_PDF_BYTES ||
      !/^%PDF-(?:1\.[0-7]|2\.0)[\r\n\t ]/.test(decode.decode(bytes.subarray(0, 16))) ||
      !/%%EOF[\t\n\f\r \0]*$/.test(decode.decode(bytes.subarray(Math.max(0, bytes.length - 1024))))) {
    throw new BondPdfImportError("invalid_pdf");
  }
}

export function hasPdfEntries(value: unknown): boolean {
  return value instanceof Map ? value.size > 0 : Boolean(value && typeof value === "object" && Object.keys(value).length);
}

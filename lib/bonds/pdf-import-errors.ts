export const MAX_BOND_PDF_BYTES = 10 * 1024 * 1024;

const MESSAGES = {
  file_type: "Choose a PDF document. Other file types are not accepted.",
  file_size: "Choose a non-empty PDF smaller than 10 MB.",
  invalid_pdf: "❌Wrong file.",
  unreadable: "We couldn’t read this PDF. Please export a new plain PDF and try again.",
  password: "Unlock the password-protected PDF before importing it.",
  unsafe_content: "Only plain PDFs without scripts, attachments or interactive annotations can be imported. Export a flattened PDF and try again.",
  page_limit: "Use a purchase PDF with at most 10 pages.",
  scan_limit: "Use a PDF with at most 5 scanned pages. Split a larger document first.",
  text_limit: "This PDF contains too much text. Use the purchase document only.",
  not_bond_result: "This PDF is not a supported purchase document. Choose a BNR bond result or an RSE equity purchase contract note.",
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
  // Some broker exports reserve a large zero-filled buffer after %%EOF.
  // Strip only PDF whitespace/NUL padding, never arbitrary trailing payloads.
  let end = bytes.length;
  while (end > 0 && [0, 9, 10, 12, 13, 32].includes(bytes[end - 1])) end--;
  if (bytes.length > MAX_BOND_PDF_BYTES ||
      !/^%PDF-(?:1\.[0-7]|2\.0)[\r\n\t ]/.test(decode.decode(bytes.subarray(0, 16))) ||
      !/%%EOF[\t\n\f\r \0]*$/.test(decode.decode(bytes.subarray(Math.max(0, end - 1024), end)))) {
    throw new BondPdfImportError("invalid_pdf");
  }
}

export function hasPdfEntries(value: unknown): boolean {
  return value instanceof Map ? value.size > 0 : Boolean(value && typeof value === "object" && Object.keys(value).length);
}

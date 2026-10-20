import { parseBondPdfText, type BondPdfImport } from "./pdf-import-parser";

export const MAX_BOND_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 10;
const MAX_OCR_PAGES = 5;
const MAX_TEXT = 200_000;

/** All PDF bytes and recognized text stay in this browser. Only reviewed form data is saved. */
export async function importBondPdf(
  file: File,
  signal: AbortSignal,
  onProgress: (message: string) => void,
): Promise<BondPdfImport> {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) {
    throw new Error("Choose a PDF file. Renaming another file to .pdf will not work.");
  }
  if (!file.size || file.size > MAX_BOND_PDF_BYTES) throw new Error("Choose a PDF smaller than 10 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal.throwIfAborted();
  if (!/^%PDF-\d\.\d/.test(new TextDecoder().decode(bytes.subarray(0, 8))) ||
      !new TextDecoder().decode(bytes.subarray(Math.max(0, bytes.length - 1024))).includes("%%EOF")) {
    throw new Error("This file does not have a valid PDF header and ending.");
  }

  onProgress("Checking PDF structure…");
  const pdfjs = await import("pdfjs-dist");
  signal.throwIfAborted();
  pdfjs.GlobalWorkerOptions.workerSrc = "/bond-import/pdf.worker.min.mjs";
  const loading = pdfjs.getDocument({
    data: bytes,
    stopAtErrors: true,
    cMapUrl: "/bond-import/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/bond-import/standard_fonts/",
    wasmUrl: "/bond-import/wasm/",
    useWorkerFetch: true,
    maxImageSize: 16_000_000,
    canvasMaxAreaInBytes: 32_000_000,
  });
  let ocr: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
  const abort = () => {
    void loading.destroy();
    void ocr?.terminate();
  };
  signal.addEventListener("abort", abort, { once: true });
  const wait = <T,>(promise: Promise<T>): Promise<T> => {
    signal.throwIfAborted();
    return new Promise<T>((resolve, reject) => {
      const cancel = () => reject(new DOMException("Cancelled", "AbortError"));
      signal.addEventListener("abort", cancel, { once: true });
      promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", cancel));
    });
  };
  let usedOcr = false;
  let ocrPages = 0;
  const texts: string[] = [];
  try {
    const pdf = await wait(loading.promise);
    signal.throwIfAborted();
    if (pdf.numPages > MAX_PAGES) throw new Error("Use a bond result PDF with at most 10 pages.");
    const [actions, attachments] = await wait(Promise.all([pdf.getJSActions(), pdf.getAttachments()]));
    if (actions?.size || attachments?.size) throw new Error("PDFs with scripts or embedded files are not accepted. Export a plain PDF and try again.");
    for (let index = 1; index <= pdf.numPages; index++) {
      signal.throwIfAborted();
      onProgress(`Reading page ${index} of ${pdf.numPages}…`);
      const page = await wait(pdf.getPage(index));
      if ((await wait(page.getJSActions()))?.size) throw new Error("PDFs with scripts are not accepted.");
      const content = await wait(page.getTextContent());
      // Reconstruct rows so table columns stay together while field labels retain line breaks.
      const items = content.items.filter((item) => "str" in item);
      const rows = new Map<number, typeof items>();
      for (const item of items) {
        const y = Math.round(item.transform[5] / 3) * 3;
        rows.set(y, [...(rows.get(y) ?? []), item]);
      }
      let text = [...rows.entries()].sort(([a], [b]) => b - a)
        .map(([, row]) => row.sort((a, b) => a.transform[4] - b.transform[4]).map((item) => item.str).join(" ")).join("\n");
      if (text.replace(/\s/g, "").length < 80) {
        if (++ocrPages > MAX_OCR_PAGES) throw new Error("Use a PDF with at most 5 scanned pages. Split a larger document first.");
        usedOcr = true;
        if (!ocr) {
          onProgress("Loading text recognition on your device…");
          const { createWorker, PSM } = await import("tesseract.js");
          signal.throwIfAborted();
          const worker = await wait(createWorker("eng", 1, {
            workerPath: "/bond-import/worker.min.js",
            corePath: "/bond-import/tesseract",
            langPath: "/bond-import",
            workerBlobURL: false,
            cacheMethod: "none",
            logger: (message) => {
              if (!signal.aborted && message.status === "recognizing text") {
                onProgress(`Recognizing page ${index} of ${pdf.numPages}: ${Math.round(message.progress * 100)}%`);
              }
            },
          }).then((worker) => {
            if (signal.aborted) void worker.terminate();
            return worker;
          }));
          ocr = worker;
          signal.throwIfAborted();
          await wait(worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT }));
        }
        if (!ocr) throw new Error("Text recognition could not start. Please try again.");
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(3, Math.sqrt(8_000_000 / (base.width * base.height)));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        try {
          await wait(page.render({ canvas, viewport }).promise);
          signal.throwIfAborted();
          const recognized = await wait(ocr.recognize(canvas, {}, { text: true, blocks: true }));
          text = recognized.data.text;
          const initial = parseBondPdfText(text, true);
          const initialDates = initial.fields.couponDates ?? [];
          if (initialDates.length && initial.warnings.some((warning) => warning.includes("Found ") || warning.includes("invalid"))) {
            // A tight second pass avoids surrounding table borders being read as digits.
            const words = recognized.data.blocks?.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.flatMap((line) => line.words))) ?? [];
            const payment = words.find((word) => /^PAYMENT$/i.test(word.text));
            const settlement = payment && words.find((word) => /^SETTLEMENT$/i.test(word.text) && word.bbox.y0 > payment.bbox.y0);
            if (payment && settlement) {
              const dateWords = words.filter((word) => word.bbox.y0 >= payment.bbox.y0 - 10 && word.bbox.y1 < settlement.bbox.y0 - 5 && /\d.*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(word.text));
              if (dateWords.length >= 3) {
                const left = Math.max(0, Math.min(...dateWords.map((word) => word.bbox.x0)) - 10);
                const top = Math.max(0, Math.min(...dateWords.map((word) => word.bbox.y0)) - 2);
                const right = Math.min(canvas.width, Math.max(...dateWords.map((word) => word.bbox.x1)) + 5);
                const bottom = Math.min(canvas.height, Math.max(...dateWords.map((word) => word.bbox.y1)) + 2);
                onProgress(`Checking coupon table on page ${index}…`);
                const cropped = await wait(ocr.recognize(canvas, { rectangle: { left, top, width: right - left, height: bottom - top } }));
                const candidate = text.replace(/(COUPON\s+PAYMENT(?:\s+DATES)?)[\s\S]*?(?=SETTLEMENT\s+DATE)/i, `$1\n${cropped.data.text}\n`);
                const candidateDates = parseBondPdfText(candidate, true).fields.couponDates ?? [];
                if (candidateDates.length > initialDates.length && initialDates.every((date) => candidateDates.includes(date))) text = candidate;
              }
            }
          }
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
      if (text.length > MAX_TEXT || texts.reduce((sum, item) => sum + item.length, 0) + text.length > MAX_TEXT) {
        throw new Error("This PDF contains too much text. Use the bond result document only.");
      }
      texts.push(text);
      page.cleanup();
    }
    signal.throwIfAborted();
    const result = parseBondPdfText(texts.join("\n"), usedOcr);
    if (!result.fields.bondName && !result.fields.isin && !result.fields.couponRate && !result.fields.couponDates?.length) {
      throw new Error("No recognizable bond details were found. Use a clear BNR bond result PDF or enter the details manually.");
    }
    return result;
  } catch (error) {
    if (signal.aborted) throw new Error("PDF import cancelled or timed out. You can try again with a smaller document.");
    if (error instanceof Error && error.name === "PasswordException") throw new Error("Unlock the password-protected PDF before importing it.");
    if (error instanceof Error && /InvalidPDF|FormatError|UnknownError/.test(error.name)) throw new Error("This PDF could not be read. Export a new plain PDF and try again.");
    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
    await ocr?.terminate();
    await loading.destroy();
  }
}

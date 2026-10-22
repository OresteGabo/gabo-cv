import { isRecognizedBondResult, parseBondPdfText, type BondPdfImport } from "./pdf-import-parser";
import { BondPdfImportError, hasPdfEntries, validateBondPdfEnvelope, validateBondPdfMetadata } from "./pdf-import-errors";

export { MAX_BOND_PDF_BYTES } from "./pdf-import-errors";
const MAX_PAGES = 10;
const MAX_OCR_PAGES = 5;
const MAX_TEXT = 200_000;

/** All PDF bytes and recognized text stay in this browser. Only reviewed form data is saved. */
export async function importBondPdf(
  file: File,
  signal: AbortSignal,
  onProgress: (message: string) => void,
): Promise<BondPdfImport> {
  let loading: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
  let ocr: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
  const cleanup = () => Promise.allSettled([
    Promise.resolve().then(() => loading?.destroy()),
    Promise.resolve().then(() => ocr?.terminate()),
  ]);
  const abort = () => { void cleanup(); };
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
    validateBondPdfMetadata(file);
    signal.throwIfAborted();
    const bytes = new Uint8Array(await file.arrayBuffer());
    signal.throwIfAborted();
    validateBondPdfEnvelope(bytes);
    onProgress("Checking PDF structure…");
    // Safari needs PDF.js's supported compatibility build in both threads.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    signal.throwIfAborted();
    pdfjs.GlobalWorkerOptions.workerSrc = "/bond-import/pdf.worker.legacy.min.mjs";
    loading = pdfjs.getDocument({
      data: bytes,
      stopAtErrors: true,
      enableXfa: false,
      disableFontFace: true,
      cMapUrl: "/bond-import/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/bond-import/standard_fonts/",
      wasmUrl: "/bond-import/wasm/",
      useWorkerFetch: true,
      maxImageSize: 16_000_000,
      canvasMaxAreaInBytes: 32_000_000,
      verbosity: pdfjs.VerbosityLevel.ERRORS,
    });
    signal.addEventListener("abort", abort, { once: true });
    const pdf = await wait(loading.promise);
    signal.throwIfAborted();
    if (pdf.numPages > MAX_PAGES) throw new BondPdfImportError("page_limit");
    if (pdf.numPages < 1) throw new BondPdfImportError("invalid_pdf");
    const [actions, attachments, fieldObjects] = await wait(Promise.all([pdf.getJSActions(), pdf.getAttachments(), pdf.getFieldObjects()]));
    const fields = [...(fieldObjects?.values() ?? [])].flat() as { id?: string; type?: string; actions?: unknown }[];
    if (hasPdfEntries(actions) || hasPdfEntries(attachments) || fields.some((field) => field.type !== "signature" || !field.id || hasPdfEntries(field.actions))) throw new BondPdfImportError("unsafe_content");
    const signatures = new Set<string>();
    for (let index = 1; index <= pdf.numPages; index++) {
      signal.throwIfAborted();
      onProgress(`Reading page ${index} of ${pdf.numPages}…`);
      const page = await wait(pdf.getPage(index));
      const [pageActions, annotations] = await wait(Promise.all([page.getJSActions(), page.getAnnotations({ intent: "any" })]));
      // Non-widget annotations can hide actions omitted by PDF.js's public output.
      // Accept passive signature widgets only; never mount annotation/scripting UI.
      if (hasPdfEntries(pageActions) || annotations.some((annotation) =>
        annotation.annotationType !== pdfjs.AnnotationType.WIDGET || annotation.fieldType !== "Sig" ||
        hasPdfEntries(annotation.actions) || annotation.file || annotation.attachment || annotation.attachmentId,
      )) throw new BondPdfImportError("unsafe_content");
      for (const annotation of annotations) signatures.add(annotation.id);
      const content = await wait(page.getTextContent());
      if (content.items.length > 50_000) throw new BondPdfImportError("text_limit");
      // Reconstruct rows so table columns stay together while field labels retain line breaks.
      const items = content.items.filter((item) => "str" in item);
      const rows = new Map<number, typeof items>();
      let pageTextLength = 0;
      for (const item of items) {
        pageTextLength += item.str.length;
        if (pageTextLength > MAX_TEXT) throw new BondPdfImportError("text_limit");
        const y = Math.round(item.transform[5] / 3) * 3;
        const row = rows.get(y);
        if (row) row.push(item); else rows.set(y, [item]);
      }
      let text = [...rows.entries()].sort(([a], [b]) => b - a)
        .map(([, row]) => row.sort((a, b) => a.transform[4] - b.transform[4]).map((item) => item.str).join(" ")).join("\n");
      if (text.replace(/\s/g, "").length < 80) {
        if (++ocrPages > MAX_OCR_PAGES) throw new BondPdfImportError("scan_limit");
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
        if (!ocr) throw new BondPdfImportError("unreadable");
        const base = page.getViewport({ scale: 1 });
        if (!Number.isFinite(base.width * base.height) || base.width <= 0 || base.height <= 0) throw new BondPdfImportError("invalid_pdf");
        const scale = Math.min(3, Math.sqrt(8_000_000 / (base.width * base.height)), 4096 / base.width, 4096 / base.height);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        try {
          await wait(page.render({ canvas, viewport, annotationMode: pdfjs.AnnotationMode.DISABLE }).promise);
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
        throw new BondPdfImportError("text_limit");
      }
      texts.push(text);
      page.cleanup();
    }
    signal.throwIfAborted();
    if (fields.some((field) => !signatures.has(field.id!))) throw new BondPdfImportError("unsafe_content");
    const result = parseBondPdfText(texts.join("\n"), usedOcr);
    if (!isRecognizedBondResult(result, texts.join("\n"))) throw new BondPdfImportError("not_bond_result");
    return result;
  } catch (error) {
    if (signal.aborted) throw new BondPdfImportError("cancelled");
    if (error instanceof BondPdfImportError) throw error;
    if (error instanceof Error && error.name === "PasswordException") throw new BondPdfImportError("password");
    throw new BondPdfImportError("unreadable");
  } finally {
    signal.removeEventListener("abort", abort);
    await cleanup();
  }
}

import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Serve workers, WASM, and OCR data ourselves: documents never go to a CDN.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");
const target = join(root, "public", "bond-import");
await mkdir(join(target, "tesseract"), { recursive: true });
await cp(join(modules, "pdfjs-dist/build/pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
await cp(join(modules, "tesseract.js/dist/worker.min.js"), join(target, "worker.min.js"));
await cp(join(modules, "@tesseract.js-data/eng/4.0.0/eng.traineddata.gz"), join(target, "eng.traineddata.gz"));
for (const name of await readdir(join(modules, "tesseract.js-core"))) {
  if (name.endsWith(".wasm") || name.endsWith(".wasm.js")) {
    await cp(join(modules, "tesseract.js-core", name), join(target, "tesseract", name));
  }
}
for (const name of ["cmaps", "standard_fonts", "wasm"]) {
  await cp(join(modules, "pdfjs-dist", name), join(target, name), { recursive: true });
}

"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CircleAlert, FileText, LoaderCircle, Upload, X } from "lucide-react";
import type { BondPdfImport } from "@/lib/bonds/pdf-import-parser";
import { bondPdfImportErrorMessage, validateBondPdfMetadata } from "@/lib/bonds/pdf-import-errors";

export function BondPdfUpload({ onImport, onBusyChange }: {
  onImport: (result: BondPdfImport, fileName: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [dragState, setDragState] = useState<"ready" | "invalid" | null>(null);
  const dragDepth = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => {
    controller.current?.abort();
    controller.current = null;
    onBusyChange(false);
  }, [onBusyChange]);

  async function readFile(file: File) {
    if (controller.current) return;
    try { validateBondPdfMetadata(file); }
    catch (cause) {
      setError(bondPdfImportErrorMessage(cause));
      return;
    }
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setProgress("Opening PDF…");
    const timeout = window.setTimeout(() => current.abort(), 120_000);
    try {
      const { importBondPdf } = await import("@/lib/bonds/pdf-import");
      const result = await importBondPdf(file, current.signal, setProgress);
      if (!current.signal.aborted) onImport(result, file.name);
    } catch (cause) {
      if (controller.current === current) {
        setError(bondPdfImportErrorMessage(cause));
      }
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === current) {
        controller.current = null;
        setBusy(false);
        onBusyChange(false);
        setProgress("");
      }
    }
  }

  function checkDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    const items = Array.from(event.dataTransfer.items).filter((item) => item.kind === "file");
    // File counts and MIME types can be hidden or incomplete while hovering.
    // Check the actual FileList only on drop, rather than reporting unknown
    // drag metadata as multiple files.
    const definitelyNotPdf = items.length > 0 && items.every((item) =>
      item.type && item.type !== "application/pdf" && item.type !== "application/octet-stream",
    );
    const accepted = !busy && !definitelyNotPdf;
    event.dataTransfer.dropEffect = accepted ? "copy" : "none";
    setDragState(accepted ? "ready" : "invalid");
  }

  return (
    <div aria-busy={busy} className="mt-5">
      <div data-testid="bond-pdf-dropzone" data-drag-state={dragState ?? "idle"}
        onDragEnter={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          dragDepth.current++;
          checkDrag(event);
        }}
        onDragOver={checkDrag}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDragState(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepth.current = 0;
          setDragState(null);
          if (busy) return;
          const listedFiles = Array.from(event.dataTransfer.files);
          const files = listedFiles.length ? listedFiles : Array.from(event.dataTransfer.items)
            .filter((item) => item.kind === "file")
            .map((item) => item.getAsFile())
            .filter((file): file is File => file !== null);
          if (files.length > 1) {
            setError("Drop one PDF at a time.");
            return;
          }
          if (!files.length) {
            setError("No readable file was received. Please use Choose PDF to select your file.");
            return;
          }
          void readFile(files[0]);
        }}
        className={`relative flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none ${
          dragState === "ready" ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] shadow-[inset_0_0_0_3px_var(--md-sys-color-primary)]"
            : dragState === "invalid" ? "border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]"
            : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]"
        }`}>
        <div className={`pointer-events-none mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] ${dragState === "invalid" ? "text-[var(--md-sys-color-error)]" : "text-[var(--md-sys-color-primary)]"}`}>
          {busy ? <LoaderCircle size={26} className="animate-spin motion-reduce:animate-none" /> : dragState === "invalid" ? <CircleAlert size={26} /> : dragState === "ready" ? <Upload size={26} /> : <FileText size={26} />}
        </div>
        <p role="status" aria-live="polite" className="pointer-events-none text-base font-black">
          {busy ? "Reading your bond PDF…" : dragState === "ready" ? "Release to read your PDF" : dragState === "invalid" ? "Use a PDF document" : "Drop your bond PDF here"}
        </p>
        <p className="pointer-events-none mt-2 max-w-sm text-xs leading-relaxed text-on-surface-variant">
          {dragState === "invalid" ? "Only PDF documents are accepted." : "We’ll extract your bond details and coupon dates for you to review."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-2.5 text-xs font-black text-[var(--md-sys-color-on-primary)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-40">
            <Upload size={15} />Choose PDF
          </button>
          {busy && <button type="button" onClick={() => controller.current?.abort()} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-on-surface-variant"><X size={14} />Cancel import</button>}
        </div>
        <input ref={input} type="file" aria-label="Bond PDF" accept=".pdf,application/pdf" disabled={busy} className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void readFile(file);
          }} />
        <p className="pointer-events-none mt-4 text-[11px] text-on-surface-variant">Up to 10 MB · Scanned PDFs supported</p>
      </div>
      <p className="mt-3 text-center text-[11px] text-on-surface-variant">Your PDF stays on this device. Nothing is saved until you confirm.</p>
      <p role="status" aria-live="polite" className="mt-2 text-center text-xs text-primary">{progress}</p>
      {error && <p role="alert" className="mt-3 rounded-xl border border-[var(--md-sys-color-error)] p-3 text-xs text-[var(--md-sys-color-error)]">{error}</p>}
    </div>
  );
}

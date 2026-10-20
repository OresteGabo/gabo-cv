"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, Upload, X } from "lucide-react";
import type { BondPdfImport } from "@/lib/bonds/pdf-import-parser";

export function BondPdfUpload({ onImport, onBusyChange }: {
  onImport: (result: BondPdfImport, fileName: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => {
    controller.current?.abort();
    controller.current = null;
    onBusyChange(false);
  }, [onBusyChange]);

  async function readFile(file: File) {
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
        setError(cause instanceof Error ? cause.message : "The PDF could not be read. Please try another file.");
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

  return (
    <div aria-busy={busy} className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-black"><FileText size={17} className="text-primary" />Import from a bond PDF</div>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
        Fill this form from a BNR bond result, including scanned PDFs. The file stays on your device. Review the extracted values before saving.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <label className={`inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-on-primary ${busy ? "cursor-wait opacity-50" : "cursor-pointer"}`}>
          {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}{busy ? "Reading PDF…" : "Upload PDF"}
          <input type="file" accept=".pdf,application/pdf" disabled={busy} className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void readFile(file);
            }} />
        </label>
        {busy && <button type="button" onClick={() => controller.current?.abort()} className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant"><X size={14} />Cancel</button>}
      </div>
      <p className="mt-2 text-[11px] text-on-surface-variant">PDF only · Up to 10 MB · 10 pages, including up to 5 scanned pages</p>
      <p role="status" aria-live="polite" className="mt-2 text-xs text-primary">{progress}</p>
      {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}

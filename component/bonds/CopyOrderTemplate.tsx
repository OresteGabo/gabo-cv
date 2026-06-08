"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

const ORDER_TEMPLATE = `Subject: Fixed Income Order - Primary Auction [or Secondary Market]

Dear BK Capital Trading Desk,

Please execute the following fixed-income order on my behalf:

Investor Name: Oreste MUHIRWA GABO
CSD Account Number: [Your CSD Account ID]
Bond Security Ticker: FXD 1/2026/10YRS
Order Type: Primary Re-opening Auction (Non-Competitive Bid)
Face Value Target Amount: RWF 2,000,000

Please confirm the required settlement amount, funding instructions, fees, documents, order deadline, and whether any additional authorization is required before execution.

Best regards,
Oreste MUHIRWA GABO`;

export function CopyOrderTemplate() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "selected">(
    "idle",
  );
  const templateRef = useRef<HTMLPreElement>(null);

  async function copyTemplate() {
    let copied = false;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(ORDER_TEMPLATE);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = ORDER_TEMPLATE;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setCopyState("copied");
    } else {
      const selection = window.getSelection();
      if (selection && templateRef.current) {
        const range = document.createRange();
        range.selectNodeContents(templateRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setCopyState("selected");
    }
    window.setTimeout(() => setCopyState("idle"), 3000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary/10 bg-primary-container/20">
      <div className="flex items-center justify-between gap-4 border-b border-primary/10 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--md-sys-color-primary)]">
          Sample order email
        </p>
        <button
          type="button"
          onClick={copyTemplate}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-surface-container-lowest/70 px-3 py-2 text-[10px] font-black text-[var(--md-sys-color-primary)] transition hover:border-primary/35"
        >
          {copyState === "copied" ? <Check size={13} /> : <Copy size={13} />}
          {copyState === "copied"
            ? "Copied"
            : copyState === "selected"
              ? "Press Cmd+C"
              : "Copy email"}
        </button>
      </div>
      <pre
        ref={templateRef}
        className="bond-scrollbar overflow-x-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-on-surface"
      >
        {ORDER_TEMPLATE}
      </pre>
    </div>
  );
}

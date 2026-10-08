"use client";

import { AlertCircle, ExternalLink, RadioTower } from "lucide-react";
import { RseRefreshButton } from "./RseRefreshButton";

export function RseMarketErrorTable({
  sourceName,
  sourceUrl,
}: {
  sourceName: string;
  sourceUrl: string;
}) {
  return (
    <div className="grid min-h-[360px] place-items-center px-5 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-outline/10 bg-surface-container-low/70 p-6 text-center md:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <RadioTower size={24} />
        </span>
        <div className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error-container/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--md-sys-color-on-error-container)]">
            <AlertCircle size={13} />
            RSE unavailable
          </span>
        </div>
        <h4 className="mt-4 text-lg font-black text-on-surface">
          Market data could not be loaded
        </h4>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-on-surface-variant">
          The {sourceName} page may be temporarily unavailable, slow, or its table
          format may have changed. No values are being guessed or replaced with
          stale rows.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <RseRefreshButton />
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-outline/15 bg-background px-4 py-2.5 text-xs font-black text-on-surface transition hover:border-primary/35 hover:text-primary"
          >
            Visit {sourceName}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

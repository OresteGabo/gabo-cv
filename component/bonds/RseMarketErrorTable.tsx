"use client";

import { AlertCircle, ExternalLink, RefreshCcw } from "lucide-react";
import { useState } from "react";

export function RseMarketErrorTable({
  columns,
  sourceName,
  sourceUrl,
}: {
  columns: string[];
  sourceName: string;
  sourceUrl: string;
}) {
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    const url = new URL(window.location.href);
    url.searchParams.set("rseRefresh", Date.now().toString());
    url.hash = "rse-market";
    window.location.assign(url);
  }

  return (
    <div>
      <div className="bond-scrollbar overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead className="bg-surface-container text-[9px] uppercase tracking-[0.12em] text-on-surface-variant">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((row) => (
              <tr key={row} className="border-t border-outline/10">
                {columns.map((column, index) => (
                  <td key={column} className="px-4 py-4">
                    <span
                      className={`block h-2.5 rounded-full bg-outline/10 ${
                        index === 0 ? "w-32" : "w-16"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-outline/10 bg-surface-container-low/45 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <AlertCircle size={17} />
          </span>
          <div>
            <h4 className="text-sm font-black">Market data could not be loaded</h4>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              The {sourceName} page may be temporarily unavailable, slow, or its
              table format may have changed. No values are being guessed or replaced
              with stale rows.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-on-primary transition hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCcw
              size={14}
              className={refreshing ? "animate-spin" : undefined}
            />
            {refreshing ? "Refreshing…" : "Try again"}
          </button>
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

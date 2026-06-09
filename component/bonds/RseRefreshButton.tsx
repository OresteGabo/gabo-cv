"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

export function RseRefreshButton() {
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("rseRefresh")) return;
    url.searchParams.delete("rseRefresh");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  function refresh() {
    setRefreshing(true);
    const url = new URL(window.location.href);
    url.searchParams.set("rseRefresh", Date.now().toString());
    url.hash = "rse-market";
    window.location.assign(url);
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={refreshing}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-2.5 text-xs font-black text-[var(--md-sys-color-on-primary)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCcw
        size={14}
        className={refreshing ? "animate-spin" : undefined}
      />
      {refreshing ? "Refreshing RSE data…" : "Refresh market data"}
    </button>
  );
}

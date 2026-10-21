"use client";
import { startTransition, useEffect, useState } from "react";
import { deferMarketTask } from "@/lib/bonds/deferred-market";

export function useDeferredMarket<T>(path: string, enabled: boolean) {
  const [result, setResult] = useState<{ path: string; data: T | null; error: boolean; loading: boolean }>({ path, data: null, error: false, loading: false });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    deferMarketTask(async () => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      try {
        setResult((previous) => ({ path, data: previous.path === path ? previous.data : null, error: false, loading: true }));
        timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 38_000);
        const response = await fetch(path, { signal: controller.signal, priority: "low", cache: "no-store" });
        if (!response.ok) throw new Error("Optional market data unavailable.");
        const data: T = await response.json();
        if (!controller.signal.aborted) startTransition(() => setResult({ path, data, error: false, loading: false }));
      } catch {
        if (timedOut || !controller.signal.aborted) setResult((previous) => ({ ...previous, error: true, loading: false }));
      } finally { clearTimeout(timeout); }
    }, controller.signal);
    return () => controller.abort();
  }, [path, enabled, revision]);
  return { data: result.path === path ? result.data : null, error: result.path === path && result.error, loading: enabled && result.path === path && result.loading, retry: () => setRevision((value) => value + 1) };
}

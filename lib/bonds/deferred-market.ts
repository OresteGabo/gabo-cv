// Optional market work starts after document load, a quiet resource interval,
// and an idle browser slot. The caller also gates it on its own foreground work.
let running = false;
export function deferMarketTask(task: () => Promise<void>, signal: AbortSignal) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idle: number | undefined;
  const cleanup = () => { clearTimeout(timer); if (idle !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idle); };
  const attempt = () => {
    if (signal.aborted) return;
    const resources = performance.getEntriesByType("resource").slice(-30) as PerformanceResourceTiming[];
    const lastFinished = resources.reduce((last, item) => Math.max(last, item.responseEnd), 0);
    if (running || document.readyState !== "complete" || document.visibilityState === "hidden" || performance.now() - lastFinished < 700) { timer = setTimeout(attempt, 500); return; }
    const start = () => {
      if (signal.aborted) return;
      if (running || document.visibilityState === "hidden") { timer = setTimeout(attempt, 500); return; }
      running = true;
      void task().finally(() => { running = false; signal.removeEventListener("abort", cleanup); });
    };
    if ("requestIdleCallback" in window) idle = window.requestIdleCallback((deadline) => { if (deadline.timeRemaining() < 8) { timer = setTimeout(attempt, 500); } else start(); });
    else timer = setTimeout(start, 500);
  };
  signal.addEventListener("abort", cleanup, { once: true });
  timer = setTimeout(attempt, 700);
}

import "server-only";
import { parseBondQuotes, parseEquityQuotes, parseListedBonds, publishedEquityDate, rsePageCount, type BondQuotes, type EquityQuotes, type QuoteSource } from "./market-quotes";

const BASE = "https://rse.rw";
const TTL = 15 * 60_000;
type PageSet = { pages: string[]; failed: number; checkedAt: string };
async function page(url: string) {
  const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(8_000), headers: { Accept: "text/html", "User-Agent": "orestegabo.dev optional market reader" } });
  if (!response.ok) throw new Error("RSE is unavailable.");
  const html = await response.text();
  if (html.length > 1_500_000) throw new Error("Market response is too large.");
  return html;
}
async function pages(path: string): Promise<PageSet> {
  const first = await page(`${BASE}/${path}`);
  const count = rsePageCount(first);
  const result = { pages: [first], failed: 0, checkedAt: new Date().toISOString() };
  // Bound concurrency so an optional page cannot fan out into dozens of requests.
  for (let index = 2; index <= count; index += 2) {
    const batch = await Promise.allSettled(Array.from({ length: Math.min(2, count - index + 1) }, (_, offset) => page(`${BASE}/${path}?page_bonds-trades=${index + offset}`)));
    for (const value of batch) if (value.status === "fulfilled") result.pages.push(value.value); else result.failed++;
  }
  return result;
}
function source(path: string, result: PageSet | null, count: number): QuoteSource {
  return { url: `${BASE}/${path}`, status: !result ? "error" : result.failed ? "partial" : count ? "available" : "empty", checkedAt: result?.checkedAt ?? new Date().toISOString(), publishedAt: null, stale: false };
}
const cache = new Map<string, { expires: number; value: BondQuotes | EquityQuotes }>();
const pending = new Map<string, Promise<BondQuotes | EquityQuotes>>();
async function cached<T extends BondQuotes | EquityQuotes>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const old = cache.get(key);
  if (old && old.expires > Date.now()) return old.value as T;
  const running = pending.get(key);
  if (running) return running as Promise<T>;
  const task = fetcher().then((fresh) => {
    let value = fresh;
    if (fresh.source.status === "error" && old && Date.now() - new Date(old.value.source.checkedAt).getTime() < 86400000) value = { ...old.value, source: { ...old.value.source, stale: true } } as T;
    cache.set(key, { value, expires: Date.now() + (fresh.source.status === "error" ? 60_000 : TTL) });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}
export function getBondQuotes(): Promise<BondQuotes> {
  return cached("bonds", async () => {
    const [market, listing] = await Promise.all([pages("bond-market").catch(() => null), pages("outstanding-bonds").catch(() => null)]);
    const quotes = market?.pages.flatMap(parseBondQuotes) ?? [];
    const listings = listing?.pages.flatMap(parseListedBonds) ?? [];
    return { source: source("bond-market", market, quotes.length), listingSource: source("outstanding-bonds", listing, listings.length), quotes, listings };
  });
}
export function getEquityQuotes(): Promise<EquityQuotes> {
  return cached("equities", async () => {
    const result = await pages("equities-market").catch(() => null);
    const quotes = result?.pages.flatMap(parseEquityQuotes) ?? [];
    return { source: { ...source("equities-market", result, quotes.length), publishedAt: result ? publishedEquityDate(result.pages[0], result.checkedAt) : null }, quotes };
  });
}

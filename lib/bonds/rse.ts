import "server-only";

const RSE_BOND_MARKET_URL = "https://rse.rw/bond-market";
const RSE_FIXED_INCOME_URL = "https://rse.rw/fixed-income-board";
const RSE_OUTSTANDING_BONDS_URL = "https://rse.rw/outstanding-bonds";

export type RseMarketTrade = {
  bond: string;
  closing: string;
  previous: string;
  change: string;
  volume: string;
  value: string;
};

export type RseOutstandingBond = {
  bond: string;
  code: string;
  issueDate: string;
  maturityDate: string;
  couponRate: string;
  yieldToMaturity: string;
  closingPrice: number | null;
  grossYield: number;
  netAnnualizedYield: number;
  yearsRemaining: number;
  strategyScore: number;
  yieldScore: number;
  durationScore: number;
  priceScore: number;
  confidenceScore: number;
  yieldSource: "closing-price estimate" | "RSE published YTM";
};

export type RseMarketData = {
  trades: RseMarketTrade[];
  tradesStatus: "available" | "empty" | "error";
  outstanding: RseOutstandingBond[];
  fixedIncomePagesFetched: number;
  treasuryRowsAnalyzed: number;
  fetchedAt: string | null;
};

type RsePage = {
  html: string;
  fetchedAt: string;
};

function oldestFetchedAt(pages: RsePage[]) {
  const timestamps = pages
    .map((page) => new Date(page.fetchedAt).getTime())
    .filter(Number.isFinite);
  return timestamps.length > 0
    ? new Date(Math.min(...timestamps)).toISOString()
    : null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cellText(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function tableRows(html: string) {
  const body = (
    html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? ""
  ).replace(/<!--[\s\S]*?-->/g, "");
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      cellText(cell[1]),
    ),
  );
}

function fixedIncomePageCount(html: string) {
  const pages = [
    ...html.matchAll(/page_bonds-trades=(\d+)/gi),
  ].map((match) => Number(match[1]));
  return Math.min(25, Math.max(1, ...pages.filter(Number.isFinite)));
}

function cleanBondName(value: string) {
  return value.replace(/\s*TREASURY\s*$/i, "").trim();
}

function normalizedBondName(value: string) {
  return cleanBondName(value)
    .toLowerCase()
    .replace(/re-?opened/g, "reopened")
    .replace(/[^a-z0-9]/g, "");
}

function percentage(value: string) {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed / 100 : 0;
}

function price(value: string) {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseRseDate(value: string) {
  const parsed = new Date(`${value} UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function yearsUntil(value: string, valuationDate: Date) {
  const maturity = parseRseDate(value);
  if (!maturity) return 0;
  return Math.max(
    0,
    (maturity.getTime() - valuationDate.getTime()) /
      (365.2425 * 24 * 60 * 60 * 1000),
  );
}

function solveSemiannualYield({
  marketPrice,
  annualCouponRate,
  yearsRemaining,
  couponTaxRate,
}: {
  marketPrice: number;
  annualCouponRate: number;
  yearsRemaining: number;
  couponTaxRate: number;
}) {
  const periods = Math.max(1, Math.ceil(yearsRemaining * 2));
  const coupon = 100 * annualCouponRate * (1 - couponTaxRate) / 2;
  const presentValue = (periodicYield: number) => {
    let value = 0;
    for (let period = 1; period <= periods; period += 1) {
      value += coupon / (1 + periodicYield) ** period;
    }
    return value + 100 / (1 + periodicYield) ** periods;
  };

  let low = -0.49;
  let high = 1;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (presentValue(midpoint) > marketPrice) low = midpoint;
    else high = midpoint;
  }
  return ((low + high) / 2) * 2;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function strategyScores({
  netAnnualizedYield,
  yearsRemaining,
  closingPrice,
}: {
  netAnnualizedYield: number;
  yearsRemaining: number;
  closingPrice: number | null;
}) {
  const yieldScore = clampScore((netAnnualizedYield / 0.14) * 100);
  const durationScore =
    100 / (1 + Math.exp(-0.35 * (yearsRemaining - 10)));
  const priceScore =
    closingPrice === null
      ? 50
      : closingPrice <= 100
        ? 100
        : Math.max(0, 100 - ((closingPrice - 100) / 100) * 500);
  const confidenceScore = closingPrice === null ? 60 : 100;
  const strategyScore =
    yieldScore * 0.6 +
    durationScore * 0.25 +
    priceScore * 0.1 +
    confidenceScore * 0.05;

  return {
    strategyScore: Math.round(strategyScore * 10) / 10,
    yieldScore,
    durationScore,
    priceScore,
    confidenceScore,
  };
}

async function rsePage(url: string, forceRefresh: boolean) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "orestegabo.dev bond market reader",
    },
    ...(forceRefresh
      ? { cache: "no-store" as const }
      : { next: { revalidate: 15 * 60 } }),
  });
  if (!response.ok) throw new Error(`RSE returned ${response.status}.`);
  const responseDate = response.headers.get("date");
  const parsedResponseDate = responseDate ? new Date(responseDate) : null;
  return {
    html: await response.text(),
    fetchedAt:
      parsedResponseDate && !Number.isNaN(parsedResponseDate.getTime())
        ? parsedResponseDate.toISOString()
        : new Date().toISOString(),
  };
}

async function fixedIncomePages(forceRefresh: boolean) {
  const firstPage = await rsePage(RSE_FIXED_INCOME_URL, forceRefresh);
  const pageCount = fixedIncomePageCount(firstPage.html);
  if (pageCount === 1) {
    return { pages: [firstPage], pageCount: 1 };
  }

  const remaining = await Promise.allSettled(
    Array.from({ length: pageCount - 1 }, (_, index) => {
      const page = index + 2;
      const url = new URL(RSE_FIXED_INCOME_URL);
      url.searchParams.set("page_bonds-trades", String(page));
      url.searchParams.set("category", "TREASURY");
      return rsePage(url.toString(), forceRefresh);
    }),
  );
  const pages = [
    firstPage,
    ...remaining.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    ),
  ];
  return { pages, pageCount: pages.length };
}

export async function getRseMarketData(
  forceRefresh = false,
): Promise<RseMarketData> {
  try {
    const [marketPage, fixedIncomeResult] = await Promise.all([
      rsePage(RSE_BOND_MARKET_URL, forceRefresh).catch(() => null),
      fixedIncomePages(forceRefresh).catch(async () => ({
        pages: [await rsePage(RSE_OUTSTANDING_BONDS_URL, forceRefresh)],
        pageCount: 1,
      })),
    ]);

    const trades = (marketPage ? tableRows(marketPage.html) : [])
      .filter((cells) => cells.length >= 6)
      .map(([bond, closing, previous, change, volume, value]) => ({
        bond: cleanBondName(bond),
        closing,
        previous,
        change,
        volume,
        value,
      }));
    const tradePrices = new Map(
      trades.map((trade) => [
        normalizedBondName(trade.bond),
        price(trade.closing),
      ]),
    );
    const valuationDate = new Date();
    const fixedIncomeRows = fixedIncomeResult.pages.flatMap((page) =>
      tableRows(page.html),
    );
    const treasuryRows = fixedIncomeRows.filter(
      (cells) => cells.length >= 6 && /TREASURY/i.test(cells[0]),
    );

    const seen = new Set<string>();
    const outstanding = treasuryRows
      .map(
        ([
          bond,
          code,
          issueDate,
          maturityDate,
          couponRate,
          yieldToMaturity,
        ]) => {
          const cleanedBond = cleanBondName(bond);
          const closingPrice =
            tradePrices.get(normalizedBondName(cleanedBond)) ?? null;
          const annualCouponRate = percentage(couponRate);
          const yearsRemaining = yearsUntil(maturityDate, valuationDate);
          const publishedYield = percentage(yieldToMaturity);
          const grossYield =
            closingPrice === null
              ? publishedYield
              : solveSemiannualYield({
                  marketPrice: closingPrice,
                  annualCouponRate,
                  yearsRemaining,
                  couponTaxRate: 0,
                });
          const netAnnualizedYield =
            closingPrice === null
              ? publishedYield * (1 - 0.05)
              : solveSemiannualYield({
                  marketPrice: closingPrice,
                  annualCouponRate,
                  yearsRemaining,
                  couponTaxRate: 0.05,
                });
          const scores = strategyScores({
            netAnnualizedYield,
            yearsRemaining,
            closingPrice,
          });

          return {
            bond: cleanedBond,
            code,
            issueDate,
            maturityDate,
            couponRate,
            yieldToMaturity,
            closingPrice,
            grossYield,
            netAnnualizedYield,
            yearsRemaining,
            ...scores,
            yieldSource:
              closingPrice === null
                ? ("RSE published YTM" as const)
                : ("closing-price estimate" as const),
          };
        },
      )
      .filter((bond) => {
        const key = `${bond.code}-${bond.yieldToMaturity}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return {
      trades,
      tradesStatus:
        marketPage === null
          ? "error"
          : trades.length > 0
            ? "available"
            : "empty",
      outstanding,
      fixedIncomePagesFetched: fixedIncomeResult.pageCount,
      treasuryRowsAnalyzed: treasuryRows.length,
      fetchedAt: oldestFetchedAt(fixedIncomeResult.pages),
    };
  } catch {
    return {
      trades: [],
      tradesStatus: "error",
      outstanding: [],
      fixedIncomePagesFetched: 0,
      treasuryRowsAnalyzed: 0,
      fetchedAt: null,
    };
  }
}

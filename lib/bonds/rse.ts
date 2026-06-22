import "server-only";

import {
  listRecentTradeObservations,
  normalizeObservedBondName,
  recordRseTradeObservations,
} from "./market-observations";

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
  impliedCleanPrice: number | null;
  grossYield: number;
  netAnnualizedYield: number;
  yearsRemaining: number;
  strategyScore: number;
  yieldScore: number;
  durationScore: number;
  priceScore: number;
  confidenceScore: number;
  yieldSource: "closing-price estimate" | "RSE published YTM";
  recentTradeCount: number;
  lastTradedAt: string | null;
  lastTradedPrice: number | null;
  lastTradeChange: string;
  lastTradeVolume: string;
  lastTradeValue: string;
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

function shiftUtcMonths(date: Date, months: number) {
  const shifted = new Date(date);
  const day = shifted.getUTCDate();
  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0),
  ).getUTCDate();
  shifted.setUTCDate(Math.min(day, lastDay));
  return shifted;
}

function impliedCleanPrice({
  annualCouponRate,
  annualYield,
  maturityDate,
  valuationDate,
}: {
  annualCouponRate: number;
  annualYield: number;
  maturityDate: string;
  valuationDate: Date;
}) {
  const maturity = parseRseDate(maturityDate);
  if (
    !maturity ||
    maturity <= valuationDate ||
    annualCouponRate < 0 ||
    annualYield <= -1
  ) {
    return null;
  }

  const paymentDates = [maturity];
  let paymentDate = maturity;
  while (paymentDate > valuationDate && paymentDates.length < 100) {
    paymentDate = shiftUtcMonths(paymentDate, -6);
    if (paymentDate > valuationDate) paymentDates.unshift(paymentDate);
  }

  const nextPayment = paymentDates[0];
  const previousPayment = shiftUtcMonths(nextPayment, -6);
  const couponPeriodMs = nextPayment.getTime() - previousPayment.getTime();
  const timeToNextPaymentMs =
    nextPayment.getTime() - valuationDate.getTime();
  if (couponPeriodMs <= 0 || timeToNextPaymentMs < 0) return null;

  const firstPeriodFraction = timeToNextPaymentMs / couponPeriodMs;
  const periodicYield = annualYield / 2;
  const coupon = (100 * annualCouponRate) / 2;
  let dirtyPrice = 0;

  paymentDates.forEach((_, index) => {
    const exponent = firstPeriodFraction + index;
    dirtyPrice += coupon / (1 + periodicYield) ** exponent;
    if (index === paymentDates.length - 1) {
      dirtyPrice += 100 / (1 + periodicYield) ** exponent;
    }
  });

  const accruedFraction = 1 - firstPeriodFraction;
  const cleanPrice = dirtyPrice - coupon * accruedFraction;
  return Number.isFinite(cleanPrice)
    ? Math.round(cleanPrice * 1000) / 1000
    : null;
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
  const durationScore = clampScore((yearsRemaining / 12) * 100);
  const priceScore =
    closingPrice === null
      ? 50
      : closingPrice <= 100
        ? 100
        : Math.max(0, 100 - ((closingPrice - 100) / 100) * 500);
  const confidenceScore = closingPrice === null ? 60 : 100;
  const strategyScore =
    yieldScore * 0.7 +
    durationScore * 0.25 +
    priceScore * 0.05;

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
    const tradeDetails = new Map(
      trades.map((trade) => [
        normalizedBondName(trade.bond),
        trade,
      ]),
    );
    const valuationDate = new Date();
    const fixedIncomeRows = fixedIncomeResult.pages.flatMap((page) =>
      tableRows(page.html),
    );
    const treasuryRows = fixedIncomeRows.filter(
      (cells) => cells.length >= 6 && /TREASURY/i.test(cells[0]),
    );

    await recordRseTradeObservations({
      trades,
      fetchedAt: marketPage?.fetchedAt ?? null,
    }).catch(() => undefined);

    const baseOutstanding = treasuryRows
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
          const tradeDetail = tradeDetails.get(normalizedBondName(cleanedBond));
          const closingPrice =
            tradePrices.get(normalizedBondName(cleanedBond)) ?? null;
          const annualCouponRate = percentage(couponRate);
          const yearsRemaining = yearsUntil(maturityDate, valuationDate);
          const publishedYield = percentage(yieldToMaturity);
          const estimatedCleanPrice =
            closingPrice === null
              ? impliedCleanPrice({
                  annualCouponRate,
                  annualYield: publishedYield,
                  maturityDate,
                  valuationDate,
                })
              : null;
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
            impliedCleanPrice: estimatedCleanPrice,
            grossYield,
            netAnnualizedYield,
            yearsRemaining,
            ...scores,
            yieldSource:
              closingPrice === null
                ? ("RSE published YTM" as const)
                : ("closing-price estimate" as const),
            recentTradeCount: closingPrice === null ? 0 : 1,
            lastTradedAt: closingPrice === null ? null : marketPage?.fetchedAt ?? null,
            lastTradedPrice: closingPrice,
            lastTradeChange: tradeDetail?.change ?? "",
            lastTradeVolume: tradeDetail?.volume ?? "",
            lastTradeValue: tradeDetail?.value ?? "",
          };
        },
      )
      .filter((bond) => bond.yearsRemaining > 0);

    const recentObservations = await listRecentTradeObservations({
      bondNames: baseOutstanding.map((bond) => bond.bond),
    }).catch(() => new Map());

    const seen = new Set<string>();
    const outstanding = baseOutstanding
      .map((bond) => {
        const observation = recentObservations.get(
          normalizeObservedBondName(bond.bond),
        );
        if (!observation) return bond;

        return {
          ...bond,
          recentTradeCount: Math.max(
            bond.recentTradeCount,
            observation.tradeCount,
          ),
          lastTradedAt: observation.lastObservedAt,
          lastTradedPrice: observation.lastClosingPrice,
          lastTradeChange: observation.lastChange,
          lastTradeVolume: observation.lastVolume,
          lastTradeValue: observation.lastValue,
        };
      })
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

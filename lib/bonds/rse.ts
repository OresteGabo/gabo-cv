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
};

export type RseMarketData = {
  trades: RseMarketTrade[];
  outstanding: RseOutstandingBond[];
  fetchedAt: string | null;
};

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

function cleanBondName(value: string) {
  return value.replace(/\s*TREASURY\s*$/i, "").trim();
}

async function rsePage(url: string, forceRefresh: boolean) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "orestegabo.dev bond market reader",
    },
    ...(forceRefresh
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 * 60 } }),
  });
  if (!response.ok) throw new Error(`RSE returned ${response.status}.`);
  return response.text();
}

export async function getRseMarketData(
  forceRefresh = false,
): Promise<RseMarketData> {
  try {
    const [marketHtml, fixedIncomeHtml] = await Promise.all([
      rsePage(RSE_BOND_MARKET_URL, forceRefresh),
      rsePage(RSE_FIXED_INCOME_URL, forceRefresh).catch(() =>
        rsePage(RSE_OUTSTANDING_BONDS_URL, forceRefresh),
      ),
    ]);

    const trades = tableRows(marketHtml)
      .filter((cells) => cells.length >= 6)
      .map(([bond, closing, previous, change, volume, value]) => ({
        bond: cleanBondName(bond),
        closing,
        previous,
        change,
        volume,
        value,
      }));

    const seen = new Set<string>();
    const outstanding = tableRows(fixedIncomeHtml)
      .filter((cells) => cells.length >= 6 && /TREASURY/i.test(cells[0]))
      .map(
        ([
          bond,
          code,
          issueDate,
          maturityDate,
          couponRate,
          yieldToMaturity,
        ]) => ({
          bond: cleanBondName(bond),
          code,
          issueDate,
          maturityDate,
          couponRate,
          yieldToMaturity,
        }),
      )
      .filter((bond) => {
        const key = `${bond.code}-${bond.yieldToMaturity}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    return {
      trades,
      outstanding,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return { trades: [], outstanding: [], fetchedAt: null };
  }
}

import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { bondsDatabaseUrl } from "./database-config";
import { bondPurchaseKey, DuplicatePurchaseError } from "./purchase-identity";
import { canonicalPurchaseFromCatalog } from "./catalog";
import type { AccountPortfolioSummary, BondPurchase, BondPurchaseInput } from "./types";

type BondFileDatabase = {
  purchases: BondPurchase[];
};

let fileWriteQueue: Promise<void> = Promise.resolve();

function shouldUseFileDatabase(userId: string) {
  if (userId !== "owner" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) throw new Error("Invalid portfolio owner.");
  return userId === "owner" ? process.env.BONDS_PORTFOLIO_DATABASE !== "database" : !bondsDatabaseUrl();
}

function fileDatabasePath(userId: string) {
  if (userId !== "owner") return join(process.cwd(), ".data", "bonds-users", `${userId}.json`);
  const fileName = (
    process.env.BONDS_FILE_DATABASE_NAME ?? "bonds-portfolio.json"
  ).replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(process.cwd(), ".data", fileName);
}

function database() {
  const url = bondsDatabaseUrl();
  if (!url) {
    throw new Error("BONDS_DATABASE_URL is not configured.");
  }
  return neon(url);
}

function sortPurchases(purchases: BondPurchase[]) {
  return [...purchases].sort(
    (a, b) =>
      b.purchaseDate.localeCompare(a.purchaseDate) ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

function normalizePurchase(value: unknown): BondPurchase | null {
  if (!value || typeof value !== "object") return null;
  const purchase = value as Partial<BondPurchase>;
  if (!purchase.id || !purchase.purchaseDate || !purchase.bondName) return null;

  return canonicalPurchaseFromCatalog({
    id: purchase.id,
    instrumentType: purchase.instrumentType ?? "treasury",
    issuer: purchase.issuer ?? "Government of Rwanda",
    currency: purchase.currency ?? "RWF",
    market: purchase.market ?? "primary",
    purchaseDate: purchase.purchaseDate,
    settlementDate: purchase.settlementDate ?? purchase.purchaseDate,
    bondName: purchase.bondName,
    isin: purchase.isin ?? "",
    tenorYears: purchase.tenorYears ?? 0,
    faceValue: purchase.faceValue ?? purchase.amountInvested ?? 0,
    pricePercent: purchase.pricePercent ?? 100,
    accruedInterestPaid: purchase.accruedInterestPaid ?? 0,
    feesPaid: purchase.feesPaid ?? 0,
    amountInvested:
      purchase.amountInvested ??
      (purchase.faceValue ?? 0) + (purchase.feesPaid ?? 0),
    couponRate: purchase.couponRate ?? 0,
    withholdingTaxRate: purchase.withholdingTaxRate ?? 0.05,
    maturityDate: purchase.maturityDate ?? purchase.purchaseDate,
    firstCouponDate: purchase.firstCouponDate ?? "",
    couponDates: Array.isArray(purchase.couponDates)
      ? purchase.couponDates
      : [],
    couponFrequency: purchase.couponFrequency ?? 2,
    scheduleConfidence: purchase.scheduleConfidence ?? "estimated",
    broker: purchase.broker ?? "",
    accountReference: purchase.accountReference ?? "",
    sourceUrl: purchase.sourceUrl ?? "",
    status: purchase.status ?? "active",
    notes: purchase.notes ?? "",
    createdAt: purchase.createdAt ?? new Date().toISOString(),
  });
}

async function readFileDatabase(userId: string): Promise<BondFileDatabase> {
  const path = fileDatabasePath(userId);
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<BondFileDatabase>;
    const purchases = Array.isArray(parsed.purchases)
      ? parsed.purchases
          .map((purchase) => normalizePurchase(purchase))
          .filter((purchase): purchase is BondPurchase => Boolean(purchase))
      : [];
    return { purchases: sortPurchases(purchases) };
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") {
      return { purchases: [] };
    }
    throw error;
  }
}

async function writeFileDatabase(userId: string, fileDatabase: BondFileDatabase) {
  const path = fileDatabasePath(userId);
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  const payload = JSON.stringify(
    { purchases: sortPurchases(fileDatabase.purchases) },
    null,
    2,
  );
  await writeFile(temporaryPath, `${payload}\n`, "utf8");
  await rename(temporaryPath, path);
}

async function updateFileDatabase<T>(
  userId: string,
  change: (fileDatabase: BondFileDatabase) => T | Promise<T>,
): Promise<T> {
  const operation = fileWriteQueue.then(async () => {
    const fileDatabase = await readFileDatabase(userId);
    const result = await change(fileDatabase);
    await writeFileDatabase(userId, fileDatabase);
    return result;
  });
  fileWriteQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

function purchaseFromInput(
  input: BondPurchaseInput,
  existing?: BondPurchase,
): BondPurchase {
  return canonicalPurchaseFromCatalog({
    id: existing?.id ?? randomUUID(),
    ...input,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
}

async function listFilePurchases(userId: string): Promise<BondPurchase[]> {
  await fileWriteQueue;
  const fileDatabase = await readFileDatabase(userId);
  return fileDatabase.purchases;
}

async function createFilePurchase(
  userId: string,
  input: BondPurchaseInput,
): Promise<BondPurchase> {
  return updateFileDatabase(userId, (fileDatabase) => {
    const purchase = purchaseFromInput(input);
    if (fileDatabase.purchases.some((item) => bondPurchaseKey(item) === bondPurchaseKey(purchase))) throw new DuplicatePurchaseError();
    fileDatabase.purchases = sortPurchases([
      purchase,
      ...fileDatabase.purchases,
    ]);
    return purchase;
  });
}

async function getFilePurchase(userId: string, id: string): Promise<BondPurchase | null> {
  await fileWriteQueue;
  const fileDatabase = await readFileDatabase(userId);
  return fileDatabase.purchases.find((purchase) => purchase.id === id) ?? null;
}

async function deleteFilePurchase(userId: string, id: string): Promise<boolean> {
  return updateFileDatabase(userId, (fileDatabase) => {
    const initialLength = fileDatabase.purchases.length;
    fileDatabase.purchases = fileDatabase.purchases.filter(
      (purchase) => purchase.id !== id,
    );
    return fileDatabase.purchases.length !== initialLength;
  });
}

async function updateFilePurchase(
  userId: string,
  id: string,
  input: BondPurchaseInput,
): Promise<BondPurchase | null> {
  return updateFileDatabase(userId, (fileDatabase) => {
    const index = fileDatabase.purchases.findIndex(
      (purchase) => purchase.id === id,
    );
    if (index === -1) return null;
    const purchase = purchaseFromInput(input, fileDatabase.purchases[index]);
    if (fileDatabase.purchases.some((item) => item.id !== id && bondPurchaseKey(item) === bondPurchaseKey(purchase))) throw new DuplicatePurchaseError();
    fileDatabase.purchases[index] = purchase;
    fileDatabase.purchases = sortPurchases(fileDatabase.purchases);
    return purchase;
  });
}

export async function listPurchases(userId: string): Promise<BondPurchase[]> {
  if (shouldUseFileDatabase(userId)) return listFilePurchases(userId);

  const sql = database();
  const rows = await sql`
    SELECT
      id::text,
      instrument_type AS "instrumentType",
      issuer,
      currency,
      market,
      purchase_date::text AS "purchaseDate",
      COALESCE(settlement_date::text, purchase_date::text) AS "settlementDate",
      bond_name AS "bondName",
      isin,
      tenor_years::float8 AS "tenorYears",
      face_value::float8 AS "faceValue",
      price_percent::float8 AS "pricePercent",
      accrued_interest_paid::float8 AS "accruedInterestPaid",
      fees_paid::float8 AS "feesPaid",
      amount_invested::float8 AS "amountInvested",
      coupon_rate::float8 AS "couponRate",
      withholding_tax_rate::float8 AS "withholdingTaxRate",
      maturity_date::text AS "maturityDate",
      COALESCE(first_coupon_date::text, '') AS "firstCouponDate",
      COALESCE(coupon_dates, '[]'::jsonb) AS "couponDates",
      coupon_frequency AS "couponFrequency",
      schedule_confidence AS "scheduleConfidence",
      broker,
      account_reference AS "accountReference",
      source_url AS "sourceUrl",
      status,
      notes,
      created_at::text AS "createdAt"
    FROM bond_purchases
    WHERE owner_id = ${userId}
    ORDER BY purchase_date DESC, created_at DESC
  `;
  return rows
    .map((row) => normalizePurchase(row))
    .filter((purchase): purchase is BondPurchase => Boolean(purchase));
}

// Called only after the account-management API has verified owner access.
export async function accountPortfolioSummaries(userIds: string[]): Promise<Map<string, AccountPortfolioSummary>> {
  const summaries = new Map<string, AccountPortfolioSummary>();
  const databaseIds: string[] = [];
  for (const userId of new Set(userIds)) {
    summaries.set(userId, { purchaseCount: 0, principalByCurrency: [], latestPurchase: null });
    if (!shouldUseFileDatabase(userId)) { databaseIds.push(userId); continue; }
    const purchases = await listFilePurchases(userId);
    const totals = new Map<string, number>();
    for (const purchase of purchases) totals.set(purchase.currency, (totals.get(purchase.currency) ?? 0) + purchase.faceValue);
    const latest = [...purchases].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))[0];
    summaries.set(userId, {
      purchaseCount: purchases.length,
      principalByCurrency: [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 })),
      latestPurchase: latest ? { bondName: latest.bondName, isin: latest.isin, purchaseDate: latest.purchaseDate, createdAt: latest.createdAt } : null,
    });
  }
  if (!databaseIds.length) return summaries;
  const sql = database();
  const rows = await sql`
    WITH scoped AS (
      SELECT owner_id, currency, face_value, bond_name, isin, purchase_date, created_at, id
      FROM bond_purchases WHERE owner_id IN (SELECT jsonb_array_elements_text(${JSON.stringify(databaseIds)}::jsonb))
    ), totals AS (
      SELECT owner_id, currency, SUM(face_value)::float8 AS principal, COUNT(*)::int AS count
      FROM scoped GROUP BY owner_id, currency
    ), latest AS (
      SELECT DISTINCT ON (owner_id) owner_id, bond_name, isin, purchase_date, created_at
      FROM scoped ORDER BY owner_id, created_at DESC, id DESC
    )
    SELECT totals.owner_id AS "userId", totals.currency, totals.principal, totals.count,
      latest.bond_name AS "bondName", latest.isin, latest.purchase_date::text AS "purchaseDate", latest.created_at::text AS "createdAt"
    FROM totals JOIN latest ON latest.owner_id = totals.owner_id
    ORDER BY totals.owner_id, totals.currency`;
  for (const row of rows) {
    const summary = summaries.get(String(row.userId))!;
    summary.purchaseCount += Number(row.count);
    summary.principalByCurrency.push({ currency: String(row.currency).trim(), amount: Number(row.principal) });
    summary.latestPurchase = { bondName: String(row.bondName), isin: String(row.isin), purchaseDate: String(row.purchaseDate), createdAt: new Date(String(row.createdAt)).toISOString() };
  }
  return summaries;
}

export async function createPurchase(
  userId: string,
  input: BondPurchaseInput,
): Promise<BondPurchase> {
  if (shouldUseFileDatabase(userId)) return createFilePurchase(userId, input);
  input = purchaseFromInput(input);

  const sql = database();
  const rows = await sql`
    INSERT INTO bond_purchases (
      dedup_key,
      owner_id,
      instrument_type,
      issuer,
      currency,
      market,
      purchase_date,
      settlement_date,
      bond_name,
      isin,
      tenor_years,
      face_value,
      price_percent,
      accrued_interest_paid,
      fees_paid,
      amount_invested,
      coupon_rate,
      withholding_tax_rate,
      maturity_date,
      first_coupon_date,
      coupon_dates,
      coupon_frequency,
      schedule_confidence,
      broker,
      account_reference,
      source_url,
      status,
      notes
    )
    VALUES (
      ${bondPurchaseKey(input)},
      ${userId},
      ${input.instrumentType},
      ${input.issuer},
      ${input.currency},
      ${input.market},
      ${input.purchaseDate},
      ${input.settlementDate},
      ${input.bondName},
      ${input.isin},
      ${input.tenorYears},
      ${input.faceValue},
      ${input.pricePercent},
      ${input.accruedInterestPaid},
      ${input.feesPaid},
      ${input.amountInvested},
      ${input.couponRate},
      ${input.withholdingTaxRate},
      ${input.maturityDate},
      ${input.firstCouponDate || null},
      ${JSON.stringify(input.couponDates)}::jsonb,
      ${input.couponFrequency},
      ${input.scheduleConfidence},
      ${input.broker},
      ${input.accountReference},
      ${input.sourceUrl},
      ${input.status},
      ${input.notes}
    )
    RETURNING
      id::text,
      instrument_type AS "instrumentType",
      issuer,
      currency,
      market,
      purchase_date::text AS "purchaseDate",
      COALESCE(settlement_date::text, purchase_date::text) AS "settlementDate",
      bond_name AS "bondName",
      isin,
      tenor_years::float8 AS "tenorYears",
      face_value::float8 AS "faceValue",
      price_percent::float8 AS "pricePercent",
      accrued_interest_paid::float8 AS "accruedInterestPaid",
      fees_paid::float8 AS "feesPaid",
      amount_invested::float8 AS "amountInvested",
      coupon_rate::float8 AS "couponRate",
      withholding_tax_rate::float8 AS "withholdingTaxRate",
      maturity_date::text AS "maturityDate",
      COALESCE(first_coupon_date::text, '') AS "firstCouponDate",
      COALESCE(coupon_dates, '[]'::jsonb) AS "couponDates",
      coupon_frequency AS "couponFrequency",
      schedule_confidence AS "scheduleConfidence",
      broker,
      account_reference AS "accountReference",
      source_url AS "sourceUrl",
      status,
      notes,
      created_at::text AS "createdAt"
  `;
  const purchase = normalizePurchase(rows[0]);
  if (!purchase) throw new Error("The saved purchase could not be normalized.");
  return purchase;
}

export async function getPurchase(userId: string, id: string): Promise<BondPurchase | null> {
  if (shouldUseFileDatabase(userId)) return getFilePurchase(userId, id);

  const sql = database();
  const rows = await sql`
    SELECT
      id::text,
      instrument_type AS "instrumentType",
      issuer,
      currency,
      market,
      purchase_date::text AS "purchaseDate",
      COALESCE(settlement_date::text, purchase_date::text) AS "settlementDate",
      bond_name AS "bondName",
      isin,
      tenor_years::float8 AS "tenorYears",
      face_value::float8 AS "faceValue",
      price_percent::float8 AS "pricePercent",
      accrued_interest_paid::float8 AS "accruedInterestPaid",
      fees_paid::float8 AS "feesPaid",
      amount_invested::float8 AS "amountInvested",
      coupon_rate::float8 AS "couponRate",
      withholding_tax_rate::float8 AS "withholdingTaxRate",
      maturity_date::text AS "maturityDate",
      COALESCE(first_coupon_date::text, '') AS "firstCouponDate",
      COALESCE(coupon_dates, '[]'::jsonb) AS "couponDates",
      coupon_frequency AS "couponFrequency",
      schedule_confidence AS "scheduleConfidence",
      broker,
      account_reference AS "accountReference",
      source_url AS "sourceUrl",
      status,
      notes,
      created_at::text AS "createdAt"
    FROM bond_purchases
    WHERE id = ${id}::uuid AND owner_id = ${userId}
    LIMIT 1
  `;
  return normalizePurchase(rows[0]);
}

export async function deletePurchase(userId: string, id: string): Promise<boolean> {
  if (shouldUseFileDatabase(userId)) return deleteFilePurchase(userId, id);

  const sql = database();
  const rows = await sql`
    DELETE FROM bond_purchases
    WHERE id = ${id}::uuid AND owner_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function updatePurchase(
  userId: string,
  id: string,
  input: BondPurchaseInput,
): Promise<BondPurchase | null> {
  if (shouldUseFileDatabase(userId)) return updateFilePurchase(userId, id, input);
  input = purchaseFromInput(input);

  const sql = database();
  const rows = await sql`
    UPDATE bond_purchases
    SET
      dedup_key = ${bondPurchaseKey(input)},
      instrument_type = ${input.instrumentType},
      issuer = ${input.issuer},
      currency = ${input.currency},
      market = ${input.market},
      purchase_date = ${input.purchaseDate},
      settlement_date = ${input.settlementDate},
      bond_name = ${input.bondName},
      isin = ${input.isin},
      tenor_years = ${input.tenorYears},
      face_value = ${input.faceValue},
      price_percent = ${input.pricePercent},
      accrued_interest_paid = ${input.accruedInterestPaid},
      fees_paid = ${input.feesPaid},
      amount_invested = ${input.amountInvested},
      coupon_rate = ${input.couponRate},
      withholding_tax_rate = ${input.withholdingTaxRate},
      maturity_date = ${input.maturityDate},
      first_coupon_date = ${input.firstCouponDate || null},
      coupon_dates = ${JSON.stringify(input.couponDates)}::jsonb,
      coupon_frequency = ${input.couponFrequency},
      schedule_confidence = ${input.scheduleConfidence},
      broker = ${input.broker},
      account_reference = ${input.accountReference},
      source_url = ${input.sourceUrl},
      status = ${input.status},
      notes = ${input.notes},
      updated_at = now()
    WHERE id = ${id}::uuid AND owner_id = ${userId}
    RETURNING
      id::text,
      instrument_type AS "instrumentType",
      issuer,
      currency,
      market,
      purchase_date::text AS "purchaseDate",
      COALESCE(settlement_date::text, purchase_date::text) AS "settlementDate",
      bond_name AS "bondName",
      isin,
      tenor_years::float8 AS "tenorYears",
      face_value::float8 AS "faceValue",
      price_percent::float8 AS "pricePercent",
      accrued_interest_paid::float8 AS "accruedInterestPaid",
      fees_paid::float8 AS "feesPaid",
      amount_invested::float8 AS "amountInvested",
      coupon_rate::float8 AS "couponRate",
      withholding_tax_rate::float8 AS "withholdingTaxRate",
      maturity_date::text AS "maturityDate",
      COALESCE(first_coupon_date::text, '') AS "firstCouponDate",
      COALESCE(coupon_dates, '[]'::jsonb) AS "couponDates",
      coupon_frequency AS "couponFrequency",
      schedule_confidence AS "scheduleConfidence",
      broker,
      account_reference AS "accountReference",
      source_url AS "sourceUrl",
      status,
      notes,
      created_at::text AS "createdAt"
  `;
  return normalizePurchase(rows[0]);
}

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type { BondPurchase, BondPurchaseInput } from "./types";

type BondFileDatabase = {
  purchases: BondPurchase[];
};

let fileWriteQueue: Promise<void> = Promise.resolve();

function shouldUseFileDatabase() {
  const mode = process.env.BONDS_PORTFOLIO_DATABASE;
  if (mode === "file") {
    return (
      process.env.NODE_ENV !== "production" ||
      process.env.BONDS_ALLOW_PRODUCTION_FILE_DATABASE === "true"
    );
  }
  if (mode === "database") return false;
  return !process.env.BONDS_DATABASE_URL && process.env.NODE_ENV !== "production";
}

function fileDatabasePath() {
  const fileName = (
    process.env.BONDS_FILE_DATABASE_NAME ?? "bonds-portfolio.json"
  ).replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(process.cwd(), ".data", fileName);
}

function database() {
  const url = process.env.BONDS_DATABASE_URL;
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

  return {
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
  };
}

async function readFileDatabase(): Promise<BondFileDatabase> {
  const path = fileDatabasePath();
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

async function writeFileDatabase(fileDatabase: BondFileDatabase) {
  const path = fileDatabasePath();
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
  change: (fileDatabase: BondFileDatabase) => T | Promise<T>,
): Promise<T> {
  const operation = fileWriteQueue.then(async () => {
    const fileDatabase = await readFileDatabase();
    const result = await change(fileDatabase);
    await writeFileDatabase(fileDatabase);
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
  return {
    id: existing?.id ?? randomUUID(),
    ...input,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

async function listFilePurchases(): Promise<BondPurchase[]> {
  await fileWriteQueue;
  const fileDatabase = await readFileDatabase();
  return fileDatabase.purchases;
}

async function createFilePurchase(
  input: BondPurchaseInput,
): Promise<BondPurchase> {
  return updateFileDatabase((fileDatabase) => {
    const purchase = purchaseFromInput(input);
    fileDatabase.purchases = sortPurchases([
      purchase,
      ...fileDatabase.purchases,
    ]);
    return purchase;
  });
}

async function getFilePurchase(id: string): Promise<BondPurchase | null> {
  await fileWriteQueue;
  const fileDatabase = await readFileDatabase();
  return fileDatabase.purchases.find((purchase) => purchase.id === id) ?? null;
}

async function deleteFilePurchase(id: string): Promise<boolean> {
  return updateFileDatabase((fileDatabase) => {
    const initialLength = fileDatabase.purchases.length;
    fileDatabase.purchases = fileDatabase.purchases.filter(
      (purchase) => purchase.id !== id,
    );
    return fileDatabase.purchases.length !== initialLength;
  });
}

async function updateFilePurchase(
  id: string,
  input: BondPurchaseInput,
): Promise<BondPurchase | null> {
  return updateFileDatabase((fileDatabase) => {
    const index = fileDatabase.purchases.findIndex(
      (purchase) => purchase.id === id,
    );
    if (index === -1) return null;
    const purchase = purchaseFromInput(input, fileDatabase.purchases[index]);
    fileDatabase.purchases[index] = purchase;
    fileDatabase.purchases = sortPurchases(fileDatabase.purchases);
    return purchase;
  });
}

export async function listPurchases(): Promise<BondPurchase[]> {
  if (shouldUseFileDatabase()) return listFilePurchases();

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
    ORDER BY purchase_date DESC, created_at DESC
  `;
  return rows as BondPurchase[];
}

export async function createPurchase(
  input: BondPurchaseInput,
): Promise<BondPurchase> {
  if (shouldUseFileDatabase()) return createFilePurchase(input);

  const sql = database();
  const rows = await sql`
    INSERT INTO bond_purchases (
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
  return rows[0] as BondPurchase;
}

export async function getPurchase(id: string): Promise<BondPurchase | null> {
  if (shouldUseFileDatabase()) return getFilePurchase(id);

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
    WHERE id = ${id}::uuid
    LIMIT 1
  `;
  return (rows[0] as BondPurchase | undefined) ?? null;
}

export async function deletePurchase(id: string): Promise<boolean> {
  if (shouldUseFileDatabase()) return deleteFilePurchase(id);

  const sql = database();
  const rows = await sql`
    DELETE FROM bond_purchases
    WHERE id = ${id}::uuid
    RETURNING id
  `;
  return rows.length > 0;
}

export async function updatePurchase(
  id: string,
  input: BondPurchaseInput,
): Promise<BondPurchase | null> {
  if (shouldUseFileDatabase()) return updateFilePurchase(id, input);

  const sql = database();
  const rows = await sql`
    UPDATE bond_purchases
    SET
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
    WHERE id = ${id}::uuid
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
  return (rows[0] as BondPurchase | undefined) ?? null;
}

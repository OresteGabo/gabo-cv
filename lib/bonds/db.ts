import { neon } from "@neondatabase/serverless";
import type { BondPurchase, BondPurchaseInput } from "./types";

function database() {
  const url = process.env.BONDS_DATABASE_URL;
  if (!url) {
    throw new Error("BONDS_DATABASE_URL is not configured.");
  }
  return neon(url);
}

export async function listPurchases(): Promise<BondPurchase[]> {
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

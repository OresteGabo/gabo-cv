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
      purchase_date::text AS "purchaseDate",
      bond_name AS "bondName",
      isin,
      tenor_years::float8 AS "tenorYears",
      amount_invested::float8 AS "amountInvested",
      coupon_rate::float8 AS "couponRate",
      maturity_date::text AS "maturityDate",
      coupon_frequency AS "couponFrequency",
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
      purchase_date,
      bond_name,
      isin,
      tenor_years,
      amount_invested,
      coupon_rate,
      maturity_date,
      coupon_frequency,
      notes
    )
    VALUES (
      ${input.purchaseDate},
      ${input.bondName},
      ${input.isin},
      ${input.tenorYears},
      ${input.amountInvested},
      ${input.couponRate},
      ${input.maturityDate},
      ${input.couponFrequency},
      ${input.notes}
    )
    RETURNING
      id::text,
      purchase_date::text AS "purchaseDate",
      bond_name AS "bondName",
      isin,
      tenor_years::float8 AS "tenorYears",
      amount_invested::float8 AS "amountInvested",
      coupon_rate::float8 AS "couponRate",
      maturity_date::text AS "maturityDate",
      coupon_frequency AS "couponFrequency",
      notes,
      created_at::text AS "createdAt"
  `;
  return rows[0] as BondPurchase;
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

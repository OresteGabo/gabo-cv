import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { createPurchase, listPurchases } from "@/lib/bonds/db";
import { isSameOriginRequest } from "@/lib/bonds/request";
import type { BondPurchaseInput } from "@/lib/bonds/types";
import {
  MAX_ANNUAL_COUPON_RATE,
  MIN_ANNUAL_COUPON_RATE,
  TREASURY_BOND_TENORS,
} from "@/lib/bonds/calculations";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function parsePurchase(value: unknown): BondPurchaseInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const purchaseDate = String(input.purchaseDate ?? "");
  const bondName = String(input.bondName ?? "").trim();
  const isin = String(input.isin ?? "").trim().toUpperCase();
  const tenorYears = Number(input.tenorYears);
  const amountInvested = Number(input.amountInvested);
  const couponRate = Number(input.couponRate);
  const maturityDate = String(input.maturityDate ?? "");
  const couponFrequency = Number(input.couponFrequency);
  const notes = String(input.notes ?? "").trim();

  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  if (
    !validDate.test(purchaseDate) ||
    !validDate.test(maturityDate) ||
    new Date(maturityDate) <= new Date(purchaseDate) ||
    bondName.length < 1 ||
    bondName.length > 120 ||
    isin.length > 32 ||
    !Number.isFinite(tenorYears) ||
    !TREASURY_BOND_TENORS.includes(
      tenorYears as (typeof TREASURY_BOND_TENORS)[number],
    ) ||
    !Number.isFinite(amountInvested) ||
    amountInvested < 100_000 ||
    amountInvested % 100_000 !== 0 ||
    !Number.isFinite(couponRate) ||
    couponRate < MIN_ANNUAL_COUPON_RATE ||
    couponRate > MAX_ANNUAL_COUPON_RATE ||
    !Number.isInteger(couponFrequency) ||
    couponFrequency < 1 ||
    couponFrequency > 12 ||
    notes.length > 1000
  ) {
    return null;
  }

  return {
    purchaseDate,
    bondName,
    isin,
    tenorYears,
    amountInvested,
    couponRate,
    maturityDate,
    couponFrequency,
    notes,
  };
}

export async function GET() {
  if (!(await getBondSession())) return unauthorized();
  try {
    return NextResponse.json({ purchases: await listPurchases() });
  } catch {
    return NextResponse.json(
      { error: "The portfolio database is not available." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await getBondSession())) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const purchase = parsePurchase(body);
  if (!purchase) {
    return NextResponse.json(
      { error: "Check the purchase details and try again." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      { purchase: await createPurchase(purchase) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "The purchase could not be saved." },
      { status: 503 },
    );
  }
}

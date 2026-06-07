import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { createPurchase, listPurchases } from "@/lib/bonds/db";
import { isSameOriginRequest } from "@/lib/bonds/request";
import { parsePurchase } from "@/lib/bonds/validation";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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

import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { createPurchase, listPurchases } from "@/lib/bonds/db";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";
import { parsePurchase } from "@/lib/bonds/validation";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await getBondSession();
  if (!session) return unauthorized();
  try {
    return NextResponse.json({ purchases: await listPurchases(session.userId) });
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
  const session = await getBondSession();
  if (!session) return unauthorized();
  const bodyResult = await readBoundedJsonBody(request, 32_768);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { error: bodyResult.error },
      { status: bodyResult.status },
    );
  }
  const purchase = parsePurchase(bodyResult.data);
  if (!purchase) {
    return NextResponse.json(
      { error: "Check the purchase details and try again." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      { purchase: await createPurchase(session.userId, purchase) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "The purchase could not be saved." },
      { status: 503 },
    );
  }
}

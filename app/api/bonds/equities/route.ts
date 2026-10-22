import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { createEquityPurchase, listEquityHoldings } from "@/lib/bonds/equities";
import { parseEquityPurchase } from "@/lib/bonds/equity-validation";
import { isDuplicatePurchaseError } from "@/lib/bonds/purchase-identity";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";

export async function GET() {
  const session = await getBondSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ holdings: await listEquityHoldings(session.userId) }); }
  catch { return NextResponse.json({ error: "Share purchases could not be loaded. Please try again." }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await getBondSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await readBoundedJsonBody(request, 16_384);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const purchase = parseEquityPurchase(body.data);
  if (!purchase) return NextResponse.json({ error: "Check the share details, dates and fee totals before saving." }, { status: 400 });
  try { return NextResponse.json({ holding: await createEquityPurchase(session.userId, purchase) }, { status: 201 }); }
  catch (error) {
    if (isDuplicatePurchaseError(error)) return NextResponse.json({ error: "This share purchase is already saved in your portfolio." }, { status: 409 });
    return NextResponse.json({ error: "The share purchase could not be saved. Please try again." }, { status: 503 });
  }
}

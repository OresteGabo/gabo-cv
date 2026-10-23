import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { listPurchases } from "@/lib/bonds/db";
import { listEquityHoldings } from "@/lib/bonds/equities";
import { mobilePortfolioOverview } from "@/lib/bonds/mobile-overview";

export async function GET() {
  const session = await getBondSession();
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers });
  try {
    const [bonds, shares] = await Promise.all([listPurchases(session.userId), listEquityHoldings(session.userId)]);
    return NextResponse.json(mobilePortfolioOverview(bonds, shares, new Date().toISOString().slice(0, 10)), { headers });
  } catch {
    return NextResponse.json({ error: "The portfolio could not be loaded. Please try again." }, { status: 503, headers });
  }
}

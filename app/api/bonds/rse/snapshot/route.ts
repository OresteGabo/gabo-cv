import { NextRequest, NextResponse } from "next/server";
import { getRseMarketData } from "@/lib/bonds/rse";

function isAuthorized(request: NextRequest) {
  const secret = process.env.BONDS_MARKET_SNAPSHOT_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  return authorization === `Bearer ${secret}` || querySecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const marketData = await getRseMarketData(true);

  return NextResponse.json(
    {
      fetchedAt: marketData.fetchedAt,
      trades: marketData.trades.length,
      treasuryRowsAnalyzed: marketData.treasuryRowsAnalyzed,
      fixedIncomePagesFetched: marketData.fixedIncomePagesFetched,
      tradesStatus: marketData.tradesStatus,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

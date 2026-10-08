import { NextRequest, NextResponse } from "next/server";
import { getRseMarketData } from "@/lib/bonds/rse";

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.has("refresh");
  const marketData = await getRseMarketData(forceRefresh);

  return NextResponse.json(marketData, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

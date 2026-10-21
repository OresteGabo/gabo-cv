import { NextRequest, NextResponse } from "next/server";
import { listEquityObservations } from "@/lib/bonds/equity-observations";

export async function GET(request: NextRequest) {
  const tickers = [...new Set((request.nextUrl.searchParams.get("tickers") ?? "").split(","))];
  if (!tickers.length || tickers.length > 10 || tickers.some((ticker) => !/^[A-Z][A-Z0-9]{1,9}$/.test(ticker))) return NextResponse.json({ error: "Choose up to ten stock symbols." }, { status: 400 });
  try { return NextResponse.json(await listEquityObservations(tickers)); }
  catch { return NextResponse.json({ available: false, observations: [] }); }
}

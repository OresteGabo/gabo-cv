import { NextRequest, NextResponse } from "next/server";
import { listEquityObservations } from "@/lib/bonds/equity-observations";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? "all";
  if (period !== "month" && period !== "year" && period !== "all") return NextResponse.json({ error: "Choose month, year, or all history." }, { status: 400 });
  const tickers = [...new Set((request.nextUrl.searchParams.get("tickers") ?? "").split(","))];
  if (!tickers.length || tickers.length > 10 || tickers.some((ticker) => !/^[A-Z][A-Z0-9]{1,9}$/.test(ticker))) return NextResponse.json({ error: "Choose up to ten stock symbols." }, { status: 400 });
  try { return NextResponse.json(await listEquityObservations(tickers, period)); }
  catch { return NextResponse.json({ available: false, resolution: "daily", observations: [] }); }
}

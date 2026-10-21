import { timingSafeEqual, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getEquityQuotes } from "@/lib/bonds/rse-quotes";
import { recordEquityCollectionRun, recordEquityQuotes } from "@/lib/bonds/equity-observations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!secret || !timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const startedAt = new Date().toISOString();
  try {
    let data = await getEquityQuotes({ fresh: true });
    // Vercel does not retry failed cron invocations. One bounded upstream retry.
    if (data.source.status !== "available" || !data.source.publishedAt) data = await getEquityQuotes({ fresh: true });
    const result = await recordEquityQuotes(data);
    await recordEquityCollectionRun(startedAt, result.status, result.status === "saved" ? result.marketDate : null);
    console.info("[rse-daily]", JSON.stringify(result));
    return NextResponse.json(result, { status: result.status === "saved" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    await recordEquityCollectionRun(startedAt, "collection-failed", null).catch(() => undefined);
    console.error("[rse-daily] collection-failed");
    return NextResponse.json({ status: "collection-failed" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

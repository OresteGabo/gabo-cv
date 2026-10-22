import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { parsePdfImportReport } from "@/lib/bonds/pdf-import-diagnostics";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";

const recent = new Map<string, number>();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return new NextResponse(null, { status: 403 });
  try {
    const session = await getBondSession();
    if (!session) return new NextResponse(null, { status: 401 });
    const body = await readBoundedJsonBody(request, 1024);
    if (!body.ok) return new NextResponse(null, { status: body.status });
    const report = parsePdfImportReport(body.data);
    if (!report) return new NextResponse(null, { status: 400 });
    const now = Date.now();
    // Best-effort, bounded suppression within each server instance. Account IDs
    // are used only for suppression, never included in the log or response.
    if ((recent.get(session.userId) ?? 0) + 30_000 <= now) {
      if (recent.size >= 512) recent.delete(recent.keys().next().value!);
      recent.set(session.userId, now);
      console.warn("[purchase-pdf-import]", report);
    }
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch { return new NextResponse(null, { status: 503 }); }
}

import { NextRequest, NextResponse } from "next/server";
import { consumeAttempt } from "./auth-store";
import { tokenHash } from "./auth-crypto";

export function authJson(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
export async function authRateLimited(request: NextRequest, scope: string, identity: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) || "unknown";
  if (await consumeAttempt(tokenHash(`${scope}:global`), 100)) return true;
  const results = await Promise.all([
    consumeAttempt(tokenHash(`${scope}:identity:${identity}`), 5),
    consumeAttempt(tokenHash(`${scope}:ip:${ip}`), 25),
  ]);
  return results.some(Boolean);
}

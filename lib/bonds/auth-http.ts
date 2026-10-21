import { NextRequest, NextResponse } from "next/server";
import { consumeAttempt } from "./auth-store";
import { tokenHash } from "./auth-crypto";
import { fileOwnerMode } from "./auth-mode";
import { consumeFileOwnerAttempt } from "./file-owner-session";

export function authJson(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
export async function authRateLimited(request: NextRequest, scope: string, identity: string) {
  const consume = fileOwnerMode() ? consumeFileOwnerAttempt : consumeAttempt;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) || "unknown";
  if (await consume(tokenHash(`${scope}:global`), 100)) return true;
  const results = await Promise.all([
    consume(tokenHash(`${scope}:identity:${identity}`), 5),
    consume(tokenHash(`${scope}:ip:${ip}`), 25),
  ]);
  return results.some(Boolean);
}

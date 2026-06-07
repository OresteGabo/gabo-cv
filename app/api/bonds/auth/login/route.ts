import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookie,
  TEMPORARY_ADMIN_EMAIL,
  verifyPassword,
} from "@/lib/bonds/auth";
import { isSameOriginRequest } from "@/lib/bonds/request";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const key = clientKey(request);
  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const configuredEmail = (
    process.env.BONDS_ADMIN_EMAIL ?? TEMPORARY_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();
  const email = body.email?.trim().toLowerCase();
  if (
    !configuredEmail ||
    !email ||
    email !== configuredEmail ||
    !body.password ||
    !verifyPassword(body.password)
  ) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  attempts.delete(key);
  const response = NextResponse.json({ authenticated: true, email });
  response.cookies.set(sessionCookie(createSessionToken(email)));
  return response;
}

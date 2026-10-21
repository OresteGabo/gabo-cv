import { NextRequest } from "next/server";
import { createSession, ownerEmail, revokeSession, sessionCookie } from "@/lib/bonds/auth";
import { activeInvitation, redeemInvitation } from "@/lib/bonds/auth-store";
import { hashPassword, normalizeEmail, tokenHash } from "@/lib/bonds/auth-crypto";
import { authJson, authRateLimited } from "@/lib/bonds/auth-http";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  const body = await readBoundedJsonBody(request, 4096);
  if (!body.ok) return authJson({ error: body.error }, body.status);
  const input = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const email = normalizeEmail(input.email);
  try {
    if (await authRateLimited(request, "register", email || "invalid")) return authJson({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    if (!email || typeof input.password !== "string" || input.password.length < 15 || input.password.length > 128) return authJson({ error: "Use a valid email and a password between 15 and 128 characters." }, 400);
    const token = typeof input.invite === "string" && /^[A-Za-z0-9_-]{43}$/.test(input.invite) ? input.invite : "";
    const invitation = await activeInvitation();
    if (!token || !invitation || invitation.email !== email || invitation.tokenHash !== tokenHash(token) || email === ownerEmail()) return authJson({ error: "Account creation is closed, or this invitation is invalid or expired." }, 403);
    const account = await redeemInvitation(tokenHash(token), email, await hashPassword(input.password));
    if (!account) return authJson({ error: "This invitation cannot be used. Ask the owner for a new one." }, 403);
    await revokeSession();
    const response = authJson({ authenticated: true, user: { id: account.id, email: account.email, isOwner: false } }, 201);
    response.cookies.set(sessionCookie(await createSession(account)));
    return response;
  } catch { return authJson({ error: "Account creation is unavailable. Please try signing in if your account was already created." }, 503); }
}

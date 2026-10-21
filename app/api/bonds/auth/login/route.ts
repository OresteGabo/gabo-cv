import { NextRequest } from "next/server";
import { authenticate, createSession, ownerEmail, revokeSession, sessionCookie } from "@/lib/bonds/auth";
import { normalizeEmail } from "@/lib/bonds/auth-crypto";
import { authJson } from "@/lib/bonds/auth-http";
import { fileOwnerMode } from "@/lib/bonds/auth-mode";
import { reportAuthFailure } from "@/lib/bonds/auth-diagnostics";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  const body = await readBoundedJsonBody(request, 4096);
  if (!body.ok) return authJson({ error: body.error }, body.status);
  const input = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const email = normalizeEmail(input.email);
  let stage = "credential_verification";
  try {
    if (!email || typeof input.password !== "string" || input.password.length > 128) return authJson({ error: "Invalid email or password." }, 401);
    if (fileOwnerMode() && !ownerEmail()) return authJson({ error: "Owner sign-in is not configured on this deployment. Save the owner credentials in Vercel and redeploy." }, 503);
    const account = await authenticate(email, input.password);
    if (!account) return authJson({ error: "Invalid email or password." }, 401);
    if (fileOwnerMode() && account.id !== "owner") return authJson({ error: "Your login is ready, but synchronized portfolio storage has not been connected yet. Ask the owner to finish database setup." }, 503);
    stage = "previous_session_revocation";
    await revokeSession();
    const response = authJson({ authenticated: true, user: { id: account.id, email: account.email, isOwner: account.id === "owner" } });
    stage = "session_creation";
    response.cookies.set(sessionCookie(await createSession(account)));
    return response;
  } catch (error) {
    reportAuthFailure("login", stage, error);
    return authJson({ error: "Sign-in is unavailable. Check the account database configuration." }, 503);
  }
}

import { NextRequest } from "next/server";
import { getBondSession, ownerEmail } from "@/lib/bonds/auth";
import { accountByEmail, activeInvitation, closeInvitations, putInvitation } from "@/lib/bonds/auth-store";
import { newToken, normalizeEmail, tokenHash } from "@/lib/bonds/auth-crypto";
import { authJson } from "@/lib/bonds/auth-http";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";
import { fileOwnerMode } from "@/lib/bonds/auth-mode";
import { configuredFriend } from "@/lib/bonds/friend-account";

export async function GET() {
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (!session.isOwner) return authJson({ error: "Owner access required." }, 403);
    const friend = configuredFriend();
    const setup = { passwordSetupPath: "/create-password", friendEmail: friend?.email ?? null };
    if (fileOwnerMode()) return authJson({ available: false, invitation: null, ...setup });
    const invitation = await activeInvitation();
    return authJson({ available: true, invitation: invitation ? { email: invitation.email, expiresAt: invitation.expiresAt } : null, ...setup });
  } catch { return authJson({ error: "Registration settings are unavailable." }, 503); }
}
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (!session.isOwner) return authJson({ error: "Owner access required." }, 403);
    if (fileOwnerMode()) return authJson({ error: "Invitations require persistent account storage. This deployment uses the original owner-only JSON portfolio." }, 409);
    const body = await readBoundedJsonBody(request, 1024);
    if (!body.ok) return authJson({ error: body.error }, body.status);
    const input = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
    const supplied = input.email;
    const email = supplied === undefined || supplied === "" || (typeof supplied === "string" && !supplied.trim()) ? "" : normalizeEmail(supplied);
    if (email === null || (email && (email === ownerEmail() || email === configuredFriend()?.email || await accountByEmail(email)))) return authJson({ error: "Use a valid email that does not already have access, or leave it blank so your friend can choose." }, 400);
    const token = newToken();
    const expiresAt = Date.now() + 48 * 60 * 60_000;
    await putInvitation({ tokenHash: tokenHash(token), email, expiresAt, used: false });
    return authJson({ invite: token, email, expiresAt }, 201);
  } catch { return authJson({ error: "The invitation could not be created." }, 503); }
}
export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (!session.isOwner) return authJson({ error: "Owner access required." }, 403);
    if (fileOwnerMode()) return authJson({ closed: true });
    await closeInvitations();
    return authJson({ closed: true });
  } catch { return authJson({ error: "Registration could not be closed." }, 503); }
}

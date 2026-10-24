import { NextRequest } from "next/server";
import { expiredSessionCookie, getBondSession } from "@/lib/bonds/auth";
import { accountById, deleteAccount } from "@/lib/bonds/auth-store";
import { verifyPasswordHash } from "@/lib/bonds/auth-crypto";
import { authJson, authRateLimited } from "@/lib/bonds/auth-http";
import { configuredFriend } from "@/lib/bonds/friend-account";
import { fileOwnerMode } from "@/lib/bonds/auth-mode";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";

// Self-service deletion is scoped exclusively to the authenticated invited account.
export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (session.isOwner || fileOwnerMode() || session.userId === configuredFriend()?.id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session.userId)) {
      return authJson({ error: "Only invited accounts can be deleted here." }, 403);
    }
    if (await authRateLimited(request, "account-deletion", session.userId)) {
      return authJson({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    }
    const body = await readBoundedJsonBody(request, 2048);
    if (!body.ok) return authJson({ error: body.error }, body.status);
    const input = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
    const account = await accountById(session.userId);
    if (!account || account.email !== session.email) return authJson({ error: "Authentication required." }, 401);
    if (typeof input.password !== "string" || !input.password || input.password.length > 128 ||
      !await verifyPasswordHash(input.password, account.passwordHash)) {
      return authJson({ error: "The password is incorrect. Your account has not been deleted." }, 403);
    }
    if (!await deleteAccount(session.userId, session.email)) {
      return authJson({ error: "Account deletion was not confirmed. Please try again." }, 409);
    }
    const response = authJson({ deleted: true });
    response.cookies.set(expiredSessionCookie);
    return response;
  } catch {
    return authJson({ error: "Your account could not be deleted. Please try again." }, 503);
  }
}

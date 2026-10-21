import { NextRequest } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { deleteAccount } from "@/lib/bonds/auth-store";
import { authJson } from "@/lib/bonds/auth-http";
import { normalizeEmail } from "@/lib/bonds/auth-crypto";
import { configuredFriend } from "@/lib/bonds/friend-account";
import { fileOwnerMode } from "@/lib/bonds/auth-mode";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (!session.isOwner) return authJson({ error: "Owner access required." }, 403);
    const { id } = await context.params;
    if (id === "owner" || id === session.userId) return authJson({ error: "The main owner account cannot be deleted." }, 403);
    const body = await readBoundedJsonBody(request, 1024);
    if (!body.ok) return authJson({ error: body.error }, body.status);
    const email = normalizeEmail((body.data as Record<string, unknown> | null)?.email);
    if (!email || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return authJson({ error: "Select an account and confirm its email address." }, 400);
    const friend = configuredFriend();
    if (email === session.email) return authJson({ error: "The main owner account cannot be deleted." }, 403);
    if (id === friend?.id || email === friend?.email) return authJson({ error: "This account is managed by Vercel. Remove its BONDS_FRIEND_EMAIL and BONDS_FRIEND_PASSWORD_HASH variables and redeploy to revoke access." }, 409);
    if (fileOwnerMode()) return authJson({ error: "There are no database accounts on this deployment." }, 409);
    if (!await deleteAccount(id, email)) return authJson({ error: "Account not found, or the confirmation email does not match." }, 404);
    return authJson({ deleted: true });
  } catch { return authJson({ error: "The account could not be deleted." }, 503); }
}

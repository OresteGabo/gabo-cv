import { getBondSession } from "@/lib/bonds/auth";
import { authJson } from "@/lib/bonds/auth-http";
import { reportAuthFailure } from "@/lib/bonds/auth-diagnostics";
export async function GET() {
  try {
    const session = await getBondSession();
    return authJson({ authenticated: Boolean(session), user: session ? { id: session.userId, email: session.email, isOwner: session.isOwner } : null });
  } catch (error) {
    reportAuthFailure("session", "session_lookup", error);
    return authJson({ authenticated: false, user: null, error: "The account database is unavailable." }, 503);
  }
}

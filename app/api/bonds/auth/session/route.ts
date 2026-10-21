import { getBondSession } from "@/lib/bonds/auth";
import { authJson } from "@/lib/bonds/auth-http";
export async function GET() {
  try {
    const session = await getBondSession();
    return authJson({ authenticated: Boolean(session), user: session ? { id: session.userId, email: session.email, isOwner: session.isOwner } : null });
  } catch { return authJson({ authenticated: false, user: null, error: "The account database is unavailable." }, 503); }
}

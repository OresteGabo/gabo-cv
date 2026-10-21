import { getBondSession } from "@/lib/bonds/auth";
import { listAccounts } from "@/lib/bonds/auth-store";
import { authJson } from "@/lib/bonds/auth-http";
import { configuredFriend } from "@/lib/bonds/friend-account";
import { fileOwnerMode } from "@/lib/bonds/auth-mode";

export async function GET() {
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (!session.isOwner) return authJson({ error: "Owner access required." }, 403);
    const accounts = [{ id: "owner", email: session.email, createdAt: null, status: "active", kind: "owner", deletable: false }];
    const friend = configuredFriend();
    if (friend) accounts.push({ id: friend.id, email: friend.email, createdAt: null, status: "active", kind: "environment", deletable: false });
    if (!fileOwnerMode()) {
      const registered = await listAccounts();
      return authJson({ accounts: [...accounts, ...registered.map((account) => ({ ...account, kind: "database", deletable: account.email !== session.email && account.id !== friend?.id && account.email !== friend?.email }))] });
    }
    return authJson({ accounts });
  } catch { return authJson({ error: "Accounts could not be loaded." }, 503); }
}

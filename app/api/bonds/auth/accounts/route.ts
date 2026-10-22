import { listEquityHoldings } from "@/lib/bonds/equities";
import { getBondSession } from "@/lib/bonds/auth";
import { listAccounts, type AccountSummary } from "@/lib/bonds/auth-store";
import { authJson } from "@/lib/bonds/auth-http";
import { configuredFriend } from "@/lib/bonds/friend-account";
import { fileOwnerMode } from "@/lib/bonds/auth-mode";
import { accountPortfolioSummaries } from "@/lib/bonds/db";

export async function GET() {
  try {
    const session = await getBondSession();
    if (!session) return authJson({ error: "Authentication required." }, 401);
    if (!session.isOwner) return authJson({ error: "Owner access required." }, 403);
    const accounts: (AccountSummary & { kind: "owner" | "environment" | "database"; deletable: boolean })[] = [{ id: "owner", email: session.email, createdAt: null, status: "active", kind: "owner", deletable: false }];
    const friend = configuredFriend();
    if (friend) accounts.push({ id: friend.id, email: friend.email, createdAt: null, status: "active", kind: "environment", deletable: false });
    if (!fileOwnerMode()) {
      const registered = await listAccounts();
      accounts.push(...registered.map((account) => ({ ...account, kind: "database" as const, deletable: account.email !== session.email && account.id !== friend?.id && account.email !== friend?.email })));
    }
    const summaries = await accountPortfolioSummaries(accounts.map((account) => account.id));
    await Promise.all(accounts.map(async (account) => {
      const holdings = await listEquityHoldings(account.id);
      const latest = [...holdings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      summaries.get(account.id)!.equityActivity = { purchaseCount: holdings.length, cashCost: holdings.reduce((total, item) => total + item.netAmountPayable, 0), latestSecurity: latest ? `${latest.securityName} (${latest.ticker})` : null };
    }));
    return authJson({ accounts: accounts.map((account) => ({ ...account, portfolio: summaries.get(account.id) })) });
  } catch { return authJson({ error: "Accounts could not be loaded." }, 503); }
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";
import type { AccountPortfolioSummary } from "@/lib/bonds/types";

type ManagedAccount = {
  id: string;
  email: string;
  createdAt: string | null;
  status: "active" | "disabled";
  kind: "owner" | "environment" | "database";
  deletable: boolean;
  portfolio: AccountPortfolioSummary;
};

function principalLabel(portfolio: AccountPortfolioSummary) {
  if (!portfolio.principalByCurrency.length) return "No bond principal";
  return portfolio.principalByCurrency.map(({ currency, amount }) => `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(amount)}`).join(" · ");
}

function PortfolioActivity({ portfolio }: { portfolio: AccountPortfolioSummary }) {
  const latest = portfolio.latestPurchase;
  return <div className="mt-3 grid gap-3 rounded-xl bg-surface-container/60 p-3 sm:grid-cols-2">
    <div><p className="text-xs text-on-surface-variant">Total bond principal</p><p className="mt-1 text-sm font-black">{principalLabel(portfolio)}</p><p className="mt-1 text-xs text-on-surface-variant">{portfolio.purchaseCount} saved {portfolio.purchaseCount === 1 ? "purchase" : "purchases"}</p></div>
    <div><p className="text-xs text-on-surface-variant">Latest added purchase</p>{latest ? <><p className="mt-1 break-words text-sm font-bold">{latest.bondName}</p>{latest.isin && <p className="mt-1 break-all font-mono text-xs">{latest.isin}</p>}<p className="mt-1 text-xs text-on-surface-variant">Trade date: {latest.purchaseDate} · Added: {new Date(latest.createdAt).toLocaleDateString()}</p></> : <p className="mt-1 text-sm text-on-surface-variant">No purchases saved</p>}</div>
  </div>;
}

export function BondAccountManagement() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = accounts.find((account) => account.id === selectedId);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback((signal?: AbortSignal) =>
    fetch("/api/bonds/auth/accounts", { cache: "no-store", signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load accounts.");
      if (!signal?.aborted) { setAccounts(data.accounts); setError(""); }
    }).catch((cause) => {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Could not load accounts.");
    }).finally(() => { if (!signal?.aborted) setLoading(false); }), []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function remove(event: FormEvent) {
    event.preventDefault();
    if (!selected || loading || error || deleting || confirmation.trim().toLowerCase() !== selected.email) return;
    setDeleting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bonds/auth/accounts/${encodeURIComponent(selected.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete account.");
      setAccounts((current) => current.filter((account) => account.id !== selected.id));
      setMessage(`Deleted ${selected.email} and their saved purchases. They have been signed out.`);
      setSelectedId(null);
      setConfirmation("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete account."); }
    finally { setDeleting(false); }
  }

  return <section id="account-management" aria-labelledby="account-management-heading" className="mt-4 rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5">
    <div className="flex items-center justify-between gap-3">
      <h3 id="account-management-heading" className="flex items-center gap-2 font-black"><Users size={19} />Manage accounts</h3>
      <button type="button" disabled={loading || deleting} onClick={() => { setLoading(true); setError(""); void refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-outline/15 px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh</button>
    </div>
    <p className="mt-2 text-sm text-on-surface-variant">Review account activity before deleting a user. Principal totals include the face value of all saved purchases, including sold and matured bonds. Currencies are shown separately.</p>
    {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-primary">{message}</p>}
    {loading && accounts.length === 0 && <p role="status" className="mt-4 text-sm text-on-surface-variant">Loading accounts…</p>}
    <ul className="mt-4 space-y-2" aria-label="Accounts">
      {accounts.map((account) => <li key={account.id} className="rounded-2xl border border-outline/10 bg-background/70 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="break-all text-sm font-black">{account.email}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{account.kind === "owner" ? "Main admin · Protected" : account.kind === "environment" ? "Member · Managed in Vercel" : `Member · ${account.status === "disabled" ? "Disabled" : "Active"}`}{account.createdAt && ` · Created ${new Date(account.createdAt).toLocaleDateString()}`}</p>
          </div>
          {account.deletable ? <button type="button" disabled={deleting || loading} onClick={() => { setSelectedId(account.id); setConfirmation(""); setError(""); setMessage(""); setLoading(true); void refresh(); }} aria-label={`Delete account ${account.email}`} className="inline-flex w-fit items-center gap-2 rounded-xl border border-error/20 px-3 py-2 text-xs font-black text-error hover:bg-error-container/30 disabled:opacity-50"><Trash2 size={14} />Delete account</button> : account.kind === "owner" ? <ShieldCheck size={19} className="text-primary" aria-label="Owner account protected" /> : null}
        </div>
        <PortfolioActivity portfolio={account.portfolio} />
        {account.kind === "environment" && <p className="mt-2 text-xs text-on-surface-variant">To revoke this account, remove its friend credentials in Vercel and redeploy.</p>}
        {selected?.id === account.id && <form onSubmit={remove} className="mt-4 space-y-3 border-t border-error/20 pt-4">
          <p className="text-sm font-bold text-error">Delete this account and all its saved purchases? This cannot be undone.</p>
          {loading ? <p role="status" className="text-sm text-on-surface-variant">Updating account activity before deletion…</p> : <p className="text-sm font-bold">You are about to remove {principalLabel(account.portfolio)} across {account.portfolio.purchaseCount} saved {account.portfolio.purchaseCount === 1 ? "purchase" : "purchases"}.{account.portfolio.latestPurchase && ` Latest added: ${account.portfolio.latestPurchase.bondName}${account.portfolio.latestPurchase.isin ? ` (${account.portfolio.latestPurchase.isin})` : ""}, trade date ${account.portfolio.latestPurchase.purchaseDate}.`}</p>}
          <label className="block text-xs font-bold">Type {account.email} to confirm<input type="email" required autoComplete="off" value={confirmation} disabled={deleting} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-outline/20 bg-background px-3 py-2.5 text-sm" /></label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={deleting || loading || Boolean(error) || confirmation.trim().toLowerCase() !== account.email} className="rounded-xl bg-error px-4 py-2.5 text-xs font-black text-on-error disabled:opacity-50">{deleting ? "Deleting…" : "Permanently delete account"}</button>
            <button type="button" disabled={deleting} onClick={() => { setSelectedId(null); setConfirmation(""); }} className="rounded-xl border border-outline/20 px-4 py-2.5 text-xs font-bold">Cancel</button>
          </div>
        </form>}
      </li>)}
    </ul>
  </section>;
}

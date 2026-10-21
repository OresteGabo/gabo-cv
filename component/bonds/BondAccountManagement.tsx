"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";

type ManagedAccount = {
  id: string;
  email: string;
  createdAt: string | null;
  status: "active" | "disabled";
  kind: "owner" | "environment" | "database";
  deletable: boolean;
};

export function BondAccountManagement() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<ManagedAccount | null>(null);
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
    if (!selected || deleting || confirmation.trim().toLowerCase() !== selected.email) return;
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
      setSelected(null);
      setConfirmation("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete account."); }
    finally { setDeleting(false); }
  }

  return <section id="account-management" aria-labelledby="account-management-heading" className="mt-4 rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5">
    <div className="flex items-center justify-between gap-3">
      <h3 id="account-management-heading" className="flex items-center gap-2 font-black"><Users size={19} />Manage accounts</h3>
      <button type="button" disabled={loading || deleting} onClick={() => { setLoading(true); setError(""); void refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-outline/15 px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh</button>
    </div>
    <p className="mt-2 text-sm text-on-surface-variant">Review accounts and remove test users. Deleting an account permanently removes its saved purchases and signs it out on every device.</p>
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
          {account.deletable ? <button type="button" disabled={deleting} onClick={() => { setSelected(account); setConfirmation(""); setError(""); setMessage(""); }} aria-label={`Delete account ${account.email}`} className="inline-flex w-fit items-center gap-2 rounded-xl border border-error/20 px-3 py-2 text-xs font-black text-error hover:bg-error-container/30 disabled:opacity-50"><Trash2 size={14} />Delete account</button> : account.kind === "owner" ? <ShieldCheck size={19} className="text-primary" aria-label="Owner account protected" /> : null}
        </div>
        {account.kind === "environment" && <p className="mt-2 text-xs text-on-surface-variant">To revoke this account, remove its friend credentials in Vercel and redeploy.</p>}
        {selected?.id === account.id && <form onSubmit={remove} className="mt-4 space-y-3 border-t border-error/20 pt-4">
          <p className="text-sm font-bold text-error">Delete this account and all its saved purchases? This cannot be undone.</p>
          <label className="block text-xs font-bold">Type {account.email} to confirm<input type="email" required autoComplete="off" value={confirmation} disabled={deleting} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-outline/20 bg-background px-3 py-2.5 text-sm" /></label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={deleting || confirmation.trim().toLowerCase() !== account.email} className="rounded-xl bg-error px-4 py-2.5 text-xs font-black text-on-error disabled:opacity-50">{deleting ? "Deleting…" : "Permanently delete account"}</button>
            <button type="button" disabled={deleting} onClick={() => { setSelected(null); setConfirmation(""); }} className="rounded-xl border border-outline/20 px-4 py-2.5 text-xs font-bold">Cancel</button>
          </div>
        </form>}
      </li>)}
    </ul>
  </section>;
}

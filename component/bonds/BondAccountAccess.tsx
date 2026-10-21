"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";

export type BondAccountUser = { id: string; email: string; isOwner: boolean };
export function BondAccountAccess({ onAuthenticated }: { onAuthenticated: (user: BondAccountUser) => void }) {
  const [invite, setInvite] = useState("");
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("invite");
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
      queueMicrotask(() => { setInvite(token); setRegister(true); });
      // Keep invitation secrets out of copied URLs, browser navigation, and referrers.
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    if (register && values.get("password") !== values.get("confirmPassword")) { setError("The passwords do not match."); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/bonds/auth/${register ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.get("email"), password: values.get("password"), ...(register ? { invite } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Access could not be completed."); return; }
      form.reset();
      setInvite("");
      onAuthenticated(data.user);
    } catch { setError("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="mt-8 max-w-lg rounded-3xl border border-outline/10 bg-[var(--md-sys-color-surface-container-lowest)] p-5 md:p-7">
      <div className="mb-5 flex items-center gap-3">
        <ShieldCheck size={24} className="text-primary" />
        <div><h3 className="font-black">{register ? "Create your account" : "Sign in to your portfolio"}</h3><p className="mt-1 text-xs text-on-surface-variant">{register ? "Your invitation works once. Your portfolio stays private to your account." : "Use your email and password to access your own investments."}</p></div>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-[var(--md-sys-color-error)]">{error}</p>}
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-xs font-bold">Email<input name="email" type="email" required maxLength={254} autoComplete="username" className="mt-2 w-full rounded-xl border border-outline/15 bg-background px-4 py-3" /></label>
        <label className="block text-xs font-bold">Password<input name="password" type="password" required minLength={register ? 15 : undefined} maxLength={128} autoComplete={register ? "new-password" : "current-password"} className="mt-2 w-full rounded-xl border border-outline/15 bg-background px-4 py-3" /></label>
        {register && <><p className="text-xs text-on-surface-variant">Use at least 15 characters. A long, unique passphrase works well.</p><label className="block text-xs font-bold">Confirm password<input name="confirmPassword" type="password" required minLength={15} maxLength={128} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-outline/15 bg-background px-4 py-3" /></label></>}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-3 text-sm font-black text-[var(--md-sys-color-on-primary)]">{busy ? "Please wait…" : register ? "Create account" : "Open private portfolio"}<ChevronRight size={16} /></button>
      </fieldset>
      {invite && <button type="button" disabled={busy} onClick={() => { setRegister((value) => !value); setError(""); }} className="mt-4 text-xs font-bold underline">{register ? "Already have an account? Sign in" : "Use invitation to create an account"}</button>}
    </form>
  );
}

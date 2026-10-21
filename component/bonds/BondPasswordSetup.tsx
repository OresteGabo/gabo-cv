"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { createBrowserPasswordHash } from "@/lib/bonds/password-setup";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";

export function BondPasswordSetup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ email: string; hash: string } | null>(null);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(""); setCopied(false); setResult(null);
    const address = email.trim().toLowerCase();
    if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setError("Enter a valid email address."); return; }
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      const hash = await createBrowserPasswordHash(password);
      setResult({ email: address, hash });
      setPassword(""); setConfirmation("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create your password hash."); }
    finally { setBusy(false); }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`BONDS_FRIEND_EMAIL=${result.email}\nBONDS_FRIEND_PASSWORD_HASH=${result.hash}`);
      setCopied(true);
    } catch { setError("Select and copy the email and hash below."); }
  }

  return <main className="bond-app min-h-screen bg-background px-4 pb-16 text-on-background">
    <header className="mx-auto flex max-w-3xl items-center justify-between py-6"><GaboBrand /><BondThemeToggle /></header>
    <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm sm:p-9">
      <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><KeyRound size={26} /></span>
      <h1 className="mt-5 text-3xl font-black tracking-tight">Choose your portfolio password</h1>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">Your password stays on this device while your browser creates its hash. Send the owner only your email and the generated hash.</p>
      {error && <p role="alert" className="mt-5 text-sm text-[var(--md-sys-color-error)]">{error}</p>}
      {!result ? <form onSubmit={generate} className="mt-6 space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          {/* No name attributes: native submission cannot serialize passwords. */}
          <label className="block text-sm font-bold">Email<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-outline/20 bg-background px-4 py-3" /></label>
          <label className="block text-sm font-bold">New password<input type="password" required minLength={15} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-outline/20 bg-background px-4 py-3" /></label>
          <p className="text-xs leading-5 text-on-surface-variant">Use 15–128 characters. Save your password in your password manager.</p>
          <label className="block text-sm font-bold">Confirm password<input type="password" required minLength={15} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-outline/20 bg-background px-4 py-3" /></label>
          <button className="w-full rounded-xl bg-[var(--md-sys-color-primary)] px-5 py-3 font-black text-[var(--md-sys-color-on-primary)]">{busy ? "Creating your hash…" : "Create password hash"}</button>
        </fieldset>
      </form> : <div className="mt-6 space-y-4" aria-live="polite">
        <div className="flex items-center gap-2 text-sm font-bold text-primary"><ShieldCheck size={20} />Your password hash is ready</div>
        <label className="block text-xs font-bold">Email<input readOnly value={result.email} onFocus={event => event.target.select()} className="mt-2 w-full rounded-xl border border-outline/20 bg-background px-4 py-3 text-sm" /></label>
        <label className="block text-xs font-bold">Password hash<textarea readOnly rows={4} value={result.hash} onFocus={event => event.target.select()} className="mt-2 w-full resize-none rounded-xl border border-outline/20 bg-background px-4 py-3 font-mono text-xs" /></label>
        <button type="button" onClick={() => void copy()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--md-sys-color-primary)] px-5 py-3 font-black text-[var(--md-sys-color-on-primary)]">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copied email and hash" : "Copy email and hash for the owner"}</button>
        <p className="text-xs leading-5 text-on-surface-variant">This has not created an account yet. The owner must enable your email and hash, then redeploy. Keep your password private; use the password itself when you sign in.</p>
        <button type="button" onClick={() => { setResult(null); setCopied(false); setError(""); }} className="text-xs font-bold underline">Choose a different password</button>
      </div>}
      <Link href="/portfolio" className="mt-7 inline-block text-sm font-bold text-primary underline">Go to sign-in</Link>
    </section>
  </main>;
}

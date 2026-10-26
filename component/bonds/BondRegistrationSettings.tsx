"use client";
import { useEffect, useState, type FormEvent } from "react";

export function BondRegistrationSettings() {
  const [email, setEmail] = useState("");
  const [invitation, setInvitation] = useState<{ email: string; expiresAt: number } | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch("/api/bonds/auth/registration", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) {
        setAvailable(data.available !== false); setInvitation(data.invitation);
        if (!data.invitation) setLink("");
      }
    }).catch(() => { if (active) setError("Could not load account creation settings."); });
    void refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15000);
    return () => { active = false; window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, []);
  async function change(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setCopied(false);
    try {
      const response = await fetch("/api/bonds/auth/registration", { method: event ? "POST" : "DELETE", ...(event ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setInvitation(event ? { email: data.email, expiresAt: data.expiresAt } : null);
      const joinPath = window.location.pathname.startsWith("/bonds/") ? "/bonds/join" : "/join";
      setLink(event ? `${window.location.origin}${joinPath}#invite=${data.invite}` : "");
      setEmail("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update registration."); }
    finally { setBusy(false); }
  }
  if (available !== true) return <section className="mt-4 rounded-2xl border border-outline/15 bg-[var(--md-sys-color-surface-container-lowest)] p-4">
    <h3 className="font-black">Invite a friend</h3>
    <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{available === false ? "Account invitations are currently unavailable. Please try again later." : error || "Loading account settings…"}</p>
  </section>;
  return <section className="mt-4 rounded-2xl border border-outline/15 bg-[var(--md-sys-color-surface-container-lowest)] p-4">
    <h3 className="font-black">Invite a friend</h3>
    <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">Create a private link for your friend. They choose their own email and password, then upload PDFs and manage their own portfolio. The link works once, expires after 48 hours, and closes automatically after account creation.</p>
    <p className="mt-3 text-sm font-bold">{invitation ? invitation.email ? `One invitation open for ${invitation.email}` : "One private invitation is open" : "No open invitations"}</p>
    {error && <p role="alert" className="mt-2 text-sm text-[var(--md-sys-color-error)]">{error}</p>}
    <form onSubmit={change} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <label className="min-w-0 flex-1 text-xs font-bold">Friend’s email (optional)<input type="email" value={email} maxLength={254} disabled={busy} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-outline/15 bg-background px-3 py-2.5" /><span className="mt-1 block font-normal text-on-surface-variant">Leave blank so your friend can choose their email.</span></label>
      <button disabled={busy} className="self-end rounded-xl bg-[var(--md-sys-color-primary)] px-4 py-2.5 text-xs font-black text-[var(--md-sys-color-on-primary)]">{busy ? "Please wait…" : "Create private invitation"}</button>
    </form>
    {link && <div className="mt-3"><label className="text-xs font-bold">Invitation link<input readOnly value={link} onFocus={(event) => event.target.select()} className="mt-1 w-full rounded-xl border border-outline/15 bg-background px-3 py-2 text-xs" /></label><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError("Select and copy the invitation link above."); } }} className="mt-2 text-xs font-bold underline">{copied ? "Copied" : "Copy invitation link"}</button></div>}
    {invitation && <button type="button" disabled={busy} onClick={() => void change()} className="mt-3 rounded-xl border border-outline/20 px-3 py-2 text-xs font-bold">Close account creation</button>}
  </section>;
}

"use client";

import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";

type DocumentSummary = {
  id: string;
  label: string;
  documentDate: string;
  category: string;
  instrumentName: string;
  issuer: string;
  description: string;
  originalFileName: string;
  downloadUrl: string;
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function NavLink({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      }`}
    >
      {children}
    </Link>
  );
}

export function BondDocumentsLibrary() {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bonds/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .finally(() => setSessionLoading(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    fetch("/api/bonds/documents", { cache: "no-store" })
      .then(async (response) => ({
        ok: response.ok,
        data: await response.json(),
      }))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          setError(data.error ?? "Could not load documents.");
          return;
        }
        setDocuments(data.documents);
      })
      .catch(() => {
        if (active) setError("Could not load documents.");
      });
    return () => {
      active = false;
    };
  }, [authenticated]);

  const categories = useMemo(
    () => [...new Set(documents.map((document) => document.category))],
    [documents],
  );

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/bonds/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Sign-in failed.");
      return;
    }
    setAuthenticated(true);
    formElement.reset();
  }

  return (
    <main className="bond-app relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <ImigongoBackground />
      <header className="sticky top-0 z-50 border-b border-outline/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <GaboBrand />
            <Link
              href="/portfolio"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary"
            >
              <ArrowLeft size={15} /> Portfolio
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/portfolio">Portfolio</NavLink>
            <NavLink href="/calendar">Calendar</NavLink>
            <NavLink href="/documents" active>
              Documents
            </NavLink>
          </nav>
          <BondThemeToggle />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <LockKeyhole size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                Private records
              </p>
            </div>
            <h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tighter md:text-6xl">
              Documents
            </h1>
          </div>
          {authenticated && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-black uppercase text-on-surface-variant"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        )}

        {sessionLoading ? (
          <div className="mt-8 rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-8 text-sm text-on-surface-variant">
            Checking private session...
          </div>
        ) : !authenticated ? (
          <form
            onSubmit={login}
            className="mt-8 max-w-lg rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5 md:p-7"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck size={21} />
              </span>
              <div>
                <h2 className="font-black">Protected access</h2>
              </div>
            </div>
            <label className="block text-xs font-bold text-on-surface-variant">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                defaultValue="orestegabo@icloud.com"
                className="mt-2 w-full rounded-xl border border-outline/10 bg-background px-4 py-3 text-on-surface outline-none focus:border-primary/60"
              />
            </label>
            <label className="mt-4 block text-xs font-bold text-on-surface-variant">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-outline/10 bg-background px-4 py-3 text-on-surface outline-none focus:border-primary/60"
              />
            </label>
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:opacity-90">
              Open documents <FileText size={16} />
            </button>
          </form>
        ) : (
          <div className="mt-8 grid gap-3">
            {documents.map((document) => (
              <article
                key={document.id}
                className="rounded-3xl border border-outline/10 bg-surface-container-lowest/75 p-5 md:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase text-primary">
                        <CalendarDays size={12} />
                        {displayDate(document.documentDate)}
                      </span>
                      <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase text-on-surface-variant">
                        {document.category}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-black text-on-surface">
                      {document.label}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-on-surface">
                      {document.instrumentName}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
                      {document.description}
                    </p>
                    <p className="mt-3 break-all text-[11px] font-bold text-on-surface-variant">
                      {document.originalFileName}
                    </p>
                  </div>
                  <a
                    href={document.downloadUrl}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary transition hover:opacity-90"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
              </article>
            ))}
            {documents.length === 0 && (
              <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-8 text-sm text-on-surface-variant">
                No documents saved.
              </div>
            )}
          </div>
        )}

        {authenticated && (
          <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-2xl border border-outline/10 bg-surface-container-lowest/90 p-2 shadow-2xl backdrop-blur-xl md:hidden">
            <Link href="/portfolio" aria-label="Portfolio" className="grid place-items-center rounded-xl p-3 text-outline">
              <WalletCards size={18} />
            </Link>
            <Link href="/calendar" aria-label="Calendar" className="grid place-items-center rounded-xl p-3 text-outline">
              <CalendarDays size={18} />
            </Link>
            <Link href="/documents" aria-label="Documents" className="grid place-items-center rounded-xl bg-primary p-3 text-on-primary">
              <FileText size={18} />
            </Link>
          </nav>
        )}
      </section>
    </main>
  );
}

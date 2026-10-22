"use client";

import {
  CalendarDays,
  ChevronDown,
  Download,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { BondPortfolioChrome } from "./BondSiteChrome";

type DocumentSummary = {
  id: string;
  label: string;
  documentDate: string;
  category: string;
  instrumentName: string;
  issuer: string;
  description: string;
  details?: {
    summary?: string;
    facts?: { label: string; value: string }[];
    charges?: { label: string; value: string }[];
    flow?: { label: string; value: string }[];
    sections?: {
      title: string;
      items: { label: string; value: string }[];
    }[];
  };
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


function DetailGrid({
  title,
  items,
}: {
  title: string;
  items?: { label: string; value: string }[];
}) {
  if (!items?.length) return null;

  return (
    <section>
      <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
        {title}
      </h4>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="rounded-xl bg-surface-container-lowest px-3 py-2"
          >
            <dt className="text-[10px] font-bold uppercase text-on-surface-variant">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-black text-on-surface">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MoneyFlow({
  items,
}: {
  items?: { label: string; value: string }[];
}) {
  if (!items?.length) return null;

  return (
    <section>
      <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
        Money flow
      </h4>
      <div className="mt-2 grid gap-2 md:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${item.value}`}
            className="relative rounded-xl border border-outline/10 bg-surface-container-lowest px-3 py-3"
          >
            <div className="mb-2 inline-grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-black text-on-primary">
              {index + 1}
            </div>
            <p className="text-[10px] font-black uppercase text-on-surface-variant">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-black text-on-surface">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterTab({
  active,
  children,
  count,
  disabled = false,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`group inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-primary text-on-primary shadow-sm ring-1 ring-primary/35"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      }`}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
            active
              ? "bg-on-primary/18 text-on-primary"
              : "bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function BondDocumentsLibrary() {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState(() =>
    String(new Date().getFullYear()),
  );

  useEffect(() => {
    fetch("/api/bonds/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setError("Could not check document access. Reload to try again."))
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
        setError("");
      })
      .catch(() => {
        if (active) setError("Could not load documents.");
      }).finally(() => { if (active) setDocumentsLoading(false); });
    return () => {
      active = false;
    };
  }, [authenticated]);

  const years = useMemo(
    () => [
      ...new Set(
        documents.map((document) => document.documentDate.slice(0, 4)),
      ),
    ],
    [documents],
  );
  const documentsForYear = useMemo(
    () =>
      selectedYear === "All"
        ? documents
        : documents.filter((document) =>
            document.documentDate.startsWith(selectedYear),
          ),
    [documents, selectedYear],
  );
  const categories = useMemo(
    () => [...new Set(documents.map((document) => document.category))],
    [documents],
  );
  const categoriesForYear = useMemo(
    () => [...new Set(documentsForYear.map((document) => document.category))],
    [documentsForYear],
  );
  const effectiveCategory =
    selectedCategory === "All" || categoriesForYear.includes(selectedCategory)
      ? selectedCategory
      : "All";
  const visibleDocuments = useMemo(
    () =>
      effectiveCategory === "All"
        ? documentsForYear
        : documentsForYear.filter(
            (document) => document.category === effectiveCategory,
          ),
    [documentsForYear, effectiveCategory],
  );
  const documentGroups = useMemo(
    () =>
      (effectiveCategory === "All" ? categoriesForYear : [effectiveCategory])
        .map((category) => ({
          category,
          documents: visibleDocuments.filter(
            (document) => document.category === category,
          ),
        }))
        .filter((group) => group.documents.length > 0),
    [categoriesForYear, effectiveCategory, visibleDocuments],
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
    <main className="bond-app relative min-h-screen overflow-x-hidden pb-24 bg-background text-on-background">
      <ImigongoBackground />
      <BondPortfolioChrome active="/documents" />

      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 md:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <LockKeyhole size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                Private records
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
              Documents
            </h1>
          </div>
          {authenticated && (
            <div className="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-black uppercase text-on-surface-variant">
              {documents.length} {documents.length === 1 ? "file" : "files"}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        )}

        {sessionLoading ? (
          <div className="mt-8 rounded-xl sm:rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4 sm:p-8 text-sm text-on-surface-variant">
            Checking private session...
          </div>
        ) : !authenticated ? (
          <form
            onSubmit={login}
            className="mt-8 max-w-lg rounded-xl sm:rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-3 sm:p-5 md:p-7"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
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
        ) : documentsLoading ? <p role="status" className="mt-5 rounded-xl border border-outline/10 p-4 text-sm text-on-surface-variant">Loading documents…</p> : error ? <p className="mt-4 text-sm text-on-surface-variant">Reload this page to try again.</p> : documents.length > 0 ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest/75 p-2 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]">
                <section>
                  <p className="px-1 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                    Year
                  </p>
                  <div
                    role="tablist"
                    aria-label="Document year"
                    className="flex gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1"
                  >
                    <FilterTab
                      active={selectedYear === "All"}
                      onClick={() => setSelectedYear("All")}
                    >
                      All years
                    </FilterTab>
                    {years.map((year) => (
                      <FilterTab
                        key={year}
                        active={selectedYear === year}
                        onClick={() => setSelectedYear(year)}
                      >
                        {year}
                      </FilterTab>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="px-1 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                    Document type
                  </p>
                  <div
                    role="tablist"
                    aria-label="Document category"
                    className="flex gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1"
                  >
                    <FilterTab
                      active={effectiveCategory === "All"}
                      count={documentsForYear.length}
                      onClick={() => setSelectedCategory("All")}
                    >
                      All
                    </FilterTab>
                    {categories.map((category) => {
                      const count = documentsForYear.filter(
                        (document) => document.category === category,
                      ).length;
                      return (
                        <FilterTab
                          key={category}
                          active={effectiveCategory === category}
                          count={count}
                          disabled={count === 0}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </FilterTab>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            {visibleDocuments.length === 0 ? (
              <div className="rounded-xl sm:rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4 sm:p-8 text-sm text-on-surface-variant">
                No documents match this view.
              </div>
            ) : (
              <div className="space-y-8">
            {documentGroups.map(({ category, documents: groupDocuments }) => (
              <section key={category}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">
                    {category}
                  </h2>
                  <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase text-on-surface-variant">
                    {groupDocuments.length}{" "}
                    {groupDocuments.length === 1 ? "file" : "files"}
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-outline/10 bg-surface-container-lowest/75">
                  {groupDocuments.map((document) => (
                    <details
                      key={document.id}
                      className="group border-b border-outline/10 last:border-b-0"
                    >
                      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-3 py-3 transition hover:bg-surface-container/60 marker:hidden md:grid-cols-[8.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] md:items-center md:px-5 [&::-webkit-details-marker]:hidden">
                        <div className="col-span-2 flex items-center gap-2 text-[10px] font-bold text-on-surface-variant md:col-span-1 md:text-xs">
                          <CalendarDays size={13} />
                          {displayDate(document.documentDate)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-on-surface">
                            {document.label}
                          </h3>
                          <p className="mt-0.5 truncate text-xs font-bold text-on-surface-variant">
                            {document.instrumentName}
                          </p>
                        </div>
                        <p className="hidden truncate text-xs font-bold text-on-surface-variant md:block md:text-sm">
                          {document.issuer}
                        </p>
                        <span className="inline-flex w-fit items-center rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase text-on-surface-variant">
                          Details
                          <ChevronDown
                            size={13}
                            className="ml-1 transition group-open:rotate-180"
                          />
                        </span>
                        <a
                          href={document.downloadUrl}
                          className="hidden w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--md-sys-color-primary)] px-3 py-2 text-xs font-black text-[var(--md-sys-color-on-primary)] md:inline-flex"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </summary>
                      <div className="border-t border-outline/10 bg-surface-container-low/45 px-4 py-3 md:px-5">
                        <div className="space-y-4">
                          <a href={document.downloadUrl} className="inline-flex items-center gap-2 rounded-lg border border-outline/15 px-3 py-2 text-xs font-bold md:hidden"><Download size={14} />Download PDF</a>
                          <p className="max-w-4xl text-sm leading-6 text-on-surface-variant">
                            {document.details?.summary ??
                              document.description}
                          </p>
                          <MoneyFlow items={document.details?.flow} />
                          <DetailGrid
                            title="Key details"
                            items={document.details?.facts}
                          />
                          <DetailGrid
                            title="Charges"
                            items={document.details?.charges}
                          />
                          {document.details?.sections?.map((section) => (
                            <DetailGrid
                              key={section.title}
                              title={section.title}
                              items={section.items}
                            />
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-xl sm:rounded-2xl border border-outline/10 bg-surface-container-lowest/70 p-4 sm:p-8 text-sm text-on-surface-variant">
            No documents saved.
          </div>
        )}


      </section>
    </main>
  );
}

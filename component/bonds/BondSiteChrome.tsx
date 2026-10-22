"use client";

import { Moon, Sun, WalletCards, CalendarDays, FileText, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function GaboBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
      <Image
        src={compact ? "/icon.svg" : "/logo-full.svg"}
        alt="Gabo"
        width={compact ? 32 : 118}
        height={32}
        className="h-8 w-auto"
        priority
      />
    </Link>
  );
}

export function BondThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    queueMicrotask(() => {
      const savedTheme = window.localStorage.getItem("theme");
      if (savedTheme === "dark") setTheme("dark");
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("light", theme === "light");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      className="rounded-xl border border-outline/10 bg-surface-container-low/60 p-2.5 text-on-surface-variant shadow-sm transition-all hover:text-primary active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

const portfolioLinks = [
  { href: "/portfolio", label: "Portfolio", Icon: WalletCards },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/documents", label: "Documents", Icon: FileText },
  { href: "/stocks", label: "Stocks", Icon: BarChart3 },
];

export function BondPortfolioChrome({ active, actions }: { active: string; actions?: React.ReactNode }) {
  return <>
    <header className="sticky top-0 z-50 border-b border-outline/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 md:px-8">
        <div className="flex items-center gap-4"><span className="hidden sm:block"><GaboBrand /></span><span className="sm:hidden"><GaboBrand compact /></span><span className="hidden border-l border-outline/20 pl-4 text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant sm:block">Portfolio</span></div>
        <nav aria-label="Portfolio navigation" className="hidden items-center gap-1 lg:flex">
          {portfolioLinks.map(({ href, label, Icon }) => <Link key={href} href={href} prefetch={false} aria-current={active === href ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${active === href ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "text-on-surface-variant hover:bg-surface-container"}`}><Icon size={15} />{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">{actions}<BondThemeToggle /></div>
      </div>
    </header>
    <nav aria-label="Mobile portfolio navigation" className="fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-sm grid-cols-4 gap-1 rounded-xl border border-outline/15 bg-[var(--md-sys-color-background)]/95 p-1 shadow-xl backdrop-blur-xl lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      {portfolioLinks.map(({ href, label, Icon }) => <Link key={href} href={href} prefetch={false} aria-current={active === href ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${active === href ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "text-on-surface-variant"}`}><Icon size={17} />{label}</Link>)}
    </nav>
  </>;
}

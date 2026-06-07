"use client";

import { Moon, Sun } from "lucide-react";
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

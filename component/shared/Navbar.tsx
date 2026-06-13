"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_CONFIG, Locale } from "@/lib/constants";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

// Define the Props to receive language state from the Parent (page.tsx)
interface NavbarProps {
    lang: Locale;
    setLang: (l: Locale) => void;
}

export const Navbar = ({ lang, setLang }: NavbarProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const savedTheme = window.localStorage.getItem("theme");
        if (savedTheme === "dark" || savedTheme === "light") {
            const timer = window.setTimeout(() => setTheme(savedTheme), 0);
            return () => window.clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const body = document.body;

        if (theme === "dark") {
            body.classList.add("dark");
            body.classList.remove("light");
        } else {
            body.classList.add("light");
            body.classList.remove("dark");
        }

        window.localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        const style = document.createElement("style");
        style.appendChild(
            document.createTextNode(`*,
*::before,
*::after {
  transition: none !important;
  animation: none !important;
}`)
        );
        document.head.appendChild(style);

        window.requestAnimationFrame(() => {
            setTheme((prev) => (prev === "dark" ? "light" : "dark"));

            window.requestAnimationFrame(() => {
                window.setTimeout(() => {
                    style.remove();
                }, 0);
            });
        });
    };

    // Localized Navigation Items
    const navItems = [
        { label: lang === "en" ? "Skills" : "Compétences", href: "#skills" },
        { label: lang === "en" ? "Experience" : "Expérience", href: "#experience" },
        { label: "KotlinConf", href: "#kotlinconf" },
        { label: lang === "en" ? "Projects" : "Projets", href: "#projects" },
        { label: lang === "en" ? "Contact" : "Contact", href: "#contact" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 mx-auto max-w-7xl w-full px-6 py-4 md:px-8 z-[1001] bg-background/80 backdrop-blur-xl border-b border-outline/5">
            <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
                    {/* Full Logo - Visible on tablet (sm) and up */}
                    <Image
                        src="/logo-full.svg"
                        alt={`${SITE_CONFIG.name} Logo`}
                        width={132}
                        height={32}
                        className="hidden sm:block h-8 w-auto"
                    />

                    {/* Small Icon - Visible only on mobile */}
                    <Image
                        src="/icon.svg"
                        alt={SITE_CONFIG.name}
                        width={32}
                        height={32}
                        className="block sm:hidden h-8 w-auto"
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {navItems.map((item) => (
                        <a key={item.href} href={item.href} className="hover:text-primary transition-colors">
                            {item.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {/* THEME TOGGLE BUTTON */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-surface-container-low/60 border border-outline/10 text-on-surface-variant hover:text-primary transition-all shadow-sm active:scale-95"
                        aria-label="Toggle Theme"
                    >
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    {/* Language Switcher Component */}
                    <div className="flex p-1 bg-surface-container-low/60 rounded-xl border border-outline/10">
                        {(["en", "fr"] as const).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border-2",
                                    lang === l
                                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-105"
                                        : "border-transparent text-on-surface-variant/40 hover:text-primary hover:border-outline/20"
                                )}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <a
                        href={SITE_CONFIG.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary"
                    >
                        LinkedIn
                    </a>

                    <button
                        className="md:hidden p-2 text-on-surface-variant"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 bg-surface-container border-b border-outline/10 p-6 flex flex-col gap-4 md:hidden shadow-xl z-10"
                    >
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant"
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

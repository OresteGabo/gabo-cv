"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_CONFIG } from "@/lib/constants";

const navItems = [
    { label: "Projects", href: "#projects" },
    { label: "Experience", href: "#experience" },
    { label: "Contact", href: "#contact" },
];

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 mx-auto max-w-7xl w-full px-6 py-4 md:px-8 z-[1000] bg-background/80 backdrop-blur-xl border-b border-outline/5">
            <div className="flex justify-between items-center">
                <Link href="/" className="text-2xl font-black tracking-tighter text-primary">
                    {SITE_CONFIG.name}.
                </Link>

                <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {navItems.map((item) => (
                        <a key={item.href} href={item.href} className="hover:text-primary transition-colors">
                            {item.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href={SITE_CONFIG.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary border-r border-outline/20 pr-4"
                    >
                        LinkedIn
                    </a>

                    {/* Using <a> for file downloads is the architectural standard */}
                    <a
                        href="/Gabo_Oreste_Systems_Architect_2026.pdf"
                        download="Gabo_Oreste_Systems_Architect_2026.pdf"
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 inline-block text-center cursor-pointer"
                    >
                        Download CV
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
                            <a key={item.href} href={item.href} className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant" onClick={() => setMenuOpen(false)}>
                                {item.label}
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
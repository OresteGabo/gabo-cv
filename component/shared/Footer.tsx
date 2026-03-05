"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { SITE_CONFIG, Locale } from '@/lib/constants';
import { Github, Linkedin, Cpu, ExternalLink } from 'lucide-react';

interface FooterProps {
    lang: Locale;
}

export const Footer = ({ lang }: FooterProps) => {
    // Localized UI Strings for the Footer
    const t = {
        description: {
            en: "Systems Architect & Software Engineer. Crafting high-performance solutions from low-level C++ engines to scalable cloud infrastructures.",
            fr: "Architecte Systèmes & Ingénieur Logiciel. Conception de solutions haute performance, des moteurs C++ bas niveau aux infrastructures cloud scalables."
        },
        ctaLabel: {
            en: "Get in touch",
            fr: "Contactez-moi"
        },
        builtWith: {
            en: "BUILT WITH NEXT.JS & FRAMER MOTION",
            fr: "DÉVELOPPÉ AVEC NEXT.JS & FRAMER MOTION"
        },
        location: {
            en: "PARIS",
            fr: "PARIS"
        }
    };

    return (
        <footer id="contact" className="pt-24 pb-12 px-8 border-t border-outline/10 bg-surface-container-lowest/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
                    <div className="md:col-span-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Cpu size={24} />
                            <span className="text-2xl font-black tracking-tighter text-on-background">{SITE_CONFIG.name}.</span>
                        </div>
                        <p className="text-on-surface-variant text-lg leading-relaxed max-w-md mb-8 font-medium">
                            {t.description[lang]}
                        </p>
                        <div className="flex gap-4">
                            <a
                                href={SITE_CONFIG.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl border border-outline/10 bg-surface-container-low hover:border-primary/50 hover:text-primary transition-all duration-300 shadow-sm"
                            >
                                <Linkedin size={20} />
                            </a>
                            <a
                                href={SITE_CONFIG.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl border border-outline/10 bg-surface-container-low hover:border-primary/50 hover:text-primary transition-all duration-300 shadow-sm"
                            >
                                <Github size={20} />
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col items-end justify-center">
                        <motion.a
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            href={`mailto:${SITE_CONFIG.email}`}
                            className="group p-8 rounded-[2.5rem] bg-primary text-on-primary w-full max-w-sm flex justify-between items-center shadow-xl shadow-primary/20 transition-shadow hover:shadow-primary/40"
                        >
                            <div className="pr-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2 block">
                                    {t.ctaLabel[lang]}
                                </span>
                                <span className="text-lg md:text-xl font-bold break-all lowercase tracking-tight">
                                    {SITE_CONFIG.email}
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-on-primary/10 group-hover:bg-on-primary/20 transition-colors">
                                <ExternalLink size={24} />
                            </div>
                        </motion.a>
                    </div>
                </div>

                {/* BOTTOM SECTION: Improved Contrast */}
                <div className="pt-12 border-t border-outline/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em]">
                            &copy; 2026 {SITE_CONFIG.name} • {t.builtWith[lang]}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline/10 bg-surface-container-low">
                            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                                <span className="text-primary">{t.location[lang]}</span>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-primary">FRANCE</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
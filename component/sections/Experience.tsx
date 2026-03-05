"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, ShieldAlert, CheckCircle2, Layers, Zap } from 'lucide-react';
import { Locale, CDAFAL_EXP } from '@/lib/constants';

interface ExperienceProps { lang: Locale; }

export const Experience = ({ lang }: ExperienceProps) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted) return null;

    const t = {
        title: { en: "Engineering", fr: "Parcours" },
        subtitle: { en: "Experience.", fr: "Ingénieur." },
        legacyLabel: { en: "Legacy State", fr: "État Initial" },
        modernLabel: { en: "System Architected", fr: "Système Architecturé" },
        legacyPoints: {
            en: [
                "Data Silos: Fragmented Excel/Access workflows with no central source of truth.",
                "Zero-Trust Failure: Shared credentials and lack of Role-Based Access Control (RBAC).",
                "State Corruption: Manual data synchronization leading to frequent race conditions and record loss."
            ],
            fr: [
                "Silos de Données : Workflows Excel/Access fragmentés sans source de vérité centrale.",
                "Défaut de Sécurité : Identifiants partagés et absence de contrôle d'accès basé sur les rôles (RBAC).",
                "Corruption d'État : Synchronisation manuelle provoquant des 'race conditions' et des pertes de données."
            ]
        }
    };

    return (
        <section id="experience" className="py-32 px-8 max-w-7xl mx-auto border-t border-outline/10">
            <div className="mb-20 relative z-10">
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none mb-4">
                    {t.title[lang]} <br />
                    <span className="text-primary">{t.subtitle[lang]}</span>
                </h2>
            </div>

            {/* STITCHED CONTAINER: No Gap, High Contrast Borders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch relative">

                {/* 1. LEGACY ZONE: Amber + Dashed + Glass */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-5 p-10 md:p-14
                               rounded-t-[3rem] lg:rounded-tr-none lg:rounded-l-[3rem]
                               border-2 border-dashed border-amber-500/40
                               bg-surface-container-lowest/40 backdrop-blur-3xl relative z-10"
                >
                    <div className="flex items-center gap-3 mb-10 text-amber-500 font-black text-xs uppercase tracking-[0.2em]">
                        <History size={16} />
                        {t.legacyLabel[lang]}
                    </div>

                    <div className="space-y-8">
                        {t.legacyPoints[lang].map((point, i) => (
                            <div key={i} className="flex gap-5 items-start">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500/60">
                                    <ShieldAlert size={18} />
                                </div>
                                <p className="text-base font-mono text-on-surface-variant leading-relaxed italic">
                                    {point}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Transition Connector */}
                    <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl bg-primary rotate-45 items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                        <Zap size={18} className="text-on-primary -rotate-45" />
                    </div>
                </motion.div>

                {/* 2. MODERN ZONE: Primary + Solid + Glass */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-7 p-10 md:p-14
                               rounded-b-[3rem] lg:rounded-bl-none lg:rounded-r-[3rem]
                               border-2 border-solid border-primary/30 lg:-ml-[2px]
                               bg-surface-container-high/60 backdrop-blur-3xl relative overflow-hidden z-20"
                >
                    {/* Interior Blueprint Grid Detail */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                         style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10 text-primary font-black text-xs uppercase tracking-[0.2em]">
                            <Layers size={16} />
                            {t.modernLabel[lang]}
                        </div>

                        <div className="mb-12">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-on-surface leading-tight">
                                {CDAFAL_EXP.role[lang]}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <p className="text-primary font-bold text-lg uppercase tracking-wider">{CDAFAL_EXP.company}</p>
                                <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-outline/20" />
                                <p className="text-on-surface-variant/60 font-mono text-sm uppercase">{CDAFAL_EXP.period}</p>
                            </div>
                        </div>

                        {/* Tech Stack Bubbles */}
                        <div className="flex flex-wrap gap-2 mb-12">
                            {CDAFAL_EXP.tech.map((tech) => (
                                <span key={tech} className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black text-primary uppercase">
                                    {tech}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-outline/10">
                            {CDAFAL_EXP.tasks[lang].map((task, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="mt-1 p-1 rounded bg-primary/20 text-primary">
                                        <CheckCircle2 size={14} className="shrink-0" />
                                    </div>
                                    <p className="text-sm font-medium text-on-surface-variant leading-snug group-hover:text-on-surface transition-colors">
                                        {task}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    History,
    ShieldAlert,
    CheckCircle2,
    Layers,
    Zap,
    Briefcase,
    GraduationCap
} from 'lucide-react';
import { Locale, CDAFAL_EXP } from '@/lib/constants';

interface ExperienceProps { lang: Locale; }

export const Experience = ({ lang }: ExperienceProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const t = {
        title: { en: "Engineering", fr: "Parcours" },
        subtitle: { en: "Experience.", fr: "Ingénieur." },
        // Titre spécifique pour le rôle
        roleTitle: {
            en: "Fullstack & DevOps Intern",
            fr: "Ingénieur Stagiaire Fullstack & DevOps"
        },
        internshipBadge: {
            en: "Bachelor's Degree Internship",
            fr: "Stage de Fin de Licence"
        },
        legacyLabel: { en: "Initial Audit: Legacy State", fr: "Audit Initial : État Legacy" },
        modernLabel: { en: "System Deployment: V2 Architecture", fr: "Déploiement : Architecture V2" },
        legacyPoints: {
            en: [
                "Data Silos: Fragmented Excel/Access workflows with no central source of truth.",
                "Zero-Trust Failure: Shared credentials and lack of Role-Based Access Control (RBAC).",
                "State Corruption: Manual data synchronization leading to frequent race conditions."
            ],
            fr: [
                "Silos de Données : Workflows Excel/Access fragmentés sans source de vérité centrale.",
                "Défaut de Sécurité : Identifiants partagés et absence de contrôle d'accès (RBAC).",
                "Corruption d'État : Synchronisation manuelle provoquant des 'race conditions'."
            ]
        }
    };

    if (!isMounted) return null;

    return (
        <section id="experience" className="py-32 px-8 max-w-7xl mx-auto border-t border-outline-variant relative">

            {/* Header Section */}
            <div className="mb-20 relative z-10">
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none mb-4 text-on-background">
                    {t.title[lang]} <br />
                    <span className="text-primary">{t.subtitle[lang]}</span>
                </h2>

                {/* Badge de statut académique/professionnel */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container border border-outline-variant text-[10px] font-black uppercase tracking-[0.2em] mt-4">
                    <GraduationCap size={14} />
                    {t.internshipBadge[lang]}
                </div>
            </div>

            {/* Stitched Blueprint Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch relative">

                {/* 1. LEGACY ZONE (L'audit de stagiaire) */}
                <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-5 p-10 md:p-14
                               rounded-t-[3rem] lg:rounded-tr-none lg:rounded-l-[3rem]
                               border-2 border-dashed border-error/60
                               bg-error-container/10 backdrop-blur-3xl relative z-10 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-10 text-error font-black text-xs uppercase tracking-[0.3em]">
                        <History size={18} strokeWidth={3} />
                        {t.legacyLabel[lang]}
                    </div>

                    <div className="space-y-8">
                        {t.legacyPoints[lang].map((point, i) => (
                            <div key={i} className="flex gap-5 items-start">
                                <div className="p-2 rounded-lg bg-error-container text-on-error-container shadow-md">
                                    <ShieldAlert size={20} />
                                </div>
                                <p className="text-base font-mono text-on-error-container leading-relaxed italic">
                                    {point}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Noeud de transition */}
                    <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl bg-tertiary rotate-45 items-center justify-center shadow-xl shadow-shadow/40 border-2 border-on-tertiary/20">
                        <Zap size={20} className="text-on-tertiary -rotate-45 animate-pulse" />
                    </div>
                </motion.div>

                {/* 2. MODERN ZONE (La réalisation technique) */}
                <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-7 p-10 md:p-14
                               rounded-b-[3rem] lg:rounded-bl-none lg:rounded-r-[3rem]
                               border-2 border-solid border-primary/40 lg:-ml-[2px]
                               bg-surface-container-high/80 backdrop-blur-3xl relative overflow-hidden z-20 shadow-2xl"
                >
                    {/* Grillage Blueprint */}
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
                         style={{
                             backgroundImage: 'radial-gradient(circle, var(--md-sys-color-primary) 1px, transparent 1px)',
                             backgroundSize: '40px 40px'
                         }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10 text-primary font-black text-xs uppercase tracking-[0.3em]">
                            <Layers size={18} />
                            {t.modernLabel[lang]}
                        </div>

                        <div className="mb-12">
                            {/* Titre incluant le statut de stagiaire ingénieur */}
                            <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-on-surface leading-[0.9]">
                                {t.roleTitle[lang]}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <p className="text-primary font-bold text-lg uppercase tracking-wider">{CDAFAL_EXP.company}</p>
                                <span className="hidden md:block w-2 h-2 rounded-full bg-tertiary/40" />
                                <p className="text-on-surface-variant font-mono text-sm uppercase">{CDAFAL_EXP.period}</p>
                            </div>
                        </div>

                        {/* Stack Technique */}
                        <div className="flex flex-wrap gap-2 mb-12">
                            {CDAFAL_EXP.tech.map((tech) => (
                                <span key={tech} className="px-3 py-1 rounded-full border border-tertiary/30 bg-tertiary-container/40 text-[10px] font-black text-on-tertiary-container uppercase tracking-tight">
                                    {tech}
                                </span>
                            ))}
                        </div>

                        {/* Liste des tâches */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-outline-variant">
                            {CDAFAL_EXP.tasks[lang].map((task, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="mt-1 p-1 rounded-md bg-primary-container text-on-primary-container shadow-sm group-hover:scale-110 transition-transform">
                                        <CheckCircle2 size={14} className="shrink-0" />
                                    </div>
                                    <p className="text-sm font-medium text-on-surface leading-snug">
                                        {task}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer de statut final */}
            <div className="mt-10 flex items-center gap-4 px-6 opacity-30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-on-background">Major Internship: Deliverables Validated</span>
                </div>
                <div className="flex-grow h-px bg-outline-variant" />
            </div>
        </section>
    );
};
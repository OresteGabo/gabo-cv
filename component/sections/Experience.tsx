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
    GraduationCap,
    Smartphone
} from 'lucide-react';
import { Locale } from '@/lib/constants';

interface ExperienceProps { lang: Locale; }

export const Experience = ({ lang }: ExperienceProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const t = {
        title: { en: "Engineering", fr: "Parcours" },
        subtitle: { en: "Experience.", fr: "Ingénieur." },

        // --- SECTION 1: SOFTWARE ENGINEER (CDAFAL 2023-2025) ---
        mainRole: {
            en: "Software Engineer — Mobile & Systems",
            fr: "Ingénieur Logiciel — Systèmes & Mobile"
        },
        mainModernLabel: {
            en: "Production & Research: Digital Inclusion",
            fr: "Production & Recherche : Inclusion Numérique"
        },
        mobileTasks: {
            en: [
                "Developed an inclusive mobile platform for remote education and citizen support services.",
                "Integrated LiveKit (WebRTC) for secure, real-time language learning and virtual consultations.",
                "Optimized accessibility for diverse users, ensuring stability on low-end devices and slow networks.",
                "Implemented JWT-based security to protect sensitive personal data and academic records."
            ],
            fr: [
                "Développement d'une plateforme mobile inclusive pour l'éducation et le soutien citoyen.",
                "Intégration de LiveKit (WebRTC) pour l'apprentissage des langues et consultations virtuelles.",
                "Optimisation de l'accessibilité pour garantir la stabilité sur smartphones d'entrée de gamme.",
                "Mise en place de la sécurité via JWT pour protéger les données personnelles et dossiers académiques."
            ]
        },
        researchModernLabel: {
            en: "Research: V2V Urban Mobility",
            fr: "Recherche : Mobilité Urbaine V2V"
        },
        mainCompany: "CDAFAL / Mulhouse City",
        mainPeriod: "2023 — 2025",
        mainBadge: { en: "Professional Career", fr: "Parcours Professionnel" },
        //mainModernLabel: { en: "Production: Scalable Mobile Ecosystem", fr: "Production : Écosystème Mobile Scalable" },
        mainStack: ["Jetpack Compose", "SwiftUI", "LiveKit", "WebRTC", "Spring Boot", "JWT"],


        // --- SECTION 2: THE INTERNSHIP (LEGACY VS MODERN) ---
        internRole: {
            en: "Web Developer & Data Intern",
            fr: "Stagiaire Développeur Web & Data"
        },
        internCompany: "Member Management Systems",
        internPeriod: "2022",
        internBadge: { en: "Academic Internship", fr: "Stage de Licence" },
        legacyLabel: { en: "Initial Audit: Legacy State", fr: "Audit Initial : État Legacy" },
        modernLabel: { en: "Digitalization: V2 System", fr: "Numérisation : Système V2" },
        legacyPoints: {
            en: [
                "Data Silos: Fragmented Excel workflows with no central source of truth.",
                "Manual Tracking: Paper-based exam management for foreign residents.",
                "Process Corruption: Frequent data loss during manual payment entries."
            ],
            fr: [
                "Silos de Données : Workflows Excel fragmentés sans source de vérité.",
                "Suivi Manuel : Gestion papier des examens pour les résidents étrangers.",
                "Corruption d'État : Pertes de données fréquentes lors des saisies manuelles."
            ]
        },
        internTasks: {
            en: [
                "Digitalized member registration and payment tracking via Vue.js.",
                "Built a high-performance C++ ETL tool for historical data migration.",
                "Automated French language exam scheduling and results tracking."
            ],
            fr: [
                "Numérisation des adhésions et paiements via Vue.js.",
                "Outil ETL en C++ pour la migration performante des données historiques.",
                "Automatisation du suivi des cours et examens de langue française."
            ]
        },

        researchTasks: {
            en: [
                "Developed a C++/Qt6 framework to simulate Connected Vehicles (V2V).",
                "Refactored rendering with QGraphicsScene for real-time visualization.",
                "Used Qt Concurrency for multithreaded signal and frequency logic.",
                "Designed HIL-style testing to validate urban network protocols."
            ],
            fr: [
                "Framework C++/Qt6 pour simuler des véhicules connectés (V2V).",
                "Rendu temps réel optimisé via QGraphicsScene.",
                "Simulation multi-threadée des signaux et fréquences via Qt Concurrency.",
                "Conception de tests type HIL pour les protocoles réseau urbains."
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
            </div>

            {/* --- PROFESSIONAL CAREER (Parallel with Masters) --- */}
            <div className="mb-24">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Briefcase size={14} />
                    {t.mainBadge[lang]}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-10 md:p-14 rounded-[3rem] border-2 border-solid border-primary/40 bg-surface-container-high/80 backdrop-blur-3xl relative overflow-hidden shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10 text-primary font-black text-xs uppercase tracking-[0.3em]">
                            <Smartphone size={18} />
                            {t.mainModernLabel[lang]}
                        </div>

                        <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-on-surface leading-[0.9]">
                            {t.mainRole[lang]}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            <p className="text-primary font-bold text-lg uppercase tracking-wider">CDAFAL 68 / Mulhouse City</p>
                            <span className="hidden md:block w-2 h-2 rounded-full bg-tertiary/40" />
                            <p className="text-on-surface-variant font-mono text-sm uppercase">June 2023 — Dec 2025</p>
                        </div>

                        {/* Combined Tech Stack */}
                        <div className="flex flex-wrap gap-2 mb-12">
                            {["Jetpack Compose", "SwiftUI", "LiveKit", "WebRTC", "C++ / Qt6", "Spring Boot", "JWT"].map((tech) => (
                                <span key={tech} className="px-3 py-1 rounded-full border border-tertiary/30 bg-tertiary-container/40 text-[10px] font-black text-on-tertiary-container uppercase tracking-tight">
                        {tech}
                    </span>
                            ))}
                        </div>

                        {/* Combined Tasks - Grouped by Domain */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-10 border-t border-outline-variant">

                            {/* Mobile & Telehealth Domain */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Mobile & Telehealth</h4>
                                {t.mobileTasks[lang].map((task, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-1 p-1 rounded-md bg-primary-container text-on-primary-container shadow-sm group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <p className="text-sm font-medium text-on-surface leading-snug">{task}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Research & Simulation Domain */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-2 italic">V2V Research & Simulation</h4>
                                {t.researchTasks[lang].map((task, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-1 p-1 rounded-md bg-tertiary-container text-on-tertiary-container shadow-sm group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <p className="text-sm font-medium text-on-surface leading-snug">{task}</p>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- BLOCK 2: INTERNSHIP (LEGACY VS MODERN) --- */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container border border-outline-variant text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <GraduationCap size={14} />
                {t.internBadge[lang]}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch relative">
                {/* Legacy Zone */}
                <motion.div className="lg:col-span-5 p-10 border-2 border-dashed border-error/60 bg-error-container/10 backdrop-blur-3xl rounded-t-[3rem] lg:rounded-tr-none lg:rounded-l-[3rem] relative z-10">
                    <div className="flex items-center gap-3 mb-10 text-error font-black text-xs uppercase tracking-[0.3em]">
                        <History size={18} strokeWidth={3} />
                        {t.legacyLabel[lang]}
                    </div>
                    <div className="space-y-8">
                        {t.legacyPoints[lang].map((point, i) => (
                            <div key={i} className="flex gap-5 items-start">
                                <div className="p-2 rounded-lg bg-error-container text-on-error-container"><ShieldAlert size={20} /></div>
                                <p className="text-sm font-mono text-on-error-container leading-relaxed italic">{point}</p>
                            </div>
                        ))}
                    </div>
                    <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl bg-tertiary rotate-45 items-center justify-center border-2 border-on-tertiary/20">
                        <Zap size={20} className="text-on-tertiary -rotate-45 animate-pulse" />
                    </div>
                </motion.div>

                {/* Modern Zone */}
                <motion.div className="lg:col-span-7 p-10 border-2 border-solid border-outline-variant lg:-ml-[2px] bg-surface-container-high/80 rounded-b-[3rem] lg:rounded-bl-none lg:rounded-r-[3rem] relative z-20">
                    <div className="flex items-center gap-3 mb-10 text-primary font-black text-xs uppercase tracking-[0.3em]">
                        <Layers size={18} />
                        {t.modernLabel[lang]}
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mb-2 text-on-surface">{t.internRole[lang]}</h3>
                    <p className="text-primary font-bold mb-8 uppercase tracking-widest text-xs">{t.internCompany} | {t.internPeriod}</p>
                    <div className="grid grid-cols-1 gap-4 pt-6 border-t border-outline-variant">
                        {t.internTasks[lang].map((task, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="mt-1 p-1 rounded-md bg-secondary-container text-on-secondary-container"><CheckCircle2 size={12} /></div>
                                <p className="text-sm font-medium text-on-surface">{task}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Final Footer Status */}
            <div className="mt-10 flex items-center gap-4 px-6 opacity-30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-on-background">System Architect Status: Production Ready</span>
                </div>
                <div className="flex-grow h-px bg-outline-variant" />
            </div>
        </section>
    );
};
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

        mainRole: {
            en: "Software Engineer — Mobile & Systems",
            fr: "Ingénieur Logiciel — Systèmes & Mobile"
        },
        mainModernLabel: {
            en: "Production: Citizen Services & Realtime Mobile",
            fr: "Production : Services Citoyens & Mobile Temps Réel"
        },
        mobileTasks: {
            en: [
                "Developed and deployed a citizen-facing mobile platform for secure access to city services and documents.",
                "Built native user experiences with Jetpack Compose and SwiftUI for real mobile workflows.",
                "Integrated LiveKit (WebRTC) for secure real-time video consultations between citizens and public-service staff.",
                "Worked across mobile clients and backend APIs to support reliable service journeys end to end."
            ],
            fr: [
                "Développement et déploiement d'une plateforme mobile orientée citoyens pour l'accès sécurisé aux services et documents.",
                "Conception d'expériences natives avec Jetpack Compose et SwiftUI pour des parcours mobiles concrets.",
                "Intégration de LiveKit (WebRTC) pour des consultations vidéo temps réel sécurisées entre citoyens et agents.",
                "Travail sur les clients mobiles et les API backend pour assurer des parcours fiables de bout en bout."
            ]
        },
        systemsLabel: {
            en: "Security & Performance",
            fr: "Sécurité & Performance"
        },
        mainCompany: "CDAFAL / Mulhouse City / France",
        mainPeriod: "2023 — 2025",
        mainBadge: { en: "Professional Career", fr: "Parcours Professionnel" },
        mainStack: ["Jetpack Compose", "SwiftUI", "LiveKit / WebRTC", "Spring Boot", "REST APIs", "JWT", "Performance"],


        internRole: {
            en: "Web Developer Intern",
            fr: "Stagiaire Développeur Web"
        },
        internCompany: "CDAFAL / Mulhouse City / France",
        internPeriod: "Jan 2023 — Jun 2023",
        internBadge: { en: "Academic Internship", fr: "Stage de Licence" },
        legacyLabel: { en: "Mission Scope", fr: "Périmètre de Mission" },
        modernLabel: { en: "Delivery: Digitalization System", fr: "Livraison : Système de Numérisation" },
        legacyPoints: {
            en: [
                "Member registration and fee tracking were still heavily manual.",
                "Student records for foreign residents depended on fragmented processes.",
                "National exam and language-course data needed a reliable migration path."
            ],
            fr: [
                "Les inscriptions et le suivi des frais restaient largement manuels.",
                "Les dossiers des résidents étrangers dépendaient de processus fragmentés.",
                "Les données d'examens nationaux et de cours de langue demandaient une migration fiable."
            ]
        },
        internTasks: {
            en: [
                "Engineered internal automation tools for member registration and fee tracking.",
                "Built a responsive Vue.js interface backed by Spring Boot services.",
                "Developed a custom C++ ETL tool to migrate and process exam and language-course data.",
                "Digitalized student-record management for foreign residents, replacing manual workflows."
            ],
            fr: [
                "Conception d'outils internes d'automatisation pour les inscriptions et le suivi des frais.",
                "Développement d'une interface Vue.js connectée à un backend Spring Boot.",
                "Création d'un outil ETL sur mesure en C++ pour migrer et traiter les données d'examens et de cours.",
                "Numérisation de la gestion des dossiers étudiants pour remplacer les processus manuels."
            ]
        },

        systemsTasks: {
            en: [
                "Implemented JWT-secured API flows to protect sensitive personal data.",
                "Optimized app stability and responsiveness for low-bandwidth environments.",
                "Improved the experience for users on entry-level smartphones and constrained devices.",
                "Focused on production-ready reliability for public-service and citizen-support use cases."
            ],
            fr: [
                "Mise en place de flux API sécurisés par JWT pour protéger les données sensibles.",
                "Optimisation de la stabilité et de la réactivité en environnement à faible bande passante.",
                "Amélioration de l'expérience sur smartphones d'entrée de gamme et appareils contraints.",
                "Priorité donnée à une fiabilité de niveau production pour des usages de service public."
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
                            <p className="text-primary font-bold text-lg uppercase tracking-wider">{t.mainCompany}</p>
                            <span className="hidden md:block w-2 h-2 rounded-full bg-tertiary/40" />
                            <p className="text-on-surface-variant font-mono text-sm uppercase">{t.mainPeriod}</p>
                        </div>

                        {/* Combined Tech Stack */}
                        <div className="flex flex-wrap gap-2 mb-12">
                            {t.mainStack.map((tech) => (
                                <span key={tech} className="px-3 py-1 rounded-full border border-tertiary/30 bg-tertiary-container/40 text-[10px] font-black text-on-tertiary-container uppercase tracking-tight">
                        {tech}
                    </span>
                            ))}
                        </div>

                        {/* Combined Tasks - Grouped by Domain */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-10 border-t border-outline-variant">

                            {/* Mobile & Realtime Domain */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Mobile & Real-Time Systems</h4>
                                {t.mobileTasks[lang].map((task, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-1 p-1 rounded-md bg-primary-container text-on-primary-container shadow-sm group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <p className="text-sm font-medium text-on-surface leading-snug">{task}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Security & Performance Domain */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-2 italic">{t.systemsLabel[lang]}</h4>
                                {t.systemsTasks[lang].map((task, i) => (
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

"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    History,
    ShieldAlert,
    CheckCircle2,
    Layers,
    Zap,
    GraduationCap
} from 'lucide-react';
import { Locale } from '@/lib/constants';

interface ExperienceProps { lang: Locale; }

export const Experience = ({ lang }: ExperienceProps) => {
    const t = {
        title: { en: "Engineering", fr: "Parcours" },
        subtitle: { en: "Experience.", fr: "Ingénieur." },

        internRole: {
            en: "Fullstack Developer Intern",
            fr: "Stagiaire Développeur Fullstack"
        },
        internCompany: "CDAFAL 68",
        internBadge: { en: "End-of-degree Internship · 6 months", fr: "Stage de fin de Licence · 6 mois" },
        internStack: ["Spring Boot", "Vue.js", "REST APIs", "JWT", "SQL", "Git", "GitHub Actions", "Docker"],
        legacyLabel: { en: "Mission Scope", fr: "Périmètre de Mission" },
        modernLabel: { en: "Delivery: Digitalization System", fr: "Livraison : Système de Numérisation" },
        legacyPoints: {
            en: [
                "Business processes relied on paper, Excel, and Access.",
                "The workflow needed to support simultaneous users.",
                "Access security, profile-based permissions, and data consistency needed improvement."
            ],
            fr: [
                "Les processus métier reposaient sur le papier, Excel et Access.",
                "Le fonctionnement devait permettre le travail simultané des utilisateurs.",
                "La sécurisation des accès, les droits par profil et la cohérence des données devaient être améliorés."
            ]
        },
        internTasks: {
            en: [
                "Digitalized a paper/Excel/Access business process into a Spring Boot and Vue.js web application supporting simultaneous users.",
                "Secured access with JWT, managed profile-based permissions, and improved data consistency.",
                "Contributed to requirements analysis, data structuring, and REST API design.",
                "Delivered functional fixes and progressively improved the application based on user feedback."
            ],
            fr: [
                "Digitalisation d’un processus métier papier/Excel/Access vers une application web Spring Boot et Vue.js permettant le travail simultané des utilisateurs.",
                "Sécurisation des accès par JWT, gestion des droits par profil et amélioration de la cohérence des données.",
                "Participation à l’analyse du besoin, à la structuration des données et à la conception d’API REST.",
                "Corrections fonctionnelles et amélioration progressive de l’outil selon les retours utilisateurs."
            ]
        }
    };

    return (
        <section id="experience" className="py-32 px-8 max-w-7xl mx-auto border-t border-outline-variant relative">

            {/* Header Section */}
            <div className="mb-20 relative z-10">
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none mb-4 text-on-background">
                    {t.title[lang]} <br />
                    <span className="text-primary">{t.subtitle[lang]}</span>
                </h2>
            </div>

            {/* Internship */}
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
                    <p className="text-primary font-bold mb-8 uppercase tracking-widest text-xs">{t.internCompany}</p>
                    <div className="flex flex-wrap gap-2 mb-8">
                        {t.internStack.map((tech) => (
                            <span key={tech} className="px-3 py-1 rounded-full border border-tertiary/30 bg-tertiary-container/40 text-[10px] font-black text-on-tertiary-container uppercase tracking-tight">
                                {tech}
                            </span>
                        ))}
                    </div>
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

            {/* Engineering focus */}
            <div className="mt-10 flex items-center gap-4 px-6 opacity-30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-on-background">
                        {lang === "en"
                            ? "Engineering focus: secure, reliable digital systems"
                            : "Priorité : systèmes numériques sécurisés et fiables"}
                    </span>
                </div>
                <div className="flex-grow h-px bg-outline-variant" />
            </div>
        </section>
    );
};

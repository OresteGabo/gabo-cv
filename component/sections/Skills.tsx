"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Boxes, CheckCircle2 } from "lucide-react";
import { Locale } from "@/lib/constants";
import { TechIcon } from "@/component/shared/TechIcon";

interface SkillsProps {
    lang: Locale;
}

const skillGroups = [
    {
        status: "APPLIED",
        icon: CheckCircle2,
        title: {
            en: "Applied professionally",
            fr: "Appliqué professionnellement",
        },
        description: {
            en: "Used in professional delivery or production-facing engineering work.",
            fr: "Utilisé dans des livraisons professionnelles ou des systèmes orientés production.",
        },
        skills: ["Kotlin", "Java", "Spring Boot", "Android", "SwiftUI", "PostgreSQL", "REST APIs", "JWT", "Git"],
    },
    {
        status: "BUILT",
        icon: Boxes,
        title: {
            en: "Built in substantial projects",
            fr: "Construit dans des projets substantiels",
        },
        description: {
            en: "Implemented in portfolio systems such as Kaze, SchoolBridge, and this web platform.",
            fr: "Implémenté dans des systèmes du portfolio comme Kaze, SchoolBridge et cette plateforme web.",
        },
        skills: ["KMP", "Compose Multiplatform", "Ktor", "OpenAPI", "OAuth2", "Docker", "Cloud Run", "TypeScript", "Next.js", "C++"],
    },
    {
        status: "EXPLORING",
        icon: BookOpenCheck,
        title: {
            en: "Currently exploring",
            fr: "En cours d'exploration",
        },
        description: {
            en: "Active professional development, including KotlinConf 2026 learning.",
            fr: "Développement professionnel actif, notamment via KotlinConf 2026.",
        },
        skills: ["Sentry", "Koog", "MCP", "Spring Boot 4", "On-device AI", "Observability"],
    },
];

export const Skills = ({ lang }: SkillsProps) => {
    const t = {
        eyebrow: {
            en: "Capability Map",
            fr: "Carte de Compétences",
        },
        title: {
            en: "Engineering Toolkit.",
            fr: "Boîte à Outils.",
        },
        intro: {
            en: "Technologies grouped by evidence, so the distinction between professional experience, project implementation, and active learning remains clear.",
            fr: "Technologies regroupées par niveau de preuve afin de distinguer clairement expérience professionnelle, projets réalisés et apprentissage actif.",
        },
    };

    return (
        <section id="skills" className="py-24 px-6 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <p className="text-primary text-xs font-black uppercase tracking-[0.35em] mb-5">
                        {t.eyebrow[lang]}
                    </p>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                        {t.title[lang]}
                    </h2>
                </div>
                <p className="max-w-xl text-on-surface-variant leading-relaxed font-medium">
                    {t.intro[lang]}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {skillGroups.map((group, index) => {
                    const GroupIcon = group.icon;

                    return (
                        <motion.article
                            key={group.status}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08 }}
                            className="rounded-[2rem] border border-outline/10 bg-surface-container-low p-7"
                        >
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                    <GroupIcon size={20} />
                                </div>
                                <span className="text-[9px] font-black tracking-[0.25em] text-primary">{group.status}</span>
                            </div>

                            <h3 className="text-xl font-black tracking-tight mb-3">{group.title[lang]}</h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed mb-7">
                                {group.description[lang]}
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                {group.skills.map((skill) => (
                                    <div
                                        key={skill}
                                        className="flex items-center gap-3 rounded-xl border border-outline/8 bg-background/45 px-3 py-3"
                                    >
                                        <TechIcon name={skill} className="shrink-0 text-primary" size={17} />
                                        <span className="text-[10px] font-black uppercase tracking-wide leading-tight">
                                            {skill}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.article>
                    );
                })}
            </div>
        </section>
    );
};

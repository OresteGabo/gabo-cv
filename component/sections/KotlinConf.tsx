"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowUpRight,
    Bot,
    Gauge,
    MapPin,
    RadioTower,
    ScanSearch,
    ServerCog,
} from "lucide-react";
import { Locale, SITE_CONFIG } from "@/lib/constants";
import { TechIcon } from "@/component/shared/TechIcon";

interface KotlinConfProps {
    lang: Locale;
}

const conferenceNotes = [
    {
        code: "ARCH-01",
        icon: RadioTower,
        title: {
            en: "Architecture at organizational scale",
            fr: "Architecture à l'échelle d'une organisation",
        },
        text: {
            en: "Sessions on Amazon's Kotlin Multiplatform adoption connected mobile platform design with operational consistency: shared capabilities, native SwiftUI and Android experiences, modular boundaries, and feature parity across mission-critical applications.",
            fr: "Les sessions sur l'adoption de Kotlin Multiplatform chez Amazon ont relié conception mobile et cohérence opérationnelle : capacités partagées, expériences natives SwiftUI et Android, modularité et parité fonctionnelle pour des applications critiques.",
        },
        tags: ["KMP", "Platform Architecture", "Modularity", "Scale"],
    },
    {
        code: "BACKEND-02",
        icon: ServerCog,
        title: {
            en: "Resilient Kotlin backends",
            fr: "Backends Kotlin résilients",
        },
        text: {
            en: "Spring Boot 4 and Ktor sessions sharpened my thinking around null-safe APIs, serialization, dependency injection, third-party integrations, and API documentation that remains useful from design through production support.",
            fr: "Les sessions Spring Boot 4 et Ktor ont approfondi ma réflexion sur les API null-safe, la sérialisation, l'injection de dépendances, les intégrations tierces et une documentation utile de la conception au support en production.",
        },
        tags: ["Spring Boot 4", "Ktor", "API Design", "Documentation"],
    },
    {
        code: "OPS-03",
        icon: ScanSearch,
        title: {
            en: "Observability and faster diagnosis",
            fr: "Observabilité et diagnostic rapide",
        },
        text: {
            en: "Conversations around Sentry reinforced why production systems need actionable error context, release visibility, performance signals, and a clear path from an incident to its root cause. I am carrying those practices into how I design, debug, and document systems.",
            fr: "Les échanges autour de Sentry ont rappelé pourquoi les systèmes de production ont besoin d'erreurs contextualisées, de visibilité sur les versions, de signaux de performance et d'un chemin clair de l'incident à sa cause racine.",
        },
        tags: ["Sentry", "Monitoring", "RCA", "Release Health"],
    },
    {
        code: "AI-04",
        icon: Bot,
        title: {
            en: "Typed, privacy-aware AI systems",
            fr: "Systèmes IA typés et respectueux des données",
        },
        text: {
            en: "Koog, MCP, cloud models, and on-device inference showed how agentic features can be integrated into strongly typed applications while keeping orchestration, privacy, and system boundaries explicit.",
            fr: "Koog, MCP, les modèles cloud et l'inférence locale ont montré comment intégrer des fonctions agentiques dans des applications fortement typées tout en gardant orchestration, confidentialité et frontières système explicites.",
        },
        tags: ["Koog", "MCP", "On-device AI", "Privacy"],
    },
    {
        code: "PERF-05",
        icon: Gauge,
        title: {
            en: "Performance is an architectural constraint",
            fr: "La performance est une contrainte d'architecture",
        },
        text: {
            en: "Compose Multiplatform sessions on rendering, adaptive interfaces, and asset pipelines reinforced a practical rule: performance, battery use, memory, and bandwidth must shape the design from day one, especially for inclusive digital channels.",
            fr: "Les sessions Compose Multiplatform sur le rendu, les interfaces adaptatives et les pipelines d'assets ont renforcé une règle : performance, batterie, mémoire et bande passante doivent guider la conception dès le départ.",
        },
        tags: ["Compose Multiplatform", "Rendering", "Bandwidth", "Inclusive UX"],
    },
];

const gallery = [
    {
        src: "/events/kotlinconf-2026/oreste-gabo-marton-braun-kmp-architecture.jpg",
        alt: {
            en: "Oreste Gabo with Kotlin developer advocate Marton Braun at KotlinConf 2026",
            fr: "Oreste Gabo avec Marton Braun à KotlinConf 2026",
        },
        caption: {
            en: "KMP architecture discussion with Márton Braun",
            fr: "Échange sur l'architecture KMP avec Márton Braun",
        },
    },
    {
        src: "/events/kotlinconf-2026/oreste-gabo-josh-long-spring-boot.jpg",
        alt: {
            en: "Oreste Gabo with Spring developer advocate Josh Long at KotlinConf 2026",
            fr: "Oreste Gabo avec Josh Long à KotlinConf 2026",
        },
        caption: {
            en: "Spring ecosystem exchange with Josh Long",
            fr: "Échange sur l'écosystème Spring avec Josh Long",
        },
    },
    {
        src: "/events/kotlinconf-2026/oreste-gabo-philipp-lackner-kotlin.jpg",
        alt: {
            en: "Oreste Gabo with Kotlin educator Philipp Lackner at KotlinConf 2026",
            fr: "Oreste Gabo avec Philipp Lackner à KotlinConf 2026",
        },
        caption: {
            en: "Kotlin community with Philipp Lackner",
            fr: "Communauté Kotlin avec Philipp Lackner",
        },
    },
    {
        src: "/events/kotlinconf-2026/oreste-gabo-kodee-kotlinconf.jpg",
        alt: {
            en: "Oreste Gabo with the Kodee mascot at KotlinConf 2026",
            fr: "Oreste Gabo avec la mascotte Kodee à KotlinConf 2026",
        },
        caption: {
            en: "With Kodee, the Kotlin mascot",
            fr: "Avec Kodee, la mascotte de Kotlin",
        },
    },
];

export const KotlinConf = ({ lang }: KotlinConfProps) => {
    const t = {
        eyebrow: {
            en: "Professional Development · May 2026",
            fr: "Développement Professionnel · Mai 2026",
        },
        title: {
            en: "KotlinConf 2026",
            fr: "KotlinConf 2026",
        },
        location: {
            en: "Munich, Germany",
            fr: "Munich, Allemagne",
        },
        intro: {
            en: "Three days of architecture, backend, mobile, AI, tooling, and engineering-community conversations. I focused on ideas that translate into more reliable digital platforms: scalable Kotlin systems, observable production software, explicit API contracts, and performance for real devices.",
            fr: "Trois jours consacrés à l'architecture, au backend, au mobile, à l'IA, aux outils et aux échanges avec la communauté. J'ai retenu les idées qui rendent les plateformes plus fiables : systèmes Kotlin scalables, logiciels observables, contrats API explicites et performance sur appareils réels.",
        },
        notes: {
            en: "Field Notes",
            fr: "Notes de Terrain",
        },
        evidence: {
            en: "Conference connections",
            fr: "Rencontres à la conférence",
        },
        linkedin: {
            en: "Read my KotlinConf notes on LinkedIn",
            fr: "Lire mes notes KotlinConf sur LinkedIn",
        },
        context: {
            en: "Conference learning and professional development. Technologies listed here are takeaways I am actively studying and applying where appropriate.",
            fr: "Apprentissage en conférence et développement professionnel. Les technologies listées ici sont des sujets que j'étudie et applique lorsqu'elles sont pertinentes.",
        },
    };

    return (
        <section id="kotlinconf" className="py-28 px-6 md:px-8 border-y border-outline/10 bg-surface-container-lowest/40">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-7 relative min-h-[430px] md:min-h-[560px] overflow-hidden rounded-[2.5rem] border border-outline/10 bg-surface-container"
                    >
                        <Image
                            src="/events/kotlinconf-2026/oreste-gabo-kotlinconf-2026-munich.jpg"
                            alt="Oreste Gabo at the KotlinConf 2026 event wall in Munich"
                            fill
                            priority={false}
                            sizes="(min-width: 1024px) 58vw, 100vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-7 md:p-10 text-white">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-3">
                                {t.eyebrow[lang]}
                            </p>
                            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-none mb-4">
                                {t.title[lang]}
                            </h2>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                                <MapPin size={16} />
                                {t.location[lang]}
                            </div>
                        </div>
                    </motion.div>

                    <div className="lg:col-span-5 flex flex-col justify-between rounded-[2.5rem] border border-primary/15 bg-primary/8 p-8 md:p-10">
                        <div>
                            <span className="inline-flex px-3 py-1.5 rounded-full bg-primary text-on-primary text-[9px] font-black uppercase tracking-[0.2em] mb-7">
                                {t.notes[lang]}
                            </span>
                            <p className="text-xl md:text-2xl font-bold leading-relaxed text-on-surface mb-8">
                                {t.intro[lang]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {["Kotlin", "KMP", "Spring Boot 4", "Ktor", "Sentry", "Koog", "MCP"].map((topic) => (
                                    <span key={topic} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline/10 bg-background/50 text-[10px] font-black uppercase tracking-wider">
                                        <TechIcon name={topic} size={14} className="text-primary" />
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <a
                            href={SITE_CONFIG.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-10 inline-flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-background/60 p-5 text-primary hover:bg-primary hover:text-on-primary transition-colors"
                        >
                            <span className="text-xs font-black uppercase tracking-[0.16em]">{t.linkedin[lang]}</span>
                            <ArrowUpRight size={20} />
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-16">
                    {conferenceNotes.map((note, index) => {
                        const Icon = note.icon;
                        return (
                            <motion.article
                                key={note.code}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.06 }}
                                className="rounded-[2rem] border border-outline/10 bg-surface-container-low p-6"
                            >
                                <div className="flex items-center justify-between gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Icon size={20} />
                                    </div>
                                    <span className="text-[9px] font-mono text-on-surface-variant/60">{note.code}</span>
                                </div>
                                <h3 className="text-lg font-black tracking-tight leading-tight mb-4">{note.title[lang]}</h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{note.text[lang]}</p>
                                <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag) => (
                                        <span key={tag} className="text-[9px] font-bold text-primary uppercase tracking-wide">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.article>
                        );
                    })}
                </div>

                <div className="flex items-end justify-between gap-6 mb-6">
                    <h3 className="text-2xl md:text-4xl font-black tracking-tight">{t.evidence[lang]}</h3>
                    <p className="hidden md:block max-w-lg text-right text-xs text-on-surface-variant leading-relaxed">
                        {t.context[lang]}
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                    {gallery.map((photo) => (
                        <figure key={photo.src} className="group">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] border border-outline/10 bg-surface-container">
                                <Image
                                    src={photo.src}
                                    alt={photo.alt[lang]}
                                    fill
                                    sizes="(min-width: 1024px) 25vw, 50vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            </div>
                            <figcaption className="mt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                {photo.caption[lang]}
                            </figcaption>
                        </figure>
                    ))}
                </div>

                <p className="md:hidden mt-8 text-xs text-on-surface-variant leading-relaxed">
                    {t.context[lang]}
                </p>
            </div>
        </section>
    );
};

"use client";
import React from 'react';
import { motion } from 'framer-motion';
// Ensure the import path for EngineeringCore matches your file structure
import { EngineeringCore } from "@/component/shared/EngineeringCore";
import { Locale } from "@/lib/constants";

interface HeroProps {
    lang: Locale;
}

export const Hero = ({ lang }: HeroProps) => {
    // Translation object for internal UI strings
    const t = {
        badge: {
            en: "Available for Engineering Roles — 2026",
            fr: "Disponible pour Postes Ingénieur — 2026"
        },
        nameLabel: {
            en: "Muhirwa Gabo Oreste",
            fr: "Muhirwa Gabo Oreste"
        },
        description: {
            en: "Software Engineer building secure mobile products, realtime communication features, and backend systems that stay reliable on real-world networks and low-end devices.",
            fr: "Ingénieur Logiciel concevant des produits mobiles sécurisés, des fonctionnalités temps réel et des systèmes backend fiables sur réseaux réels et appareils modestes."
        },
        skills: {
            en: ["Mobile Products", "Realtime Communication", "Backend APIs", "Low-Bandwidth Performance"],
            fr: ["Produits Mobiles", "Communication Temps Réel", "API Backend", "Performance Réseaux Limités"]
        }
    };

    return (
        <section className="min-h-screen flex flex-col justify-center px-8 pt-36 pb-16 md:pt-40 lg:pt-32 overflow-hidden">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* LEFT COLUMN: Text Content */}
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <span className="text-primary text-xs font-black uppercase tracking-[0.3em]">
                            {t.badge[lang]}
                        </span>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="mb-4 text-sm md:text-base font-bold uppercase tracking-[0.28em] text-on-surface-variant"
                    >
                        {t.nameLabel[lang]}
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        /* Reduced from 9rem to 5xl-7xl range.
                           Added 'max-w-4xl' to prevent it from stretching too wide.
                        */
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 max-w-4xl"
                    >
                        MOBILE <br />
                        <span className="text-primary">
        ENGINEER.
    </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-xl text-lg md:text-xl text-on-surface-variant leading-relaxed font-medium mb-10"
                    >
                        {t.description[lang]}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-3"
                    >
                        {t.skills[lang].map((skill) => (
                            <span key={skill} className="px-4 py-1.5 rounded-full border border-outline/10 text-[9px] font-black uppercase tracking-widest bg-surface-container-low shadow-sm">
                                {skill}
                            </span>
                        ))}
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: The Interactive 3D Stack */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="relative order-first lg:order-last h-[500px] lg:h-auto flex items-center justify-center"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    {/* PASSING LANG TO THE 3D CARDS */}
                    <EngineeringCore lang={lang} />
                </motion.div>

            </div>
        </section>
    );
};

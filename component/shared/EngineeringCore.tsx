"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUpRight, RadioTower, ShieldCheck, Smartphone } from "lucide-react";
import clsx from "clsx";
import { ENGINEERING_CARDS, Locale } from "@/lib/constants";

interface EngineeringCoreProps {
    lang: Locale;
}

export const EngineeringCore = ({ lang }: EngineeringCoreProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % ENGINEERING_CARDS.length);
        }, 5000);

        return () => window.clearInterval(timer);
    }, []);

    const activeCard = ENGINEERING_CARDS[index];
    const Icon = activeCard.Icon;

    const t = {
        label: {
            en: "Architecture Focus",
            fr: "Focus Architecture"
        },
        summary: {
            en: "Designing secure, explainable systems from user channel to backend service, data flow, and production operation.",
            fr: "Concevoir des systèmes sécurisés et explicables, du canal utilisateur au service backend, aux données et à l'exploitation."
        },
        board: {
            en: "System capabilities",
            fr: "Capacités système"
        },
        metrics: {
            en: [
                { icon: Smartphone, value: "Channels", label: "Android + iOS + web" },
                { icon: RadioTower, value: "Distributed", label: "Realtime communication" },
                { icon: ShieldCheck, value: "Security", label: "API boundaries + JWT" },
                { icon: Activity, value: "Reliability", label: "Constrained networks" }
            ],
            fr: [
                { icon: Smartphone, value: "Canaux", label: "Android + iOS + web" },
                { icon: RadioTower, value: "Distribué", label: "Communication temps réel" },
                { icon: ShieldCheck, value: "Sécurité", label: "Frontières API + JWT" },
                { icon: Activity, value: "Fiabilité", label: "Réseaux contraints" }
            ]
        },
        ready: {
            en: "Design to delivery",
            fr: "De la conception à la livraison"
        }
    };

    return (
        <div className="relative w-full max-w-[620px]">
            <div className="absolute inset-0 bg-primary/8 blur-[90px] rounded-full pointer-events-none" />

            <div className="relative rounded-[2.5rem] border border-outline/10 bg-surface-container/90 shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr]">
                    <aside className="border-b xl:border-b-0 xl:border-r border-outline/10 bg-surface-container-low/80 p-4 md:p-6">
                        <div className="flex items-center gap-3 text-primary mb-6">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.board[lang]}</span>
                        </div>

                        <div className="space-y-2">
                            {ENGINEERING_CARDS.map((card, cardIndex) => {
                                const RailIcon = card.Icon;

                                return (
                                    <button
                                        key={card.code}
                                        onClick={() => setIndex(cardIndex)}
                                        className={clsx(
                                            "w-full text-left rounded-2xl border px-3 py-3 md:px-4 md:py-4 transition-all duration-300",
                                            cardIndex === index
                                                ? "border-primary/25 bg-primary/10 text-on-surface shadow-lg shadow-primary/10"
                                                : "border-outline/5 bg-background/30 text-on-surface-variant hover:bg-primary/5 hover:border-primary/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-background/60">
                                                <RailIcon size={16} className={cardIndex === index ? "text-primary" : "text-on-surface-variant/60"} />
                                            </div>
                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-60">{card.code}</span>
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-wide leading-snug">
                                            {card.title[lang]}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <div className="p-4 md:p-8">
                        <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                                    {t.label[lang]}
                                </div>
                                <p className="max-w-xl text-sm text-on-surface-variant leading-relaxed">
                                    {t.summary[lang]}
                                </p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-primary">
                                <ArrowUpRight size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em]">{t.ready[lang]}</span>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCard.code}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-surface-container-high to-surface-container p-5 md:p-8"
                            >
                                <div className="flex items-start justify-between gap-4 mb-5 md:mb-6">
                                    <div className="p-3 md:p-4 rounded-[1.25rem] md:rounded-[1.5rem] bg-primary/12 text-primary">
                                        <Icon size={24} className="md:w-7 md:h-7" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-primary/70">
                                        {activeCard.code}
                                    </span>
                                </div>

                                <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-[1] text-on-surface mb-3 md:mb-4 max-w-lg">
                                    {activeCard.title[lang]}
                                </h3>

                                <p className="text-sm md:text-base text-on-surface-variant leading-relaxed max-w-2xl mb-6 md:mb-8">
                                    {activeCard.text[lang]}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {t.metrics[lang].map((metric) => {
                                        const MetricIcon = metric.icon;

                                        return (
                                            <div
                                                key={`${metric.value}-${metric.label}`}
                                                className="rounded-2xl border border-outline/8 bg-background/35 px-4 py-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2 text-primary">
                                                    <MetricIcon size={16} />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">{metric.value}</span>
                                                </div>
                                                <p className="text-xs text-on-surface-variant font-medium leading-snug">
                                                    {metric.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

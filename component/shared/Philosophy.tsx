"use client";
import React from 'react';
import { motion } from 'framer-motion';
// Import your data and types
import { PHILOSOPHIES, Locale } from '@/lib/constants';

interface PhilosophyProps {
    lang: Locale;
}

export const Philosophy = ({ lang }: PhilosophyProps) => {
    return (
        <section className="py-24 px-8 border-y border-outline/5 bg-surface-container-lowest/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PHILOSOPHIES.map((item, i) => (
                        <motion.div
                            // FIX: Use .en as the key string
                            key={item.title.en}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-6 rounded-3xl border border-outline/5 hover:border-primary/20 transition-all hover:bg-surface-container-low"
                        >
                            <item.icon className="text-primary mb-4 group-hover:scale-110 transition-transform" size={24} />

                            {/* Localized Title */}
                            <h4 className="text-lg font-bold mb-2 tracking-tight">
                                {item.title[lang]}
                            </h4>

                            {/* Localized Text */}
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                                {item.text[lang]}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
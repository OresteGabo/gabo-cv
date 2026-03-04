"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Terminal, Cpu, Zap } from 'lucide-react';

const PHILOSOPHIES = [
    {
        title: "Beyond 'Vibing' Code",
        text: "I don't just write syntax. I architect solutions. I prioritize understanding the underlying data structures and algorithmic complexity over simply making it work.",
        icon: Terminal
    },
    {
        title: "Pattern-First Design",
        text: "Whether it's Singleton, Factory, or Observer patterns, I select the architecture that ensures scalability and maintainability, not just the easiest implementation.",
        icon: Code2
    },
    {
        title: "Clean & Self-Documenting",
        text: "Code is read more often than it is written. I follow SOLID principles to produce clean, modular, and testable codebases.",
        icon: Zap
    },
    {
        title: "Problem Analysis",
        text: "I specialize in decomposing complex problems into manageable micro-services and components, focusing on the 'Why' before the 'How'.",
        icon: Cpu
    }
];

export const Philosophy = () => {
    return (
        <section className="py-24 px-8 border-y border-outline/5 bg-surface-container-lowest/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PHILOSOPHIES.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-6 rounded-3xl border border-outline/5 hover:border-primary/20 transition-all hover:bg-surface-container-low"
                        >
                            <item.icon className="text-primary mb-4 group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="text-lg font-bold mb-2 tracking-tight">{item.title}</h4>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                                {item.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
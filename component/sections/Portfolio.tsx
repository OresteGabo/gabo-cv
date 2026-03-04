"use client";
import React, { useState } from 'react';
import { PROJECTS, ProjectCategory } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Cpu, Activity, LayoutGrid, Layers } from 'lucide-react';

const categories: (ProjectCategory | "All")[] = ["All", "AI & ML", "Web & Cloud", "Mobile", "C++ & Graphics"];

export const Portfolio = () => {
    const [activeTab, setActiveTab] = useState<(ProjectCategory | "All")>("All");

    const filteredProjects = PROJECTS.filter(p => activeTab === "All" || p.category === activeTab);

    return (
        <section id="projects" className="py-24 px-8 max-w-7xl mx-auto relative">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 leading-none">
                        Technical <br /> <span className="text-outline text-transparent">Deployments.</span>
                    </h2>
                    <p className="text-on-surface-variant max-w-md font-medium">
                        Systematic solutions built with high-level architectural patterns and performance constraints.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 bg-surface-container-low p-1.5 rounded-full border border-outline/5">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                activeTab === cat
                                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                                    : "bg-transparent text-on-surface-variant hover:text-primary"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Project Grid */}
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode='popLayout'>
                    {filteredProjects.map((project, idx) => (
                        <motion.div
                            layout
                            key={project.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            className="group relative p-8 rounded-[2.5rem] bg-surface-container-low border border-outline/10 hover:border-primary/30 transition-all flex flex-col min-h-[480px]"
                        >
                            {/* Top Row: Category & Patterns */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{project.category}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.patterns.map(pattern => (
                                            <span key={pattern} className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-[8px] font-bold text-primary uppercase tracking-wider">
                                                {pattern}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <a
                                    href={project.link}
                                    target="_blank"
                                    className="p-4 rounded-2xl bg-surface-container-high border border-outline/10 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 group-hover:-rotate-12"
                                >
                                    <ArrowUpRight size={20} />
                                </a>
                            </div>

                            {/* Main Content */}
                            <div className="flex-grow">
                                <h3 className="text-3xl font-bold tracking-tight mb-4 group-hover:text-primary transition-colors">{project.title}</h3>
                                <p className="text-on-surface-variant mb-8 text-sm leading-relaxed font-medium">
                                    {project.description}
                                </p>
                            </div>

                            {/* Tech Stack List */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {project.tech.map(t => (
                                    <span key={t} className="text-[10px] font-mono text-on-surface-variant/60 uppercase">
                                        {t}
                                    </span>
                                ))}
                            </div>

                            {/* Performance/Impact Metric Footer */}
                            <div className="mt-auto p-5 rounded-[1.5rem] bg-background/40 border border-outline/5 flex items-center gap-4 group-hover:border-primary/20 transition-colors">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <Activity size={18} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest">Architectural Impact</p>
                                    <p className="text-sm font-bold text-on-surface">{project.impact}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </section>
    );
};
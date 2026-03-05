"use client";

import React, { useMemo, useEffect, useRef } from "react";
// Ensure these paths match your structure
import { PROJECTS, ProjectCategory, UI_STRINGS, Locale } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Activity, Terminal, X, Code2, Layers, Cpu, Database } from "lucide-react";
import clsx from "clsx";
import {StaggerContainer, StaggerItem} from "@/component/shared/StaggerContainer";

// --- Custom Hook: System Mounting ---
function useHasMounted() {
    const [hasMounted, setHasMounted] = React.useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);
    return hasMounted;
}

// --- Detail Drawer Component ---
const ProjectDrawer = ({ project, isOpen, onClose, lang }: { project: any; isOpen: boolean; onClose: () => void; lang: Locale }) => {
    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalStyle;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!project) return null;
    const t = UI_STRINGS;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[9998] cursor-zoom-out"
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[650px] bg-surface-container-high z-[9999] shadow-2xl border-l border-outline/10 overflow-y-auto scrollbar-hide"
                    >
                        <div className="sticky top-0 flex justify-between items-center p-6 md:p-8 bg-surface-container-high/95 backdrop-blur-2xl z-[10000] border-b border-outline/5">
                            <div className="flex items-center gap-2 text-primary">
                                <Terminal size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">System.Detail</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t.close[lang]}</span>
                                <X size={18} className="text-primary" />
                            </button>
                        </div>

                        <div className="p-8 md:p-12 pt-10">
                            <div className="flex items-center gap-2 text-on-surface-variant/40 mb-4">
                                <Layers size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{project.category}</span>
                            </div>

                            <h2 className="text-4xl md:text-6xl font-black uppercase mb-10 leading-[1.1] tracking-tight text-on-surface">
                                {project.title}
                            </h2>

                            <div className="flex flex-wrap gap-2 mb-12">
                                {project.tech.map((tech: string) => (
                                    <span key={tech} className="px-3 py-1.5 rounded-lg bg-background border border-outline/10 text-[10px] font-mono font-bold uppercase text-primary tracking-tighter">
                                        #{tech}
                                    </span>
                                ))}
                            </div>

                            <div className="space-y-16">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <Cpu size={22} className="text-primary/50" />
                                        <h4 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">{t.overviewLabel[lang]}</h4>
                                    </div>
                                    <p className="text-on-surface-variant text-lg leading-relaxed font-medium">
                                        {project.description[lang]}
                                    </p>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <Database size={22} className="text-primary/50" />
                                        <h4 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">{t.patternsLabel[lang]}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {project.patterns.map((pattern: string) => (
                                            <div key={pattern} className="p-5 rounded-2xl bg-surface-container-low border border-outline/5 flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                                                <span className="text-sm font-bold tracking-tight text-on-surface">{pattern}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="p-8 rounded-[2.5rem] bg-primary text-on-primary shadow-2xl shadow-primary/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Activity size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.impactLabel[lang]}</span>
                                    </div>
                                    <p className="text-xl font-bold leading-snug tracking-tight">
                                        {project.impact[lang]}
                                    </p>
                                </section>
                            </div>

                            <div className="mt-20 pb-10">
                                <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-4 w-full py-6 rounded-3xl bg-on-surface text-surface font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-on-primary transition-all active:scale-[0.98]"
                                >
                                    <Github size={24} />
                                    {t.viewSource[lang]}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- Project Row Component ---
const ProjectRow = ({ project, idx, onOpen, lang }: { project: any; idx: number; onOpen: (p: any) => void; lang: Locale }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            onClick={() => onOpen(project)}
            className="group flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl
                       bg-surface-container-low/20 backdrop-blur-md border border-outline/5
                       hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer"
        >
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container-high/50 text-primary/60 group-hover:text-primary transition-colors">
                <Terminal size={18} />
            </div>

            <div className="flex-grow min-w-0">
                <h3 className="text-xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors truncate mb-1">
                    {project.title}
                </h3>
                <p className="text-on-surface-variant/60 text-xs leading-relaxed truncate font-medium">
                    {project.description[lang]}
                </p>
            </div>

            <div className="flex flex-wrap gap-3 md:justify-end shrink-0">
                {project.tech.slice(0, 3).map((tech: string) => (
                    <span key={tech} className="text-[10px] font-mono font-medium text-on-surface-variant/40 uppercase tracking-widest">
                        {tech}
                    </span>
                ))}
            </div>

            <div className="hidden lg:block w-32 text-right border-l border-outline/10 pl-4">
                <span className="text-[9px] font-black px-2 py-1 rounded bg-surface-container-high text-on-surface-variant/40 uppercase tracking-widest">
                    {project.category}
                </span>
            </div>
        </motion.div>
    );
};

// --- Main Portfolio Section ---
// Update: Accepting 'lang' as a prop from page.tsx
export const Portfolio = ({ lang }: { lang: Locale }) => {
    const hasMounted = useHasMounted();
    const [activeTab, setActiveTab] = React.useState<(ProjectCategory | "All")>("All");
    const [selectedProject, setSelectedProject] = React.useState<any>(null);

    const categories: (ProjectCategory | "All")[] = ["All", "AI & ML", "Web & Cloud", "Mobile", "C++ & Graphics"];

    const filteredProjects = useMemo(() => {
        return PROJECTS.filter((p) => activeTab === "All" || p.category === activeTab);
    }, [activeTab]);

    const t = UI_STRINGS;

    if (!hasMounted) return <section id="projects" className="py-24 min-h-screen" />;

    return (
        <section id="projects" className="py-24 px-6 md:px-8 max-w-7xl mx-auto relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                <div>
                    <div className="flex items-center gap-3 text-primary mb-6">
                        <Code2 size={24} />
                        <span className="text-xs font-black uppercase tracking-[0.4em]">{t.registry[lang]}</span>
                    </div>
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
                        {t.technical[lang]} <br />
                        <span
                            className="text-transparent"
                            style={{ WebkitTextStroke: "1px hsl(var(--outline))" }}
                        >
                            {t.archives[lang]}.
                        </span>
                    </h2>
                </div>

                <div className="flex flex-wrap gap-1 p-1 bg-surface-container-low/40 backdrop-blur-md rounded-2xl border border-outline/10">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={clsx(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeTab === cat
                                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                                    : "text-on-surface-variant/50 hover:text-primary hover:bg-primary/5"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <StaggerContainer> {/* <--- Ajoute ceci */}
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project, idx) => (
                            <StaggerItem key={project.title}> {/* <--- Remplace le motion.div par StaggerItem */}
                                <ProjectRow
                                    project={project}
                                    idx={idx}
                                    onOpen={setSelectedProject}
                                    lang={lang}
                                />
                            </StaggerItem>
                        ))}
                    </AnimatePresence>
                </StaggerContainer>
            </div>

            <ProjectDrawer
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                lang={lang}
            />

            <div className="mt-12 px-6 text-[10px] font-mono text-on-surface-variant/30 uppercase tracking-[0.3em]">
                Registry Version 3.2.0 // {lang === "en" ? "Active Deployments" : "Déploiements Actifs"}: {filteredProjects.length}
            </div>
        </section>
    );
};
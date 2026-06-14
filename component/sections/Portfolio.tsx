"use client";

import React, { useMemo, useEffect } from "react";
import { PROJECTS, ProjectCategory, UI_STRINGS, Locale } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
    Github,
    Activity,
    Terminal,
    X,
    Code2,
    Layers,
    Cpu,
    Database,
    ArrowUpRight,
    Boxes,
} from "lucide-react";
import clsx from "clsx";
import { TechIcon } from "@/component/shared/TechIcon";

type Project = (typeof PROJECTS)[number];

// --- Detail Drawer Component ---
const ProjectDrawer = ({ project, isOpen, onClose, lang }: { project: Project | null; isOpen: boolean; onClose: () => void; lang: Locale }) => {
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
                        aria-hidden="true"
                        className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[9998] cursor-zoom-out"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="project-detail-title"
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
                                aria-label="Close project detail"
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

                            <h2 id="project-detail-title" className="text-4xl md:text-6xl font-black uppercase mb-10 leading-[1.1] tracking-tight text-on-surface">
                                {project.title}
                            </h2>

                            <div className="flex flex-wrap gap-2 mb-12">
                                {project.tech.map((tech: string) => (
                                    <span key={tech} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-outline/10 text-[10px] font-mono font-bold uppercase text-primary tracking-tighter">
                                        <TechIcon name={tech} size={14} />
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <div className="space-y-16">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <Cpu size={22} className="text-primary/50" />
                                        <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">{t.overviewLabel[lang]}</h3>
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
                                    aria-label={`View ${project.title} on GitHub`}
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

const categoryStyles: Record<ProjectCategory, string> = {
    "Mobile": "from-primary/18 via-primary/5 to-transparent",
    "Web & Cloud": "from-tertiary/18 via-tertiary/5 to-transparent",
    "AI & ML": "from-secondary/20 via-secondary/5 to-transparent",
    "C++ & Graphics": "from-on-surface/12 via-on-surface/3 to-transparent",
};

const ProjectCard = ({
    project,
    featured,
    onOpen,
    lang,
}: {
    project: Project;
    featured: boolean;
    onOpen: (project: Project) => void;
    lang: Locale;
}) => {
    const actionLabel = lang === "en" ? "Explore case study" : "Explorer le projet";

    return (
        <motion.button
            layout
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            type="button"
            onClick={() => onOpen(project)}
            aria-label={`${actionLabel}: ${project.title}`}
            className={clsx(
                "group relative overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-low text-left",
                "shadow-[0_18px_55px_rgba(0,0,0,0.06)] transition-all duration-300",
                "hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_70px_rgba(0,0,0,0.12)]",
                featured && "md:col-span-2"
            )}
        >
            <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-80", categoryStyles[project.category])} />
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-primary/10 bg-background/20 transition-transform duration-500 group-hover:scale-125" />

            <div className={clsx("relative p-7 md:p-8", featured && "md:grid md:grid-cols-[1.15fr_0.85fr] md:gap-12 md:p-10")}>
                <div className="flex min-h-full flex-col">
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-outline/10 bg-background/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                            <Boxes size={13} className="text-primary" />
                            {project.category}
                        </span>
                        {featured && (
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">
                                {lang === "en" ? "Featured system" : "Système phare"}
                            </span>
                        )}
                    </div>

                    <h3 className={clsx(
                        "max-w-2xl font-black tracking-tighter text-on-surface transition-colors group-hover:text-primary",
                        featured ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl"
                    )}>
                        {project.title}
                    </h3>

                    <p className={clsx(
                        "mt-5 max-w-2xl font-medium leading-relaxed text-on-surface-variant",
                        featured ? "text-base md:text-lg" : "text-sm"
                    )}>
                        {project.description[lang]}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2">
                        {project.tech.slice(0, featured ? 5 : 4).map((tech: string) => (
                            <span
                                key={tech}
                                className="inline-flex items-center gap-2 rounded-xl border border-outline/10 bg-background/55 px-3 py-2 text-[9px] font-black uppercase tracking-wide text-on-surface"
                            >
                                <TechIcon name={tech} size={14} className="text-primary" />
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                <div className={clsx(
                    "mt-9 flex flex-col justify-between border-t border-outline/10 pt-7",
                    featured && "md:mt-0 md:border-l md:border-t-0 md:pl-10 md:pt-0"
                )}>
                    <div>
                        <p className="mb-4 text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                            {lang === "en" ? "Architecture signals" : "Signaux d'architecture"}
                        </p>
                        <div className="space-y-3">
                            {project.patterns.slice(0, 3).map((pattern) => (
                                <div key={pattern} className="flex items-center gap-3">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                    <span className="text-sm font-bold text-on-surface">{pattern}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-primary/15 bg-primary/8 p-5">
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-primary">
                            {lang === "en" ? "Engineering outcome" : "Résultat technique"}
                        </p>
                        <p className="text-sm font-bold leading-relaxed text-on-surface">
                            {project.impact[lang]}
                        </p>
                    </div>

                    <div className="mt-7 flex items-center justify-between border-t border-outline/10 pt-5 text-primary">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em]">{actionLabel}</span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary transition-transform duration-300 group-hover:rotate-45">
                            <ArrowUpRight size={18} />
                        </span>
                    </div>
                </div>
            </div>
        </motion.button>
    );
};

// Update: Accepting 'lang' as a prop from page.tsx
export const Portfolio = ({ lang }: { lang: Locale }) => {
    const [activeTab, setActiveTab] = React.useState<(ProjectCategory | "All")>("All");
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

    const categories: (ProjectCategory | "All")[] = ["All", "AI & ML", "Web & Cloud", "Mobile", "C++ & Graphics"];

    const filteredProjects = useMemo(() => {
        return PROJECTS.filter((p) => activeTab === "All" || p.category === activeTab);
    }, [activeTab]);

    const t = UI_STRINGS;

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project, index) => (
                        <ProjectCard
                            key={project.title}
                            project={project}
                            featured={activeTab === "All" && index === 0}
                            onOpen={setSelectedProject}
                            lang={lang}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <ProjectDrawer
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                lang={lang}
            />

            <div className="mt-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/45">
                <span>{filteredProjects.length} {lang === "en" ? "selected systems" : "systèmes sélectionnés"}</span>
                <span className="h-px flex-1 bg-outline/10" />
            </div>
        </section>
    );
};

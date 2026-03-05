"use client";
import React from 'react';
import { Briefcase, Calendar, CheckCircle2, Terminal } from 'lucide-react';

// For this demo, I'm defining the specific CDAFAL data here.
// You should move this to your @/lib/constants.ts file later.
const CDAFAL_EXP = {
    company: "CDAFAL68",
    role: "Fullstack & DevOps Engineer",
    period: "JAN 2023 — JUN 2023",
    location: "Internship",
    description: "Led the digital transformation of legacy data systems, replacing fragmented Excel/Access workflows with a centralized, secure enterprise architecture.",
    tasks: [
        "Architected a centralized PostgreSQL database to eliminate data silos and version conflicts caused by legacy Excel/Access workflows.",
        "Engineered a Spring Boot REST API with Role-Based Access Control (RBAC) to fix critical security vulnerabilities and shared-password risks.",
        "Developed a high-performance C++ data-parsing engine to sanitize, validate, and migrate corrupted legacy records into the new relational schema.",
        "Deployed a modern CI/CD pipeline using Docker and GitHub Actions, enabling asynchronous collaboration and zero-downtime deployments.",
        "Increased organizational productivity by 60% by enabling concurrent data access and removing 'email-based' file sharing."
    ],
    tech: ["SpringBoot", "Vue.js", "PostgreSQL", "C++", "Docker", "GitHub Actions"]
};

export const Experience = () => {
    return (
        <section id="experience" className="py-24 px-8 max-w-7xl mx-auto border-t border-outline/5">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 leading-none">
                        Systemic <br /> <span className="text-transparent" style={{ WebkitTextStroke: "1px hsl(var(--outline))" }}>History.</span>
                    </h2>
                    <p className="text-on-surface-variant max-w-md font-medium">
                        Documenting the transition from legacy fragmentation to modern, scalable infrastructure.
                    </p>
                </div>
            </div>

            {/* Timeline Wrapper */}
            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">

                {/* CDAFAL Experience Card */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    {/* Architectural Node (The Dot) */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-outline/20 bg-background group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Terminal size={16} className="group-hover:text-primary transition-colors" />
                    </div>

                    {/* Content Card with Glassmorphism */}
                    <div className="w-[calc(100%-4rem)] md:w-[45%] p-8 rounded-[2.5rem] bg-surface-container-low/40 backdrop-blur-md border border-outline/10 hover:border-primary/20 transition-all shadow-xl shadow-black/5">
                        <div className="flex flex-col mb-6">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{CDAFAL_EXP.period}</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight mb-1">{CDAFAL_EXP.role}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-on-surface-variant font-bold uppercase text-xs tracking-wider">{CDAFAL_EXP.company}</span>
                                <span className="w-1 h-1 rounded-full bg-outline/30" />
                                <span className="text-on-surface-variant/60 text-xs italic">{CDAFAL_EXP.location}</span>
                            </div>
                        </div>

                        {/* Storytelling Impact Paragraph */}
                        <p className="text-sm text-on-surface-variant/80 mb-6 leading-relaxed font-medium border-l-2 border-primary/20 pl-4 italic">
                            &#34;{CDAFAL_EXP.description}&#34;
                        </p>

                        <ul className="space-y-4 mb-8">
                            {CDAFAL_EXP.tasks.map((task, i) => (
                                <li key={i} className="text-sm text-on-surface-variant flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-primary/60 mt-0.5 shrink-0" />
                                    <span>{task}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Tech Stack Tags */}
                        <div className="flex flex-wrap gap-2 pt-6 border-t border-outline/10">
                            {CDAFAL_EXP.tech.map((t) => (
                                <span key={t} className="px-2 py-1 rounded-md bg-primary/5 text-[9px] font-bold text-primary/70 uppercase tracking-tighter border border-primary/10">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* NOTE: You can map your other experiences from constants.ts here similarly */}
            </div>
        </section>
    );
};
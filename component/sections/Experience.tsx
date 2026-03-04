"use client";
import React from 'react';
import { EXPERIENCE } from '@/lib/constants';
import { Briefcase, Calendar, Layers } from 'lucide-react';

export const Experience = () => {
    return (
        <section id="experience" className="py-24 px-8 max-w-7xl mx-auto border-t border-outline/5">
            <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">Professional <br/> Experience</h2>
                <p className="text-on-surface-variant max-w-xs text-sm italic">
                    My journey through internships and academic collaborations.
                </p>
            </div>

            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline/20 before:to-transparent">
                {EXPERIENCE.map((exp, index) => (
                    <div key={exp.company} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-outline/20 bg-background group-hover:border-primary transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Briefcase size={16} className="group-hover:text-primary transition-colors" />
                        </div>

                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[45%] p-8 rounded-[2rem] bg-surface-container border border-outline/10 hover:border-primary/20 transition-all">
                            <div className="flex flex-col mb-4">
                                <div className="flex items-center gap-2 text-primary mb-1">
                                    <Calendar size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{exp.period}</span>
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight">{exp.role}</h3>
                                <span className="text-on-surface-variant font-medium">{exp.company}</span>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {exp.tasks.map((task, i) => (
                                    <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                        {task}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-outline/5">
                                {exp.tech.map((t) => (
                                    <span key={t} className="text-[9px] font-black text-outline uppercase">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {EngineeringCore} from "@/component/shared/EngineeringCore";


export const Hero = () => {
    return (
        <section className="min-h-screen flex flex-col justify-center px-8 pt-24 lg:pt-0 overflow-hidden">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

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
                            Available for Engineering Internships 2026
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-7xl xl:text-[9rem] font-black tracking-tighter leading-[0.8] mb-8"
                    >
                        SYSTEMS <br />
                        <span className="text-outline text-transparent">
                            ARCHITECT.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-xl text-lg md:text-xl text-on-surface-variant leading-relaxed font-medium mb-10"
                    >
                        Solving complex problems across the stack. From <span className="text-on-background font-bold">C++ 3D Engines</span> and <span className="text-on-background font-bold">AI Models</span> to <span className="text-on-background font-bold">Full-Stack Mobile & Web</span> ecosystems.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-3"
                    >
                        {["Full-Stack", "Computer Vision", "Systems", "Mobile"].map((skill) => (
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
                    {/* Background decorative element to anchor the cards */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    <EngineeringCore />
                </motion.div>

            </div>
        </section>
    );
};
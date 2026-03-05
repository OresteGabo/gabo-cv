"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { SITE_CONFIG } from '@/lib/constants';
import { Mail, Github, Linkedin, Cpu, ExternalLink } from 'lucide-react';

export const Footer = () => {
    return (
        <footer id="contact" className="pt-24 pb-12 px-8 border-t border-outline/10 bg-surface-container-lowest/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
                    <div className="md:col-span-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Cpu size={24} />
                            <span className="text-2xl font-black tracking-tighter text-on-background">{SITE_CONFIG.name}.</span>
                        </div>
                        <p className="text-on-surface-variant text-lg leading-relaxed max-w-md mb-8">
                            Software Engineer in training. Building robust solutions with a focus on Frontend excellence and UX performance.
                        </p>
                        <div className="flex gap-4">
                            <a href={SITE_CONFIG.linkedin} className="p-3 rounded-full border border-outline/20 hover:border-primary transition-colors"><Linkedin size={18} /></a>
                            <a href={SITE_CONFIG.github} className="p-3 rounded-full border border-outline/20 hover:border-primary transition-colors"><Github size={18} /></a>
                        </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col items-end justify-center">
                        <motion.a
                            whileHover={{ scale: 1.02 }}
                            href={`mailto:${SITE_CONFIG.email}`}
                            className="group p-8 rounded-[2.5rem] bg-primary text-on-primary w-full max-w-sm flex justify-between items-center"
                        >
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 block">Get in touch</span>
                                <span className="text-xl font-bold">{SITE_CONFIG.email}</span>
                            </div>
                            <ExternalLink size={24} />
                        </motion.a>
                    </div>
                </div>

                <div className="pt-8 border-t border-outline/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        &copy; 2026 {SITE_CONFIG.name} • BUILT WITH NEXT.JS & FRAMER MOTION
                    </p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-1">
                        PARIS <span className="w-1.5 h-1.5 rounded-full bg-primary" /> FRANCE
                    </p>
                </div>
            </div>
        </footer>
    );
};
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ENGINEERING_CARDS } from "@/lib/constants";

export const EngineeringCore = () => {
    const [index, setIndex] = useState(0);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);

    const isIdle = useRef(true);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const springConfig = { damping: 30, stiffness: 100 };
    const rotateX = useSpring(useTransform(my, [-500, 500], [15, -15]), springConfig);
    const rotateY = useSpring(useTransform(mx, [-500, 500], [-15, 15]), springConfig);

    const next = () => setIndex((i) => (i + 1) % ENGINEERING_CARDS.length);

    useEffect(() => {
        const move = (e: MouseEvent) => {
            mx.set(e.clientX - window.innerWidth / 2);
            my.set(e.clientY - window.innerHeight / 2);
        };

        window.addEventListener("mousemove", move);

        autoPlayRef.current = setInterval(() => {
            if (isIdle.current) {
                next();
            }
        }, 5000);

        return () => {
            window.removeEventListener("mousemove", move);
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, []);

    return (
        <div className="relative w-full h-[600px] flex items-center justify-center [perspective:2000px] overflow-visible">
            {/* Focal Point Glow */}
            <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="relative w-[320px] h-[420px] flex items-center justify-center"
            >
                <AnimatePresence mode="popLayout">
                    {ENGINEERING_CARDS.map((card, i) => {
                        const isActive = i === index;
                        const relIndex = (i - index + ENGINEERING_CARDS.length) % ENGINEERING_CARDS.length;
                        const Icon = card.Icon;

                        return (
                            <motion.div
                                key={card.title}
                                drag
                                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                                onDragStart={() => (isIdle.current = false)}
                                onDragEnd={(e, info) => {
                                    isIdle.current = true;
                                    if (Math.abs(info.offset.x) > 100 || Math.abs(info.offset.y) > 100) next();
                                }}
                                onMouseEnter={() => (isIdle.current = false)}
                                onMouseLeave={() => (isIdle.current = true)}
                                initial={{ opacity: 0, scale: 0.8, z: -200 }}
                                animate={{
                                    opacity: isActive ? 1 : 0.4 - (relIndex * 0.1),
                                    x: isActive ? 0 : relIndex * 40,
                                    y: isActive ? 0 : relIndex * -15,
                                    z: -relIndex * 50,
                                    rotateZ: isActive ? 0 : relIndex * 5,
                                    scale: isActive ? 1 : 0.9,
                                }}
                                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                                className={`absolute inset-0 p-8 rounded-[2.5rem] cursor-grab active:cursor-grabbing
                                    border border-outline/10 backdrop-blur-2xl
                                    bg-surface-container/90 shadow-2xl
                                    ${isActive ? "z-50" : "z-0"}`}
                                style={{
                                    transformStyle: "preserve-3d",
                                    transformOrigin: "bottom center"
                                }}
                            >
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                            <Icon size={28} />
                                        </div>
                                        <span className="font-mono text-[9px] text-primary/50 tracking-widest">{card.code}</span>
                                    </div>

                                    <h3 className="text-2xl font-black text-on-surface tracking-tighter mb-4 leading-[1.1]">
                                        {card.title}
                                    </h3>

                                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                                        {card.text}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-outline/5 flex items-center justify-between">
                                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Ready to Build</span>
                                        <div className="flex gap-1">
                                            {[...Array(4)].map((_, dotI) => (
                                                <div key={dotI} className={`w-1 h-1 rounded-full ${dotI === i ? 'bg-primary' : 'bg-outline/20'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Bottom Selection Dots */}
            <div className="absolute -bottom-4 flex flex-col items-center gap-3">
                <div className="flex gap-2">
                    {ENGINEERING_CARDS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setIndex(i); isIdle.current = false; }}
                            className={`h-1 rounded-full transition-all duration-500 ${
                                i === index ? "w-8 bg-primary" : "w-2 bg-outline/30"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
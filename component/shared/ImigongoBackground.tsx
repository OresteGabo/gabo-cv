"use client";
import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

export const ImigongoBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
    const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf: number;

        const getThemeColor = (varName: string) => {
            const style = getComputedStyle(document.documentElement);
            return style.getPropertyValue(varName).trim();
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Using MD3 tokens for harmony
            const primary = getThemeColor("--md-sys-color-primary");
            const outline = getThemeColor("--md-sys-color-outline-variant");

            // Increased step (120 instead of 80) to reduce pattern density
            const step = 120;
            const mX = smoothX.get();
            const mY = smoothY.get();

            for (let x = 0; x < canvas.width + step; x += step) {
                for (let y = 0; y < canvas.height + step; y += step) {
                    const dx = x - mX;
                    const dy = y - mY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    // Shorter interaction radius (300 instead of 400)
                    const force = Math.max(0, (300 - distance) / 300);

                    ctx.beginPath();

                    // Subtle parallax shift
                    const shiftX = (dx / (distance || 1)) * force * 8;
                    const shiftY = (dy / (distance || 1)) * force * 8;

                    const centerX = x - shiftX;
                    const centerY = y - shiftY;
                    const size = 35 + force * 5; // Slightly larger but thinner lines

                    // Imigongo Diamond Pattern
                    ctx.moveTo(centerX, centerY - size);
                    ctx.lineTo(centerX + size / 1.8, centerY);
                    ctx.lineTo(centerX, centerY + size);
                    ctx.lineTo(centerX - size / 1.8, centerY);
                    ctx.closePath();

                    // STEALTH STYLING
                    if (force > 0.05) {
                        ctx.strokeStyle = primary;
                        // Lower max alpha (0.3 instead of 0.5)
                        ctx.globalAlpha = force * 0.3;
                        ctx.lineWidth = 0.5 + force * 0.5;
                    } else {
                        ctx.strokeStyle = outline;
                        // Ghost grid: Very faint alpha (0.05 instead of 0.15)
                        ctx.globalAlpha = 0.05;
                        ctx.lineWidth = 0.3;
                    }

                    ctx.stroke();

                    // Faint Node Points
                    if (force > 0.8) {
                        ctx.fillStyle = primary;
                        ctx.globalAlpha = force * 0.4;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.globalAlpha = 1.0;
                }
            }
            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, [smoothX, smoothY]);

    return (
        <div className="fixed inset-0 -z-10 bg-background overflow-hidden pointer-events-none">
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* VIGNETTE OVERLAY: Drowns out the edges of the pattern to focus on content */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,var(--md-sys-color-background)_90%)]" />

            {/* Bottom Fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
    );
};
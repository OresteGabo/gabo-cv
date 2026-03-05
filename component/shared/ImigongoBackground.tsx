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

        // Function to grab HSL or RGB from CSS Variables
        const getThemeColor = (varName: string) => {
            const style = getComputedStyle(document.documentElement);
            const value = style.getPropertyValue(varName).trim();
            // If the variable is just numbers (Tailwind style), wrap it
            return value.includes(",") || value.includes(" ") ? `hsl(${value})` : value;
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ARCHITECTURAL COLORS
            const primary = getThemeColor("--primary");
            const outline = getThemeColor("--outline");

            const step = 80;
            const mX = smoothX.get();
            const mY = smoothY.get();

            for (let x = 0; x < canvas.width + step; x += step) {
                for (let y = 0; y < canvas.height + step; y += step) {
                    const dx = x - mX;
                    const dy = y - mY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const force = Math.max(0, (400 - distance) / 400);

                    ctx.beginPath();

                    // Parallax shift
                    const shiftX = (dx / (distance || 1)) * force * 12;
                    const shiftY = (dy / (distance || 1)) * force * 12;

                    const centerX = x - shiftX;
                    const centerY = y - shiftY;
                    const size = 28 + force * 8;

                    // Imigongo Diamond Pattern
                    ctx.moveTo(centerX, centerY - size);
                    ctx.lineTo(centerX + size / 1.6, centerY);
                    ctx.lineTo(centerX, centerY + size);
                    ctx.lineTo(centerX - size / 1.6, centerY);
                    ctx.closePath();

                    // DYNAMIC STYLING
                    // Use 'outline' color for the grid, 'primary' for interaction
                    ctx.lineWidth = 0.4 + force * 1.2;

                    if (force > 0.1) {
                        ctx.strokeStyle = primary;
                        ctx.globalAlpha = force * 0.5; // Smooth fade
                    } else {
                        ctx.strokeStyle = outline;
                        ctx.globalAlpha = 0.15; // Faint ghost grid
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0; // Reset alpha

                    // Material "Node" Points
                    if (force > 0.7) {
                        ctx.fillStyle = primary;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
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
            {/* Material Gradient Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background" />
        </div>
    );
};
"use client";
import React, { useEffect, useRef } from "react";
import {  useMotionValue, useSpring } from "framer-motion";

export const ImigongoBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the mouse movement for a "liquid" feel
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
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#00e5ff";

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const step = 80;
            const mX = smoothX.get();
            const mY = smoothY.get();

            for (let x = 0; x < canvas.width + step; x += step) {
                for (let y = 0; y < canvas.height + step; y += step) {
                    // Calculate distance to mouse
                    const dx = x - mX;
                    const dy = y - mY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const force = Math.max(0, (400 - distance) / 400); // Interaction radius

                    ctx.beginPath();
                    ctx.lineWidth = 0.5 + force * 1.5; // Lines get thicker near mouse

                    // High-end Imigongo "Data-Diamond"
                    // The points shift slightly toward the mouse (parallax)
                    const shiftX = (dx / distance) * force * 15 || 0;
                    const shiftY = (dy / distance) * force * 15 || 0;

                    const centerX = x - shiftX;
                    const centerY = y - shiftY;
                    const size = 30 + force * 10;

                    // Drawing a sharp, technical diamond
                    ctx.moveTo(centerX, centerY - size); // Top
                    ctx.lineTo(centerX + size/1.5, centerY); // Right
                    ctx.lineTo(centerX, centerY + size); // Bottom
                    ctx.lineTo(centerX - size/1.5, centerY); // Left
                    ctx.closePath();

                    // Professional styling: Near mouse = bright/solid, Far = faint/ghosted
                    ctx.strokeStyle = force > 0.1
                        ? `${primaryColor}${Math.floor(force * 100).toString(16).padStart(2, '0')}`
                        : `${primaryColor}15`;

                    ctx.stroke();

                    // Add a tiny data-point in the center of active ones
                    if (force > 0.6) {
                        ctx.fillStyle = primaryColor;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
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
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
        </div>
    );
};
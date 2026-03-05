"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <main className="relative min-h-screen flex items-center justify-center bg-background text-on-background text-center overflow-hidden px-6">

            {/* Subtle Grid using Theme Variable */}
            <div
                className="absolute inset-0 -z-10 opacity-[0.05]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, hsl(var(--outline)) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--outline)) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                }}
            />

            <div className="relative">
                <div className="relative inline-block">
                    {/* The 404 with a soft color glitch */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[120px] md:text-[180px] font-black tracking-tighter text-primary select-none leading-none"
                    >
                        404
                    </motion.h1>

                    <motion.h1
                        aria-hidden
                        animate={{ x: [-2, 2, 0], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 text-[120px] md:text-[180px] font-black text-secondary select-none leading-none mix-blend-multiply opacity-20"
                    >
                        404
                    </motion.h1>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-on-background mb-4">
                        Lost in the grid?
                    </h2>

                    <p className="max-w-xs mx-auto text-base text-on-surface-variant leading-relaxed mb-10">
                        The page you are looking for does not exist or has been moved.
                        Let&lsquo;s get you back to the main site.
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href="/"
                            className="inline-block px-10 py-4 rounded-full bg-primary text-on-primary text-xs font-bold tracking-widest uppercase shadow-lg hover:shadow-primary/30 transition-all"
                        >
                            Back to Home
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    );
}
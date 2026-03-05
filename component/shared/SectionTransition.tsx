"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export const SectionTransition = ({ children }: { children: ReactNode }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} // Commence invisible et un peu plus bas
            whileInView={{ opacity: 1, y: 0 }} // S'anime quand la section apparaît à l'écran
            viewport={{ once: true, margin: "-100px" }} // S'exécute une seule fois
            transition={{ duration: 0.6, ease: "easeOut" }} // Transition fluide
        >
            {children}
        </motion.div>
    );
};
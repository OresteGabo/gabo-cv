"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

// Le conteneur définit la règle de cascade
export const StaggerContainer = ({ children }: { children: ReactNode }) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.15, // Délai de 0.15s entre chaque enfant
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
};

// L'item définit l'animation individuelle
export const StaggerItem = ({ children }: { children: ReactNode }) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
        >
            {children}
        </motion.div>
    );
};
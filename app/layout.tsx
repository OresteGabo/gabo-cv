import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

export const metadata: Metadata = {
    title: "Gabo Oreste | Ingénieur Fullstack & DevOps",
    description: "Audit de systèmes legacy et déploiement d'architectures modernes V2. Expertise en Fullstack, DevOps et infrastructures numériques.",
    metadataBase: new URL('https://orestegabo.dev'),

    openGraph: {
        title: "Gabo Oreste | Systems Architect Portfolio",
        description: "Transformation d'infrastructures obsolètes en systèmes performants, sécurisés et automatisés.",
        url: 'https://orestegabo.dev',
        siteName: 'Gabo Portfolio',
        images: [
            {
                url: '/opengraph-image',
                width: 1200,
                height: 630,
                alt: 'Gabo Oreste - Engineering Experience Architecture Preview',
            },
        ],
        locale: 'fr_FR',
        type: 'website',
    },

    twitter: {
        card: 'summary_large_image',
        title: "Oreste MUHIRWA GABO | Ingénieur Fullstack & DevOps",
        description: "Audit système et architecture V2 haute performance.",
        images: ['https://orestegabo.dev/opengraph-image'],
    },

    // CORRECTION : On utilise des noms de fichiers uniques pour éviter le crash Turbopack
    icons: {
        icon: [
            { url: "/icon.svg", type: "image/svg+xml" }
        ],
        apple: [
            { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
        ],
        other: [
            {
                rel: 'mask-icon',
                url: '/icon.svg',
                color: '#6d5e0f',
            },
        ],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Oreste MUHIRWA GABO",
        "jobTitle": "Fullstack & DevOps Engineer",
        "url": "https://orestegabo.dev",
        "image": "https://orestegabo.dev/opengraph-image",
        "description": "Ingénieur spécialisé en Architecture V2, Fullstack et DevOps."
    };

    return (
        <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        {/* IMPORTANT: Pas de balise <head> manuelle ici.
               Next.js injecte automatiquement le <title> et les metas.
            */}
        <body className="light antialiased transition-colors duration-300">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        </body>
        </html>
    );
}
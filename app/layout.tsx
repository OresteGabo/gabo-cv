import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Gabo Oreste | Ingénieur Fullstack & DevOps",
    description: "Audit de systèmes legacy et déploiement d'architectures modernes V2. Expertise en Fullstack, DevOps et infrastructures numériques.",
    metadataBase: new URL('https://orestegabo.dev'),

    // 1. FACEBOOK & LINKEDIN (OpenGraph Standard)
    openGraph: {
        title: "Gabo Oreste | Systems Architect Portfolio",
        description: "Transformation d'infrastructures obsolètes en systèmes performants, sécurisés et automatisés. Découvrez mon parcours d'ingénieur stagiaire.",
        url: 'https://orestegabo.dev',
        siteName: 'Gabo Portfolio',
        images: [
            {
                url: '/opengraph-image', // Next.js dynamic image route
                width: 1200,
                height: 630,
                alt: 'Gabo Oreste - Engineering Experience Architecture Preview',
            },
        ],
        locale: 'fr_FR',
        type: 'website',
    },

    // 2. TWITTER / X (Specific Tags)
    twitter: {
        card: 'summary_large_image',
        title: "Oreste MUHIRWA GABO | Ingénieur Fullstack & DevOps",
        description: "Audit système et architecture V2 haute performance. Découvrez mon parcours d'ingénieur.",
        images: [
            {
                url: 'https://orestegabo.dev/opengraph-image', // Full URL is safer for Twitter
                width: 1200,
                height: 630,
                alt: 'Oreste MUHIRWA GABO Portfolio Preview',
            }
        ],
    },

    // 3. APP ICONS (iOS/Android/Browsers)
    icons: {
        icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
        apple: "/icon.svg",
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
        <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </head>
        <body className="light antialiased transition-colors duration-300">
        {children}
        </body>
        </html>
    );
}
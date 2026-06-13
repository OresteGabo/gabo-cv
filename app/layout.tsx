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
    title: "Gabo Oreste | Software & Systems Engineer",
    description: "Software and systems engineer designing secure digital platforms, observable backend services, realtime systems, and maintainable end-to-end architectures.",
    metadataBase: new URL('https://orestegabo.dev'),

    // 1. FACEBOOK & LINKEDIN
    openGraph: {
        title: "Gabo Oreste | Software & Systems Engineering",
        description: "Secure digital platforms, observable backend services, realtime communication, and end-to-end system design for real operating conditions.",
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
        locale: 'en_US',
        type: 'website',
    },

    // 2. TWITTER / X
    twitter: {
        card: 'summary_large_image',
        title: "Oreste MUHIRWA GABO | Software & Systems Engineer",
        description: "Designing secure mobile platforms, observable backend services, realtime communication flows, and maintainable end-to-end systems.",
        images: ['https://orestegabo.dev/opengraph-image'],
    },

    // 3. ICONS (Architecture stable pour Turbopack)
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
    appleWebApp: {
        capable: true,
        title: "GABO.",
        statusBarStyle: "default",
    },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Oreste MUHIRWA GABO",
        "jobTitle": "Software & Systems Engineer",
        "url": "https://orestegabo.dev",
        "image": "https://orestegabo.dev/opengraph-image",
        "description": "Software and systems engineer focused on secure digital platforms, distributed communication, and end-to-end system design."
    };

    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
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

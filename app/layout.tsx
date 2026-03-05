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
    title: "Gabo | Systems Architect",
    description: "Ingénieur Stagiaire Fullstack & DevOps - Architecture V2 & Infrastructure Digitale.",
    metadataBase: new URL('https://votre-site.com'), // Replace with your real domain later
    openGraph: {
        title: "Gabo | Systems Architect",
        description: "De l'audit système legacy au déploiement d'architectures modernes.",
        url: 'https://votre-site.com',
        siteName: 'Gabo Portfolio',
        locale: 'fr_FR',
        type: 'website',
        // Next.js looks for a file named 'opengraph-image.png' in your /app folder automatically
    },
    twitter: {
        card: 'summary_large_image',
        title: "Gabo | Systems Architect",
        description: "Fullstack & DevOps Engineer Intern.",
    },
    icons: {
        icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
        apple: "/icon.svg",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="light antialiased transition-colors duration-300">
        {children}
        </body>
        </html>
    );
}
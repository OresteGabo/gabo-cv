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

export const metadata = {
    title: "Gabo | Systems Architect",
    description: "High-performance software engineering and digital infrastructure.",
    icons: {
        icon: [
            {
                url: "/icon.svg",
                type: "image/svg+xml",
            },
        ],
        // This ensures iPhones see your "G" logo when bookmarked
        apple: "/icon.svg",
    },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        {/* Switch this class to 'light', 'dark', 'dark-hc', dark-medium-contrast etc. to change the whole site */}
        <body className="light">
        {children}
        </body>
        </html>
    );
}
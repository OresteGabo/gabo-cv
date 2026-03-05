"use client";
import React, { useState } from "react";
import { Navbar } from '@/component/shared/Navbar';
import { Footer } from '@/component/shared/Footer';
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { Hero } from '@/component/sections/Hero';
import { Philosophy } from '@/component/shared/Philosophy';
import { Portfolio } from '@/component/sections/Portfolio';
import { Experience } from '@/component/sections/Experience';

// Import the Locale type to keep TypeScript happy
import { Locale } from "@/lib/constants";

export default function Home() {
    // 1. Initialize the shared language state
    const [lang, setLang] = useState<Locale>("en");

    return (
        <main className="min-h-screen bg-background text-on-background selection:bg-primary/30 overflow-x-hidden relative">
            {/* 2. Pass the state and the setter to the Navbar */}
            <Navbar lang={lang} setLang={setLang} />

            <ImigongoBackground />

            {/* 3. Pass 'lang' to all sections so they can show translated text */}
            <Hero lang={lang} />

            {/* This is likely where your EngineeringCore/3D Cards live */}
            <Philosophy lang={lang} />

            {/* Your Project Registry */}
            <Portfolio lang={lang} />

            {/* Your Professional History */}
            <Experience lang={lang} />

            <Footer lang={lang} />
        </main>
    );
}
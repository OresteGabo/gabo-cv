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

// app/page.tsx
import { SectionTransition } from "@/component/shared/SectionTransition";

export default function Home() {
    const [lang, setLang] = useState<Locale>("en");

    return (
        <main className="font-sans min-h-screen bg-background text-on-background selection:bg-primary/30 overflow-x-hidden relative">
            <Navbar lang={lang} setLang={setLang} />
            <ImigongoBackground />

            {/* Chaque section va "apparaître" en glissant vers le haut au scroll */}
            <SectionTransition>
                <Hero lang={lang} />
            </SectionTransition>

            <SectionTransition>
                <Philosophy lang={lang} />
            </SectionTransition>

            <SectionTransition>
                <Portfolio lang={lang} />
            </SectionTransition>

            <SectionTransition>
                <Experience lang={lang} />
            </SectionTransition>

            <Footer lang={lang} />
        </main>
    );
}

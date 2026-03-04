"use client";
import { Navbar } from '@/component/shared/Navbar';
import { Footer } from '@/component/shared/Footer';
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { Hero } from '@/component/sections/Hero';
import { Philosophy } from '@/component/shared/Philosophy'; // Import it here
import { Portfolio } from '@/component/sections/Portfolio';
import { Experience } from '@/component/sections/Experience';

export default function Home() {
    return (
        <main className="min-h-screen bg-background text-on-background selection:bg-primary/30 overflow-x-hidden relative">
            <Navbar />
            <ImigongoBackground />

            {/* Entry Point */}
            <Hero />

            {/* The "Brain" - Explaining how you think/engineer */}
            <Philosophy />

            {/* The "Proof" - Showing your work */}
            <Portfolio />

            {/* The "History" - Showing your professional growth */}
            <Experience />

            <Footer />
        </main>
    );
}
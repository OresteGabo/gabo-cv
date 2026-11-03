import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/constants";

interface HeroProps {
    lang: Locale;
}

export const Hero = ({ lang }: HeroProps) => {
    const t = {
        role: {
            en: "Mobile & web",
            fr: "Développeur"
        },
        roleAccent: {
            en: "developer.",
            fr: "mobile & web."
        },
        description: {
            en: "I’m Oreste, a Master’s student in Computer Science. I build apps for Android, iOS, and the web, with a focus on Kotlin Multiplatform.",
            fr: "Moi, c’est Oreste, étudiant en Master Informatique. Je développe des applications Android, iOS et web, avec un intérêt particulier pour Kotlin Multiplatform."
        },
        projects: { en: "Explore my projects", fr: "Voir mes projets" },
        contact: { en: "Get in touch", fr: "Me contacter" }
    };

    return (
        <section aria-label={lang === "en" ? "Introduction" : "Présentation"} className="relative px-6 pb-24 pt-40 md:px-8 md:pb-32 md:pt-48">
            <div className="mx-auto w-full max-w-7xl">
                <p className="mb-7 text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Muhirwa Gabo Oreste
                </p>
                <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-on-background sm:text-6xl lg:text-7xl">
                    {t.role[lang]}<br />
                    <span className="text-primary">{t.roleAccent[lang]}</span>
                </h1>
                <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                    {t.description[lang]}
                </p>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
                    <a href="#projects" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        {t.projects[lang]} <ArrowDown size={16} aria-hidden="true" />
                    </a>
                    <a href="mailto:orestegabo@icloud.com" className="inline-flex items-center gap-2 rounded-sm py-3 text-sm font-semibold text-on-background transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        {t.contact[lang]} <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                </div>
            </div>
        </section>
    );
};

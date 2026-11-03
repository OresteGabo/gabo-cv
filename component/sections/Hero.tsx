import Image from "next/image";
import { ArrowDown, ArrowUpRight, Smartphone, Server, Globe } from "lucide-react";
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
        contact: { en: "Get in touch", fr: "Me contacter" },
        focus: { en: "From idea to app", fr: "De l’idée à l’application" },
        building: { en: "Currently building", fr: "En cours de développement" },
        layers: [
            { Icon: Smartphone, title: { en: "Mobile", fr: "Mobile" }, detail: "Kotlin Multiplatform · Android & iOS" },
            { Icon: Server, title: { en: "Backend", fr: "Backend" }, detail: "Spring Boot · Ktor · REST APIs" },
            { Icon: Globe, title: { en: "Web", fr: "Web" }, detail: "React · Next.js · TypeScript" }
        ]
    };

    return (
        <section aria-label={lang === "en" ? "Introduction" : "Présentation"} className="relative px-6 pb-24 pt-40 md:px-8 md:pb-32 md:pt-48">
            <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
                <div>
                    <p className="mb-5 flex items-center gap-2 text-xs font-medium text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                        {lang === "en" ? "Software development · Master’s student" : "Développement logiciel · Étudiant en Master"}
                    </p>
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

                <aside aria-label={t.focus[lang]} className="w-full max-w-md rounded-[2rem] border border-outline/15 bg-surface-container-low/80 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)] sm:p-8 lg:justify-self-end">
                    <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{t.focus[lang]}</p>
                    <div className="space-y-5">
                        {t.layers.map(({ Icon, title, detail }) => (
                            <div key={title.en} className="flex items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
                                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-on-surface">{title[lang]}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <a href="https://structcapital.net" target="_blank" rel="noopener noreferrer" className="mt-7 flex items-center gap-3 rounded-2xl border border-outline/10 bg-background/60 p-4 transition-colors hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        <Image src="/brands/struct-capital/struct-capital-icon-light.svg" alt="" width={40} height={40} className="rounded-xl" />
                        <div className="flex-1">
                            <p className="text-[10px] text-on-surface-variant">{t.building[lang]}</p>
                            <p className="mt-1 text-sm font-semibold text-on-surface">Struct Capital</p>
                        </div>
                        <ArrowUpRight size={16} className="text-primary" aria-hidden="true" />
                    </a>
                </aside>
            </div>
        </section>
    );
};

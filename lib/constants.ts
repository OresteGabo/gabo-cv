import {Cpu, Binary, Smartphone, Code2, Zap, Activity, ShieldAlert, Layers} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// --- Types for Architecture ---
export type Locale = "en" | "fr";

export type Localized<T = string> = {
    en: T;
    fr: T;
};

export interface ServiceCard {
    title: Localized;
    text: Localized;
    Icon: LucideIcon;
    code: string;
}

export type ProjectCategory = "AI & ML" | "Web & Cloud" | "Mobile" | "C++ & Graphics";

// --- UI Dictionary (For Buttons, Headers, etc.) ---
export const UI_STRINGS = {
    registry: { en: "Project Registry", fr: "Registre de Projets" },
    archives: { en: "Archives", fr: "Archives" },
    technical: { en: "Technical", fr: "Technique" },
    deployments: { en: "Deployments", fr: "Déploiements" },
    close: { en: "Close [Esc]", fr: "Fermer [Esc]" },
    viewSource: { en: "Access Source", fr: "Voir le Code Source" },
    impactLabel: { en: "Deployment Impact", fr: "Impact du Déploiement" },
    patternsLabel: { en: "Architectural Patterns", fr: "Patterns Architecturaux" },
    overviewLabel: { en: "System Overview", fr: "Aperçu du Système" }
};

// --- Engineering Services ---
export const ENGINEERING_CARDS: ServiceCard[] = [
    {
        title: { en: "End-to-End System Design", fr: "Conception Système de Bout en Bout" },
        text: {
            en: "Connecting mobile clients, backend services, data flows, and operational constraints into maintainable production systems.",
            fr: "Relier clients mobiles, services backend, flux de données et contraintes opérationnelles dans des systèmes de production maintenables."
        },
        Icon: Binary,
        code: "DESIGN-01"
    },
    {
        title: { en: "Distributed & Realtime Systems", fr: "Systèmes Distribués & Temps Réel" },
        text: {
            en: "Designing low-latency communication flows with WebRTC and LiveKit while accounting for unreliable networks and constrained devices.",
            fr: "Conception de flux de communication à faible latence avec WebRTC et LiveKit, adaptés aux réseaux instables et appareils contraints."
        },
        Icon: Cpu,
        code: "DIST-02"
    },
    {
        title: { en: "Secure Backend Systems", fr: "Systèmes Backend Sécurisés" },
        text: {
            en: "Building Spring Boot services and API flows that protect sensitive data while supporting dependable mobile journeys end to end.",
            fr: "Développement de services Spring Boot et de flux API protégeant les données sensibles tout en soutenant des parcours mobiles fiables de bout en bout."
        },
        Icon: Binary,
        code: "API-03"
    },
    {
        title: { en: "Architecture Communication", fr: "Communication d'Architecture" },
        text: {
            en: "Making technical decisions reviewable through clear system boundaries, API contracts, diagrams, decision records, and implementation guidance.",
            fr: "Rendre les décisions techniques vérifiables grâce à des frontières claires, contrats API, diagrammes, décisions documentées et guides d'implémentation."
        },
        Icon: Code2,
        code: "GOV-04"
    },
    {
        title: { en: "Performance for Real Networks", fr: "Performance sur Réseaux Réels" },
        text: {
            en: "Optimizing battery use, stability, and responsiveness for lower-end devices, constrained data plans, and bandwidth-sensitive markets.",
            fr: "Optimisation de la batterie, de la stabilité et de la réactivité pour appareils modestes, forfaits limités et marchés sensibles à la bande passante."
        },
        Icon: Smartphone,
        code: "PERF-05"
    }
];

// --- Projects ---
export const PROJECTS = [
    {
        title: "Kaze Event Platform",
        category: "Mobile" as ProjectCategory,
        description: {
            en: "Kotlin Multiplatform event operating system for conferences, weddings, and summits, combining public discovery, invitation entry, digital passes, schedules, access-aware venue maps, and event services across Android, iOS, and web clients.",
            fr: "Système d'exploitation événementiel Kotlin Multiplatform pour conférences, mariages et sommets, réunissant découverte publique, invitations, pass numériques, programmes, plans avec contrôle d'accès et services sur Android, iOS et web."
        },
        patterns: [
            "Kotlin Multiplatform",
            "Clean Architecture",
            "Repository & Use Cases",
            "API-First Contracts",
            "Secure Session Flow"
        ],
        impact: {
            en: "One shared product architecture across Android, iOS, web, and a production-shaped Ktor backend",
            fr: "Une architecture produit partagée entre Android, iOS, web et un backend Ktor conçu pour la production"
        },
        tech: [
            "Kotlin 2.3",
            "Compose Multiplatform",
            "Ktor 3",
            "PostgreSQL",
            "JWT / OAuth2",
            "OpenAPI",
            "Docker",
            "Cloud Run"
        ],
        link: "https://github.com/orestegabo/kaze"
    },
    {
        title: "Gabo Ecosystem",
        category: "Web & Cloud" as ProjectCategory,
        description: {
            en: "Personal software platform that presents my work, positioning, and engineering story through a custom high-performance web experience.",
            fr: "Plateforme personnelle qui présente mon travail, mon positionnement et mon parcours d'ingénierie via une expérience web sur mesure."
        },
        patterns: ["Atomic Design", "Observer", "Facade"],
        impact: { en: "Sub-100ms Page Transitions", fr: "Transitions de page < 100ms" },
        tech: ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"],
        link: "https://github.com/OresteGabo/gabo-web"
    },
    {
        title: "Earthquake Prediction Engine",
        category: "AI & ML" as ProjectCategory,
        description: {
            en: "Deep learning system for seismic time-series analysis utilizing hardware-accelerated tensors.",
            fr: "Système de Deep Learning pour l'analyse sismique temporelle utilisant l'accélération matérielle."
        },
        patterns: ["Pipeline", "Strategy", "CNN-LSTM Hybrid"],
        impact: { en: "76.98% Prediction Accuracy", fr: "76.98% de précision de prédiction" },
        tech: ["PyTorch", "NumPy", "Metal (MPS)", "SciPy"],
        link: "https://github.com/OresteGabo/deep-learning"
    },
    {
        title: "SchoolBridge Full-Stack",
        category: "Mobile" as ProjectCategory,
        description: {
            en: "Mobile-first education platform pairing native clients with secure backend services, role-based access, and realtime-friendly architecture.",
            fr: "Plateforme éducative orientée mobile associant clients natifs, services backend sécurisés, accès par rôles et architecture prête pour le temps réel."
        },
        patterns: ["MVVM", "Repository", "Dependency Injection"],
        impact: { en: "Full Role-Based Data Isolation", fr: "Isolation totale des données par rôle" },
        tech: ["Spring Boot", "Kotlin", "PostgreSQL", "Docker", "Vue.js"],
        link: "https://github.com/OresteGabo/SchoolBridgeApi"
    },
    {
        title: "ArchViz 3D Engine",
        category: "C++ & Graphics" as ProjectCategory,
        description: {
            en: "Procedural 3D rendering engine specialized in voxel-to-mesh isosurface generation.",
            fr: "Moteur de rendu 3D procédural spécialisé dans la génération d'isosurfaces voxel-vers-maillage."
        },
        patterns: ["Marching Cubes", "Buffer Management", "Flyweight"],
        impact: { en: "Real-time Voxel-to-Mesh Generation", fr: "Génération maillage temps réel" },
        tech: ["C++ 17", "OpenGL", "GLSL", "GLFW"],
        link: "https://github.com/OresteGabo/GraphvizCPP"
    }
];

// --- Work Experience ---
export const EXPERIENCE = [
    {
        company: "CDAFAL / Mulhouse City / France",
        role: { en: "Software Engineer", fr: "Ingénieur Logiciel" },
        period: "JUN 2023 - DEC 2025",
        tasks: {
            en: [
                "Built citizen-facing mobile products with Jetpack Compose and SwiftUI",
                "Integrated LiveKit / WebRTC for secure realtime consultations",
                "Optimized performance for low-bandwidth environments and entry-level phones"
            ],
            fr: [
                "Développement de produits mobiles orientés citoyens avec Jetpack Compose et SwiftUI",
                "Intégration de LiveKit / WebRTC pour des consultations temps réel sécurisées",
                "Optimisation des performances pour réseaux limités et smartphones d'entrée de gamme"
            ]
        },
        tech: ["Jetpack Compose", "SwiftUI", "LiveKit", "Spring Boot", "JWT", "REST APIs"]
    }
];

export const SITE_CONFIG = {
    name: "GABO",
    email: "orestegabo@icloud.com",
    careerPageLink: "/cv-gabo-systems-architect.pdf",
    github: "https://github.com/orestegabo",
    linkedin: "https://linkedin.com/in/orestemg",
    title: {
        en: "Gabo Oreste | Software & Systems Engineer",
        fr: "Gabo Oreste | Ingénieur Logiciel & Systèmes"
    },
    description: {
        en: "Software and systems engineer designing secure mobile platforms, backend services, realtime communication flows, and maintainable end-to-end architectures.",
        fr: "Ingénieur logiciel et systèmes concevant des plateformes mobiles sécurisées, services backend, flux temps réel et architectures maintenables de bout en bout."
    },
    keywords: [
        "Software Engineer",
        "Mobile Development",
        "Jetpack Compose",
        "SwiftUI",
        "WebRTC",
        "LiveKit",
        "Spring Boot",
        "Kotlin",
        "Java",
        "PostgreSQL",
        "Docker",
        "REST API Architecture",
        "Solution Architecture",
        "Distributed Systems",
        "Realtime Communication",
        "Low Bandwidth Mobile",
        "Rwanda Tech"
    ],
};

// lib/constants.ts
export const PHILOSOPHIES = [
    {
        title: {
            en: "Performance-Driven Mobile",
            fr: "Performance Mobile"
        },
        text: {
            en: "Optimizing for low-end devices and variable networks so mobile products stay usable, smooth, and efficient in real conditions.",
            fr: "Optimisation pour les appareils d'entrée de gamme et les réseaux variables afin que les produits mobiles restent fluides et utiles en conditions réelles."
        },
        icon: Zap // Focus on speed/performance
    },
    {
        title: {
            en: "Observable & Supportable",
            fr: "Observable & Maintenable"
        },
        text: {
            en: "Designing clear failure boundaries, useful logs, release visibility, and documented recovery paths so teams can diagnose incidents and improve reliability.",
            fr: "Concevoir des frontières d'échec claires, des logs utiles, une visibilité sur les versions et des procédures documentées pour diagnostiquer les incidents et améliorer la fiabilité."
        },
        icon: Activity
    },
    {
        title: {
            en: "Secure by Architecture",
            fr: "Sécurité par l'Architecture"
        },
        text: {
            en: "Security is part of the product itself. I favor protected API flows, careful data handling, and dependable system boundaries from the start.",
            fr: "La sécurité fait partie du produit lui-même. Je privilégie des flux API protégés, une gestion soignée des données et des frontières système fiables dès le départ."
        },
        icon: ShieldAlert
    },
    {
        title: {
            en: "Scalable Logic",
            fr: "Logique Scalable"
        },
        text: {
            en: "I like structuring systems so product teams can move faster, features stay maintainable, and platforms scale without becoming fragile.",
            fr: "J'aime structurer les systèmes pour que les équipes produit avancent plus vite, que les fonctionnalités restent maintenables et que les plateformes évoluent sans fragilité."
        },
        icon: Layers
    }
];
export const CDAFAL_EXP = {
    company: "CDAFAL / Mulhouse City / France",
    role: { en: "Web Developer Intern", fr: "Stagiaire Développeur Web" },
    period: "JAN 2023 — JUN 2023",
    location: { en: "Internship", fr: "Stage" },
    description: {
        en: "Helped digitalize internal member and student-management workflows, replacing fragmented manual processes with maintainable web and data tools.",
        fr: "Participation à la numérisation des workflows internes de gestion des adhérents et étudiants, en remplaçant des processus manuels fragmentés par des outils web et data maintenables."
    },
    tasks: {
        en: [
            "Built internal automation tools for registration and fee tracking.",
            "Developed a Vue.js interface connected to Spring Boot services.",
            "Created a custom C++ ETL tool to migrate and process exam data.",
            "Improved record management for foreign residents by replacing manual steps."
        ],
        fr: [
            "Développement d'outils internes pour les inscriptions et le suivi des frais.",
            "Création d'une interface Vue.js connectée à des services Spring Boot.",
            "Conception d'un outil ETL en C++ pour migrer et traiter les données d'examens.",
            "Amélioration de la gestion des dossiers des résidents étrangers en remplaçant des étapes manuelles."
        ]
    },
    tech: ["Vue.js", "Spring Boot", "C++", "ETL", "Digitalization"]
};

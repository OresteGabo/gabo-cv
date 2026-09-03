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
        title: "SchoolBridge V2",
        category: "Mobile" as ProjectCategory,
        description: {
            en: "Rwanda-focused education platform connecting schools, students, teachers, and parents through timetables, role-based workflows, safety alerts, and MQTT message threads.",
            fr: "Plateforme éducative adaptée au Rwanda reliant écoles, élèves, enseignants et parents grâce aux emplois du temps, workflows par rôle, alertes de sécurité et messages MQTT."
        },
        patterns: ["MVVM", "Role-Based Workflows", "Event Messaging", "Multilingual Product"],
        impact: {
            en: "One mobile platform for academic visibility, school-family communication, and student-safety workflows",
            fr: "Une plateforme mobile pour le suivi académique, la communication école-famille et la sécurité des élèves"
        },
        tech: ["Kotlin", "Jetpack Compose", "Spring Boot", "MQTT", "Coroutines", "Material 3"],
        link: "https://github.com/OresteGabo/SchoolBridgeV2"
    },
    {
        title: "KGL Express",
        category: "Mobile" as ProjectCategory,
        description: {
            en: "Kigali-focused logistics and public-transport application with offline OpenStreetMap data, delivery workflows, GPS tracking, digital bus tickets, and role-specific mobile experiences.",
            fr: "Application de logistique et transport public pensée pour Kigali, avec données OpenStreetMap hors ligne, livraisons, suivi GPS, billets de bus numériques et parcours mobiles par rôle."
        },
        patterns: ["Feature-First Modules", "Offline-First Maps", "Platform UI Factory", "Role-Based Journeys"],
        impact: {
            en: "Designed city mobility workflows to remain useful in low-data conditions without depending on proprietary map platforms",
            fr: "Conception de parcours de mobilité urbaine utilisables avec peu de données et sans dépendance à une plateforme cartographique propriétaire"
        },
        tech: ["Flutter", "Dart", "OpenStreetMap", "SQLite", "GPS", "Offline Maps"],
        link: "https://github.com/OresteGabo/kgl-express"
    },
    {
        title: "SkyWatch Radar",
        category: "Web & Cloud" as ProjectCategory,
        description: {
            en: "Educational real-time radar-processing prototype with a scheduled Java simulator and Spring Boot backend exchanging detection streams through MQTT while measuring latency and jitter.",
            fr: "Prototype éducatif de traitement radar temps réel avec simulateur Java planifié et backend Spring Boot échangeant des détections via MQTT tout en mesurant latence et jitter."
        },
        patterns: ["Publish / Subscribe", "Scheduled Processing", "Latency Instrumentation", "Decoupled Components"],
        impact: {
            en: "Demonstrates deterministic scheduling, deadline-aware processing, and monitoring of distributed event streams",
            fr: "Démontre la planification déterministe, le traitement sensible aux échéances et le suivi de flux distribués"
        },
        tech: ["Java", "Spring Boot", "MQTT", "Docker", "Gradle", "Realtime Systems"],
        link: "https://github.com/OresteGabo/skywatch-radar"
    },
    {
        title: "Connected Cars Simulation",
        category: "C++ & Graphics" as ProjectCategory,
        description: {
            en: "C++ and Qt urban simulation that parses OpenStreetMap data, models vehicle-to-vehicle connectivity, respects road speed metadata, and renders moving traffic efficiently.",
            fr: "Simulation urbaine en C++ et Qt analysant les données OpenStreetMap, modélisant la connectivité véhicule-à-véhicule, les vitesses routières et le trafic en mouvement."
        },
        patterns: ["Database-First Loading", "Scene Graph Rendering", "Concurrent Map Drawing", "Geospatial Projection"],
        impact: {
            en: "Replaced full-screen repainting with selective scene updates and parallel map loading for responsive simulation",
            fr: "Remplacement du rafraîchissement complet par des mises à jour ciblées et un chargement parallèle de la carte"
        },
        tech: ["C++", "Qt 6", "OpenStreetMap", "MySQL", "CMake", "Multithreading"],
        link: "https://github.com/OresteGabo/betterPjMap"
    },
    {
        title: "Earthquake Detection",
        category: "AI & ML" as ProjectCategory,
        description: {
            en: "Deep-learning study comparing MLP, 1D CNN, and LSTM architectures for classifying 512-hour seismic time-series windows with hardware-accelerated training.",
            fr: "Étude deep learning comparant MLP, CNN 1D et LSTM pour classifier des fenêtres sismiques de 512 heures avec entraînement accéléré matériellement."
        },
        patterns: ["Model Benchmarking", "Training Pipeline", "Complexity Analysis", "Reproducible Evaluation"],
        impact: {
            en: "LSTM reached 76.98% accuracy with documented parameter counts and inference-time comparisons",
            fr: "Le LSTM a atteint 76,98 % de précision avec comparaison documentée des paramètres et temps d'inférence"
        },
        tech: ["Python", "PyTorch", "LSTM", "CNN", "NumPy", "Metal (MPS)"],
        link: "https://github.com/OresteGabo/deep-learning"
    }
];

// --- Work Experience ---
export const EXPERIENCE = [
    {
        company: "Public-service digital platforms",
        role: { en: "Software Engineer", fr: "Ingénieur Logiciel" },
        period: "JUN 2023 — PRESENT",
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
    period: "",
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

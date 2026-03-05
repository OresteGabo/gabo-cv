import {Cpu, Database, Binary, Smartphone, Code2, Sparkles, Terminal, Zap} from "lucide-react";

// --- Types for Architecture ---
export type Locale = "en" | "fr";

export type Localized<T = string> = {
    en: T;
    fr: T;
};

export interface ServiceCard {
    title: Localized;
    text: Localized;
    Icon: any;
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
        title: { en: "Architectural Integrity", fr: "Intégrité Architecturale" },
        text: {
            en: "Applying OOP principles and design patterns (SOLID, GoF) to solve real-world problems. My goal is clean, performant, and maintainable systems.",
            fr: "Application des principes POO et des design patterns (SOLID, GoF) pour résoudre des problèmes complexes. Objectif : systèmes propres et maintenables."
        },
        Icon: Binary,
        code: "DESIGN-01"
    },
    {
        title: { en: "AI & Computer Vision", fr: "IA & Vision par Ordinateur" },
        text: {
            en: "Developing high-accuracy ML models. From parking occupancy classification to CNN-LSTM hybrids for seismic prediction achieving 76.98% accuracy.",
            fr: "Développement de modèles ML de haute précision. De la classification de parking aux hybrides CNN-LSTM pour la prédiction sismique (76.98% de précision)."
        },
        Icon: Cpu,
        code: "MODEL-AI-01"
    },
    {
        title: { en: "Systems Engineering", fr: "Ingénierie Systèmes" },
        text: {
            en: "Low-level performance optimization. Implementing Marching Cubes and real-time OpenGL shaders in C++ for architectural visualization.",
            fr: "Optimisation de performance bas-niveau. Implémentation de Marching Cubes et de shaders OpenGL en temps réel en C++."
        },
        Icon: Binary,
        code: "SYS-CPP-17"
    },
    {
        title: { en: "Full-Stack Ecosystems", fr: "Écosystèmes Full-Stack" },
        text: {
            en: "Architecting mission-critical platforms with Next.js 15, React Server Components, and secure Spring Boot REST APIs.",
            fr: "Architecture de plateformes critiques avec Next.js 15, React Server Components et APIs REST sécurisées sous Spring Boot."
        },
        Icon: Code2,
        code: "STACK-PRO"
    },
    {
        title: { en: "Native Mobile Solutions", fr: "Solutions Mobiles Natives" },
        text: {
            en: "Engineering fluid mobile experiences with Kotlin (MVVM) and Flutter, integrating OpenStreetMap and real-time data tracking.",
            fr: "Ingénierie d'expériences mobiles fluides avec Kotlin (MVVM) et Flutter, intégrant OpenStreetMap et tracking temps réel."
        },
        Icon: Smartphone,
        code: "MOBILE-OS"
    }
];

// --- Projects ---
export const PROJECTS = [
    {
        title: "Gabo Ecosystem",
        category: "Web & Cloud" as ProjectCategory,
        description: {
            en: "High-performance software infrastructure platform with immersive UX and atomic design principles.",
            fr: "Plateforme d'infrastructure logicielle haute performance avec UX immersive et principes de design atomique."
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
            en: "Enterprise educational ecosystem with a decoupled native mobile client and secure micro-API.",
            fr: "Écosystème éducatif d'entreprise avec client mobile natif découplé et micro-API sécurisée."
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
        company: "Tech Internships Africa",
        role: { en: "Full Stack Developer Intern", fr: "Stagiaire Développeur Full-Stack" },
        period: "JAN 2025 - PRESENT",
        tasks: {
            en: [
                "Architected scalable API endpoints using Spring Boot for educational platforms",
                "Implemented real-time data sync for mobile clients using WebSocket & Firebase",
                "Optimized SQL queries reducing dashboard load times by 40%"
            ],
            fr: [
                "Architecture d'endpoints API scalables avec Spring Boot pour plateformes éducatives",
                "Implémentation de synchro temps réel via WebSocket & Firebase",
                "Optimisation de requêtes SQL réduisant le temps de chargement de 40%"
            ]
        },
        tech: ["Spring Boot", "Kotlin", "PostgreSQL", "React", "Docker", "CI/CD"]
    }
];

export const SITE_CONFIG = {
    name: "GABO",
    email: "orestegabo@icloud.com",
    careerPageLink: "/resume.pdf",
    github: "https://github.com/orestegabo",
    linkedin: "https://linkedin.com/in/orestemg"
};

// lib/constants.ts

export const PHILOSOPHIES = [
    {
        title: {
            en: "Deterministic Engineering",
            fr: "Ingénierie Déterministe"
        },
        text: {
            en: "I eliminate guesswork by prioritizing data structures and algorithmic complexity. Every line of code is a calculated decision in a larger system architecture.",
            fr: "J'élimine toute approximation en privilégiant les structures de données et la complexité algorithmique. Chaque ligne est une décision calculée au sein de l'architecture."
        },
        icon: Terminal
    },
    {
        title: {
            en: "Pattern-First Design",
            fr: "Design Axé sur les Patterns"
        },
        text: {
            en: "Whether it's Singleton, Factory, or Observer, I select the architecture that ensures scalability and maintainability.",
            fr: "Qu'il s'agisse de Singleton, Factory ou Observer, je choisis l'architecture qui garantit la scalabilité et la maintenabilité."
        },
        icon: Code2
    },
    {
        title: {
            en: "Clean & Self-Documenting",
            fr: "Code Propre et Auto-Documenté"
        },
        text: {
            en: "Code is read more often than written. I follow SOLID principles to produce clean, modular, and testable codebases.",
            fr: "Le code est plus souvent lu qu'écrit. Je suis les principes SOLID pour produire des bases de code propres, modulaires et testables."
        },
        icon: Zap
    },
    {
        title: {
            en: "Problem Analysis",
            fr: "Analyse de Problèmes"
        },
        text: {
            en: "I specialize in decomposing complex problems into manageable micro-services, focusing on the 'Why' before the 'How'.",
            fr: "Je me spécialise dans la décomposition de problèmes complexes en micro-services, en me concentrant sur le 'Pourquoi' avant le 'Comment'."
        },
        icon: Cpu
    }
];
export const CDAFAL_EXP = {
    company: "CDAFAL68",
    role: { en: "Fullstack & DevOps Engineer", fr: "Ingénieur Fullstack & DevOps" },
    period: "JAN 2023 — JUN 2023",
    location: { en: "Internship", fr: "Stage" },
    description: {
        en: "Led the digital transformation of legacy data systems, replacing fragmented Excel/Access workflows with a centralized, secure enterprise architecture.",
        fr: "Direction de la transformation digitale des systèmes de données, remplaçant les flux Excel/Access fragmentés par une architecture d'entreprise centralisée et sécurisée."
    },
    tasks: {
        en: [
            "Architected a centralized PostgreSQL database to eliminate data silos and version conflicts caused by legacy Excel/Access workflows.",
            "Engineered a Spring Boot REST API with Role-Based Access Control (RBAC) to fix critical security vulnerabilities.",
            "Developed a high-performance C++ data-parsing engine to sanitize and migrate corrupted legacy records.",
            "Deployed a modern CI/CD pipeline using Docker and GitHub Actions for zero-downtime deployments.",
            "Increased organizational productivity by 60% by enabling concurrent data access."
        ],
        fr: [
            "Architecture d'une base de données PostgreSQL centralisée pour éliminer les silos de données et les conflits de version Excel/Access.",
            "Ingénierie d'une API REST Spring Boot avec RBAC pour corriger les vulnérabilités de sécurité critiques.",
            "Développement d'un moteur de parsing C++ haute performance pour assainir et migrer les données corrompues.",
            "Déploiement d'un pipeline CI/CD moderne via Docker et GitHub Actions pour des déploiements sans interruption.",
            "Augmentation de la productivité organisationnelle de 60% via l'accès concurrent aux données."
        ]
    },
    tech: ["SpringBoot", "Vue.js", "PostgreSQL", "C++", "Docker", "CI/CD"]
};
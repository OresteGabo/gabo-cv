import { Cpu, Database, Binary, Smartphone, Code2, Sparkles } from "lucide-react";

export interface ServiceCard {
    title: string;
    text: string;
    Icon: any;
    code: string;
}

export const ENGINEERING_CARDS: ServiceCard[] = [
    {
        title: "Architectural Integrity",
        text: "Applying OOP principles and design patterns (SOLID, GoF) to solve real-world problems. My goal is clean, performant, and maintainable systems.",
        Icon: Binary,
        code: "DESIGN-01"
    },
    {
        title: "AI & Computer Vision",
        text: "Developing high-accuracy ML models. From parking occupancy classification to CNN-LSTM hybrids for seismic prediction achieving 76.98% accuracy.",
        Icon: Cpu,
        code: "MODEL-AI-01"
    },
    {
        title: "Systems Engineering",
        text: "Low-level performance optimization. Implementing Marching Cubes and real-time OpenGL shaders in C++ for architectural visualization.",
        Icon: Binary,
        code: "SYS-CPP-17"
    },
    {
        title: "Full-Stack Ecosystems",
        text: "Architecting mission-critical platforms with Next.js 15, React Server Components, and secure Spring Boot REST APIs.",
        Icon: Code2,
        code: "STACK-PRO"
    },
    {
        title: "Native Mobile Solutions",
        text: "Engineering fluid mobile experiences with Kotlin (MVVM) and Flutter, integrating OpenStreetMap and real-time data tracking.",
        Icon: Smartphone,
        code: "MOBILE-OS"
    }
];
export const SITE_CONFIG = {
    name: "GABO",
    email: "orestegabo@icloud.com",
    careerPageLink: "/resume.pdf",
    github: "https://github.com/orestegabo",
    linkedin: "https://linkedin.com/in/orestemg"
};

export type ProjectCategory = "AI & ML" | "Web & Cloud" | "Mobile" | "C++ & Graphics";

export const PROJECTS = [
    {
        title: "Gabo Ecosystem",
        category: "Web & Cloud",
        description: "High-performance software infrastructure platform with immersive UX and atomic design principles.",
        patterns: ["Atomic Design", "Observer", "Facade"],
        impact: "Sub-100ms Page Transitions",
        tech: ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"],
        link: "https://github.com/OresteGabo/gabo-web"
    },
    {
        title: "Earthquake Prediction Engine",
        category: "AI & ML",
        description: "Deep learning system for seismic time-series analysis utilizing hardware-accelerated tensors.",
        patterns: ["Pipeline", "Strategy", "CNN-LSTM Hybrid"],
        impact: "76.98% Prediction Accuracy",
        tech: ["PyTorch", "NumPy", "Metal (MPS)", "SciPy"],
        link: "https://github.com/OresteGabo/deep-learning"
    },
    {
        title: "Parking Occupancy ML",
        category: "AI & ML",
        description: "Computer Vision system for real-time binary classification of spatial occupancy.",
        patterns: ["Feature Engineering", "Singleton", "Adapter"],
        impact: "Cross-Lighting Reliability",
        tech: ["Python", "OpenCV", "Scikit-Learn", "HSV-Analysis"],
        link: "https://github.com/OresteGabo/parking-occupancy-ml"
    },
    {
        title: "SchoolBridge Full-Stack",
        category: "Mobile",
        description: "Enterprise educational ecosystem with a decoupled native mobile client and secure micro-API.",
        patterns: ["MVVM", "Repository", "Dependency Injection"],
        impact: "Full Role-Based Data Isolation",
        tech: ["Spring Boot", "Kotlin", "PostgreSQL", "Docker"],
        link: "https://github.com/OresteGabo/SchoolBridgeApi"
    },
    {
        title: "ArchViz 3D Engine",
        category: "C++ & Graphics",
        description: "Procedural 3D rendering engine specialized in voxel-to-mesh isosurface generation.",
        patterns: ["Marching Cubes", "Buffer Management", "Flyweight"],
        impact: "Real-time Voxel-to-Mesh Generation",
        tech: ["C++ 17", "OpenGL", "GLSL", "GLFW"],
        link: "https://github.com/OresteGabo/GraphvizCPP"
    },
    {
        title: "Connected Mobility Simulator",
        category: "C++ & Graphics",
        description: "High-framerate visualization system for massive dynamic data flows on OSM geospatial layers.",
        patterns: ["Layered Architecture", "Async Provider", "State"],
        impact: "60FPS with 10k+ Dynamic Entities",
        tech: ["C++", "Qt5", "MySQL", "OpenStreetMap API"],
        link: "https://github.com/OresteGabo/betterPjMap"
    }
];

export const EXPERIENCE = [
    {
        company: "Tech Internships Africa",
        role: "Full Stack Developer Intern",
        period: "JAN 2025 - PRESENT",
        tasks: [
            "Architected scalable API endpoints using Spring Boot for educational platforms",
            "Implemented real-time data sync for mobile clients using WebSocket & Firebase",
            "Optimized SQL queries reducing dashboard load times by 40%"
        ],
        tech: ["Spring Boot", "Kotlin", "PostgreSQL", "React"]
    }
];
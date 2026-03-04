# Oreste Gabo — Systems Architecture Portfolio (2026)

[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com/)
[![Framework: Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)

> Live Technical Demonstration — A high-performance engineering portfolio engineered as a production-grade system, not a static CV.

---

## Executive Summary

This repository is intentionally designed as a **technical artifact**.

It demonstrates:

- Systems-level architectural thinking
- Performance-first engineering
- Clean design patterns and composability
- Deterministic data flow and decoupled layers
- Production-ready deployment strategy

Built with **Next.js 15 (App Router)**, this application leverages React Server Components (RSC) and Standalone Output to minimize runtime overhead and optimize edge distribution.

---

## Technology Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- React Server Components (RSC)
- Standalone production output

---

## Architectural Overview

### Composition Root

The `app/` directory functions as the **composition root**, orchestrating:

- Layout injection
- Section assembly
- Server/Client rendering boundaries
- Rendering strategy definition

This ensures dependency direction is controlled at the highest level of the application.

---

### Atomic Design System

UI components are structured using **Atomic Design principles**:

component/
├── sections/   → Domain-specific page assemblies  
└── shared/     → Atomic, reusable UI primitives

This architecture enforces:

- High cohesion
- Low coupling
- Predictable scaling
- Reusable abstractions

---

### Strategy Pattern (Filtering & State Logic)

Dynamic project filtering is implemented using the **Strategy Pattern**.

Instead of conditional branching, interchangeable filtering strategies are injected, enabling:

- Extensibility without modification
- Open/Closed Principle compliance
- Deterministic rendering behavior

---

### Decoupled Data Layer

`lib/constants.ts`

Acts as the **single source of truth**:

- Pure data definitions
- No rendering logic
- Framework-agnostic structure
- Easily swappable to API or CMS

`lib/utils.ts`

Contains pure helper functions:

- Deterministic transformations
- Side-effect isolation
- Testable logic units

---

## Performance Engineering

Performance is treated as a system constraint.

### React Server Components (RSC)

- Server-first rendering
- Reduced client-side JavaScript
- Smaller hydration payload
- Faster Time-to-Interactive

### Standalone Output

- Minimal deployment footprint
- Optimized containerization
- Reduced runtime dependencies
- Efficient edge distribution

### Motion & GPU Optimization

Framer Motion animations rely on:

- Transform-based animations
- Hardware acceleration
- Composite-layer rendering
- No layout thrashing

---

## Project Structure

app/                    → Next.js App Router (Composition Root)  
component/              
├── sections/          → Domain-specific page sections  
└── shared/            → Atomic UI components  
lib/                    
├── constants.ts       → Source of Truth (Decoupled Data Layer)  
└── utils.ts           → Pure helper functions  
public/                 
└── patterns/          → Geometric Imigongo background assets

---

## Engineering Highlights (For Hiring Managers)

### CI/CD Discipline

- Automated production deployment via Vercel
- Branch-based preview environments
- Immutable build artifacts
- Deterministic deployment strategy

---

### 3D Math in CSS

Advanced CSS transforms include:

- Matrix transformations
- Perspective projection
- Depth-layer composition
- Controlled stacking contexts

Used to simulate architectural depth with minimal DOM complexity.

---

### Hardware-Accelerated ML Projects

#### Seismic AI

- Earthquake signal classification system
- Achieved 76.98% accuracy
- Performance-aware inference pipeline
- Optimized model evaluation

---

#### C++ ArchViz Engine

- Custom real-time visualization engine
- Implemented Marching Cubes algorithm
- Procedural geometry generation
- Memory-efficient mesh construction
- Spatial data structure optimization

---

## Design Philosophy

This portfolio embodies:

- Systems thinking over surface aesthetics
- Measurable engineering outcomes
- Structural clarity over complexity
- Performance-driven decisions
- Predictable abstractions

This is not a marketing page.

It is an engineered system.

---

## Installation

Clone the repository:

    git clone https://github.com/orestegabo/gabo-cv.git

Install dependencies:

    npm install

Run development server:

    npm run dev

Production build:

    npm run build
    npm start

---

## Deployment

Optimized for:

- Vercel edge distribution
- Standalone container environments
- Minimal cold-start latency

---

## Contact

Oreste Gabo  
Systems Architect — Logic | Performance | Clean Design

GitHub: https://github.com/orestegabo 
LinkedIn: https://linkedin.com/in/orestemg 
Email: orestegabo@icloud.com

---

## Closing Statement

This repository represents my engineering mindset in executable form.

Every architectural decision is deliberate.

This is not a résumé.

It is a system.


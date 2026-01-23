# Codebase Summary

**Lộc Xanh CRM - Complete File Structure & Component Overview**
**Last Updated**: January 15, 2026

---

## 📁 Project Structure

```
locxanh.vn/
├── 📄 Root Files
│   ├── README.md                    # Project overview & quick start
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript configuration
│   ├── next.config.ts               # Next.js config
│   ├── tailwind.config.ts           # TailwindCSS configuration
│   ├── eslint.config.mjs            # ESLint rules
│   └── CLAUDE.md                    # AI assistant guidelines
│
├── 📂 docs/                         # Comprehensive documentation
│   ├── planning/
│   │   ├── project-overview-pdr.md  # Requirements & specifications
│   │   ├── codebase-summary.md      # This file
│   │   ├── code-standards.md        # Development guidelines
│   │   ├── system-architecture.md   # Technical architecture
│   │   └── project-roadmap.md       # Future development
│   └── ... (deployment, setup, testing)
│
├── 📂 prisma/                       # Database schema & migrations
│   ├── schema.prisma                # Complete database models
│   ├── migrations/                  # Generated migrations
│   └── seed.ts                      # Database seeding
│
├── 📂 src/
│   ├── 📂 domain/                   # DDD Domain Layer
│   │   └── customer/                # Customer entities & interfaces
│   ├── 📂 application/              # DDD Application Layer
│   │   └── customer/                # Customer use cases
│   ├── 📂 infrastructure/           # DDD Infrastructure Layer
│   │   ├── repositories/            # Prisma repository implementations
│   │   └── mappers/                 # Entity/POJO mappers
│   │
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── (auth)/                  # Authentication routes
│   │   ├── (dashboard)/             # Main application
│   │   ├── api/                     # API routes (SmartVAS, invoices, upload)
│   │   └── layout.tsx               # Root layout
│   │
│   ├── 📂 actions/                  # Server Actions (Service Layer)
│   │   ├── customers.ts             # Customer CRUD (delegates to DDD)
│   │   ├── monthly-statements.ts    # Bảng Kê (85% complete)
│   │   ├── churn-analysis.ts        # AI Churn prediction
│   │   ├── exchange-prediction.ts   # AI Exchange prediction
│   │   └── ... (20+ action modules)
│   │
│   ├── 📂 components/               # React components
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── customers/               # Customer-specific UI
│   │   ├── bang-ke/                 # Monthly statement components
│   │   ├── map/                     # Leaflet map components
│   │   ├── dashboard/               # Dashboard widgets & AI panels
│   │   └── ... (70+ components)
│   │
│   ├── 📂 lib/                      # Utilities & Shared Logic
│   │   ├── ai/                      # AI provider logic (Gemini, OpenRouter)
│   │   ├── validations/             # Zod schemas (30+ files)
│   │   ├── exchange/                # Priority scoring & inventory sync
│   │   └── ... (auth, prisma, utils)
│   │
│   └── 📂 types/                    # Shared TypeScript types
```

---

## 🔧 Core Modules Overview

### 1. DDD Layers (In Progress)

Starting with the Customer module, the codebase is migrating to a Clean Architecture/DDD pattern.

- **Domain**: Pure business logic and entity definitions.
- **Application**: Use cases that orchestrate domain entities and infrastructure services.
- **Infrastructure**: Technical implementation details (Prisma, external APIs).

### 2. Server Actions (`src/actions/`)

Used as the primary entry point for frontend components, delegating to DDD use cases or direct Prisma calls.

- **AI Actions**: `churn-analysis.ts`, `exchange-prediction.ts` provide predictive insights.
- **Financial Actions**: `monthly-statements.ts`, `invoices.ts` handle complex billing logic.

### 3. AI Capabilities (`src/lib/ai/`)

- **Multi-Provider**: Support for Gemini, OpenRouter (DeepSeek), and Groq.
- **Task Routing**: Intelligent routing based on task type (Multimodal, Math, Vietnamese NLP).

---

## 📊 Code Statistics

### File Count

- **Total Files**: ~250
- **Components**: 70+
- **Server Actions**: 20+ modules
- **Validation Schemas**: 30+ files
- **Database Models**: 18 models
- **Tests**: 150+ test cases

### Test Coverage

- **Lines**: 97.5%
- **Functions**: 94.55%
- **Overall**: 97%+

---

**Summary Version**: 1.1
**Last Updated**: January 15, 2026
**Codebase Status**: 85% Complete, Phase 3 (DDD & AI)

# System Architecture

**Lộc Xanh CRM - Technical Architecture & Design Patterns**
**Last Updated**: January 15, 2026

---

## 🏗 Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Desktop   │  │   Tablet    │  │   Mobile    │         │
│  │   (React)   │  │   (React)   │  │   (Future)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│              Next.js 16 Application Layer                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              App Router & Middleware                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │            Server Actions (Entry Layer)              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │           DDD Application Layer (Use Cases)          │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │          DDD Domain Layer (Business Logic)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Infrastructure Layer
                              │
┌─────────────────────────────────────────────────────────────┐
│              Database Layer (PostgreSQL 17)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostGIS 3.5  │  pg_trgm  │  unaccent               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  45+ Indexes  │  6 Views  │  18 Models              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              External Services Integration                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Google Maps │  │  MinIO/S3   │  │   Gemini    │         │
│  │   (Maps)    │  │  (Storage)  │  │    (AI)     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Architectural Patterns

### 1. Hybrid DDD & Server Actions

The project is transitioning from a direct Server Action pattern to a more structured Domain-Driven Design (DDD) architecture.

#### Layers:

1. **Delivery (Server Actions)**: `src/actions/` - Handles HTTP/Form data, authentication checks, and delegates to the Application layer.
2. **Application**: `src/application/` - Contains Use Cases that orchestrate domain logic and infrastructure services.
3. **Domain**: `src/domain/` - Pure business entities, repository interfaces, and domain exceptions.
4. **Infrastructure**: `src/infrastructure/` - Prisma repositories, external API adapters (SmartVAS), and mappers.

### 2. Full-Stack Type Safety

Type safety is enforced from the database schema up to the React components.

- **DB**: Prisma types.
- **Validation**: Zod schemas for runtime safety.
- **API**: Type-safe Server Actions.
- **Frontend**: Inferred types from Zod and Prisma.

### 3. Vietnamese-First Design

- **Search**: Hybrid search using `pg_trgm` (trigram) and `unaccent` for fuzzy matching Vietnamese text.
- **Data**: Automatic normalization of company names and addresses at the infrastructure layer.

---

## 📊 Database Architecture

### 1. Core Models

- **Customer**: Core entity with tiered pricing and geocoding.
- **MonthlyStatement (Bảng Kê)**: Billing records with 24th-23rd cycle logic and automated rollover.
- **Invoice**: Financial records with SmartVAS e-invoice integration.
- **ExchangeRequest**: Priority-scored plant replacement requests with inventory sync.

### 2. Performance

- **Raw SQL FILTER**: Used for complex dashboard aggregations to reduce query count.
- **Optimized Indexes**: 45+ indexes, including GIN indexes for trigram search.

---

## 🤖 AI Architecture

### 1. Intelligence Engine

- **Multi-Provider SDK**: Orchestrates requests between Google Gemini, OpenRouter, and Groq.
- **Task Router**: Selects the best model for the task (e.g., Gemini for multimodal/PDF, DeepSeek for complex logic).

### 2. Predictive Analytics

- **Churn Prediction**: Hybrid scoring based on payment patterns, exchange frequency, and sentiment analysis.
- **Exchange Prediction**: Forecasts maintenance needs based on plant lifespan and care observations.

---

## 🛡 Security Architecture

### 1. Authentication & RBAC

- **NextAuth.js 5**: Handles session management and OAuth.
- **RBAC**: 5 levels (ADMIN, MANAGER, STAFF, ACCOUNTANT, VIEWER) enforced at the Server Action level.

### 2. Integrity

- **Audit Logging**: Comprehensive activity logs for all entity mutations.
- **Concurrency**: Optimistic locking and race condition protection for e-invoice numbering (SmartVAS).

---

## 📚 Related Documentation

- **PDR**: `./docs/planning/project-overview-pdr.md`
- **Standards**: `./docs/planning/code-standards.md`
- **Roadmap**: `./docs/planning/project-roadmap.md`

---

**Document Version**: 1.1
**Last Updated**: January 15, 2026
**Architecture Type**: Hybrid DDD + Server Actions

# Code Standards & Development Guidelines

**Lộc Xanh CRM - Development Conventions & Best Practices**
**Last Updated**: January 15, 2026

---

## 🏗 DDD & Clean Architecture Standards

The project is migrating to a Domain-Driven Design (DDD) structure to improve maintainability as complexity grows.

### 1. Layer Responsibilities

- **Domain Layer (`src/domain/`)**: Pure business logic. Entities, Value Objects, Repository interfaces, and Domain exceptions. No dependencies on external libraries (except types).
- **Application Layer (`src/application/`)**: Use cases (Command/Query handlers). Orchestrates domain entities and infrastructure services. Contains DTOs and validation logic.
- **Infrastructure Layer (`src/infrastructure/`)**: Technical implementations. Prisma repositories, external API adapters (SmartVAS, Google Maps), and Mappers (Domain Entity ↔ Database POJO).

### 2. Implementation Rules

- **Dependency Inversion**: Use cases depend on repository interfaces, not implementations.
- **Thin Delivery**: Server Actions should only validate basic input and delegate to Use Cases.
- **Encapsulation**: Domain entities should handle their own state transitions and business rules.

---

## 🔧 TypeScript Standards

### 1. Type Safety

- **No `any`**: Use `unknown`, `never`, or proper generics.
- **Explicit Returns**: Always define return types for public functions and Server Actions.
- **Strict Null Checks**: Always handle null/undefined explicitly.

### 2. Naming Conventions

- **Files**: kebab-case (e.g., `customer-form.tsx`).
- **Components/Classes**: PascalCase (e.g., `CustomerTable`).
- **Functions/Variables**: camelCase.
- **Constants**: UPPER_SNAKE_CASE.

---

## ⚛️ React & Next.js Patterns

- **Server Components**: Default for data fetching and layouts.
- **Client Components**: Use only for interactivity (forms, maps, buttons). Add "use client" directive.
- **Server Actions**: Primary way to handle mutations. Use the `createAction` wrapper for consistent error handling and validation.
- **Suspense**: Use granular Suspense boundaries with skeletons for better perceived performance.

---

## 🗄 Database & Prisma Standards

- **Snake Case in DB**: Use `@map` to keep database columns snake_case while using camelCase in TypeScript.
- **Transactions**: Use `$transaction` for operations affecting multiple models.
- **Raw SQL**: Reserve for complex aggregations or performance-critical queries (use `FILTER` and `pg_trgm`).
- **Optimistic Locking**: Use version fields or timestamps for critical updates to prevent race conditions.

---

## ✅ Validation & Error Handling

- **Zod**: Required for all Server Action inputs and API responses.
- **Vietnamese Messages**: All user-facing validation errors must be in Vietnamese.
- **Custom Errors**: Use `AppError`, `NotFoundError`, `ConflictError` classes from `@/lib/errors`.
- **Try-Catch**: Handle specific database errors (P2002, etc.) and convert them to user-friendly messages.

---

## 🧪 Testing Standards

- **Vitest**: Preferred for unit and integration tests.
- **Coverage**: Maintain >95% line coverage.
- **Layers**:
  - **Unit**: Domain entities and utility functions.
  - **Integration**: Application use cases with Prisma.
  - **E2E**: Playwright for critical paths (e.g., invoice generation).

---

## 🌐 Vietnamese Standards

- **Formatting**: Use `Intl.NumberFormat` for currency (VND) and `Intl.DateTimeFormat` for dates (DD/MM/YYYY).
- **Normalization**: Store `companyNameNorm` (unaccented, lowercase) for fuzzy search.
- **Phone Numbers**: Validate and format as `0XX XXX XXXX`.

---

## 📦 Git & Commit Standards

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `test:`, `chore:`.
- **Branch Strategy**: `main` ← `dev` ← `feat/*` | `fix/*`.
- **Pre-commit**: Run `pnpm run validate` (lint + typecheck + format) before committing.

---

**Document Version**: 1.2
**Last Updated**: January 15, 2026
**Status**: Active - Phase 3 (DDD Transition)

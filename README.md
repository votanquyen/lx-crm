# Lộc Xanh CRM - Plant Rental Management System

![CI](https://github.com/{org}/{repo}/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/{org}/{repo}/branch/main/graph/badge.svg)](https://codecov.io/gh/{org}/{repo})

Hệ thống Quản lý Khách hàng & Cho thuê Cây xanh - **85% Hoàn thành**

## 🎯 Core Features

### ✅ Completed (Phase 1-2.5)

- **Customer Management**: Vietnamese fuzzy search (pg_trgm), geocoding, multi-tier customer tracking (DDD implementation started)
- **Contract & Invoicing**: Full lifecycle management with automated calculations & SmartVAS integration
- **Care Scheduling**: GPS check-in/out, route optimization, daily schedules
- **Exchange Management**: Plant replacement requests with priority scoring & map visualization
- **Monthly Statements (Bảng Kê)**: 85% complete - automated billing cycle generation & confirmation workflow
- **Analytics Dashboard**: Real-time revenue, customer, and contract analytics
- **AI-Powered Features**: Churn prediction, exchange prediction, sticky notes analysis
- **File Storage**: MinIO S3 integration with presigned URLs

### 🚧 In Development (Phase 3)

- **DDD Migration**: Porting direct Server Actions to Domain-Driven Design layers
- **Performance Optimization**: Query caching, code splitting, raw SQL aggregation
- **Mobile App**: React Native companion app for field staff (planning)

## 🛠 Tech Stack

| Layer          | Technology                                 | Purpose                                      |
| -------------- | ------------------------------------------ | -------------------------------------------- |
| **Frontend**   | Next.js 16.1, React 19, TypeScript         | Modern React with App Router                 |
| **Styling**    | TailwindCSS 3, shadcn/ui                   | Utility-first + component library            |
| **Backend**    | Next.js Server Actions                     | Full-stack type safety                       |
| **Database**   | PostgreSQL 17 + PostGIS 3.5                | Geospatial + trigram search                  |
| **ORM**        | Prisma 6.1                                 | Type-safe database client                    |
| **Auth**       | NextAuth.js 5 (Google OAuth + Credentials) | RBAC (ADMIN/MANAGER/STAFF/ACCOUNTANT/VIEWER) |
| **Validation** | Zod 4.2                                    | Runtime validation + TypeScript inference    |
| **State**      | Zustand 5.0, TanStack Query 5.90           | Client state + server state management       |
| **Storage**    | MinIO S3-compatible                        | File uploads with presigned URLs             |
| **Maps**       | Google Maps API + React Leaflet            | Geocoding + route visualization              |
| **PDF**        | jsPDF + autotable (Webpack)                | Vietnamese font support                      |
| **Testing**    | Vitest 4.0 (97.5% coverage) + Playwright   | Unit + E2E testing                           |

## 📊 Project Status

| Metric                 | Status                        | Details                            |
| ---------------------- | ----------------------------- | ---------------------------------- |
| **Overall Completion** | 85%                           | Phase 2.5 (Bảng Kê) 85% complete   |
| **Test Coverage**      | 97.5% lines, 94.55% functions | 150+ passing tests                 |
| **Database Indexes**   | 45+                           | Optimized for Vietnamese search    |
| **API Endpoints**      | 35+                           | Server Actions with Zod validation |
| **Components**         | 70+                           | Reusable shadcn/ui components      |
| **Architecture**       | 🔄 Hybrid                     | Server Actions + DDD (started)     |

### Recent Achievements (Phase 3)

- ✅ **DDD Architecture**: Migrated Customer module to Domain/Application/Infrastructure layers
- ✅ **AI Predictions**: Implemented churn and exchange prediction modules
- ✅ **Monthly Statements**: Advanced confirmation workflow and rollovers
- ✅ **SmartVAS Integration**: E-invoice integration with race condition protection
- ✅ **Map Visualization**: Interactive customer & exchange map with priority scoring
- ✅ **Sticky Notes**: Global sticky notes display and navigation

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22.12+ (LTS)
- **Package Manager**: pnpm 10.26+
- **Database**: PostgreSQL 17 + PostGIS 3.5

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp .env.example .env

# 3. Database setup
docker-compose up -d db

# 4. Run migrations
pnpm run db:migrate

# 5. Start development
pnpm dev
```

## 📚 Documentation

- **[Project Overview & PDR](docs/planning/project-overview-pdr.md)** - Requirements
- **[System Architecture](docs/planning/system-architecture.md)** - Technical design
- **[Codebase Summary](docs/planning/codebase-summary.md)** - File structure
- **[Code Standards](docs/planning/code-standards.md)** - Development guidelines

**Status**: Phase 2.5 (Bảng Kê) 85% complete • **Next**: Phase 3 Performance & DDD Migration
**Last Updated**: January 15, 2026
**License**: Private - All rights reserved

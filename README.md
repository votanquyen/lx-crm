# Lộc Xanh CRM - Plant Rental Management System

![CI](https://github.com/{org}/{repo}/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/{org}/{repo}/branch/main/graph/badge.svg)](https://codecov.io/gh/{org}/{repo})

Hệ thống Quản lý Khách hàng & Cho thuê Cây xanh

## Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS 3, shadcn/ui
- **Backend:** Next.js Server Actions, Prisma ORM
- **Database:** PostgreSQL 17 + PostGIS
- **Authentication:** NextAuth.js 5 (Google OAuth)
- **AI:** Google Gemini, Groq (fallback)
- **Testing:** Vitest, Playwright, Testing Library
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20.x or Bun 1.1.38+
- **Database:** PostgreSQL 17 with PostGIS (choose one):
  - **Neon** (recommended) - Free serverless PostgreSQL
  - **Local Docker** - PostgreSQL + PostGIS container
- Google OAuth credentials (for authentication)

### Installation

```bash
# Install dependencies
bun install

# Setup database (choose one option)

# Option 1: Neon PostgreSQL (Recommended - Free cloud database)
./scripts/setup-neon.sh
# Follow prompts to connect to Neon database
# See docs/neon-setup-guide.md for detailed instructions

# Option 2: Local PostgreSQL with Docker
docker-compose up -d db
# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
bun run db:migrate

# Seed database (optional)
bun run db:seed

# Start development server
bun dev
```

### Development Workflow

```bash
# Run all quality checks before pushing
bun run validate

# Individual checks
bun run lint          # ESLint + TypeScript check
bun run lint:fix      # Auto-fix linting issues
bun test              # Run unit tests
bun test --coverage   # Run tests with coverage
bun run build         # Production build
```

## Documentation

- **Development:**
  - [Getting Started](#getting-started)
  - [Development Workflow](#development-workflow)

- **Testing & Quality:**
  - [CI/CD Pipeline](docs/ci-cd-pipeline.md) - Automated testing and deployment
  - [CI/CD Quick Reference](docs/ci-cd-quick-reference.md) - Developer commands

- **Database:**
  - [Database Migrations](docs/database-migrations.md) - Migration workflow
  - [Neon Setup Guide](docs/neon-setup-guide.md) - Free cloud PostgreSQL setup

- **Deployment:**
  - [Deployment Guide](docs/deployment-guide.md) - Staging and production deployment

## Project Status

**Phase 1: Test Infrastructure** ✅ Complete
- Test coverage: 97.5% lines, 94.55% functions
- 121 passing tests across 3 test suites
- CI/CD pipeline operational

## License

Private - All rights reserved.

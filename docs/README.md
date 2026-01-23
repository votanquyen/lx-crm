# Documentation Index

**Last Updated:** 2026-01-01

Welcome to the Lộc Xanh CRM documentation. This folder contains all technical documentation organized by category.

---

## 📚 Quick Navigation

| Category                                | Description                                 | Files    |
| --------------------------------------- | ------------------------------------------- | -------- |
| **[Setup](#setup)**                     | Database, storage, and infrastructure setup | 5 files  |
| **[Deployment](#deployment)**           | Deployment guides and CI/CD pipelines       | 3 files  |
| **[Planning](#planning)**               | Architecture, standards, and roadmaps       | 10 files |
| **[Features](#features)**               | Feature implementation guides               | 3 files  |
| **[Testing](#testing)**                 | Testing guides and checklists               | 5 files  |
| **[Quick Reference](#quick-reference)** | Command cheat sheets                        | 1 file   |
| **[Archive](#archive)**                 | Historical records and completion reports   | 13 files |
| **[Misc](#misc)**                       | Miscellaneous documentation                 | 5 files  |

---

## Setup

Database, storage, and infrastructure configuration guides.

### Database

- **[Database Migrations](setup/database-migrations.md)** - Schema migrations and version control
- **[Neon Setup Guide](setup/neon-setup-guide.md)** - Complete Neon PostgreSQL setup
- **[Neon Quick Reference](setup/neon-quick-reference.md)** - Neon commands and tips

### Storage

- **[MinIO S3 Storage](setup/storage/minio-s3-storage.md)** - Complete MinIO/S3 setup guide
- **[MinIO Quick Reference](setup/storage/minio-quick-reference.md)** - MinIO commands and troubleshooting

---

## Deployment

Deployment guides for production and staging environments.

- **[Deployment Guide](deployment/deployment-guide.md)** - Comprehensive deployment guide (Docker, traditional)
- **[Coolify Deployment](deployment/coolify-deployment.md)** - Complete Coolify platform deployment (1200+ lines)
- **[CI/CD Pipeline](deployment/ci-cd-pipeline.md)** - Continuous integration and deployment setup

---

## Planning

Architecture, standards, and project planning documentation.

### Core Documentation

- **[Project Overview (PDR)](planning/project-overview-pdr.md)** - Product Development Requirements
- **[System Architecture](planning/system-architecture.md)** - System design and architecture
- **[Code Standards](planning/code-standards.md)** - Coding conventions and best practices
- **[Design Guidelines](planning/design-guidelines.md)** - UI/UX design principles
- **[Feature Roadmap](planning/feature-roadmap.md)** - Product roadmap and milestones

### Technical Reference

- **[Tech Stack Documentation](planning/tech-stack-documentation.md)** - Technology stack overview
- **[Function Workflow](planning/function-workflow.md)** - Business logic and workflows
- **[Codebase Summary](planning/codebase-summary.md)** - Codebase structure overview
- **[Frontend Overview](planning/frontend-overview.md)** - Frontend architecture and patterns
- **[Project Roadmap](planning/project-roadmap.md)** - Long-term project vision

---

## Features

Implementation guides for specific features.

- **[Plant Types Implementation](features/plant-types-implementation.md)** - Plant type management system
- **[Payment Recording](features/payment-recording-implementation-progress.md)** - Payment tracking and recording
- **[Analytics CSV Export](features/analytics-csv-export.md)** - Analytics data export functionality

---

## Testing

Testing guides, checklists, and test reports.

- **[Browser Testing Checklist](testing/browser-testing-checklist.md)** - Comprehensive browser test matrix
- **[Quick Testing Reference](testing/quick-testing-reference.md)** - Quick testing commands
- **[Payment Testing Guide](testing/payment-testing-guide.md)** - Payment feature testing
- **[Quotation Manual Testing Report](testing/quotation-manual-testing-report.md)** - Quotation system test results
- **[Plant Types Browser Test Report](testing/plant-types-browser-test-report.md)** - Plant types feature test results

---

## Quick Reference

Command cheat sheets and quick references.

- **[CI/CD Quick Reference](quick-reference/ci-cd-quick-reference.md)** - CI/CD commands and workflows
- **[Neon Quick Reference](setup/neon-quick-reference.md)** - Database commands (see Setup section)
- **[MinIO Quick Reference](setup/storage/minio-quick-reference.md)** - Storage commands (see Setup section)

---

## Archive

Historical documentation and completion reports.

### Session Notes

- Browser Testing Session (Dec 19, 2025)
- Session Summary (Dec 19, 2025)
- Validation Session (Dec 19, 2025)

### Completion Reports

- Analytics Dashboard Completion
- Analytics Navigation Added
- Payment Recording Completion
- Plant Types Completion
- Quotation System Completion
- Sticky Notes Status
- Test Data Creation
- Validation Completion (Dec 19, 2025)
- Phase 3.3 Summary
- Phase 3 Architecture Update
- Phase 3 Architecture Decisions

**Location:** `archive/sessions/` and `archive/completion-reports/`

---

## Misc

Miscellaneous documentation and one-off guides.

- **[Build Fixes Summary](misc/build-fixes-summary.md)** - Build error fixes and solutions
- **[TypeScript Errors to Fix](misc/typescript-errors-to-fix.md)** - TypeScript error tracking
- **[Upload Size Increase](misc/upload-size-increase.md)** - File upload size configuration
- **[Schedule Execution Tracking](misc/schedule-execution-tracking.md)** - Schedule tracking implementation
- **[Morning Briefing PDF](misc/morning-briefing-pdf.md)** - PDF generation for briefings

---

## Getting Started

**New to the project?** Start here:

1. **[Project Overview (PDR)](planning/project-overview-pdr.md)** - Understand the project scope
2. **[System Architecture](planning/system-architecture.md)** - Learn the system design
3. **[Code Standards](planning/code-standards.md)** - Follow coding conventions
4. **[Setup Guides](setup/)** - Configure your development environment
5. **[Deployment Guide](deployment/deployment-guide.md)** - Deploy to production

**Need to deploy quickly?**

- **[Coolify Deployment](deployment/coolify-deployment.md)** - Complete step-by-step guide

**Need commands fast?**

- **[Quick Reference](#quick-reference)** - All command cheat sheets

---

## Documentation Structure

```
docs/
├── README.md (this file)
├── setup/
│   ├── database-migrations.md
│   ├── neon-setup-guide.md
│   ├── neon-quick-reference.md
│   └── storage/
│       ├── minio-s3-storage.md
│       └── minio-quick-reference.md
├── deployment/
│   ├── deployment-guide.md
│   ├── coolify-deployment.md
│   └── ci-cd-pipeline.md
├── features/
│   ├── plant-types-implementation.md
│   ├── payment-recording-implementation-progress.md
│   └── analytics-csv-export.md
├── testing/
│   ├── browser-testing-checklist.md
│   ├── quick-testing-reference.md
│   ├── payment-testing-guide.md
│   ├── quotation-manual-testing-report.md
│   └── plant-types-browser-test-report.md
├── planning/
│   ├── project-overview-pdr.md
│   ├── feature-roadmap.md
│   ├── system-architecture.md
│   ├── code-standards.md
│   ├── design-guidelines.md
│   ├── function-workflow.md
│   ├── tech-stack-documentation.md
│   ├── codebase-summary.md
│   ├── frontend-overview.md
│   └── project-roadmap.md
├── quick-reference/
│   └── ci-cd-quick-reference.md
├── archive/
│   ├── sessions/
│   │   ├── browser-testing-session-251219.md
│   │   ├── session-summary-251219.md
│   │   └── session-summary-validation-251219.md
│   └── completion-reports/
│       ├── analytics-dashboard-completion-summary.md
│       ├── analytics-navigation-added.md
│       ├── payment-recording-completion-summary.md
│       ├── plant-types-completion-summary.md
│       ├── quotation-system-completion-summary.md
│       ├── sticky-notes-status-summary.md
│       ├── test-data-creation-summary.md
│       ├── validation-completion-summary-251219.md
│       ├── phase-3.3-summary.md
│       ├── phase-3-architecture-update.md
│       └── phase-3-architecture-decisions.md
└── misc/
    ├── build-fixes-summary.md
    ├── typescript-errors-to-fix.md
    ├── upload-size-increase.md
    ├── schedule-execution-tracking.md
    └── morning-briefing-pdf.md
```

---

## Contributing to Documentation

When adding new documentation:

1. **Place in appropriate folder** - Use existing categories or create new ones if needed
2. **Update this README** - Add links to new documents
3. **Follow naming conventions** - Use kebab-case: `feature-name-guide.md`
4. **Include date** - Add "Last Updated" at the top of documents
5. **Cross-reference** - Link to related documents

---

## Need Help?

- **Issue Tracker:** [GitHub Issues](https://github.com/your-repo/issues)
- **Project Lead:** Check project-overview-pdr.md for contacts
- **Quick Start:** deployment/coolify-deployment.md

---

**Total Documentation Files:** 45 (excluding archived files)
**Last Cleanup:** 2026-01-01

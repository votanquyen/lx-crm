# Project Roadmap

**Lộc Xanh CRM - Development Phases & Future Plans**
**Last Updated**: January 15, 2026

---

## 📍 Current Status

### Phase Completion: 85%

| Phase       | Status         | Completion | Key Features                          |
| ----------- | -------------- | ---------- | ------------------------------------- |
| **Phase 1** | ✅ Complete    | 100%       | Test infrastructure, core models      |
| **Phase 2** | ✅ Complete    | 100%       | Business logic, analytics             |
| **Phase 3** | ✅ Done        | 85%        | Monthly statements (Bảng Kê)          |
| **Phase 4** | ✅ Complete    | 95%        | Operations module, Customer Map       |
| **Phase 5** | ✅ Complete    | 95%        | **Đổi Cây Module** - Exchange system  |
| **Phase 6** | 🚧 In Progress | 60%        | AI Predictions & SmartVAS             |
| **Phase 7** | 📋 Planned     | 0%         | Advanced Features (Portal, Mobile)    |
| **Phase 8** | 📋 Future      | 10%        | DDD Migration (Architecture refactor) |

### 🎉 Latest Achievement (2026-01-15): AI Predictions & SmartVAS

- **AI Predictions**: Implemented Churn Prediction and Exchange Prediction modules.
- **SmartVAS Integration**: Complete e-invoice flow with race condition protection.
- **Bảng Kê Advanced**: Confirmation workflow, rollovers, and locking mechanism.
- **DDD Experiment**: Customer module migrated as proof-of-concept.

---

## ✅ Phase 1: Foundation (Complete)

- **Database Schema**: Core models, PostGIS integration, trigram search.
- **Authentication**: NextAuth.js 5 with RBAC roles.
- **Test Infrastructure**: Vitest with 97%+ coverage.

## ✅ Phase 2: Core Business Logic (Complete)

- **Contracts & Invoicing**: Auto-calculation, PDF draft generation.
- **Scheduling**: GPS-enabled visits, route visualization.
- **Exchanges**: Priority-based scoring (0-100), inventory sync.

## ✅ Phase 3: Monthly Statements (Bảng Kê) ~85%

- ✅ Automated monthly generation (24th-23rd cycle).
- ✅ Rollover logic from previous months.
- ✅ Confirmation & Locking workflow.
- [ ] Customer portal viewing.
- [ ] Professional PDF/Excel export branding.

## ✅ Phase 4: Operations Module (Complete)

- **Care Scheduling**: GPS check-in/out, route optimization.
- **Customer Map**: Interactive Leaflet map with clustering.
- **Daily Schedules**: Stop ordering and briefing generation.

## ✅ Phase 5: Đổi Cây Module (Complete)

- **Exchange Requests**: Priority scoring (0-100 scale).
- **Inventory Sync**: Atomic plant quantity updates.
- **Map Visualization**: Priority markers and clustering.

## 🚧 Phase 6: AI Predictions & SmartVAS (In Progress)

- ✅ **Churn Prediction**: Risk levels (CRITICAL/HIGH/MEDIUM/LOW).
- ✅ **Exchange Prediction**: Plant lifecycle forecasting.
- ✅ **SmartVAS**: E-invoice production readiness.
- 🔄 **Performance**: Query caching with Redis (Planned).

## 📋 Phase 7: Advanced Features (Planned Q1-Q2 2026)

- **Customer Portal**: Self-service statement viewing and exchange requests.
- **Automated Notifications**: Email/Zalo integration for invoices and visits.
- **Mobile Staff App**: React Native companion for field operations.

## 📋 Phase 8: DDD Migration (Future - Architecture Refactor)

- **Purpose**: Refactor codebase to Domain-Driven Design for long-term maintainability.
- **Scope**: Migrate Server Actions to Use Cases/Domain entities.
- **Proof-of-Concept**: Customer module already migrated (src/domain, src/application, src/infrastructure).
- **Priority**: Low - only when codebase complexity demands it.

---

**Document Version**: 1.3
**Last Updated**: January 15, 2026
**Status**: Active Development
**Next Review**: After Phase 6 completion (Feb 2026)

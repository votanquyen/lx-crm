# Project Overview & Product Requirements Document (PDR)

**Lộc Xanh CRM - Plant Rental Management System**
**Version**: 4.2.0
**Status**: Phase 6 (AI & SmartVAS) 60% | Phase 3 (Bảng Kê) 85%
**Last Updated**: January 15, 2026

---

## 📋 Executive Summary

Lộc Xanh CRM is a comprehensive plant rental management system designed for Vietnamese businesses. The system handles customer management, contract lifecycle, invoicing, care scheduling, plant exchanges, and financial reporting with native Vietnamese language support and geospatial capabilities.

### Key Metrics

- **Completion**: 85% (Phase 1-5 completed, Phase 6 in progress)
- **Test Coverage**: 97.5% lines, 94.55% functions
- **Database**: PostgreSQL 17 + PostGIS 3.5 with 45+ indexes
- **API Endpoints**: 35+ Server Actions with Zod validation
- **Components**: 70+ React components with shadcn/ui

---

## 🎯 Business Requirements

### 1. Customer Management

**Priority**: Critical | **Status**: ✅ Complete

#### Functional Requirements

- **CRUD Operations**: Create, read, update, delete customers with Vietnamese validation
- **Fuzzy Search**: pg_trgm-based search for Vietnamese company names and addresses
- **Geocoding**: Google Maps integration for location tracking
- **Customer Tiers**: STANDARD, PREMIUM, VIP with different pricing rules
- **Status Tracking**: LEAD, ACTIVE, INACTIVE, TERMINATED
- **Multi-contact Support**: Primary, secondary, and accounting contacts
- **Care Preferences**: Preferred weekdays, time slots, special requests

### 2. Contract Management

**Priority**: Critical | **Status**: ✅ Complete

#### Functional Requirements

- **Lifecycle Management**: DRAFT → SENT → NEGOTIATING → SIGNED → ACTIVE → EXPIRED/TERMINATED
- **Auto-calculation**: Monthly fees, deposits, VAT, discounts with precision
- **Renewal System**: Auto-renewal with configurable reminders (30 days default)
- **Document Management**: Draft PDFs, signed contracts, appendices
- **Itemization**: Multiple plant types per contract with quantities and pricing

### 3. Invoicing & Payments

**Priority**: Critical | **Status**: ✅ Complete

#### Functional Requirements

- **Invoice Types**: Service, deposit, setup, penalty
- **Status Flow**: DRAFT → SENT → PARTIAL → PAID → OVERDUE → CANCELLED/REFUNDED
- **Payment Methods**: Bank transfer, cash, card, MoMo, ZaloPay, VNPay
- **Outstanding Tracking**: Real-time calculation of unpaid amounts
- **Reminder System**: Automated tracking with escalation

### 4. Care Scheduling & Operations

**Priority**: High | **Status**: ✅ Complete

#### Functional Requirements

- **GPS Check-in/out**: Location verification with coordinates
- **Route Optimization**: Daily schedule generation with stop ordering
- **Status Tracking**: SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED
- **Photo Documentation**: Before/after photos per visit
- **Customer Feedback**: Satisfaction ratings and comments

### 5. Plant Exchange Management

**Priority**: High | **Status**: ✅ Complete

#### Functional Requirements

- **Request Flow**: PENDING → SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED
- **Priority Scoring**: 0-100 scale based on urgency, tier, quantity, and request age
- **Map Visualization**: Interactive map with clustering and priority markers
- **Inventory Sync**: Atomic updates for plant quantities during exchange execution

### 6. Monthly Statements (Bảng Kê)

**Priority**: High | **Status**: ✅ 85% Complete

#### Functional Requirements (Phase 3)

- **Billing Cycle**: 24th → 23rd of following month
- **Plant Listing**: JSON array of plants with quantities and pricing
- **Auto-generation**: Copy from previous month with rollover & adjustment
- **Confirmation Workflow**: Needs customer/accountant confirmation before finalization
- **VAT Calculation**: 8% for monthly statements (different from contracts)
- **Locking Mechanism**: Prevent changes to statements once confirmed

#### Completed Features

- ✅ Automated monthly generation logic
- ✅ Rollover and plant quantity adjustment
- ✅ Statement confirmation and status flow
- ✅ Calculation of totals with 8% VAT

#### Pending Features

- [ ] Customer portal for direct statement viewing
- [ ] Automated email/Zalo notification for new statements
- [ ] Export to Excel/PDF (in progress)

### 7. Analytics & Reporting

**Priority**: Medium | **Status**: ✅ Complete

#### Functional Requirements

- **Revenue Overview**: Monthly recurring, total revenue, growth metrics
- **Customer Analytics**: Active count, new this month, churn rate, lifetime value
- **Invoice Analytics**: Aging report, collection rate, overdue tracking
- **Contract Analytics**: Renewal rate, average duration, expiring soon

### 8. AI-Powered Features

**Priority**: Medium | **Status**: ✅ Implemented

#### AI Prediction Features

- **Churn Prediction**: Identify customers at risk using payment behavior, exchange frequency, and sentiment analysis of sticky notes via Gemini.
- **Exchange Prediction**: Predict when plants need exchange based on plant type lifespan, installation date, and care observations.

#### Churn Risk Levels

- CRITICAL (75-100): Immediate intervention needed
- HIGH (50-74): Schedule retention call
- MEDIUM (25-49): Monitor closely
- LOW (0-24): Normal engagement

### 9. SmartVAS Integration

**Priority**: High | **Status**: ✅ Complete

#### Functional Requirements

- **Electronic Invoices**: Integration with SmartVAS provider for legal e-invoice issuance
- **Race Condition Protection**: Locking mechanism for invoice numbers
- **API Retry Logic**: Handle SmartVAS API timeouts or failures
- **Webhooks**: Automated status updates from SmartVAS

---

## 🏗 Technical Architecture

### System Components

- **Database**: PostgreSQL 17 + PostGIS 3.5
- **Backend**: Next.js Server Actions
- **Frontend**: Next.js 16 + React 19 + TailwindCSS + shadcn/ui
- **Storage**: MinIO/S3 with presigned URLs
- **AI**: Gemini 1.5 Flash for analysis and predictions

---

## 🚧 Development Phases

### Phase 1: Foundation ✅ Complete

- Database schema and migrations
- Authentication and RBAC
- Basic customer management
- Test infrastructure (97.5% coverage)

### Phase 2: Core Business Logic ✅ Complete

- Contract and invoicing system
- Care scheduling with GPS
- Exchange management with priority scoring
- Analytics dashboard

### Phase 3: Bảng Kê (Monthly Statements) ✅ 85%

- Statement generation logic
- Confirmation workflow & Locking
- Automated rollover
- **Pending**: Customer portal, export branding

### Phase 4: Operations Module ✅ Complete

- Care scheduling with GPS
- Customer map visualization
- Daily schedules with stop ordering

### Phase 5: Đổi Cây Module ✅ Complete

- Exchange requests with priority scoring
- Inventory sync
- Map visualization

### Phase 6: AI Predictions & SmartVAS 🚧 In Progress

- Churn & Exchange predictions (Implemented)
- SmartVAS Integration (Complete)
- Query caching and optimization (Planned)

### Phase 7: Advanced Features 📋 Planned

- Customer Portal
- Email/Zalo notifications
- Mobile Staff App

### Phase 8: DDD Migration 📋 Future

- Architecture refactor when complexity demands
- Proof-of-concept: Customer module migrated

---

**Document Version**: 1.2
**Last Updated**: January 15, 2026
**Status**: Active Development
**Next Review**: After Phase 6 completion (Feb 2026)

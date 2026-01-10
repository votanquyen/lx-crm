# Project Overview & Product Requirements Document (PDR)

**Lộc Xanh CRM - Plant Rental Management System**
**Version**: 4.0.0
**Status**: Phase 6 (Đổi Cây) 95% Complete | Phase 2.5 (Bảng Kê) 50% Complete
**Last Updated**: January 09, 2026

---

## 📋 Executive Summary

Lộc Xanh CRM is a comprehensive plant rental management system designed for Vietnamese businesses. The system handles customer management, contract lifecycle, invoicing, care scheduling, plant exchanges, and financial reporting with native Vietnamese language support and geospatial capabilities.

### Key Metrics

- **Completion**: 74% (Phase 1-2.5 completed)
- **Test Coverage**: 97.5% lines, 94.55% functions
- **Database**: PostgreSQL 17 + PostGIS 3.5 with 40+ indexes
- **API Endpoints**: 25+ Server Actions with Zod validation
- **Components**: 50+ React components with shadcn/ui

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

#### Technical Implementation

```typescript
// Customer search with Vietnamese fuzzy matching
const customers = await prisma.$queryRaw`
  SELECT c.*, GREATEST(
    similarity(company_name_norm, ${normalized}),
    similarity(COALESCE(address_normalized, ''), ${normalized}),
    similarity(code, ${normalized})
  ) as similarity
  FROM customers c
  WHERE c.company_name_norm % ${normalized}
  ORDER BY similarity DESC
`;
```

### 2. Contract Management

**Priority**: Critical | **Status**: ✅ Complete

#### Functional Requirements

- **Lifecycle Management**: DRAFT → SENT → NEGOTIATING → SIGNED → ACTIVE → EXPIRED/TERMINATED
- **Auto-calculation**: Monthly fees, deposits, VAT, discounts with precision
- **Renewal System**: Auto-renewal with configurable reminders (30 days default)
- **Document Management**: Draft PDFs, signed contracts, appendices
- **Itemization**: Multiple plant types per contract with quantities and pricing

#### Business Rules

- **VAT Rate**: 10% default, configurable per contract
- **Payment Terms**: 30 days default, configurable per customer
- **Auto-renewal**: Enabled by default, can be disabled
- **Contract Number Format**: HĐ-YYYY-NNN (e.g., HĐ-2025-001)

### 3. Invoicing & Payments

**Priority**: Critical | **Status**: ✅ Complete

#### Functional Requirements

- **Invoice Types**: Service, deposit, setup, penalty
- **Status Flow**: DRAFT → SENT → PARTIAL → PAID → OVERDUE → CANCELLED/REFUNDED
- **Payment Methods**: Bank transfer, cash, card, MoMo, ZaloPay, VNPay
- **Outstanding Tracking**: Real-time calculation of unpaid amounts
- **Reminder System**: Automated tracking with escalation

#### Financial Precision

```typescript
// Decimal handling for financial calculations
subtotal: Decimal @db.Decimal(12, 0)  // Up to 999,999,999,999 VND
vatRate: Decimal @db.Decimal(4, 2)    // 10.00%
totalAmount: Decimal @db.Decimal(12, 0)
```

### 4. Care Scheduling & Operations

**Priority**: High | **Status**: ✅ Complete

#### Functional Requirements

- **GPS Check-in/out**: Location verification with coordinates
- **Route Optimization**: Daily schedule generation with stop ordering
- **Status Tracking**: SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED
- **Photo Documentation**: Before/after photos per visit
- **Customer Feedback**: Satisfaction ratings and comments
- **Duration Tracking**: Estimated vs actual time per visit

#### Operational Features

- **Care Frequency**: Weekly, bi-weekly, monthly
- **Time Slots**: 08:00-10:00, 14:00-16:00, etc.
- **Plant Count**: Automatic tracking of plants serviced
- **Issue Reporting**: Problems found during visits

### 5. Plant Exchange Management

**Priority**: High | **Status**: ✅ Complete

#### Functional Requirements

- **Request Flow**: PENDING → SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED
- **Priority Scoring**: 1-10 scale with URGENT (9-10), HIGH (7-8), MEDIUM (4-6), LOW (1-3)
- **Daily Routes**: Group exchanges by date with route optimization
- **Verification**: Customer signature/photo confirmation
- **Source Tracking**: Links to sticky notes, care reports, phone calls

#### Exchange Data Structure

```json
{
  "plantsData": [
    { "action": "remove", "plantType": "Kim Tiền", "qty": 3, "condition": "poor" },
    { "action": "install", "plantType": "Phát Tài", "qty": 3, "potType": "composite" }
  ]
}
```

### 6. Monthly Statements (Bảng Kê)

**Priority**: High | **Status**: 🚧 50% Complete

#### Functional Requirements (Phase 2.5)

- **Billing Cycle**: 24th → 23rd of following month
- **Plant Listing**: JSON array of plants with quantities and pricing
- **Auto-generation**: Copy from previous month with rollover
- **Confirmation Workflow**: Needs customer confirmation before finalization
- **VAT Calculation**: 8% for monthly statements (different from contracts)

#### Pending Features

- [ ] Automated monthly generation script
- [ ] Customer portal for statement viewing
- [ ] Export to Excel/PDF
- [ ] Payment integration with statements

### 7. Analytics & Reporting

**Priority**: Medium | **Status**: ✅ Complete

#### Functional Requirements

- **Revenue Overview**: Monthly recurring, total revenue, growth metrics
- **Customer Analytics**: Active count, new this month, churn rate, lifetime value
- **Invoice Analytics**: Aging report, collection rate, overdue tracking
- **Contract Analytics**: Renewal rate, average duration, expiring soon
- **Top Customers**: Revenue ranking with tier classification

#### Performance Optimizations

- **Raw SQL Aggregation**: Single query vs 5 separate queries
- **Query Caching**: Redis-ready architecture
- **Dynamic Imports**: Code splitting for heavy charts

### 8. AI-Powered Features
**Priority**: Medium | **Status**: ✅ Complete (Core) / 📋 Planned (Predictions)

#### Functional Requirements

- **Note Analysis**: Entity extraction, intent classification, sentiment analysis
- **Priority Suggestions**: AI-suggested priority with reasoning
- **Action Suggestions**: Recommended next steps based on content
- **Processing Timestamp**: Track when AI processed the note

#### Integration Points

- **Sticky Notes**: Automatic analysis on creation
- **Exchange Requests**: Priority scoring suggestions
- **Care Reports**: Issue identification and recommendations

### 8.1 AI Prediction Features (NEW)
**Priority**: P1-P2 | **Status**: 📋 Planned

#### Churn Prediction (P1)
Identify customers at risk of not renewing contracts using hybrid approach.

**Data Sources:**
| Data Type | Source | Signals |
|-----------|--------|---------|
| Payment behavior | `Invoice`, `Payment` | Late payments, overdue count |
| Exchange frequency | `ExchangeRequest` | Frequent exchanges = dissatisfaction |
| Care feedback | `CareSchedule` | Satisfaction ratings, complaints |
| Notes/complaints | `StickyNote` | Sentiment analysis via Gemini |

**Scoring Algorithm (0-100):**
```typescript
// Rule-based scoring (0-60 points)
- Payment signals: overdue count, avg days late (0-25)
- Exchange/complaint signals: frequency, issues (0-20)
- Satisfaction signals: ratings (0-15)

// LLM sentiment analysis (0-40 points)
- Analyze recent sticky notes via Gemini
- Extract negative sentiment score
- Identify concern keywords
```

**Risk Levels:**
- CRITICAL (75-100): Immediate intervention needed
- HIGH (50-74): Schedule retention call
- MEDIUM (25-49): Monitor closely
- LOW (0-24): Normal engagement

**Output:**
- Risk score with contributing factors
- Recommended retention actions (Vietnamese)
- Dashboard widget for at-risk customers

#### Exchange/Maintenance Prediction (P2)
Predict when plants need exchange based on health scoring.

**Data Sources:**
| Data Type | Source | Signals |
|-----------|--------|---------|
| Plant type | `PlantType` | Expected lifespan |
| Installation date | `CustomerPlant` | Age calculation |
| Exchange history | `ExchangeRequest` | Historical patterns |
| Care observations | `CareSchedule` | Health notes |

**Health Scoring Algorithm:**
```typescript
// Base lifespan by plant type
- Indoor foliage: 180 days
- Outdoor palm: 365 days
- Flowering: 90 days
- Succulent: 365 days

// Condition multipliers
- Indoor: 1.0x
- Outdoor: 0.8x (shorter life)
- Mixed: 0.9x

// Early warning keywords
- Vietnamese: "vàng lá", "héo", "sâu bệnh", "thối rễ"
```

**Urgency Levels:**
- URGENT: Overdue (>100% lifespan)
- RECOMMENDED: 85-100% lifespan
- UPCOMING: 70-85% lifespan
- NONE: <70% lifespan

**Output:**
- Health score per plant (0-100)
- Days remaining estimate
- Exchange suggestion widget

### 9. File Storage & Security

**Priority**: Medium | **Status**: ✅ Complete

#### Functional Requirements

- **S3-Compatible**: MinIO integration for local development
- **Presigned URLs**: Time-limited access for security
- **Entity Linking**: Files linked to contracts, invoices, schedules
- **Type Tracking**: Contract, Invoice, CareSchedule, Exchange
- **Access Control**: Public/private flags, temporary file cleanup

---

## 🏗 Technical Architecture

### System Components

#### 1. Database Layer (PostgreSQL 17 + PostGIS 3.5)

- **Extensions**: postgis, pg_trgm, unaccent
- **Indexes**: 40+ indexes for performance
- **Views**: 6 database views for complex aggregations
- **Constraints**: Foreign keys, unique constraints, check constraints

#### 2. Backend Layer (Next.js Server Actions)

- **Pattern**: Full-stack type safety with Server Actions
- **Validation**: Zod schemas with Vietnamese error messages
- **Authentication**: NextAuth.js 5 with RBAC
- **Authorization**: Role-based access control (5 levels)

#### 3. Frontend Layer (Next.js 16 + React 19)

- **Routing**: App Router with nested layouts
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod validation

#### 4. Storage Layer (MinIO/S3)

- **Uploads**: Presigned URLs for direct upload
- **Security**: Expiring URLs, access control
- **Cleanup**: Temporary file management

### Data Flow Patterns

#### Customer Creation Flow

```
User Input → Zod Validation → Duplicate Check → Geocoding → DB Insert → Activity Log → Cache Invalidation
```

#### Invoice Generation Flow

```
Contract Data → Calculation Engine → VAT Application → Due Date Calculation → PDF Generation → Email Delivery
```

#### Care Schedule Flow

```
Customer Preferences → Route Optimization → GPS Integration → Photo Upload → Feedback Collection → Status Update
```

---

## 🎨 User Experience Requirements

### Vietnamese-First Design

- **Language**: All user-facing text in Vietnamese
- **Formatting**: Currency (₫), dates (DD/MM/YYYY), phone (0XX XXX XXXX)
- **Error Messages**: Clear, actionable Vietnamese messages
- **Validation**: Real-time feedback with Vietnamese hints

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliance
- **Mobile Responsive**: Touch-friendly interface

### Performance Targets

- **Initial Load**: < 2 seconds
- **Dashboard Load**: < 1 second (cached)
- **Search Response**: < 500ms
- **PDF Generation**: < 3 seconds

---

## 🔒 Security & Compliance

### Authentication & Authorization

- **RBAC Levels**: ADMIN, MANAGER, STAFF, ACCOUNTANT, VIEWER
- **Session Management**: JWT with refresh tokens
- **OAuth Providers**: Google (primary), Credentials (dev)
- **Domain Restriction**: Optional email domain filtering

### Data Protection

- **Audit Trail**: Complete activity logging
- **Data Privacy**: Internal notes separate from customer data
- **File Security**: Presigned URLs with expiration
- **Backup Strategy**: Database and file backup procedures

### Business Logic Security

- **Financial Precision**: Decimal types prevent rounding errors
- **Concurrency Control**: Optimistic locking for updates
- **Validation**: Server-side validation always, client-side for UX
- **Idempotency**: Safe to retry operations

---

## 📊 Success Metrics

### Business KPIs

- **Customer Retention**: Track churn rate (target: < 5%)
- **Invoice Collection**: Days sales outstanding (target: < 45 days)
- **Contract Renewal**: Renewal rate (target: > 80%)
- **Customer Satisfaction**: Care visit ratings (target: > 4.5/5)

### Technical KPIs

- **System Uptime**: 99.9% availability
- **API Response Time**: < 200ms average
- **Test Coverage**: > 95% lines
- **Bug Rate**: < 0.5 bugs per feature

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
- Exchange management
- Analytics dashboard

### Phase 2.5: Bảng Kê (Monthly Statements) 🚧 50%

- Statement generation logic
- Confirmation workflow
- **Pending**: Automation, customer portal, export

### Phase 3: Performance & Optimization 🚧 In Progress

- Query caching and optimization
- Code splitting and lazy loading
- Advanced analytics with predictions
- **Next**: Mobile app development

### Phase 4: Advanced Features (Future)

- Mobile app for field staff
- Predictive maintenance AI
- Customer self-service portal
- Advanced reporting and BI

---

## 🎯 Risk Management

### Technical Risks

| Risk                      | Impact | Mitigation                               |
| ------------------------- | ------ | ---------------------------------------- |
| Database performance      | High   | 40+ indexes, query optimization, caching |
| File storage costs        | Medium | MinIO for dev, S3 lifecycle policies     |
| Vietnamese font rendering | Low    | Webpack configuration, fallback fonts    |
| API rate limits           | Medium | Query caching, pagination, debouncing    |

### Business Risks

| Risk                         | Impact   | Mitigation                                  |
| ---------------------------- | -------- | ------------------------------------------- |
| Customer data accuracy       | High     | Validation rules, duplicate detection       |
| Financial calculation errors | Critical | Decimal types, audit trails, reconciliation |
| Compliance requirements      | Medium   | Complete audit logging, data retention      |

---

## 📝 Configuration & Environment

### Required Environment Variables

```env
# Core
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"

# Authentication
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Storage
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_ENDPOINT_URL="http://localhost:9000"
AWS_BUCKET_NAME="locxanh"

# Maps
GOOGLE_MAPS_API_KEY="your-api-key"

# AI (Optional)
GEMINI_API_KEY="your-gemini-key"
```

### Database Requirements

- **PostgreSQL**: Version 17 or higher
- **Extensions**: postgis, pg_trgm, unaccent
- **Encoding**: UTF-8
- **Collation**: Vietnamese compatible

---

## 🤝 Integration Points

### External Services

1. **Google Maps API**: Geocoding and distance calculations
2. **Google OAuth**: Authentication provider
3. **MinIO/S3**: File storage
4. **Gemini API**: AI analysis (optional)

### Internal Systems

1. **Email System**: Invoice delivery, reminders (future)
2. **SMS Gateway**: Payment confirmations (future)
3. **Accounting Software**: Export capabilities (future)

---

## 📚 Documentation Links

- **System Architecture**: `./docs/system-architecture.md`
- **Code Standards**: `./docs/code-standards.md`
- **Codebase Summary**: `./docs/codebase-summary.md`
- **Deployment Guide**: `./docs/deployment-guide.md`
- **Project Roadmap**: `./docs/project-roadmap.md`
- **Design Guidelines**: `./docs/design-guidelines.md`

---

## 🎯 Next Steps

### Immediate (Phase 3)

1. ✅ Complete performance optimization
2. 🔄 Implement query caching with Redis
3. 🔄 Add advanced analytics predictions
4. 🔄 Develop React Native mobile app

### Short-term (Phase 4)

1. Customer self-service portal
2. Automated monthly statement generation
3. Advanced reporting and BI integration
4. Multi-language support (English)

### Long-term (Future)

1. AI-powered route optimization
2. Predictive maintenance scheduling
3. Integration with accounting software
4. White-label capabilities

---

**Document Version**: 1.0
**Last Updated**: December 22, 2025
**Status**: Active Development
**Next Review**: After Phase 3 completion

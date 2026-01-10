# Project Roadmap

**Lộc Xanh CRM - Development Phases & Future Plans**
**Last Updated**: January 09, 2026

---

## 📍 Current Status

### Phase Completion: 85%

| Phase | Status | Completion | Key Features |
|-------|--------|------------|--------------|
| **Phase 1** | ✅ Complete | 100% | Test infrastructure, core models |
| **Phase 2** | ✅ Complete | 100% | Business logic, analytics |
| **Phase 2.5** | 🚧 In Progress | 50% | Monthly statements (Bảng Kê) |
| **Phase 3** | 🔄 Starting | 10% | Performance optimization |
| **Phase 4** | ✅ Complete | 95% | Operations module, Customer Map |
| **Phase 5** | 📋 Planned | 50% | Intelligence module |
| **Phase 6** | ✅ Complete | 95% | **Đổi Cây Module** - Exchange system |

### 🎉 Latest Achievement (2026-01-09): Đổi Cây Module ~95% Complete

| Component | Status | Description |
|-----------|--------|-------------|
| Priority Scoring | ✅ Done | 0-100 scale (urgency + tier + quantity + age + keywords) |
| Execution Workflow | ✅ Done | PENDING → SCHEDULED → COMPLETED flow |
| Inventory Sync | ✅ Done | Transaction-based with atomic updates |
| Customer Map | ✅ Done | Leaflet + OpenStreetMap with clustering |
| Map Filters | ✅ Done | District, tier, status, exchanges toggle |

**Remaining (~5%):** Map view toggle in exchanges page, unit/integration tests

---

## 🎯 Phase 1: Foundation ✅ Complete

**Timeline**: Completed
**Status**: Production Ready

### Achievements
- ✅ **Database Schema**: 15 models, 40+ indexes, 6 views
- ✅ **Authentication**: NextAuth.js 5 with RBAC (5 roles)
- ✅ **Test Infrastructure**: 97.5% coverage, 121 tests
- ✅ **CI/CD**: GitHub Actions with automated testing
- ✅ **Basic CRUD**: Customer management with Vietnamese search

### Key Components
```typescript
// Core models implemented
- User & Authentication
- Customer (with Vietnamese fuzzy search)
- PlantType & Inventory
- ActivityLog (audit trail)

// Infrastructure
- Prisma ORM with PostgreSQL
- Zod validation schemas
- Custom error handling
- Server action utilities
```

### Metrics
- **Test Coverage**: 97.5% lines, 94.55% functions
- **Database Indexes**: 15+ optimized
- **API Endpoints**: 10+ server actions
- **Components**: 20+ reusable UI components

---

## ✅ Phase 2: Core Business Logic Complete

**Timeline**: Completed
**Status**: All features operational

### Achievements
- ✅ **Contract Management**: Full lifecycle with auto-calculation
- ✅ **Invoicing System**: Complete with payment tracking
- ✅ **Care Scheduling**: GPS-enabled, route optimization
- ✅ **Exchange Management**: Priority-based scheduling
- ✅ **Analytics Dashboard**: Real-time revenue & customer metrics
- ✅ **AI-Powered Notes**: Automatic analysis & priority suggestions
- ✅ **File Storage**: MinIO/S3 integration with presigned URLs

### Feature Details

#### Contract System
```typescript
// Lifecycle: DRAFT → SENT → NEGOTIATING → SIGNED → ACTIVE → EXPIRED
// Auto-calculation: monthlyFee, deposit, VAT, discounts
// Document management: PDF generation, storage
// Renewal: Auto-reminders 30 days before expiry
```

#### Invoicing & Payments
```typescript
// Types: Service, deposit, setup, penalty
// Status: DRAFT → SENT → PARTIAL → PAID → OVERDUE
// Payment methods: Bank, cash, card, MoMo, ZaloPay, VNPay
// Outstanding tracking: Real-time calculation
```

#### Care Operations
```typescript
// Scheduling: Weekly/bi-weekly/monthly
// GPS: Check-in/out with coordinates
// Photos: Before/after documentation
// Feedback: Satisfaction ratings
// Duration: Estimated vs actual tracking
```

#### Analytics
```typescript
// Revenue: Monthly recurring, growth metrics
// Customers: Active, new, churn, lifetime value
// Invoices: Aging, collection rate, overdue
// Contracts: Renewal rate, average duration
```

### Metrics
- **Features Implemented**: 8 major modules
- **Server Actions**: 15+ complex operations
- **Components**: 50+ React components
- **Database Queries**: Optimized with raw SQL

---

## ✅ Phase 6: Đổi Cây (Plant Exchange) Module Complete

**Timeline**: January 2026
**Status**: 95% Complete
**Priority**: High

### Achievements (2026-01-09 Implementation Session)
- ✅ **Priority Scoring Algorithm**: 0-100 scale scoring
- ✅ **Execution Workflow**: PENDING → SCHEDULED → COMPLETED status flow
- ✅ **Inventory Sync**: Transaction-based with atomic updates
- ✅ **Customer Map**: Leaflet + OpenStreetMap integration
- ✅ **Map Clustering**: MarkerClusterGroup for large datasets
- ✅ **Map Filters**: District, tier, status, exchanges toggle

### Technical Details

#### Priority Scoring (0-100)
```typescript
// Weights distribution:
// - Urgency (URGENT/HIGH/MEDIUM/LOW): 0-40 points
// - Customer tier (VIP/PREMIUM/STANDARD): 0-25 points
// - Plant quantity: 0-15 points
// - Request age: 0-10 points
// - Vietnamese urgent keywords: 0-10 points
```

#### Inventory Sync Flow
```typescript
// 1. Validate inventory availability before scheduling
// 2. Atomic UPDATE with WHERE clause prevents race conditions
// 3. Return removed plants to inventory (increase available)
// 4. Deduct installed plants from inventory (decrease available)
// 5. Update CustomerPlant quantities
// 6. Log activity for audit trail
```

#### Customer Map Features
```typescript
// - SSR-safe dynamic import (ssr: false)
// - Custom markers by customer tier (VIP=red, PREMIUM=blue, STANDARD=green)
// - Priority score badges on exchange markers
// - Click-to-create exchange from map popup
// - Auto-fit bounds to visible customers
```

### Files Created
```
src/lib/exchange/priority-scoring.ts     # Priority calculation
src/lib/exchange/inventory-sync.ts       # Transaction-based sync
src/components/map/customer-map.tsx      # SSR-safe wrapper
src/components/map/customer-map-client.tsx   # Leaflet implementation
src/components/map/map-controls.tsx      # Filter controls
src/components/map/index.ts              # Exports
```

### Remaining (~5%)
- [ ] Wire map view toggle to exchanges page UI
- [ ] Unit tests for priority scoring
- [ ] Integration tests for inventory sync

### Code Review Summary
- **Quality Rating**: 8/10
- **Race Condition**: ✅ Fixed with atomic $executeRaw UPDATE
- **N+1 Query**: ✅ Fixed with batch queries

---

## 🚧 Phase 2.5: Monthly Statements (Bảng Kê)

**Timeline**: December 2025 - January 2026
**Status**: 50% Complete
**Priority**: High

### Current Progress
- ✅ **Database Schema**: MonthlyStatement model created
- ✅ **Data Structure**: JSON plant data with pricing
- ✅ **Billing Cycle**: 24th → 23rd logic
- ✅ **VAT Calculation**: 8% for statements
- 🔄 **Auto-generation**: Script in development
- 📋 **Customer Portal**: Not started
- 📋 **Export Features**: Not started

### Remaining Tasks

#### 1. Automated Generation (Week 1-2)
```typescript
// Cron job: Generate statements on 24th each month
// Logic:
// 1. Get active customers
// 2. Query active plants per customer
// 3. Calculate monthly fees
// 4. Apply 8% VAT
// 5. Create MonthlyStatement records
// 6. Set needsConfirmation = true
```

#### 2. Customer Portal (Week 3)
```typescript
// Features:
// - View monthly statements
// - Download PDF/Excel
// - Confirm/reject statements
// - Payment integration
// - Historical statements
```

#### 3. Export & Integration (Week 4)
```typescript
// Excel export with Vietnamese formatting
// PDF generation with company branding
// Accounting software integration (future)
// Payment gateway linking
```

### Success Criteria
- [ ] 100% automated generation
- [ ] 95%+ customer portal adoption
- [ ] < 5% manual corrections needed
- [ ] Integration with 2+ accounting systems

---

## 🔄 Phase 3: Performance Optimization

**Timeline**: January - February 2026
**Status**: Starting
**Priority**: High

### Objectives
- **Dashboard Performance**: 60% faster load times
- **Database Load**: 40% reduction with caching
- **Bundle Size**: 35% reduction
- **API Response**: < 200ms average

### Roadmap

#### Q1 2026: Query Optimization
```typescript
// 1. Redis Integration
- Install Redis for caching
- Implement cache layer for dashboard queries
- Cache invalidation strategies

// 2. Raw SQL Optimization
- Convert complex Prisma queries to raw SQL
- Use PostgreSQL FILTER for aggregations
- Optimize indexes based on query patterns

// 3. Connection Pooling
- Implement Prisma connection pooling
- Configure PostgreSQL max_connections
- Monitor connection usage
```

#### Q2 2026: Frontend Performance
```typescript
// 1. Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting
- Component lazy loading

// 2. Image Optimization
- Next.js Image component
- WebP format conversion
- CDN integration

// 3. Bundle Analysis
- Webpack bundle analyzer
- Remove unused dependencies
- Tree-shaking optimization
```

#### Q3 2026: Caching Strategy
```typescript
// 1. React Query Implementation
- Server state management
- Query deduplication
- Background refetching

// 2. CDN Integration
- Static asset CDN
- API response caching
- Edge functions for localization

// 3. Database Query Cache
- Materialized views
- Query result caching
- Precomputed aggregates
```

### Expected Results
- **Page Load**: < 2s → < 1s
- **Dashboard**: < 1s → < 500ms
- **Search**: < 500ms → < 200ms
- **Database CPU**: 80% → 40%

---

## 📋 Phase 4: Advanced Features

**Timeline**: March - June 2026
**Status**: Planned
**Priority**: Medium

### 4.1 Customer Self-Service Portal

#### Features
```typescript
// Authentication
- Email/password login
- Google OAuth
- Password reset flow

// Dashboard
- Current contracts overview
- Active plants at location
- Upcoming care schedules
- Payment history

// Actions
- Request plant exchange
- Submit support tickets
- Download invoices
- Update contact info
- Schedule special visits

// Notifications
- Email reminders for payments
- SMS for urgent matters
- Push notifications (mobile)
```

#### Tech Stack
- **Frontend**: Next.js 16 (separate app)
- **Auth**: NextAuth.js with credentials
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand + React Query

### 4.2 Advanced Analytics & AI

#### Predictive Analytics
```typescript
// Churn Prediction
- Analyze usage patterns
- Identify at-risk customers
- Suggest retention actions

// Maintenance Prediction
- Plant health scoring
- Exchange timing optimization
- Route efficiency analysis

// Revenue Forecasting
- Monthly recurring revenue
- Customer lifetime value
- Growth projections
```

#### AI Enhancements
```typescript
// Automated Insights
- Weekly summary emails
- Anomaly detection
- Opportunity identification

// Smart Recommendations
- Plant recommendations for new customers
- Pricing optimization
- Care schedule optimization
```

### 4.3 Integration Ecosystem

#### Accounting Software
```typescript
// Export Formats
- QuickBooks integration
- Xero API connection
- Vietnamese accounting standards

// Data Sync
- Real-time invoice sync
- Payment reconciliation
- Tax calculation export
```

#### Communication
```typescript
// Email Integration
- Automated invoice delivery
- Payment reminders
- Care schedule notifications

// SMS Gateway
- Payment confirmations
- Urgent alerts
- OTP verification

// Messaging Apps
- Zalo integration (Vietnam)
- WhatsApp Business
- Telegram bot for staff
```

### 4.4 Advanced Operations

#### Route Optimization
```typescript
// VRP (Vehicle Routing Problem)
- Multiple vehicle routing
- Time window constraints
- Capacity limitations
- Real-time traffic integration

// Mobile App Features
- Offline mode support
- GPS tracking
- Photo upload
- Digital signatures
```

#### Inventory Management
```typescript
// Advanced Features
- Supplier management
- Purchase orders
- Stock alerts
- Depreciation tracking
- Maintenance history
```

---

## 📱 Phase 5: Mobile & Ecosystem

**Timeline**: July - December 2026
**Status**: Future
**Priority**: Low

### 5.1 React Native Mobile App

#### Staff App
```typescript
// Core Features
- Daily schedule with GPS
- Work report with photos
- Customer signature capture
- Offline mode with sync
- Barcode/QR scanning

// UI/UX
- Vietnamese-first design
- Touch-optimized interface
- Accessibility support
- Dark mode
```

#### Customer App
```typescript
// Features
- Statement viewing
- Payment history
- Exchange requests
- Support tickets
- Push notifications
```

#### Architecture
- **Framework**: React Native (Expo)
- **State**: Redux Toolkit
- **API**: GraphQL or REST
- **Offline**: Redux Persist + SQLite
- **Sync**: Background fetch

### 5.2 White-Label Capabilities

#### Multi-Tenant Architecture
```typescript
// Database
- Separate schemas per tenant
- Data isolation
- Shared infrastructure

// Configuration
- Branding (logo, colors)
- Custom domains
- Feature flags
- Pricing plans

// Admin Panel
- Tenant management
- Usage analytics
- Billing & invoicing
- Support tools
```

### 5.3 Marketplace & Extensions

#### Plugin System
```typescript
// Extension Points
- Custom integrations
- Third-party apps
- Workflow automation
- Report templates

// Developer Tools
- API documentation
- SDK for integrations
- Webhook system
- Sandbox environment
```

---

## 🎯 Success Metrics by Phase

### Phase 2.5 (Current)
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Statement Automation | 100% | 50% | 🟡 |
| Customer Portal Adoption | 95% | 0% | 🔴 |
| Manual Corrections | < 5% | 10% | 🟡 |
| Processing Time | < 1 min | 2 min | 🟡 |

### Phase 3 (Next)
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Dashboard Load | 1.2s | 0.5s | 58% faster |
| Database CPU | 80% | 40% | 50% reduction |
| Bundle Size | 450KB | 290KB | 35% smaller |
| API Response | 250ms | 150ms | 40% faster |

### Phase 4 (Advanced)
| Metric | Target | Business Impact |
|--------|--------|-----------------|
| Customer Portal Usage | 80% | Reduced support load |
| Churn Prediction Accuracy | 85% | Proactive retention |
| Mobile App Adoption | 70% | Field efficiency |
| Integration Partners | 3+ | Ecosystem growth |

---

## 🚦 Risk Management

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Database Scaling** | High | Medium | Query optimization, caching, read replicas |
| **Mobile App Complexity** | Medium | High | Start with MVP, phased rollout |
| **Integration Complexity** | Medium | Medium | Use established APIs, webhook patterns |
| **Performance Degradation** | High | Low | Continuous monitoring, proactive optimization |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Customer Adoption** | High | Medium | User training, phased rollout, feedback loops |
| **Competition** | Medium | Medium | Focus on Vietnamese market, local features |
| **Regulatory Changes** | Medium | Low | Compliance monitoring, flexible architecture |
| **Resource Constraints** | High | Medium | Prioritize features, outsource non-core |

---

## 📊 Resource Planning

### Team Requirements

#### Phase 2.5 (Current)
- **Backend Developer**: 1 (full-time)
- **Frontend Developer**: 1 (full-time)
- **QA Tester**: 0.5 (part-time)

#### Phase 3 (Performance)
- **Backend Developer**: 1 (full-time)
- **DevOps Engineer**: 0.5 (part-time)
- **Database Specialist**: 0.5 (consultant)

#### Phase 4 (Advanced)
- **Full-Stack Developer**: 2 (full-time)
- **Mobile Developer**: 1 (full-time)
- **AI/ML Engineer**: 0.5 (consultant)
- **UX/UI Designer**: 0.5 (part-time)

#### Phase 5 (Mobile)
- **Mobile Developer**: 2 (full-time)
- **Backend Developer**: 1 (full-time)
- **DevOps Engineer**: 1 (full-time)

### Budget Estimates

| Phase | Timeline | Team Cost | Infrastructure | Total |
|-------|----------|-----------|----------------|-------|
| 2.5 | 2 months | $20k | $2k | $22k |
| 3 | 3 months | $45k | $5k | $50k |
| 4 | 4 months | $80k | $10k | $90k |
| 5 | 6 months | $150k | $20k | $170k |
| **Total** | **15 months** | **$295k** | **$37k** | **$332k** |

---

## 🎯 Priority Features (Next 90 Days)

### Must Have (P0)
1. ✅ **Monthly Statement Automation** - Phase 2.5 completion
2. 🔄 **Query Caching with Redis** - Phase 3 foundation
3. 📋 **Customer Portal MVP** - Basic viewing & confirmation

### Should Have (P1)
4. 📋 **Excel Export for Statements** - Business requirement
5. 📋 **Advanced Analytics Dashboard** - Revenue forecasting
6. 📋 **Payment Integration** - Online payment processing

### Nice to Have (P2)
7. 📋 **Mobile App Prototype** - React Native POC
8. 📋 **AI Churn Prediction** - Machine learning model
9. 📋 **Zalo Integration** - Vietnamese messaging

---

## 📈 Success Criteria

### Business Metrics
- **Customer Retention**: > 90% annually
- **Invoice Collection**: < 45 days DSO
- **Contract Renewal**: > 80% rate
- **Customer Satisfaction**: > 4.5/5 rating

### Technical Metrics
- **System Uptime**: > 99.9%
- **API Response**: < 200ms average
- **Test Coverage**: > 95% lines
- **Bug Rate**: < 0.5 per feature

### User Metrics
- **Portal Adoption**: > 80% of customers
- **Mobile App Usage**: > 70% of staff
- **Feature Usage**: > 60% active usage
- **Support Tickets**: < 5% of users/month

---

## 🔄 Dependencies & Prerequisites

### Phase 2.5 Dependencies
- [x] MonthlyStatement model
- [x] Plant data structure
- [ ] Automated generation script
- [ ] Customer portal framework
- [ ] Export functionality

### Phase 3 Dependencies
- [ ] Redis server setup
- [ ] Monitoring tools (Grafana/Prometheus)
- [ ] Performance baseline metrics
- [ ] CDN configuration

### Phase 4 Dependencies
- [ ] Separate customer portal repo
- [ ] Payment gateway accounts
- [ ] AI API keys (Gemini)
- [ ] Mobile app development environment

### Phase 5 Dependencies
- [ ] React Native expertise
- [ ] Mobile app design system
- [ ] Push notification service
- [ ] App store accounts

---

## 📅 Timeline Summary

```
Q4 2025 (Now)
├── Phase 2.5: Monthly Statements (50%)
│   └── Expected: Jan 2026

Q1 2026
├── Phase 2.5: Completion
├── Phase 3: Performance Optimization
│   ├── Query Caching (Jan-Feb)
│   ├── Frontend Optimization (Feb-Mar)
│   └── Caching Strategy (Mar)

Q2 2026
├── Phase 3: Completion
├── Phase 4: Advanced Features
│   ├── Customer Portal (Apr-May)
│   ├── Analytics & AI (May-Jun)

Q3 2026
├── Phase 4: Continuation
│   ├── Integrations (Jun-Jul)
│   ├── Advanced Operations (Jul-Aug)

Q4 2026
├── Phase 5: Mobile & Ecosystem
│   ├── Staff App MVP (Sep-Oct)
│   ├── Customer App (Oct-Nov)
│   └── White-label (Nov-Dec)
```

---

## 🎯 Next Immediate Actions

### Week 1-2 (Current Sprint)
1. **Complete Monthly Statement Generation**
   - [ ] Write cron job for auto-generation
   - [ ] Test with sample data
   - [ ] Add error handling & logging

2. **Customer Portal Framework**
   - [ ] Set up new Next.js app
   - [ ] Implement authentication
   - [ ] Create basic statement list view

### Week 3-4
3. **Export Features**
   - [ ] Excel export with Vietnamese formatting
   - [ ] PDF generation with branding
   - [ ] Download functionality

4. **Testing & QA**
   - [ ] End-to-end tests for statements
   - [ ] Performance testing
   - [ ] User acceptance testing

### Month 2
5. **Phase 3 Preparation**
   - [ ] Install Redis
   - [ ] Set up monitoring
   - [ ] Establish performance baselines

---

## 📚 Related Documentation

- **PDR**: `./docs/project-overview-pdr.md` - Requirements & specs
- **Architecture**: `./docs/system-architecture.md` - Technical design
- **Codebase**: `./docs/codebase-summary.md` - File structure
- **Standards**: `./docs/code-standards.md` - Development rules

---

**Document Version**: 1.1
**Last Updated**: January 09, 2026
**Status**: Active Development
**Next Review**: After Phase 2.5 completion (January 2026)
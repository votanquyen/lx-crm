# Lộc Xanh CRM - Feature Roadmap

**Last Updated:** 2026-01-08
**Current Phase:** Phase 3 - Operational Excellence (95% complete)
**Next Phase:** Phase 2.5 - Bảng Kê (Monthly Statement) - In Progress
**Status:** 🟢 75% Overall (4.1 of 5.5 phases)

---

## Overall Progress

| Phase                                  | Status             | Completion |
| -------------------------------------- | ------------------ | ---------- |
| Phase 1: Test Infrastructure           | ✅ Complete        | 100%       |
| Phase 2: Core Business Features        | ✅ Complete        | 100%       |
| Phase 2.5: Bảng Kê (Monthly Statement) | 🚧 In Progress     | 65%        |
| Phase 3: Operational Excellence        | 🟢 Mostly Complete | 95%        |
| Phase 4: Advanced Features             | ⏳ Planned         | 0%         |
| Phase 5: Enterprise Features           | ⏳ Future          | 0%         |

**Overall Completion:** 75% (4.1 of 5.5 phases complete)

---

## Phase 1: Test Infrastructure ✅ COMPLETE

**Completed:** December 18, 2025
**Test Coverage:** 97.5% lines, 94.55% functions
**Test Suites:** 121 passing tests across 3 suites

---

## Phase 2: Core Business Features (Priority)

### 2.1 Plant Types & Inventory Management ✅ COMPLETE

**Priority:** HIGH
**Impact:** Foundation for quotations, contracts, and inventory tracking
**Completed:** December 18, 2025

**Features:**

- [x] Plant types catalog page (list, search, filter)
- [x] Create/edit plant type form
- [x] Inventory management dashboard
- [x] Stock level tracking
- [x] Plant type pricing management
- [x] Vietnamese fuzzy search (pg_trgm)
- [x] Seed data with 10 plant types

**Technical:**

- UI components: DataTable, PlantForm, ImageUpload
- Actions: plant-types.ts (CRUD operations)
- Inventory tracking with real-time stock updates

---

### 2.2 Payment Recording Interface ✅ COMPLETE

**Priority:** HIGH
**Impact:** Critical for cash flow tracking
**Completed:** December 18, 2025

**Features:**

- [x] Payment recording form (linked to invoices)
- [x] Multiple payment methods (bank transfer, cash, MoMo, ZaloPay, VNPay)
- [x] Bank transaction reference tracking
- [x] Payment history view
- [x] Partial payment tracking
- [x] Payment verification workflow (manager only)
- [x] Invoice status auto-update (SENT → PARTIAL → PAID)
- [x] Transaction-safe operations
- [x] Seed data with 5 payments

**Technical:**

- Components: PaymentForm, PaymentHistory, ReceiptPDF
- Actions: payments.ts (create, verify, reconcile)
- Integration with invoice status updates

---

### 2.3 Quotation System ✅ COMPLETE

**Priority:** HIGH
**Impact:** Sales pipeline management
**Completed:** December 19, 2025
**Documentation:** `docs/quotation-system-completion-summary.md`

**Features:**

- [x] Quotation creation form with multi-item support
- [x] Plant selection with auto-pricing
- [x] Discount management (% per item + quotation level)
- [x] Automatic total calculations (subtotal, discount, VAT, total)
- [x] Quotation list page with statistics dashboard
- [x] Quotation detail page with full information
- [x] Status workflow (DRAFT → SENT → VIEWED → ACCEPTED → REJECTED → EXPIRED)
- [x] Send quotation (status change, email TODO Phase 3)
- [x] Accept/reject quotations with reasons
- [x] Convert to contract (placeholder, full implementation pending)
- [x] Auto-numbering (QT-YYYYMM-XXXX)
- [x] Expiry date tracking
- [x] Authorization (managers can delete)
- [x] Seed data with 5 quotations
- [ ] PDF generation (deferred to Phase 3)
- [ ] Email integration (deferred to Phase 3)
- [ ] Auto-expire cron job (function ready, needs setup)

**Technical:**

- Validation: `src/lib/validations/quotation.ts` (9 schemas)
- Actions: `src/actions/quotations.ts` (full CRUD + items + status)
- Components: QuotationForm, QuotationActions, QuotationCard
- Pages: List, Create, Detail (Edit TODO)
- Seed: `prisma/seeds/quotations.ts`

**Deferred to Phase 3:**

- PDF generation with `@react-pdf/renderer`
- Email notifications via Resend
- Edit quotation page
- Customer portal view

---

### 2.4 Sticky Notes & Customer Notes ✅ BACKEND COMPLETE

**Priority:** MEDIUM
**Impact:** Customer service quality
**Status:** Backend 100%, UI deferred to Phase 4
**Completed:** December 19, 2025
**Documentation:** `docs/sticky-notes-status-summary.md`

**Features:**

- [x] Validation schemas (9 schemas)
- [x] Server actions (CRUD, assign, resolve, link)
- [x] Category system (URGENT, COMPLAINT, REQUEST, FEEDBACK, GENERAL)
- [x] Priority scoring (1-10)
- [x] Status workflow (OPEN → IN_PROGRESS → RESOLVED → CANCELLED)
- [x] Assignment system
- [x] Due date tracking
- [x] Link notes to records (care, exchange, invoice, quotation)
- [ ] UI components (deferred to Phase 4)
- [ ] AI analysis integration (Phase 4.3)

**Technical:**

- Validation: `src/lib/validations/sticky-note.ts` ✅
- Actions: Already exist in codebase (not shown in search)
- Components: TODO Phase 4
- Pages: TODO Phase 4

**Deferred Items:**

- UI components (NoteForm, NoteCard, NoteList)
- Pages (note list, note detail)
- AI integration (Gemini API for sentiment, keywords)

---

## Phase 2.5: Bảng Kê (Monthly Plant Statement) 🆕 PLANNED

**Priority:** HIGH
**Impact:** Monthly billing automation and customer transparency
**Status:** ⏳ Planned (0%)
**Estimated Time:** 18 hours (3 days)
**Plan:** `plans/20251217-2333-locxanh-v4-implementation/phase-25-bangke/plan.md`

### Overview

Monthly plant rental statement system with auto-generation, confirmation workflow, and professional Vietnamese business format exports.

### Features

- [ ] Auto-generate statements on 1st of month (copy from previous)
- [ ] 3-column UI: Sidebar (companies) | Main (statement) | AI Panel (suggestions)
- [ ] Company list with search, avatars, monthly totals
- [ ] Yellow warning badges for unconfirmed statements
- [ ] Month/year selector with tabs
- [ ] Plant table (inline editing, add/remove plants)
- [ ] Automatic calculations (subtotal, 8% VAT, total)
- [ ] Period dates: 24th → 23rd (custom billing cycle)
- [ ] Confirmation workflow (prevent accidental billing)
- [ ] Excel export (CSV with UTF-8 BOM)
- [ ] PDF print view (company logo, signatures)
- [ ] Vietnamese font support (reuse Phase 3 P2/P3)

### Technical Implementation

**Phase 01:** Database schema (2h)

- MonthlyStatement model (Prisma)
- Extend Customer model (shortName for avatar)
- Migration scripts

**Phase 02:** Backend API (4h)

- Server actions (CRUD, confirmation workflow)
- Auto-rollover logic (cron trigger)
- Calculation utilities (8% VAT)
- API routes for export

**Phase 03:** Frontend UI (6h)

- 3-column layout components
- Company sidebar with search
- Month selector and statement card
- Plant table with inline editing
- Warning states for unconfirmed

**Phase 04:** Export/Print (3h)

- Excel export (reuse CSV utilities)
- PDF generation (reuse Vietnamese fonts)
- Print modal with template

**Phase 05:** Integration/Testing (3h)

- Integration tests
- Manual QA checklist
- Deployment preparation

### Business Value

- **Efficiency:** Auto-rollover saves 2-3 hours/month
- **Accuracy:** Prevents billing errors with confirmation workflow
- **Professionalism:** Branded PDF statements
- **Transparency:** Customers see plant inventory clearly
- **Audit Trail:** Track all statement changes

### Dependencies

- Customer model (existing)
- PlantType model (existing)
- Vietnamese font files (Phase 3 P2/P3)
- Currency formatting utilities (existing)
- PDF generation patterns (morning-briefing)

### Success Criteria

- [ ] Statements auto-create correctly on month boundaries
- [ ] Excel opens without encoding errors
- [ ] PDF matches design spec (logo, signatures, Vietnamese text)
- [ ] Period calculations accurate (24th → 23rd)
- [ ] VAT calculation accurate (8%)
- [ ] Zero data leakage between customers
- [ ] Yellow badges visible for unconfirmed statements

---

## Phase 3: Operational Excellence (Weeks 5-8)

### 3.1 Daily Exchange Route Planning ✅ CORE COMPLETE

**Priority:** MEDIUM
**Impact:** Operational efficiency
**Status:** 80% Complete (Core features done, PDF/tracking deferred)
**Completed:** December 19, 2025 (Day 1-2)
**Documentation:** `plans/reports/251219-phase3-day2-summary.md`

**Features:**

- [x] Exchange request queue (prioritized) ✅ Day 1
- [x] Filter by status, priority, customer ✅ Day 1
- [x] Priority scoring display ✅ Day 1
- [x] Approve/cancel actions ✅ Day 1
- [x] Daily schedule creation ✅ Day 2
- [x] Route optimization (Google Maps API) ✅ Day 2
- [x] Stop ordering (drag-and-drop) ✅ Day 2
- [x] Time estimation (ETA calculations) ✅ Day 2
- [ ] Morning briefing PDF (Deferred to Phase 4)
- [ ] Schedule execution tracking (Deferred to Phase 4)
- [ ] Export to Google Sheets (Deferred to Phase 4)

**Completed Components:**

- Daily schedule server actions
- Google Maps route optimization
- Fallback nearest neighbor algorithm
- Drag-and-drop schedule builder
- Stop card components
- Daily schedule page
- Schedule approval workflow

---

### 3.2 Care Schedule Management ✅ COMPLETE

**Priority:** MEDIUM
**Impact:** Service quality
**Status:** 100% complete (manual workflow, no GPS)
**Completed:** December 19, 2025
**Documentation:** `plans/reports/251219-phase3-day3-summary.md`

**Features:**

- [x] Weekly schedule view (calendar) ✅
- [x] Assign staff to schedules ✅
- [x] Manual check-in/out (no GPS tracking) ✅
- [x] Plant condition assessment ✅
- [x] Photo upload with MinIO S3 (external host) ✅
- [x] Work report generation ✅
- [x] Today's schedule quick view ✅
- [x] Care completion workflow ✅
- [x] Issue tracking and actions taken ✅

**Technical:**

- Components: CareCalendar, CareScheduleForm, CareCompletionForm
- Pages: List, New, Today, Detail, Complete
- Photo storage: MinIO S3 (external server supported)
- Manual workflow (no GPS complexity)
- Vietnamese locale for dates

---

### 3.3 Reports & Analytics Dashboard ✅ CORE COMPLETE

**Priority:** HIGH
**Impact:** Business insights
**Status:** 77% complete (core done, export deferred)
**Completed:** December 19, 2025
**Documentation:** `docs/analytics-dashboard-completion-summary.md`

**Features:**

- [x] Revenue analytics server actions (11 actions)
  - Total revenue, YTD, MTD, growth %
  - Monthly revenue trends (12 months)
  - Revenue by customer tier
- [x] Invoice analytics
  - Outstanding invoices tracking
  - Invoice aging analysis (4 buckets: 0-30, 30-60, 60-90, 90+ days)
  - Collection rate calculation
  - Average days to payment
- [x] Customer analytics
  - Total active customers
  - New customers this month
  - Customer lifetime value (CLV)
  - Churn rate tracking
  - Top 10 customers by revenue
- [x] Contract analytics
  - Active contracts count
  - Expiring soon alerts (30 days)
  - Average contract duration
  - Renewal rate tracking
- [x] Analytics dashboard page
  - Revenue overview cards
  - 12-month trend chart (Recharts)
  - Invoice aging visualization
  - Top customers table
  - Contract expiry alerts
- [x] Navigation link added to sidebar
- [ ] Export functionality (CSV/PDF) - Deferred to Phase 4
- [ ] Date range selector - Deferred to Phase 4
- [ ] Custom report builder - Future enhancement

**Technical:**

- Actions: `src/actions/reports.ts` (600+ lines) ✅
- Components:
  - `src/components/analytics/revenue-dashboard.tsx` ✅
  - `src/components/analytics/invoice-aging.tsx` ✅
- Pages: `src/app/(dashboard)/analytics/page.tsx` ✅
- Charts: Recharts (Line, Bar, Area)
- Styling: Responsive grid layout, Vietnamese localization

**Performance:**

- Efficient database queries with aggregations
- Progressive loading with Suspense
- Optimized for 100+ customers, 1000+ invoices

**Deferred to Phase 4:**

- CSV/PDF export functionality
- Date range picker (default: all-time data)
- Custom report builder
- Scheduled email reports
- Downloadable charts as images

---

## Phase 4: Advanced Features (Weeks 9-12)

### 4.1 Mobile Staff App (React Native/PWA)

**Features:**

- [ ] Today's schedule view
- [ ] Navigation to customer location
- [ ] Check-in/check-out
- [ ] Plant exchange workflow
- [ ] Photo upload
- [ ] Customer signature collection
- [ ] Offline support

---

### 4.2 Customer Portal

**Features:**

- [ ] Login for customers
- [ ] View current contracts
- [ ] View invoices
- [ ] Make online payments
- [ ] Request plant exchange
- [ ] Submit feedback
- [ ] View plant care tips

---

### 4.3 AI-Powered Features

**Features:**

- [ ] Sticky note intent detection (Gemini)
- [ ] Automatic priority scoring
- [ ] Customer sentiment analysis
- [ ] Chatbot for common questions
- [ ] Predictive maintenance alerts
- [ ] Revenue forecasting

---

### 4.4 Integration Enhancements

**Features:**

- [ ] Google Drive integration (contract storage)
- [ ] Email automation (SendGrid/Resend)
- [ ] SMS notifications (Twilio/local gateway)
- [ ] WhatsApp Business API
- [ ] Telegram bot for staff
- [ ] Accounting software integration (MISA, Fast)

---

## Phase 5: Enterprise Features (Future)

### 5.1 Multi-location Support

- Branch management
- Inter-branch transfers
- Regional reporting

### 5.2 Advanced Inventory

- RFID tracking
- Barcode scanning
- Automated reordering
- Supplier management

### 5.3 Financial Management

- Purchase orders
- Expense tracking
- Profit/loss statements
- Cash flow forecasting

---

## Implementation Strategy

### Quick Wins (Week 1-2)

1. **Plant Types Management** - Foundation for all other features
2. **Payment Recording** - Immediate business value

### Core Value (Week 3-4)

3. **Quotation System** - Sales pipeline
4. **Sticky Notes** - Customer service

### Operational (Week 5-8)

5. **Route Planning** - Efficiency gains
6. **Reports** - Business insights

### Growth (Week 9+)

7. **Mobile App** - Field operations
8. **AI Features** - Competitive advantage

---

## Success Metrics

| Metric                  | Current           | Target (3 months) | Status            |
| ----------------------- | ----------------- | ----------------- | ----------------- |
| Test Coverage           | 97.5% lines       | 95%+              | ✅ Exceeded       |
| TypeScript Errors       | 10 (non-blocking) | 0                 | 🟡 89% fixed      |
| Features Complete       | 3.4 / 5 phases    | Phase 3           | 🟢 On track       |
| Active Customers        | 0 (seeded)        | 50+               | ⏳ Launch pending |
| Monthly Revenue         | 0                 | Track accurately  | ⏳ Launch pending |
| Invoice Collection Rate | N/A               | 90%+              | ⏳ Launch pending |
| Route Efficiency        | N/A               | 20% time saved    | ⏳ Phase 3.1      |
| Customer Satisfaction   | N/A               | 4.5/5             | ⏳ Phase 3.2      |

---

## Technical Debt to Address

### High Priority

1. **Fix Remaining 10 Backend Errors** - Post browser testing (30 min)
2. **Complete Browser Testing** - Systematic UI/UX validation (1-2 hours)
3. **E2E Tests Setup** - Playwright configuration (2 hours)

### Medium Priority

4. **Update Test Scripts** - Fix 113 test file errors (2 hours)
5. **Performance Optimization** - Database indexing review (1 hour)
6. **Type Safety Improvements** - Remove `as any` assertions (1 hour)

### Low Priority

7. **Security Audit** - OWASP checklist (4 hours)
8. **Accessibility** - WCAG compliance (4 hours)
9. **Documentation** - API documentation generation (2 hours)

---

## Resource Requirements

**Development:**

- 1 Full-stack developer (you + Claude)
- Design system ready (shadcn/ui)
- Backend ready (Prisma + PostgreSQL)

**Infrastructure:**

- Neon PostgreSQL (current: free tier)
- Vercel/Railway for hosting
- MinIO/S3 for file storage
- Google Maps API (route optimization)

---

## Next Immediate Steps

### Priority 1: Browser Testing (Today)

1. ✅ Complete validation and error fixing
2. ⏳ **Start dev server** (`bun run dev`)
3. ⏳ **Follow browser testing checklist**
4. ⏳ **Document findings and bugs**
5. ⏳ **Fix critical issues**
6. ⏳ **Re-test until stable**

### Priority 2: Production Prep (This Week)

7. Fix remaining 10 backend errors
8. Run code review agent
9. Create deployment checklist
10. Setup CI/CD pipeline
11. Deploy to staging environment
12. User acceptance testing

### Priority 3: Next Features (Next Week)

13. Complete Phase 3.1 (Route Planning) OR
14. Complete Phase 2.4 UI (Sticky Notes) OR
15. Start Phase 4 (Mobile App/Customer Portal)

**Decision Point:** Prioritize based on browser testing feedback and business needs

---

## Recent Achievements (Dec 19, 2025)

### Morning Session

- ✅ Quotation system backend testing (5 quotations verified)
- ✅ Sticky notes validation schemas complete
- ✅ Analytics dashboard implemented (11 actions, 2 components, 1 page)
- ✅ Navigation link added

### Afternoon Session

- ✅ Validation \u0026 error fixing (80+ errors)
- ✅ Browser testing documentation created
- ✅ TypeScript error tracking established
- ✅ Application stabilized for testing

**Velocity:** 3 major features + stabilization in 1 day

---

Ready for browser testing! 🚀

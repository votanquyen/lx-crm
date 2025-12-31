# Browser Testing Checklist

**Session:** December 19, 2025
**Status:** Ready for Testing
**Prerequisites:** Development server running (`bun run dev`)

---

## Pre-Testing Setup

### 1. Start Development Server
```bash
cd C:\Users\Quyen_Vo\locxanh.vn
bun run dev
```

**Expected:** Server starts on `http://localhost:3000`

### 2. Verify Database Connection
- Check `.env` file has valid `DATABASE_URL`
- Ensure Neon PostgreSQL is accessible
- Run `bun run db:generate` if needed

### 3. Authentication
- Login with Google OAuth
- Verify user session persists
- Check sidebar shows user info

---

## Feature Testing Matrix

### Phase 2.1: Plant Types ✅
**Status:** Previously tested and verified
**Route:** `/plant-types`

- [x] List all plant types
- [x] Create new plant type
- [x] Edit plant type
- [x] View plant type details
- [x] Delete plant type
- [x] Filter/search functionality

---

### Phase 2.2: Payment Recording ✅
**Status:** Previously tested and verified
**Route:** `/payments`, `/invoices/[id]/record-payment`

- [x] Record payment from invoice
- [x] View payment list
- [x] Payment method selection
- [x] Automatic invoice status updates
- [x] Payment history display

---

### Phase 2.3: Quotations System ⏳
**Status:** Backend complete, UI needs browser testing
**Route:** `/quotations`

#### List Page (`/quotations`)
- [ ] **Load quotations list** - Verify all quotations display
- [ ] **Statistics cards** - Check draft, sent, accepted, rejected counts
- [ ] **Status badges** - Verify colors (draft=secondary, sent=default, accepted=default, rejected=destructive)
- [ ] **Create button** - Click "Tạo báo giá mới" navigates to `/quotations/new`
- [ ] **Pagination** - Test page navigation with 20 items per page
- [ ] **Date formatting** - Verify Vietnamese date format (dd/MM/yyyy)
- [ ] **Currency formatting** - Check VND formatting (e.g., "10.000.000 ₫")

#### Create Page (`/quotations/new`)
- [ ] **Customer dropdown** - Load customers list
- [ ] **Plant types selection** - Add/remove items
- [ ] **Quantity input** - Enter numbers, verify validation
- [ ] **Unit price** - Auto-populate from plant type rental price
- [ ] **Discount** - Calculate correctly
- [ ] **VAT calculation** - Default 8%, recalculates on change
- [ ] **Subtotal calculation** - Sum all items
- [ ] **Total amount** - Subtotal - discount + VAT
- [ ] **Valid until date** - Date picker works
- [ ] **Notes fields** - Optional text areas work
- [ ] **Save as DRAFT** - Creates quotation with DRAFT status
- [ ] **Save \u0026 SEND** - Creates quotation with SENT status
- [ ] **Validation errors** - Show Vietnamese error messages

#### Detail Page (`/quotations/[id]`)
- [ ] **Quotation header** - Display quote number, status, dates
- [ ] **Customer info** - Show company name, tax code, address, email, phone
- [ ] **Items table** - List all quotation items with calculations
- [ ] **Financial summary** - Subtotal, discount, VAT, total
- [ ] **Notes section** - Display customer notes \u0026 internal notes
- [ ] **Status badges** - Correct color per status
- [ ] **Expiry warning** - Yellow banner if expiring within 7 days
- [ ] **Action buttons** - Conditionally shown based on status:
  - DRAFT → "Gửi báo giá" (Send)
  - SENT → "Chấp nhận" (Accept), "Từ chối" (Reject)
  - ACCEPTED → "Chuyển thành hợp đồng" (Convert)
- [ ] **Created by info** - Show creator name \u0026 email

#### Actions Testing
- [ ] **Send quotation** - Status DRAFT → SENT
- [ ] **Accept quotation** - Status SENT → ACCEPTED
- [ ] **Reject quotation** - Status SENT → REJECTED with reason
- [ ] **Convert to contract** - (If implemented) ACCEPTED → CONVERTED

---

### Phase 2.4: Sticky Notes ⏳
**Status:** Backend ready, UI deferred
**Route:** `/sticky-notes` (not implemented)

- [ ] Defer UI testing until implementation complete

---

### Phase 3.3: Analytics Dashboard ⏳
**Status:** Core features complete, needs browser testing
**Route:** `/analytics`

#### Page Load
- [ ] **Navigation link** - Click "Phân tích" in sidebar
- [ ] **Page renders** - No console errors
- [ ] **Loading states** - Show suspense fallbacks during data fetch

#### Revenue Overview Card
- [ ] **Total revenue** - Display formatted VND amount
- [ ] **YTD revenue** - Year-to-date calculation
- [ ] **MTD revenue** - Month-to-date calculation
- [ ] **Growth percentage** - Show increase/decrease vs last month
- [ ] **Growth indicator** - Green arrow up (positive) or red arrow down (negative)

#### Invoice Aging Card
- [ ] **Outstanding total** - Sum of unpaid invoices
- [ ] **Aging buckets**:
  - Current (0-30 days) - Green
  - 30-60 days - Yellow
  - 60-90 days - Orange
  - 90+ days - Red
- [ ] **Percentage bars** - Visual width matches percentage
- [ ] **Amount formatting** - VND currency format

#### 12-Month Revenue Trend Chart
- [ ] **Chart renders** - Line chart displays
- [ ] **X-axis** - Vietnamese month labels (Th1, Th2, ...)
- [ ] **Y-axis** - Formatted in millions (1M, 2M, ...)
- [ ] **Tooltip** - Hover shows formatted revenue
- [ ] **Line color** - Blue (#2563eb)
- [ ] **Data accuracy** - Matches database revenue

#### Top 10 Customers Table
- [ ] **Customer list** - Display top 10 by revenue
- [ ] **Customer link** - Click name navigates to `/customers/[id]`
- [ ] **Revenue column** - Formatted VND
- [ ] **Contracts count** - Show active contracts
- [ ] **CLV (Customer Lifetime Value)** - Formatted amount
- [ ] **Last invoice** - Vietnamese date format
- [ ] **Empty state** - Show "Chưa có dữ liệu" if no customers

#### Contract Expiry Alerts
- [ ] **Expiring contracts** - Show contracts expiring in next 30 days
- [ ] **Days until expiry** - Calculate from end date
- [ ] **Customer info** - Link to customer profile
- [ ] **Contract value** - Monthly fee display
- [ ] **Empty state** - "Không có hợp đồng sắp hết hạn"

#### Responsive Design
- [ ] **Desktop view** - 2-column grid layout
- [ ] **Tablet view** - Adjust to single column if needed
- [ ] **Mobile view** - Stack all widgets vertically
- [ ] **Chart responsiveness** - Chart resizes properly

---

## Cross-Feature Integration Tests

### Navigation
- [ ] **Sidebar links** - All routes accessible
- [ ] **Active states** - Current page highlighted
- [ ] **Breadcrumbs** - Show correct path (if implemented)

### Data Consistency
- [ ] **Customer data** - Same across quotations, contracts, analytics
- [ ] **Invoice totals** - Match payment records
- [ ] **Revenue calculations** - Consistent across analytics

### Error Handling
- [ ] **Network errors** - Show user-friendly messages
- [ ] **404 pages** - Invalid routes show not found
- [ ] **Empty states** - Display helpful messages
- [ ] **Form validation** - Vietnamese error messages

---

## Performance Checks

- [ ] **Initial page load** - Under 3 seconds
- [ ] **Data table rendering** - Smooth scrolling with 100+ rows
- [ ] **Chart rendering** - No lag on hover interactions
- [ ] **Form submissions** - Loading indicators during save
- [ ] **Image optimization** - Fast load times (if images used)

---

## Browser Compatibility

Test in:
- [ ] **Chrome** (recommended)
- [ ] **Edge**
- [ ] **Firefox**
- [ ] **Safari** (if available)

---

## Accessibility

- [ ] **Keyboard navigation** - Tab through forms
- [ ] **Focus indicators** - Visible on interactive elements
- [ ] **Screen reader** - Aria labels present (basic check)
- [ ] **Color contrast** - Text readable against backgrounds

---

## Known Issues to Verify

From validation report:

### TypeScript Errors (90+)
1. **`src/actions/reports.ts`** - Missing `requireUser`, `createServerAction` exports
2. **`src/actions/quotations.ts`** - VIEWED status not in enum
3. **`src/app/(dashboard)/quotations/[id]/page.tsx`** - Missing `XCircle` import, customer email/phone property mismatches
4. **`src/app/(dashboard)/quotations/new/page.tsx`** - Missing `sortBy`, `sortOrder` params
5. **Test scripts** - Type mismatches (acceptable, scripts not in production)

### Console Warnings (179)
- **Seed files \u0026 scripts** - console.log usage (acceptable for dev tools)

**Note:** These TypeScript errors may cause runtime issues. Proceed with browser testing but note any failures for code fixing phase.

---

## Testing Session Log

**Tester:**
**Date:**
**Browser:**
**Viewport:**

### Quotations System
| Feature | Status | Notes |
|---------|--------|-------|
| List page loads | ⬜ Pass / ⬜ Fail | |
| Create quotation | ⬜ Pass / ⬜ Fail | |
| View details | ⬜ Pass / ⬜ Fail | |
| Send quotation | ⬜ Pass / ⬜ Fail | |
| Accept quotation | ⬜ Pass / ⬜ Fail | |
| Calculations correct | ⬜ Pass / ⬜ Fail | |

### Analytics Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Page loads | ⬜ Pass / ⬜ Fail | |
| Revenue cards | ⬜ Pass / ⬜ Fail | |
| Trend chart | ⬜ Pass / ⬜ Fail | |
| Customer table | ⬜ Pass / ⬜ Fail | |
| Invoice aging | ⬜ Pass / ⬜ Fail | |
| Responsive | ⬜ Pass / ⬜ Fail | |

---

## Post-Testing Actions

1. **Document issues** - Create issue list with screenshots
2. **Prioritize fixes** - Critical bugs first
3. **Update session summary** - Record testing results
4. **Plan next phase** - Based on testing outcomes

---

## Quick Reference Commands

```bash
# Start dev server
bun run dev

# Check database
bun run db:studio

# View logs
# Check browser console (F12)

# Stop server
# Ctrl+C in terminal
```

---

**Next Steps After Browser Testing:**
1. Fix TypeScript errors (src/actions/reports.ts, quotations.ts)
2. Fix any UI bugs found during testing
3. Run full validation again
4. Prepare for staging deployment

# Browser Testing Session - December 19, 2025

**Started:** 11:40 AM
**Tester:** User
**Browser:** Chrome (recommended)
**Server:** http://localhost:3001
**Status:** 🟢 LIVE

---

## Quick Start

1. ✅ Dev server running on **http://localhost:3001**
2. ⏳ Open browser and navigate to above URL
3. ⏳ Follow test scenarios below
4. ⏳ Document findings in this file

---

## Test Priority Order

### 1. Login \u0026 Authentication (5 min)
- [ ] Navigate to http://localhost:3001
- [ ] Should redirect to `/login`
- [ ] Click "Sign in with Google"
- [ ] Complete OAuth flow
- [ ] Should redirect to dashboard
- [ ] Verify user info in sidebar

**Expected:** Successful login, dashboard loads

---

### 2. Analytics Dashboard (15 min) - PRIORITY HIGH

**URL:** http://localhost:3001/analytics

#### Revenue Section
- [ ] Page loads without errors
- [ ] Revenue overview cards display:
  - [ ] Total revenue (formatted VND)
  - [ ] YTD revenue
  - [ ] MTD revenue
  - [ ] Growth percentage (with up/down arrow)
- [ ] 12-month trend chart renders
- [ ] Chart tooltip works on hover
- [ ] Chart displays Vietnamese month labels (Th1, Th2, ...)
- [ ] Y-axis shows values in millions (1M, 2M, ...)

**Issues Found:**
```
[Document any issues here]
```

#### Invoice Aging Section
- [ ] Invoice aging card displays
- [ ] 4 aging buckets shown:
  - [ ] Current (0-30 days) - Green
  - [ ] 30-60 days - Yellow
  - [ ] 60-90 days - Orange
  - [ ] 90+ days - Red
- [ ] Amounts formatted in VND
- [ ] Percentages match visual bars

**Issues Found:**
```
[Document any issues here]
```

#### Top Customers Table
- [ ] Table loads with customer data
- [ ] Customer code links work (navigate to `/customers/[id]`)
- [ ] Revenue column formatted correctly
- [ ] CLV (Customer Lifetime Value) displays
- [ ] Contract count shows
- [ ] Last invoice date formatted (Vietnamese)
- [ ] Empty state shows if no data

**Issues Found:**
```
[Document any issues here]
```

#### Contract Expiry Alerts
- [ ] Expiring contracts section displays
- [ ] Shows contracts expiring in 30 days
- [ ] Days until expiry calculated correctly
- [ ] Customer links work
- [ ] Contract values display
- [ ] Empty state if no expiring contracts

**Issues Found:**
```
[Document any issues here]
```

---

### 3. Quotations System (20 min) - PRIORITY HIGH

#### List Page: http://localhost:3001/quotations

- [ ] Page loads without errors
- [ ] Statistics cards show:
  - [ ] Draft count
  - [ ] Sent count
  - [ ] Accepted count
  - [ ] Rejected count
- [ ] Quotations table displays
- [ ] Status badges have correct colors:
  - [ ] DRAFT - Gray/Secondary
  - [ ] SENT - Blue/Default
  - [ ] ACCEPTED - Green
  - [ ] REJECTED - Red/Destructive
  - [ ] EXPIRED - Gray/Outline
  - [ ] CONVERTED - Blue
- [ ] Dates formatted in Vietnamese (dd/MM/yyyy)
- [ ] Currency formatted in VND
- [ ] "Tạo báo giá mới" button works
- [ ] Clicking quotation navigates to detail page

**Issues Found:**
```
[Document any issues here]
```

#### Create Page: http://localhost:3001/quotations/new

- [ ] Page loads without errors
- [ ] Customer dropdown populates
- [ ] Plant types dropdown populates
- [ ] Can add multiple items
- [ ] Can remove items
- [ ] Quantity input works
- [ ] Unit price auto-populates from plant type
- [ ] Discount input works (per item)
- [ ] Subtotal calculates correctly
- [ ] Quotation-level discount works
- [ ] VAT calculation correct (default 8%)
- [ ] Total amount = Subtotal - Discount + VAT
- [ ] Valid until date picker works
- [ ] Notes fields accept text
- [ ] "Lưu nháp" saves as DRAFT
- [ ] "Gửi báo giá" saves as SENT
- [ ] Redirects to detail page after save
- [ ] Form validation shows errors

**Test Data:**
- Select a customer
- Add 2-3 plant types
- Set quantities: 5, 10, 3
- Add 10% item discount on first item
- Add 5% quotation discount
- Set VAT to 10%
- Calculate expected total manually and verify

**Issues Found:**
```
[Document any issues here]
```

#### Detail Page: http://localhost:3001/quotations/[id]

- [ ] Page loads for existing quotation
- [ ] Header shows quote number and status
- [ ] Customer info section displays:
  - [ ] Company name
  - [ ] Tax code
  - [ ] Address
  - [ ] Email (contactEmail)
  - [ ] Phone (contactPhone)
- [ ] Items table shows all quotation items
- [ ] Item calculations correct:
  - [ ] Quantity × Unit Price
  - [ ] Discount applied
  - [ ] Line total correct
- [ ] Financial summary correct:
  - [ ] Subtotal
  - [ ] Discount amount
  - [ ] VAT amount
  - [ ] Total amount
- [ ] Notes display (customer + internal)
- [ ] Created by info shows
- [ ] Action buttons conditionally shown:
  - [ ] DRAFT → "Gửi báo giá" button
  - [ ] SENT → "Chấp nhận" and "Từ chối" buttons
  - [ ] ACCEPTED → "Chuyển thành hợp đồng" button
- [ ] Expiry warning shows if expiring <7 days
- [ ] Status workflow works:
  - [ ] Send quotation (DRAFT → SENT)
  - [ ] Accept quotation (SENT → ACCEPTED)
  - [ ] Reject quotation (SENT → REJECTED)

**Issues Found:**
```
[Document any issues here]
```

---

### 4. Navigation \u0026 Integration (10 min)

#### Sidebar Navigation
- [ ] All menu items visible
- [ ] Active page highlighted
- [ ] Links work:
  - [ ] Dashboard (`/`)
  - [ ] Customers (`/customers`)
  - [ ] Contracts (`/contracts`)
  - [ ] Quotations (`/quotations`)
  - [ ] Invoices (`/invoices`)
  - [ ] Payments (`/payments`)
  - [ ] Plant Types (`/plant-types`)
  - [ ] Analytics (`/analytics`) ← NEW
  - [ ] Exchanges (`/exchanges`)
- [ ] User dropdown works
- [ ] Logout works

**Issues Found:**
```
[Document any issues here]
```

#### Cross-Feature Integration
- [ ] Customer data consistent across:
  - [ ] Quotations
  - [ ] Analytics
  - [ ] Customer list
- [ ] Plant types data consistent
- [ ] Revenue calculations match invoice data
- [ ] Quotation statistics match list counts

**Issues Found:**
```
[Document any issues here]
```

---

### 5. Error Handling \u0026 Edge Cases (5 min)

- [ ] Navigate to invalid route (e.g., `/quotations/invalid-id`)
  - [ ] Shows 404 or error page
- [ ] Empty states work:
  - [ ] Analytics with no data
  - [ ] Quotations list with no quotations
  - [ ] Customer table with no customers
- [ ] Form validation errors show in Vietnamese
- [ ] Network error handling (if applicable)

**Issues Found:**
```
[Document any issues here]
```

---

### 6. Responsive Design (5 min)

- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Test mobile view (375px width):
  - [ ] Analytics dashboard stacks vertically
  - [ ] Tables scroll horizontally
  - [ ] Charts resize properly
  - [ ] Navigation accessible
- [ ] Test tablet view (768px width)
- [ ] Test desktop view (1920px width)

**Issues Found:**
```
[Document any issues here]
```

---

### 7. Performance Check (5 min)

- [ ] Open DevTools → Network tab
- [ ] Reload analytics page
- [ ] Check load time < 3 seconds
- [ ] No 404 errors in console
- [ ] No JavaScript errors in console
- [ ] Charts render smoothly (no lag)
- [ ] Table scrolling smooth with 20+ rows

**Performance Notes:**
```
Initial load: ___ ms
TTI (Time to Interactive): ___ ms
Chart render: ___ ms
Issues: [document here]
```

---

## Browser Console Errors

Open DevTools (F12) → Console tab

**Errors Found:**
```javascript
// Copy/paste any console errors here
// Include:
// - Error message
// - Stack trace
// - File/line number
```

**Warnings:**
```javascript
// Non-critical warnings
```

---

## Critical Bugs Found

### Bug #1: [Title]
**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low
**Page:** [URL]
**Steps to Reproduce:**
1.
2.
3.

**Expected:**
**Actual:**
**Screenshot:** [if available]

---

### Bug #2: [Title]
**Severity:**
**Page:**
**Steps:**

**Expected:**
**Actual:**

---

## Test Summary

**Total Tests:** 100+
**Passed:** ___
**Failed:** ___
**Blocked:** ___

### Pass Rate
- Analytics Dashboard: ___ %
- Quotations System: ___ %
- Navigation: ___ %
- Overall: ___ %

---

## Recommendations

### Must Fix Before Production
1.

### Should Fix Soon
1.

### Nice to Have
1.

---

## Next Steps

### If Tests Pass (✅)
1. Fix 10 remaining backend errors
2. Run code review agent
3. Deploy to staging
4. User acceptance testing

### If Tests Fail (❌)
1. Document all critical bugs
2. Prioritize by severity
3. Fix critical bugs first
4. Re-test affected areas
5. Repeat until stable

---

## Session Notes

**What Worked Well:**
-

**Issues Encountered:**
-

**Observations:**
-

---

**Test Session End Time:** ___
**Duration:** ___
**Status:** ⏳ In Progress / ✅ Complete / ❌ Blocked

---

## Quick Reference

**Dev Server:** http://localhost:3001
**API Endpoint:** http://localhost:3001/api/*
**Database:** Neon PostgreSQL (check `.env` for connection)

**Useful Commands:**
```bash
# View server logs
tail -f /tmp/claude/tasks/beae20b.output

# Restart server
# Stop: Ctrl+C in terminal where it's running
# Start: bun run dev

# Check database
bun run db:studio

# View real-time logs in another terminal
bun run dev
```

**Testing Checklist:** `docs/browser-testing-checklist.md`
**Error Tracking:** `docs/typescript-errors-to-fix.md`

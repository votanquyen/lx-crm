# Payment Recording Interface - Browser Testing Guide

**Date:** December 18, 2025
**Feature:** Payment Recording Interface (Phase 2.2)
**Server:** http://localhost:3000

---

## Prerequisites

### 1. Development Server

```bash
# Server should be running at http://localhost:3000
pnpm dev
```

### 2. Database Setup

Ensure PostgreSQL database is running with:

- ✅ Customers seeded
- ✅ Contracts seeded
- ✅ Invoices seeded
- ⚠️ Payments (will be created during testing)

### 3. Authentication

You must be logged in with an authenticated user account.

---

## Test Plan

### Test 1: Access Payment List Page ✓

**URL:** http://localhost:3000/payments

**Expected:**

- Page loads without errors
- Shows "Thanh toán" heading
- Displays 4 statistics cards:
  - Tổng thanh toán (Total payments)
  - Hôm nay (Today's payments)
  - Chưa xác minh (Unverified count)
  - Đã xác minh (Verified count)
- Shows filter dropdowns:
  - Payment method (Tất cả phương thức)
  - Verification status (Tất cả trạng thái)
- Displays payment history section

**What to Check:**

- [ ] Page renders without console errors
- [ ] Statistics cards show correct numbers
- [ ] Payment method filter has 6 options + "All"
- [ ] Verification filter has 2 options + "All"
- [ ] Payment cards (if any exist) display correctly
- [ ] Each card shows: invoice number, customer, amount, date, method badge, verification badge

**Console Check:**

```js
// Open DevTools (F12) and check for errors
// Should see no red errors
```

---

### Test 2: View Payment Detail Page ✓

**URL:** http://localhost:3000/payments/[payment-id]

**Steps:**

1. Go to payment list page
2. Click on any payment card
3. Should navigate to detail page

**Expected:**

- Page shows "Chi tiết thanh toán" heading
- Left column displays:
  - Payment info card with amount (green, large)
  - Payment date
  - Payment method badge
  - Method-specific details:
    - Bank: transaction ref, bank name, account number
    - Cash: receiver name, receipt number
  - Notes (if any)
  - Receipt URL link (if any)
- Right column shows:
  - Related invoice card (clickable)
  - Invoice balances (total, paid, remaining)
  - Recording metadata (who recorded, when created)
  - Verification info (if verified)
- Action buttons (if not verified):
  - Sửa (Edit) button
  - Xác minh (Verify) button

**What to Check:**

- [ ] All payment information displays correctly
- [ ] Bank transfer shows: transaction ref, bank name, account
- [ ] Cash payment shows: receiver name, receipt number
- [ ] Invoice card is clickable and links work
- [ ] Balances calculate correctly
- [ ] Verification badge shows correct status
- [ ] Edit/Verify buttons appear only for unverified payments

---

### Test 3: Record Payment from Invoice ✓

**URL:** http://localhost:3000/invoices/[invoice-id]/record-payment

**Steps:**

1. Navigate to an invoice detail page
2. Click "Ghi nhận thanh toán" button
3. Should go to record payment page

**Expected:**

- Page shows "Ghi nhận thanh toán" heading
- Invoice summary box displays:
  - Invoice number
  - Customer name
  - Total amount
  - Amount paid
  - Remaining balance (orange, bold)
- Payment form with fields:
  - Amount (pre-filled with remaining balance)
  - Payment date (defaults to today, max = today)
  - Payment method dropdown (6 options)
- Conditional fields based on payment method:
  - **Bank Transfer:** transaction ref\*, bank name, account number, account name
  - **Cash:** receiver name\*, receipt number
- Additional fields:
  - Notes (textarea)
  - Receipt URL
- Action buttons:
  - "Ghi nhận thanh toán" (submit)
  - "Hủy" (cancel)

**What to Check:**

- [ ] Invoice summary shows correct data
- [ ] Remaining balance calculated correctly
- [ ] Amount field defaults to remaining balance
- [ ] Payment date defaults to today
- [ ] Payment date cannot be future date
- [ ] Payment method defaults to "Chuyển khoản ngân hàng"
- [ ] Conditional fields appear/disappear based on method
- [ ] Bank transfer requires transaction ref (\*)
- [ ] Cash requires receiver name (\*)

---

### Test 4: Submit Payment (Validation) ✓

**Steps:**

1. Go to record payment page
2. Try submitting with invalid data

**Test Cases:**

#### 4.1: Empty Amount

- Clear amount field
- Click submit
- Expected: Error "Số tiền thanh toán là bắt buộc"

#### 4.2: Amount Exceeds Remaining

- Enter amount > remaining balance
- Click submit
- Expected: Error "Số tiền thanh toán vượt quá số tiền còn lại"

#### 4.3: Future Payment Date

- Set date to tomorrow
- Click submit
- Expected: Error "Ngày thanh toán không thể trong tương lai"

#### 4.4: Bank Transfer Without Ref

- Select "Chuyển khoản ngân hàng"
- Clear bank ref field
- Click submit
- Expected: Error "Số giao dịch ngân hàng là bắt buộc"

#### 4.5: Cash Without Receiver

- Select "Tiền mặt"
- Clear receiver field
- Click submit
- Expected: Error "Người nhận tiền là bắt buộc"

**What to Check:**

- [ ] All validation errors display correctly
- [ ] Error messages in Vietnamese
- [ ] Form doesn't submit with invalid data
- [ ] No console errors during validation

---

### Test 5: Submit Payment (Success) ✓

**Steps:**

1. Fill valid payment data:
   - Amount: 5,000,000đ
   - Date: Today
   - Method: Chuyển khoản ngân hàng
   - Bank ref: FT20251218TEST
   - Bank name: Vietcombank
   - Notes: "Test payment"
2. Click "Ghi nhận thanh toán"

**Expected:**

- Success toast: "Ghi nhận thanh toán thành công!"
- Redirects to invoice detail page
- Invoice page shows updated:
  - Paid amount increased by 5,000,000đ
  - Outstanding amount decreased by 5,000,000đ
  - Status updated:
    - SENT → PARTIAL (if partial payment)
    - PARTIAL → PAID (if fully paid)
- New payment appears in payment history section

**What to Check:**

- [ ] Toast notification appears
- [ ] Redirects correctly
- [ ] Invoice balances updated
- [ ] Invoice status updated correctly
- [ ] Payment history shows new payment
- [ ] Database updated (check via Prisma Studio)

---

### Test 6: Filter Payments ✓

**URL:** http://localhost:3000/payments

**Steps:**

1. Select payment method filter: "Chuyển khoản"
2. Page should reload showing only bank transfer payments

**Test Filters:**

#### 6.1: Payment Method Filter

- Select "Chuyển khoản" → Only bank transfers shown
- Select "Tiền mặt" → Only cash payments shown
- Select "MoMo" → Only MoMo payments shown
- Select "Tất cả" → All payments shown

#### 6.2: Verification Status Filter

- Select "Đã xác minh" → Only verified payments
- Select "Chưa xác minh" → Only unverified payments
- Select "Tất cả" → All payments

#### 6.3: Combined Filters

- Select "Chuyển khoản" + "Chưa xác minh"
- Should show only unverified bank transfers

**What to Check:**

- [ ] Filters work correctly
- [ ] Page reloads with filtered results
- [ ] URL contains filter parameters
- [ ] Statistics cards update based on filters
- [ ] No payments message if no results

---

### Test 7: Pagination ✓

**Prerequisites:** Need > 20 payments

**Steps:**

1. Create 25+ payments via seed or manual entry
2. Go to payment list page
3. Should see pagination buttons

**Expected:**

- Shows first 20 payments
- Pagination buttons at bottom
- Page numbers: 1, 2, etc.
- Current page highlighted
- Clicking page 2 shows next 20 payments

**What to Check:**

- [ ] Pagination appears when > 20 payments
- [ ] Page size is 20 (configurable)
- [ ] Page navigation works
- [ ] URL updates with ?page=2
- [ ] Direct URL navigation works

---

### Test 8: Fully Paid Invoice Protection ✓

**Steps:**

1. Find an invoice with status = PAID
2. Navigate to `/invoices/[id]/record-payment`

**Expected:**

- Shows "Hóa đơn đã thanh toán đầy đủ" message
- Payment form NOT displayed
- "Quay lại hóa đơn" button shown
- Cannot record additional payment

**What to Check:**

- [ ] Protection message displays
- [ ] Form not accessible
- [ ] Back button works
- [ ] No way to bypass protection

---

### Test 9: Payment Verification (Manager Only) ✓

**Prerequisites:** Logged in as MANAGER or ADMIN role

**Steps:**

1. Go to unverified payment detail page
2. Click "Xác minh" button
3. Add verification notes
4. Submit

**Expected:**

- Verification form/modal appears
- Notes field available
- Submit marks payment as verified
- Payment detail updates:
  - Badge changes to "Đã xác minh"
  - Verification info shows:
    - Verified at timestamp
    - Verified by user name
  - Edit/Verify buttons disappear
- Cannot edit verified payment

**What to Check:**

- [ ] Verify button appears (manager only)
- [ ] Verification modal/form works
- [ ] Payment marked as verified
- [ ] Verification timestamp recorded
- [ ] Verifier name recorded
- [ ] Edit disabled after verification
- [ ] Delete disabled after verification

---

### Test 10: Invoice Status Transitions ✓

**Test Full Payment Flow:**

#### Initial State

- Invoice: INV-001
- Total: 10,000,000đ
- Paid: 0đ
- Status: SENT

#### Step 1: Partial Payment

- Record payment: 3,000,000đ
- Expected:
  - Paid: 3,000,000đ
  - Outstanding: 7,000,000đ
  - Status: PARTIAL

#### Step 2: Another Partial

- Record payment: 2,000,000đ
- Expected:
  - Paid: 5,000,000đ
  - Outstanding: 5,000,000đ
  - Status: PARTIAL

#### Step 3: Final Payment

- Record payment: 5,000,000đ
- Expected:
  - Paid: 10,000,000đ
  - Outstanding: 0đ
  - Status: PAID

**What to Check:**

- [ ] Status transitions correctly
- [ ] Balances always accurate
- [ ] Cannot record payment on PAID invoice
- [ ] All transitions logged

---

## Known Issues & Limitations

### Non-Critical (Development Only)

- Seed file TypeScript warnings (expected)
- Console.log warnings in development

### Expected Behavior

- Payment dates cannot be future
- Cannot overpay invoices
- Verified payments cannot be edited/deleted
- Only managers can verify payments

---

## Success Criteria

✅ All 10 tests pass
✅ No console errors
✅ No runtime errors
✅ Data integrity maintained
✅ Status transitions work
✅ Validation enforced
✅ Authorization respected

---

## Troubleshooting

### Server Won't Start

```bash
# Kill existing processes
taskkill //F //IM node.exe
# Remove lock
rm -rf .next
# Start fresh
pnpm dev
```

### Database Errors

```bash
# Reset database
pnpm db:push
# Re-seed
pnpm db:seed
```

### Console Errors

- Check browser DevTools (F12)
- Check terminal for server errors
- Verify .env file exists with DATABASE_URL

---

## Next Steps After Testing

1. **If tests pass:**
   - Mark Phase 2.2 as complete
   - Move to Phase 2.3: Quotation Management
   - Update project roadmap

2. **If issues found:**
   - Document issues in GitHub/Notion
   - Fix critical bugs
   - Re-test affected areas
   - Update completion summary

3. **Production readiness:**
   - Run full test suite: `pnpm test`
   - Check test coverage: `pnpm test:coverage`
   - Run build: `pnpm build`
   - Deploy to staging environment

---

## Testing Checklist

- [ ] Test 1: Payment list page
- [ ] Test 2: Payment detail page
- [ ] Test 3: Record payment form
- [ ] Test 4: Validation errors
- [ ] Test 5: Successful payment
- [ ] Test 6: Payment filters
- [ ] Test 7: Pagination
- [ ] Test 8: Fully paid protection
- [ ] Test 9: Payment verification
- [ ] Test 10: Status transitions

**Tester:** ******\_\_\_******
**Date:** ******\_\_\_******
**Environment:** Development
**Browser:** ******\_\_\_******
**Result:** ⬜ Pass ⬜ Fail

---

**Ready to test!** 🚀

Server running at: **http://localhost:3000**

# TypeScript Errors - Fix List

**Generated:** December 19, 2025
**Validation Command:** `bun run lint`
**Total Errors:** 90+
**Priority:** HIGH (blocks production deployment)

---

## Critical Errors (Production Code)

### 1. `src/actions/reports.ts` (Highest Priority)

**Error:** Missing exports in `@/lib/action-utils`
```
error TS2305: Module '"@/lib/action-utils"' has no exported member 'requireUser'.
error TS2724: '"@/lib/action-utils"' has no exported member named 'createServerAction'. Did you mean 'createAction'?
```

**Impact:** Analytics dashboard will not work
**Fix:**
- Check if `requireUser` and `createServerAction` exist in `src/lib/action-utils.ts`
- If not, use correct import (likely `createAction` instead of `createServerAction`)
- Or add these exports if they're missing

**Affected Features:**
- Revenue analytics
- Invoice analytics
- Customer analytics
- Contract analytics

---

### 2. `src/actions/quotations.ts` - VIEWED Status

**Error:** `VIEWED` status not in enum
```
error TS2322: Type '"VIEWED"' is not assignable to type 'QuotationStatus'.
```

**Lines:** 911, 1007
**Impact:** Quotation view tracking broken
**Fix:**
- Add `VIEWED` to `QuotationStatus` enum in Prisma schema
- OR remove VIEWED status tracking if not needed
- Re-generate Prisma client after schema change

**Related Files:**
- `src/app/(dashboard)/quotations/[id]/page.tsx` (lines 42, 55)
- `src/app/(dashboard)/quotations/page.tsx` (lines 41, 54)

---

### 3. `src/actions/quotations.ts` - Update Schema Mismatch

**Error:** Type mismatch in quotation update
```
error TS2322: Type '{ proposedDeposit?: number | Prisma.Decimal | null | undefined; ... }' is not assignable to type 'QuotationUpdateInput'
```

**Line:** 511
**Impact:** Editing quotations may fail
**Fix:**
- Remove `customerId` from update data (likely shouldn't be editable)
- Ensure update schema matches Prisma type

---

### 4. `src/actions/quotations.ts` - Null Values

**Error:** Null not assignable to formatCurrency parameter
```
error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'string | number'.
```

**Lines:** 523, 526
**Impact:** Display errors when deposit/monthly fee is null
**Fix:** Add null check
```typescript
formatCurrencyDecimal(quotation.proposedDeposit ?? 0)
formatCurrencyDecimal(quotation.proposedMonthlyFee ?? 0)
```

---

### 5. `src/actions/reports.ts` - Missing Customer Fields

**Error:** `email` property doesn't exist in CustomerSelect
```
error TS2353: Object literal may only specify known properties, and 'email' does not exist in type 'CustomerSelect<DefaultArgs>'.
```

**Lines:** 311, 548
**Impact:** Analytics customer data incomplete
**Fix:** Use correct field name:
- Change `email: true` to `contactEmail: true`
- OR add `email` field to Customer model if needed

---

### 6. `src/app/(dashboard)/quotations/[id]/page.tsx` - Missing Import

**Error:** Cannot find name `XCircle`
```
error TS2304: Cannot find name 'XCircle'.
```

**Line:** 353
**Impact:** UI component won't render (likely reject button)
**Fix:** Import from lucide-react
```typescript
import { XCircle } from "lucide-react"
```

---

### 7. `src/app/(dashboard)/quotations/[id]/page.tsx` - Customer Field Mismatch

**Error:** Customer object missing expected properties
```
error TS2339: Property 'email' does not exist on type '{ id, code, companyName, ... }'
error TS2339: Property 'phone' does not exist on type '{ id, code, companyName, ... }'
```

**Lines:** 114, 117, 120, 123
**Impact:** Customer contact info not displayed
**Fix:** Use correct field names:
- `email` → `contactEmail`
- `phone` → `contactPhone`

---

### 8. `src/app/(dashboard)/quotations/new/page.tsx` - Missing Parameters

**Error:** Missing required sortBy and sortOrder parameters
```
error TS2345: Type '{ page: number; limit: number; }' is missing properties: sortBy, sortOrder
```

**Lines:** 14 (getPlantTypes), 44 (getCustomers)
**Impact:** Create quotation page won't load data
**Fix:** Add required parameters
```typescript
const plantTypesResult = await getPlantTypes({
  page: 1,
  limit: 1000,
  sortBy: "name",
  sortOrder: "asc",
});
```

---

### 9. `src/app/(dashboard)/analytics/page.tsx` - Implicit Any

**Error:** Parameter implicitly has 'any' type
```
error TS7006: Parameter 'customer' implicitly has an 'any' type.
```

**Line:** 190
**Impact:** Type safety compromised
**Fix:** Add type annotation
```typescript
customers.map((customer: { id: string; ... }) => (
  // OR create a type for the customer object
```

---

## Non-Critical Errors (Test Scripts)

### 10. Test Files (Acceptable for Now)

**Files:**
- `scripts/test-quotation-actions.ts` (30+ errors)
- `scripts/test-quotations.ts` (20+ errors)
- `src/actions/__tests__/invoice-payment-logic.test.ts`

**Impact:** Test scripts fail, but don't affect production
**Priority:** LOW (fix after browser testing)
**Note:** These are development tools, not production code

**Common Issues:**
- Server action return type mismatches (missing `.data`, `.success`, `.error`)
- Prisma schema changes not reflected in tests
- Decimal type handling

---

## Fix Priority

### Phase 1: Critical UI Blockers (30 minutes)
1. ✅ Fix `src/actions/reports.ts` - requireUser/createServerAction imports
2. ✅ Fix `src/app/(dashboard)/quotations/[id]/page.tsx` - XCircle import
3. ✅ Fix `src/app/(dashboard)/quotations/[id]/page.tsx` - customer email/phone fields
4. ✅ Fix `src/app/(dashboard)/quotations/new/page.tsx` - sortBy/sortOrder params
5. ✅ Fix `src/app/(dashboard)/analytics/page.tsx` - customer type annotation

### Phase 2: Backend Logic Fixes (45 minutes)
6. ✅ Fix `src/actions/quotations.ts` - VIEWED status (schema change + migration)
7. ✅ Fix `src/actions/quotations.ts` - null value handling
8. ✅ Fix `src/actions/quotations.ts` - update schema mismatch
9. ✅ Fix `src/actions/reports.ts` - customer email field

### Phase 3: Test Scripts (defer to later)
10. ⏳ Fix test files after browser testing confirms features work

---

## Validation Workflow

```bash
# After each fix
bun run lint

# Expected final result
# - 0 TypeScript errors in src/ directory
# - 179 console.log warnings (acceptable)
# - Test script errors (acceptable for now)

# Then run
bun run build

# Should complete successfully
```

---

## Impact Assessment

| Error Category | Severity | Production Impact | Browser Test Impact |
|----------------|----------|-------------------|---------------------|
| reports.ts imports | 🔴 Critical | Analytics won't load | Tests will fail |
| quotations VIEWED status | 🟡 High | View tracking broken | May cause errors |
| quotations null values | 🟡 High | Display errors | Tests may pass |
| Missing XCircle | 🟠 Medium | Button won't render | Visual issue |
| Customer field names | 🟠 Medium | Contact info missing | Visual issue |
| Missing sort params | 🔴 Critical | Page won't load | Tests will fail |
| Test scripts | 🟢 Low | None | None |

---

## Next Actions

1. **Fix Phase 1 errors** (required before browser testing)
2. **Run browser testing** (use checklist in `docs/browser-testing-checklist.md`)
3. **Fix Phase 2 errors** (based on browser testing findings)
4. **Revalidate** (`bun run lint` + `bun run build`)
5. **Deploy to staging**

---

## Code Review Notes

These errors were introduced during rapid development of:
- Analytics dashboard (Phase 3.3)
- Quotations system (Phase 2.3)

**Root causes:**
- Server action return type changes not propagated
- Prisma schema out of sync with code
- Missing TypeScript strict checks during development

**Prevention:**
- Run `bun run lint` before committing
- Use TypeScript strict mode
- Type all function returns
- Keep Prisma schema in sync

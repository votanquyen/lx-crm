# Phase 04: Type Safety & Validation

**Priority:** Medium (but touches all phases)
**Estimated Effort:** 3-4 days
**Dependencies:** Implement incrementally across Phases 01-03

## Scope

Eliminate `any` types, enforce chronological validation, add atomic transactions, strengthen Zod schemas.

## Issues to Fix

### 1. Type Bypasses with `any`
**File:** `src/app/api/schedules/[id]/briefing/route.ts:95`

**Problem:**
```typescript
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type definition missing - bypass with 'any'!
(doc as any).autoTable({
  head: [['Item', 'Quantity', 'Status']],
  body: tableData,
  startY: 60
});

const finalY = (doc as any).lastAutoTable.finalY;
```

**Risk:**
- Runtime errors if API changes
- No autocomplete/IntelliSense
- Breaks at runtime when property doesn't exist

**Fix:**

**Option A: Proper Type Definitions**
```typescript
// src/types/jspdf-autotable.d.ts
import 'jspdf';
import { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Now use with full type safety:
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const doc = new jsPDF();
doc.autoTable({
  head: [['Item', 'Quantity', 'Status']],
  body: tableData,
  startY: 60
});

const finalY = doc.lastAutoTable.finalY; // Type-safe!
```

**Option B: Type Assertion (if types unavailable)**
```typescript
// Still better than 'any' - documents expected shape
interface AutoTableDoc extends jsPDF {
  autoTable: (options: {
    head: string[][];
    body: unknown[][];
    startY: number;
  }) => void;
  lastAutoTable: {
    finalY: number;
  };
}

const doc = new jsPDF() as AutoTableDoc;
doc.autoTable({ ... }); // Type-checked against interface
```

### 2. Missing Chronological Validation
**File:** `src/actions/schedules.ts:300-450`

**Problem:**
```typescript
// No validation - can arrive AFTER completion!
export async function arriveAtSchedule(scheduleId: string) {
  await db.scheduleExecution.update({
    where: { scheduleId },
    data: { arrivedAt: new Date() }
    // Missing: arrivedAt must be BEFORE startedAt/completedAt
  });
}

export async function completeSchedule(scheduleId: string) {
  await db.scheduleExecution.update({
    where: { scheduleId },
    data: { completedAt: new Date() }
    // Missing: completedAt must be AFTER startedAt/arrivedAt
  });
}
```

**Invalid States Allowed:**
```
completedAt: 2025-12-19 10:00
startedAt:   2025-12-19 11:00  ← Started AFTER completion!
arrivedAt:   2025-12-19 12:00  ← Arrived AFTER everything!
```

**Fix:**
```typescript
// src/lib/validations/schedule.ts
import { z } from 'zod';

export function validateChronology(data: {
  arrivedAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}) {
  const { arrivedAt, startedAt, completedAt } = data;

  // Rule 1: arrivedAt < startedAt
  if (arrivedAt && startedAt && arrivedAt >= startedAt) {
    throw new Error(
      `arrivedAt (${arrivedAt.toISOString()}) must be before startedAt (${startedAt.toISOString()})`
    );
  }

  // Rule 2: startedAt < completedAt
  if (startedAt && completedAt && startedAt >= completedAt) {
    throw new Error(
      `startedAt (${startedAt.toISOString()}) must be before completedAt (${completedAt.toISOString()})`
    );
  }

  // Rule 3: arrivedAt < completedAt
  if (arrivedAt && completedAt && arrivedAt >= completedAt) {
    throw new Error(
      `arrivedAt (${arrivedAt.toISOString()}) must be before completedAt (${completedAt.toISOString()})`
    );
  }

  return true;
}

// Usage in actions:
export async function completeSchedule(scheduleId: string, data: CompleteData) {
  const execution = await db.scheduleExecution.findUnique({
    where: { scheduleId }
  });

  // Validate before update
  validateChronology({
    arrivedAt: execution.arrivedAt,
    startedAt: execution.startedAt,
    completedAt: new Date() // New completion time
  });

  await db.scheduleExecution.update({
    where: { scheduleId },
    data: { completedAt: new Date() }
  });
}
```

### 3. Non-Atomic Updates (Race Condition)
**File:** `src/actions/schedules.ts:400-430` (completeSchedule)

**Problem:**
```typescript
export async function completeSchedule(scheduleId: string, data: CompleteData) {
  // Step 1: Update execution
  await db.scheduleExecution.update({
    where: { scheduleId },
    data: {
      completedAt: new Date(),
      afterPhotos: data.photos,
      notes: data.notes
    }
  });

  // Step 2: Update schedule status (SEPARATE transaction!)
  await db.schedule.update({
    where: { id: scheduleId },
    data: { status: 'COMPLETED' }
  });

  // RACE CONDITION: If crash between steps, inconsistent state!
  // - execution.completedAt set
  // - schedule.status still 'IN_PROGRESS'
}
```

**Fix (Atomic Transaction):**
```typescript
export async function completeSchedule(scheduleId: string, data: CompleteData) {
  return await db.$transaction(async (tx) => {
    // Step 1: Fetch current state
    const execution = await tx.scheduleExecution.findUnique({
      where: { scheduleId },
      include: { schedule: true }
    });

    // Step 2: Validate chronology
    validateChronology({
      arrivedAt: execution.arrivedAt,
      startedAt: execution.startedAt,
      completedAt: new Date()
    });

    // Step 3: Update execution
    const updated = await tx.scheduleExecution.update({
      where: { scheduleId },
      data: {
        completedAt: new Date(),
        afterPhotos: data.photos,
        notes: data.notes
      }
    });

    // Step 4: Update schedule status
    await tx.schedule.update({
      where: { id: scheduleId },
      data: { status: 'COMPLETED' }
    });

    return updated;
  }, {
    isolationLevel: 'Serializable', // Prevent concurrent modifications
    timeout: 10000 // 10s timeout
  });
}
```

### 4. Weak Zod Schemas
**File:** `src/lib/validations/schedule.ts`

**Problem:**
```typescript
// Too permissive - allows empty strings, future dates
export const completeScheduleSchema = z.object({
  notes: z.string().optional(),
  photos: z.array(z.string().url()).optional()
  // Missing: max length, format validation, business rules
});
```

**Fix:**
```typescript
export const completeScheduleSchema = z.object({
  notes: z
    .string()
    .max(1000, 'Notes too long (max 1000 chars)')
    .optional(),

  photos: z
    .array(
      z.string()
        .regex(
          /^schedules\/[\w-]+\/[\w-]+\.(jpg|jpeg|png)$/,
          'Invalid photo path format'
        )
        .max(200, 'Photo path too long')
    )
    .max(10, 'Maximum 10 photos allowed')
    .optional(),

  completedAt: z
    .date()
    .max(new Date(), 'Completion date cannot be in future')
    .optional()
    .default(() => new Date()),

  // Business rule: Must provide either notes OR photos
}).refine(
  (data) => data.notes || (data.photos && data.photos.length > 0),
  {
    message: 'Must provide notes or photos when completing schedule',
    path: ['notes']
  }
);

// Usage with type inference:
type CompleteScheduleData = z.infer<typeof completeScheduleSchema>;

export async function completeSchedule(
  scheduleId: string,
  rawData: unknown // Accept unknown, validate inside
): Promise<ScheduleExecution> {
  // Validate & parse
  const data = completeScheduleSchema.parse(rawData);

  // Now 'data' is fully typed and validated!
  return await db.$transaction(async (tx) => {
    // ... implementation ...
  });
}
```

## Implementation Steps

### Step 1: Type Definition Audit (Day 1)
1. Find all `any` types:
   ```bash
   rg '\bas any\b' src/ --type ts
   ```

2. Categorize:
   - **External libraries**: Create `.d.ts` type definitions
   - **Legacy code**: Add proper interfaces
   - **Quick fixes**: Use type assertions with documented shape

3. Create `src/types/` directory:
   ```
   src/types/
   ├── jspdf-autotable.d.ts
   ├── prisma-extensions.d.ts
   └── global.d.ts
   ```

### Step 2: Chronological Validation (Day 2)
1. Create `src/lib/validations/chronology.ts`:
   ```typescript
   export class ChronologyValidator {
     static validate(data: TimelineData): ValidationResult {
       const errors: string[] = [];

       if (data.arrivedAt && data.startedAt) {
         if (data.arrivedAt >= data.startedAt) {
           errors.push('Arrived time must be before start time');
         }
       }

       // ... more rules ...

       return {
         valid: errors.length === 0,
         errors
       };
     }

     static assert(data: TimelineData): void {
       const result = this.validate(data);
       if (!result.valid) {
         throw new ValidationError(result.errors.join('; '));
       }
     }
   }
   ```

2. Add to all schedule state transitions:
   - `arriveAtSchedule()`
   - `startSchedule()`
   - `completeSchedule()`

3. Add database constraint (optional):
   ```sql
   -- Prisma migration
   ALTER TABLE schedule_executions
   ADD CONSTRAINT check_chronology
   CHECK (
     (arrived_at IS NULL OR started_at IS NULL OR arrived_at < started_at)
     AND (started_at IS NULL OR completed_at IS NULL OR started_at < completed_at)
     AND (arrived_at IS NULL OR completed_at IS NULL OR arrived_at < completed_at)
   );
   ```

### Step 3: Transaction Boundaries (Day 3)
1. Identify non-atomic operations:
   ```bash
   # Find multiple await db calls without $transaction
   rg 'await db\.\w+\.(update|create|delete)' src/actions/ -A 5
   ```

2. Wrap in transactions:
   ```typescript
   // Pattern: Read → Validate → Write (atomic)
   await db.$transaction(async (tx) => {
     const data = await tx.model.findUnique(...);
     validate(data);
     return await tx.model.update(...);
   });
   ```

3. Add optimistic locking (prevent concurrent edits):
   ```typescript
   // Add version field to schema
   model ScheduleExecution {
     version Int @default(0)
   }

   // Increment on update
   await tx.scheduleExecution.update({
     where: {
       scheduleId,
       version: currentVersion // Fails if version changed
     },
     data: {
       completedAt: new Date(),
       version: { increment: 1 }
     }
   });
   ```

### Step 4: Strengthen Zod Schemas (Day 4)
1. Add business rule validations:
   ```typescript
   // src/lib/validations/schedule.ts
   export const scheduleSchema = z.object({
     scheduledDate: z.date()
       .min(new Date(), 'Cannot schedule in the past')
       .max(
         addMonths(new Date(), 6),
         'Cannot schedule more than 6 months ahead'
       ),

     maintenanceItems: z.array(maintenanceItemSchema)
       .min(1, 'At least one maintenance item required')
       .max(50, 'Too many items (max 50)'),

     estimatedDuration: z.number()
       .int()
       .min(15, 'Minimum 15 minutes')
       .max(480, 'Maximum 8 hours')
   }).refine(
     (data) => {
       // Business rule: High-priority schedules need short duration
       if (data.priority === 'HIGH' && data.estimatedDuration > 120) {
         return false;
       }
       return true;
     },
     {
       message: 'High-priority schedules must be ≤ 2 hours',
       path: ['estimatedDuration']
     }
   );
   ```

2. Add runtime validation to all actions:
   ```typescript
   export async function createSchedule(rawData: unknown) {
     const data = scheduleSchema.parse(rawData); // Throws on invalid
     // ... proceed with typed data ...
   }
   ```

## Testing Checklist

- [ ] TypeScript compiles with `strict: true` (no errors)
- [ ] No `any` types in schedule-related code
- [ ] Chronological validation rejects invalid timestamps
- [ ] Concurrent completions handled correctly (one wins)
- [ ] Transaction rollback works (simulate crash mid-update)
- [ ] Zod schemas reject invalid business rules
- [ ] Form validation shows helpful error messages

## Success Criteria

- Zero `any` types in schedule execution code
- All state transitions validate chronology
- All multi-step operations use transactions
- Zod schemas enforce business rules

## Type Safety Metrics

| Metric | Before | Target |
|--------|--------|--------|
| `any` count | 15 | 0 |
| Type coverage | ~80% | 100% |
| Transaction usage | 30% | 100% (multi-step ops) |
| Zod validation | Basic | Business rules enforced |

## Unresolved Questions

- Should we add database-level CHECK constraints (in addition to Zod)?
- Do we need optimistic locking (version field)?
- Should chronology validation be server-side only or also client-side?
- Which transaction isolation level (ReadCommitted vs Serializable)?

# Phase 02: Performance Optimization

**Priority:** High
**Estimated Effort:** 3-4 days
**Dependencies:** Phase 01 (security first)

## Scope

Eliminate memory bottlenecks, enable large dataset handling, prevent timeout failures in CSV/PDF generation.

## Issues to Fix

### 1. Non-Streaming CSV Export
**File:** `src/app/api/schedules/export/route.ts:30-70`

**Problem:**
```typescript
// Loads ALL schedules into memory at once!
const schedules = await db.schedule.findMany({
  include: { contract: { include: { customer: true } } }
  // No pagination, no limit!
});

// Builds entire CSV string in memory
let csv = headers.join(',') + '\n';
schedules.forEach(schedule => {
  csv += row.join(',') + '\n'; // O(n) string concatenation
});

return new Response(csv, { ... }); // May exceed V8 heap limit
```

**Impact:**
- 10K schedules ≈ 50MB RAM
- 100K schedules → heap overflow crash

**Fix (Streaming):**
```typescript
import { Readable } from 'stream';

export async function GET(request: Request) {
  const session = await requireAuth();

  // Stream-compatible generator
  async function* generateCSVRows() {
    // Yield header
    yield 'ID,Customer,Date,Status,Notes\n';

    // Paginated fetch
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const schedules = await db.schedule.findMany({
        skip: page * pageSize,
        take: pageSize,
        include: { contract: { include: { customer: true } } },
        orderBy: { scheduledDate: 'asc' }
      });

      if (schedules.length === 0) break;

      for (const schedule of schedules) {
        const row = [
          schedule.id,
          sanitizeCSVCell(schedule.contract.customer.name),
          schedule.scheduledDate.toISOString(),
          schedule.status,
          sanitizeCSVCell(schedule.notes)
        ];
        yield row.join(',') + '\n';
      }

      page++;
    }
  }

  // Convert generator to ReadableStream
  const stream = Readable.from(generateCSVRows());

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="schedules.csv"',
      'Transfer-Encoding': 'chunked'
    }
  });
}
```

### 2. Missing Query Pagination
**File:** `src/actions/schedules.ts:50-80` (getSchedules)

**Problem:**
```typescript
// Unbounded query - returns ALL schedules!
export async function getSchedules(filters?: ScheduleFilters) {
  return await db.schedule.findMany({
    where: buildWhereClause(filters),
    include: { contract: { include: { customer: true } } }
    // Missing: take, skip
  });
}
```

**Impact:**
- UI freezes rendering 10K+ rows
- API timeout on slow connections

**Fix:**
```typescript
export async function getSchedules(params: {
  filters?: ScheduleFilters;
  page?: number;
  pageSize?: number;
}) {
  const { filters, page = 1, pageSize = 50 } = params;

  const where = buildWhereClause(filters);

  const [schedules, total] = await db.$transaction([
    db.schedule.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { contract: { include: { customer: true } } },
      orderBy: { scheduledDate: 'desc' }
    }),
    db.schedule.count({ where })
  ]);

  return {
    data: schedules,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
```

### 3. Synchronous PDF Generation
**File:** `src/app/api/schedules/[id]/briefing/route.ts:40-120`

**Problem:**
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Blocks entire process until PDF complete!
  const pdfBytes = await generateBriefingPDF(schedule);

  // Timeout risk on large schedules (50+ maintenance items)
  return new Response(pdfBytes, { ... });
}
```

**Impact:**
- 30s timeout on Vercel/Netlify
- Client has no progress indicator (appears frozen)

**Fix (Async with Progress):**

**Option A: Background Job + Polling**
```typescript
// 1. Trigger PDF generation (returns job ID)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAuth();

  const jobId = nanoid();

  // Start background job
  await queue.enqueue('generate-pdf', {
    jobId,
    scheduleId: params.id,
    userId: session.user.id
  });

  return Response.json({ jobId, status: 'processing' });
}

// 2. Poll job status
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  const job = await queue.getJob(jobId);

  if (job.status === 'completed') {
    // Serve from temp storage
    const pdfBytes = await storage.get(job.outputPath);
    return new Response(pdfBytes, {
      headers: { 'Content-Type': 'application/pdf' }
    });
  }

  return Response.json({
    status: job.status,
    progress: job.progress // e.g., "Rendering page 3/5"
  });
}
```

**Option B: Streaming PDF (Advanced)**
```typescript
// Use pdf-lib's streaming API (if available)
import { PDFDocument } from 'pdf-lib';
import { Readable } from 'stream';

async function* generatePDFStream(schedule: Schedule) {
  const pdfDoc = await PDFDocument.create();

  // Yield chunks as pages are rendered
  for (const item of schedule.maintenanceItems) {
    const page = pdfDoc.addPage();
    // ... render page ...

    // Yield partial PDF bytes
    const partialBytes = await pdfDoc.saveAsBytes();
    yield partialBytes;
  }
}

// Return streaming response
const stream = Readable.from(generatePDFStream(schedule));
return new Response(stream as any, {
  headers: { 'Content-Type': 'application/pdf' }
});
```

### 4. ArrayBuffer Memory Spikes
**File:** Client-side photo upload logic

**Problem:**
```typescript
// Mobile Safari crashes on large photos
const photoBlob = await fetch(photoUrl).then(r => r.blob());
const arrayBuffer = await photoBlob.arrayBuffer(); // 10MB+ spike!

// Convert to base64 (doubles memory usage)
const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
```

**Fix (Chunked Processing):**
```typescript
// Use FileReader streams (avoids full ArrayBuffer)
async function uploadPhotoChunked(file: File, signedUrl: string) {
  const chunkSize = 256 * 1024; // 256KB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // Upload chunk
    await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`
      },
      body: chunk
    });

    // Report progress
    onProgress((i + 1) / totalChunks);
  }
}
```

## Implementation Steps

### Step 1: Streaming CSV (Day 1)
1. Create `src/lib/csv-stream.ts` with generator function
2. Update `src/app/api/schedules/export/route.ts`
3. Add integration test with 10K mock schedules

### Step 2: Pagination Everywhere (Day 2)
1. Update `getSchedules()` action with pagination params
2. Update UI components to use pagination:
   - `src/components/schedules/schedule-list.tsx`
   - Add `<Pagination>` component from shadcn/ui
3. Add query param support: `?page=2&pageSize=100`

### Step 3: Async PDF Generation (Day 3)
1. Evaluate: Background job queue vs. streaming
2. If background job:
   - Setup Redis/Upstash for job queue
   - Create worker: `src/workers/pdf-generator.ts`
   - Add polling UI: `<PDFGenerationProgress>`
3. If streaming:
   - Research pdf-lib streaming capabilities
   - Implement chunked PDF response

### Step 4: Photo Upload Optimization (Day 4)
1. Implement chunked upload in client
2. Add progress indicator: `<PhotoUploadProgress percent={75} />`
3. Add client-side image compression (before upload):
   ```typescript
   import imageCompression from 'browser-image-compression';

   const compressed = await imageCompression(file, {
     maxSizeMB: 1,
     maxWidthOrHeight: 1920,
     useWebWorker: true
   });
   ```

## Testing Checklist

- [ ] CSV export handles 50K schedules without memory error
- [ ] Memory usage stays <500MB during CSV generation
- [ ] Pagination returns correct page counts
- [ ] Page navigation preserves filters
- [ ] PDF generation completes within 30s timeout
- [ ] Progress indicator updates during PDF generation
- [ ] Photo upload shows progress bar
- [ ] Mobile Safari handles 10MB photos without crash

## Success Criteria

- CSV export streams (constant memory usage)
- All list views paginated (max 100 items/page)
- PDF generation non-blocking (job queue or streaming)
- Photo uploads report progress

## Performance Targets

| Metric | Before | Target |
|--------|--------|--------|
| CSV 10K schedules | 2GB RAM | <200MB RAM |
| Query response time | 5s | <500ms |
| PDF generation (50 items) | 45s | <15s |
| Photo upload feedback | None | Live progress |

## Unresolved Questions

- Which job queue (BullMQ, Upstash QStash, Trigger.dev)?
- Should we cache generated PDFs (Redis TTL 1h)?
- Do we need database query result caching?

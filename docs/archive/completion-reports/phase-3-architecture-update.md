# Architecture Update: Self-Hosted Deployment

**Date:** 2025-12-19
**Update:** Phase 3 adapted for self-hosted infrastructure

---

## Changes from Original Plan

### ✅ What Changed

| Component | Original | Updated | Reason |
|-----------|----------|---------|--------|
| **Photo Storage** | Vercel Blob | MinIO S3 | Self-hosted deployment |
| **GPS Tracking** | Required (100m) | Not needed | Workflow doesn't require it |
| **Deployment** | Vercel | Self-hosted | Your infrastructure |

### ❌ What Was Removed

- Vercel Blob dependency (`@vercel/blob`)
- GPS tracking features (geolocation API)
- Check-in/check-out location validation
- GPS accuracy tolerance settings

### ✅ What Was Added

- MinIO S3 client (`@aws-sdk/client-s3`)
- S3 upload utilities (`src/lib/storage/s3-client.ts`)
- Photo upload API (`src/app/api/upload/route.ts`)
- MinIO environment configuration

---

## Implementation Impact

### Simplified Features

**Care Schedule Management:**
- ~~GPS check-in/out~~ → Manual check-in/out buttons
- ~~Location validation~~ → Trust-based completion
- ~~Distance calculations~~ → Not needed
- Photo uploads → Still supported (via MinIO)

**Exchange Execution:**
- ~~GPS tracking~~ → Manual status updates
- ~~Location verification~~ → Staff responsibility
- Photo documentation → Still required (MinIO)

### New Infrastructure Requirements

**MinIO Setup:**
```bash
# Docker Compose (example)
minio:
  image: minio/minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
```

**Bucket Creation:**
```bash
# Using mc (MinIO Client)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/locxanh-photos
mc anonymous set download local/locxanh-photos
```

---

## Environment Configuration

**Required Variables:**
```bash
# Google Maps
GOOGLE_MAPS_API_KEY=your_key_here

# MinIO S3
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=locxanh-photos
MINIO_PUBLIC_URL=http://localhost:9000/locxanh-photos
```

**Not Required:**
- ~~`BLOB_READ_WRITE_TOKEN`~~ (Vercel Blob)
- ~~`GPS_CHECK_IN_RADIUS_METERS`~~ (GPS tracking)

---

## Code Changes

### New Files
- `src/lib/storage/s3-client.ts` - S3 upload utilities
- `src/app/api/upload/route.ts` - Photo upload endpoint

### Modified Files
- `docs/phase-3-architecture-decisions.md` - Updated decisions
- `plans/251219-phase3-route-care-implementation.md` - Updated plan
- `plans/reports/251219-phase3-day1-summary.md` - Updated summary

### Removed Dependencies
```bash
bun remove @vercel/blob
```

### Added Dependencies
```bash
bun add @aws-sdk/client-s3
```

---

## Testing Changes

### Removed Tests
- GPS accuracy validation
- Location check-in/out
- Distance calculations

### New Tests Required
- MinIO upload functionality
- S3 presigned URL generation
- File size validation
- Image type validation

---

## Deployment Notes

**Before First Deploy:**
1. Setup MinIO server
2. Create `locxanh-photos` bucket
3. Configure bucket public read access
4. Add environment variables
5. Test upload endpoint

**Production Considerations:**
- Use proper MinIO credentials (not default)
- Enable SSL for MINIO_ENDPOINT
- Configure CDN for photo serving (optional)
- Setup backup for MinIO data volume
- Monitor storage usage

---

## Benefits of Changes

✅ **Simplified:**
- No GPS complexity
- No Vercel vendor lock-in
- Easier mobile implementation

✅ **Self-Hosted:**
- Full data control
- No external dependencies
- Lower operational costs
- Predictable scaling

✅ **Standard S3 API:**
- Easy to migrate to AWS S3 later
- Compatible with many S3 tools
- Well-documented SDK

---

## Next Steps

Same as original plan, just without GPS features:

**Day 2: Route Planning**
- Daily schedule creation
- Google Maps integration
- Route optimization
- Morning briefing PDF

**Day 3: Care Schedule**
- Calendar view
- Manual check-in/out (no GPS)
- Photo upload (MinIO)
- Work reports

**Day 4: Testing & Polish**
- Browser testing
- Mobile testing (simpler without GPS)
- Documentation
- Deployment prep

---

**Status:** ✅ Architecture updated, ready to continue implementation

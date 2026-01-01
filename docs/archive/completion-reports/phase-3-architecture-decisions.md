# Phase 3 Architecture Decisions

**Date:** 2025-12-19
**Phase:** 3.1 & 3.2 (Route Planning & Care Schedule)

## Decisions Made

### 1. Route Optimization: Google Maps Only ✅
**Decision:** Use Google Maps Directions API only (no OR-Tools)

**Rationale:**
- Simpler integration, faster to market
- Sufficient for current needs (< 20 stops/day)
- Lower complexity, easier maintenance
- OR-Tools deferred to Phase 4 if optimization needs improve

**Implementation:**
- `@googlemaps/google-maps-services-js` package
- Client-side route visualization with `@react-google-maps/api`
- Server-side optimization API route

---

### 2. Photo Storage: MinIO (S3-Compatible) ✅
**Decision:** Use MinIO self-hosted S3-compatible storage

**Rationale:**
- Self-hosted deployment (not Vercel)
- Full control over data and costs
- S3-compatible API (standard)
- Can use existing infrastructure
- No external service dependencies

**Implementation:**
- `@aws-sdk/client-s3` package for S3 operations
- MinIO bucket configuration
- `/api/upload` route for photo uploads
- Public URLs via MinIO proxy or CDN

---

### 3. GPS Tracking: Not Required ✅
**Decision:** Skip GPS tracking features

**Rationale:**
- Not needed for current workflow
- Simplifies mobile implementation
- Reduces complexity and development time
- Can be added later if requirements change

**Implementation:**
- No geolocation API integration
- No check-in/check-out GPS validation
- Focus on schedule management only
- Manual status updates by staff

---

### 4. Morning Briefing Export: PDF Primary ✅
**Decision:** PDF generation (Google Sheets deferred)

**Rationale:**
- PDF for immediate printing (morning briefing workflow)
- No Google Sheets API setup overhead
- Simpler implementation with jsPDF
- Google Sheets integration deferred to Phase 4

**Implementation:**
- `jspdf` for client-side PDF generation
- Morning briefing template with route map
- Print-friendly format

---

## Environment Variables Required

```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=your_api_key_here

# MinIO S3 Storage (External Host Supported)
MINIO_ENDPOINT=https://minio.yourserver.com  # External MinIO server
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=locxanh-photos
MINIO_USE_SSL=true  # Set to true for HTTPS

# Public URL for accessing uploaded files
# Use your external MinIO domain with bucket name
MINIO_PUBLIC_URL=https://minio.yourserver.com/locxanh-photos

# Optional: Region (default: us-east-1)
MINIO_REGION=us-east-1
```

**External MinIO Setup Notes:**
- MinIO can be hosted on separate server from your VPS
- Use full URL in `MINIO_ENDPOINT` (include protocol)
- Set `MINIO_USE_SSL=true` for HTTPS connections
- Configure CORS on MinIO for browser uploads
- Ensure MinIO server is accessible from VPS

---

## Dependencies to Install

```bash
bun add @googlemaps/google-maps-services-js
bun add @react-google-maps/api
bun add @aws-sdk/client-s3
bun add jspdf
bun add date-fns
```

---

## Future Considerations (Phase 4+)

- OR-Tools for advanced route optimization (Python service)
- Google Sheets integration for collaborative planning
- MinIO for self-hosted storage (cost optimization)
- Real-time GPS tracking with WebSocket
- Offline support for mobile app (PWA)

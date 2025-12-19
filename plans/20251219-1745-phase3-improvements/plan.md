# Phase 3 Post-Implementation Improvement Plan

**Created:** 2025-12-19
**Status:** Draft
**Complexity:** High (Security + Performance + I18n)

## Overview

Systematic remediation of critical vulnerabilities and quality issues identified in Phase 3 schedule execution implementation. Addresses security gaps, performance bottlenecks, Vietnamese text support, and type safety violations.

## Problem Statement

Phase 3 delivered schedule execution functionality but exposed critical gaps:
- **Security**: Unauthenticated API routes, CSV injection vectors, unrestricted photo uploads
- **Performance**: Memory spikes from non-streaming exports, unbounded queries
- **I18n**: Vietnamese diacritics broken in PDF generation, Excel encoding issues
- **Type Safety**: `any` type bypasses, missing validation on state transitions

## Phases

### [Phase 01: Security Fixes](phase-01-security-fixes.md) ⚠️ **CRITICAL**
- API route authentication/authorization
- CSV injection prevention
- Photo upload validation + signed URLs
- State transition access control

### [Phase 02: Performance Optimization](phase-02-performance-optimization.md)
- Streaming CSV exports
- Pagination for large datasets
- Async PDF generation with progress tracking
- Database query optimization

### [Phase 03: Vietnamese Support](phase-03-vietnamese-support.md)
- jsPDF font embedding (Roboto/Noto Sans)
- UTF-8 BOM for Excel CSV compatibility
- Currency formatting fixes

### [Phase 04: Type Safety](phase-04-type-safety.md)
- Remove `any` type bypasses
- Chronological validation (arrivedAt < startedAt < completedAt)
- Atomic transaction boundaries
- Zod schema enforcement

## Success Criteria

- [ ] All API routes require authentication
- [ ] CSV injection tests pass (=, +, -, @ neutralized)
- [ ] Photos use relative paths + signed URLs
- [ ] CSV export handles 10K+ rows without memory issues
- [ ] Vietnamese diacritics render correctly in PDFs
- [ ] Excel opens CSV with correct encoding (no gibberish)
- [ ] No `any` types in schedule execution code
- [ ] Race condition tests pass (concurrent completions)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing schedules | High | Feature flags, gradual rollout |
| PDF font size increase | Medium | Subset embedding, compress font |
| CSV format incompatibility | Medium | Keep legacy export option |
| Type errors in production | High | Comprehensive test coverage first |

## Dependencies

- Phase 01 MUST complete before Phase 02 (security before features)
- Phase 03 independent (can run parallel to Phase 02)
- Phase 04 touches all phases (plan last, execute incrementally)

## Unresolved Questions

- Do we support offline photo uploads (queue + retry)?
- Should we archive original CSVs before injection fixes (audit trail)?
- Which Vietnamese font variant (Regular/Medium/Bold subset)?

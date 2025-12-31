# CI/CD Quick Reference

Quick commands and checks for developers working with the CI/CD pipeline.

---

## Pre-Push Checklist

Run these commands locally before pushing to ensure CI will pass:

```bash
# Option 1: Run full validation (recommended)
bun run validate

# Option 2: Run checks individually
bunx eslint . --ext .ts,.tsx --max-warnings 0  # Lint
bunx prettier --check .                         # Format check
bunx tsc --noEmit                               # Type check
bun test --coverage                             # Tests
bun run build                                   # Build
```

---

## Fix Common Issues

### Auto-fix Linting and Formatting

```bash
bun run lint:fix
```

### View Test Coverage

```bash
bun test --coverage
```

### Check Type Errors

```bash
bunx tsc --noEmit
```

---

## CI Status Badges

Add to README.md:

```markdown
![CI](https://github.com/{org}/{repo}/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/{org}/{repo}/branch/main/graph/badge.svg)](https://codecov.io/gh/{org}/{repo})
```

---

## GitHub Actions Commands

```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed

# Watch running workflow
gh run watch
```

---

## Coverage Thresholds

| Phase | Functions | Lines |
|-------|-----------|-------|
| Phase 1 (Current) | ≥40% | ≥40% |
| Phase 2 (Next) | ≥60% | ≥60% |
| Phase 3 (Final) | ≥80% | ≥80% |

**Current Coverage:** 94.55% functions, 97.50% lines ✅

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| Lint errors | `bun run lint:fix` |
| Format errors | `bunx prettier --write .` |
| Type errors | Fix TypeScript issues |
| Test failures | Fix tests or code |
| Build failures | Check `.env` and Prisma client |

---

## Required Secrets

| Secret | Purpose | Required? |
|--------|---------|-----------|
| CODECOV_TOKEN | Coverage reports | ✅ Yes |
| SNYK_TOKEN | Security scan | ❌ Optional |

---

## Workflow Jobs

1. **Setup** - Install dependencies (~10s)
2. **Lint** - Code quality (~30s)
3. **Type Check** - TypeScript (~40s)
4. **Test** - Run tests (~60s)
5. **Build** - Production build (~3min)
6. **E2E** - Playwright tests (~2min, optional)
7. **Security** - Audit dependencies (~30s)
8. **CI Success** - Final gate

**Total Time:** ~3-5 minutes

---

## More Info

See `docs/ci-cd-pipeline.md` for complete documentation.

# CI/CD Pipeline Documentation

Automated continuous integration and deployment pipeline for Lộc Xanh Plant Rental CRM.

---

## Table of Contents

- [Overview](#overview)
- [Pipeline Architecture](#pipeline-architecture)
- [Jobs and Stages](#jobs-and-stages)
- [Setup Instructions](#setup-instructions)
- [Secrets Configuration](#secrets-configuration)
- [Branch Strategy](#branch-strategy)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

The CI/CD pipeline automatically validates code quality, runs tests, and builds the application on every push and pull request. It ensures that only high-quality, tested code reaches production.

**Key Features:**

- ✅ **Parallel job execution** - Fast feedback (jobs run in parallel)
- ✅ **Dependency caching** - Faster builds with Bun cache
- ✅ **Test coverage reporting** - Automatic coverage comments on PRs
- ✅ **Security scanning** - Dependency vulnerability checks
- ✅ **Build validation** - Ensures deployable artifacts
- ✅ **Zero-downtime** - Cancels outdated runs automatically

**Trigger Events:**

- Push to `main`, `dev`, `master` branches
- Pull requests to `main`, `dev`, `master` branches

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline Flow                      │
└─────────────────────────────────────────────────────────────┘

Trigger (Push/PR)
       ↓
┌──────────────┐
│   Setup      │  Install dependencies, cache node_modules
└──────┬───────┘
       ↓
┌──────┴────────────────────────────────────┐
│         Parallel Quality Gates            │
├────────────┬──────────────┬───────────────┤
│   Lint     │  Type Check  │     Test      │
│  ESLint +  │  TypeScript  │  Vitest +     │
│  Prettier  │   tsc        │  Coverage     │
└────────┬───┴──────┬───────┴───────┬───────┘
         └──────────┴───────────────┘
                    ↓
            ┌───────────────┐
            │     Build     │  Next.js production build
            └───────┬───────┘
                    ↓
            ┌───────────────┐
            │   E2E Tests   │  Playwright (if config exists)
            └───────┬───────┘
                    ↓
            ┌───────────────┐
            │  CI Success   │  Final status check
            └───────────────┘
```

---

## Jobs and Stages

### 1. Setup (Dependency Installation)

**Purpose:** Install and cache dependencies for all subsequent jobs

**Steps:**

- Checkout code
- Setup Bun runtime
- Cache `node_modules` and Bun cache
- Install dependencies with `bun install --frozen-lockfile`

**Duration:** ~30-60s (first run), ~5-10s (cached)

**Cache Key:** `${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}`

---

### 2. Lint (Code Quality)

**Purpose:** Enforce code style and formatting standards

**Steps:**

- Run ESLint on `.ts` and `.tsx` files
- Check Prettier formatting
- Fail on any warnings (`--max-warnings 0`)

**Commands:**

```bash
bunx eslint . --ext .ts,.tsx --max-warnings 0
bunx prettier --check .
```

**Duration:** ~15-30s

**Failure Conditions:**

- ESLint errors or warnings
- Prettier formatting violations

---

### 3. Type Check (Type Safety)

**Purpose:** Validate TypeScript type safety

**Steps:**

- Generate Prisma client
- Run TypeScript compiler in check mode

**Commands:**

```bash
bunx prisma generate
bunx tsc --noEmit
```

**Duration:** ~20-40s

**Failure Conditions:**

- TypeScript compilation errors
- Missing type definitions

---

### 4. Test (Unit & Integration Tests)

**Purpose:** Run test suite with coverage reporting

**Steps:**

- Generate Prisma client
- Run Vitest with coverage
- Upload coverage to Codecov
- Comment coverage report on PRs

**Commands:**

```bash
bunx prisma generate
bun test --coverage
```

**Duration:** ~30-60s

**Coverage Targets:**

- Functions: ≥40% (Phase 1), ≥60% (Phase 2), ≥80% (Phase 3)
- Lines: ≥40% (Phase 1), ≥60% (Phase 2), ≥80% (Phase 3)

**Current Coverage:** 94.55% functions, 97.50% lines ✅

**Artifacts:**

- Coverage reports uploaded to Codecov
- PR comments with coverage diff

---

### 5. Build (Production Build)

**Purpose:** Validate production build succeeds

**Steps:**

- Create temporary `.env` file for build
- Generate Prisma client
- Build Next.js application

**Commands:**

```bash
bunx prisma generate
bun run build
```

**Duration:** ~2-4 minutes

**Environment Variables (CI Build):**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/locxanh_ci"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-for-ci-build-only"
GOOGLE_CLIENT_ID="test"
GOOGLE_CLIENT_SECRET="test"
```

**Artifacts:**

- Build output (`.next` directory)
- Retained for 7 days

---

### 6. E2E Tests (End-to-End) [Optional]

**Purpose:** Run Playwright E2E tests

**Conditions:** Only runs if `playwright.config.ts` exists

**Steps:**

- Install Playwright browsers (Chromium)
- Run E2E test suite

**Commands:**

```bash
bunx playwright install --with-deps chromium
bun run test:e2e
```

**Duration:** ~1-3 minutes

**Artifacts:**

- Playwright HTML report
- Screenshots/videos of failures

---

### 7. Security (Dependency Audit)

**Purpose:** Scan for security vulnerabilities

**Steps:**

- Run Bun dependency audit
- Run Snyk vulnerability scan (if token configured)

**Commands:**

```bash
bun audit
```

**Note:** Security checks don't fail the build to avoid blocking on low-severity issues

---

### 8. CI Success (Status Summary)

**Purpose:** Final gate requiring all critical jobs to pass

**Dependencies:** lint, typecheck, test, build

**Success Criteria:**

- ✅ All linting checks passed
- ✅ Type checking passed
- ✅ All tests passed with coverage targets met
- ✅ Production build succeeded

---

## Setup Instructions

### Initial Setup

1. **Enable GitHub Actions** (already enabled by default on GitHub)

2. **Add repository secrets** (Settings → Secrets and variables → Actions):

```bash
# Required for coverage reporting
CODECOV_TOKEN=your-codecov-token

# Optional for security scanning
SNYK_TOKEN=your-snyk-token
```

3. **Configure branch protection rules** (Settings → Branches):

```yaml
Branch name pattern: main
Require a pull request before merging: ✅
Require status checks to pass before merging: ✅
  - CI Success
  - Lint Code
  - Type Check
  - Run Tests
  - Build Application
```

### Local Testing

Test CI pipeline locally before pushing:

```bash
# Run all CI checks locally
bun run validate  # Combines typecheck + lint:fix + format:check

# Individual checks
bunx eslint . --ext .ts,.tsx --max-warnings 0
bunx prettier --check .
bunx tsc --noEmit
bun test --coverage
bun run build
```

---

## Secrets Configuration

### Required Secrets

**CODECOV_TOKEN**

- **Purpose:** Upload test coverage reports
- **How to get:**
  1. Sign up at https://codecov.io
  2. Add repository
  3. Copy token from repository settings
  4. Add to GitHub Secrets

**Example:**

```bash
# In GitHub: Settings → Secrets → New repository secret
Name: CODECOV_TOKEN
Value: paste-your-codecov-token-here
```

### Optional Secrets

**SNYK_TOKEN**

- **Purpose:** Security vulnerability scanning
- **How to get:**
  1. Sign up at https://snyk.io
  2. Go to Account Settings → General
  3. Copy API token
  4. Add to GitHub Secrets

---

## Branch Strategy

### Protected Branches

**main** (production)

- Requires PR approval
- Requires all CI checks to pass
- No direct pushes allowed

**dev** (development/staging)

- Requires all CI checks to pass
- Direct pushes allowed for maintainers

**Feature branches** (`feat/*`, `fix/*`, `docs/*`)

- CI runs on all pushes
- No protection rules

### Workflow

```bash
# Feature development
git checkout -b feat/my-feature
# Make changes, commit
git push origin feat/my-feature

# CI runs automatically
# → Lint, Type Check, Test, Build

# Create PR to dev
gh pr create --base dev

# CI runs again on PR
# → Includes coverage reporting on PR

# After approval, merge to dev
# → CI validates dev branch

# Deploy from dev to production
gh pr create --base main --title "Release: vX.X.X"

# After approval, merge to main
# → CI validates production build
```

---

## Troubleshooting

### Common Issues

#### 1. **Build Fails: "DATABASE_URL not found"**

**Cause:** Missing environment variables in CI

**Solution:** Build job creates temporary `.env` file automatically. If you see this error, check the "Create .env file for build" step in the workflow.

#### 2. **Tests Fail: "Cannot find module '@prisma/client'"**

**Cause:** Prisma client not generated

**Solution:** Ensure `bunx prisma generate` runs before tests. Check the "Generate Prisma client" step.

#### 3. **Coverage Below Threshold**

**Cause:** New code without sufficient tests

**Solution:**

```bash
# Check coverage locally
bun test --coverage

# Add tests to meet 40% threshold
# Focus on critical paths: db-utils, routes, invoices
```

#### 4. **ESLint Errors**

**Cause:** Code doesn't meet style guidelines

**Solution:**

```bash
# Auto-fix linting issues locally
bun run lint:fix

# Check what will fail in CI
bunx eslint . --ext .ts,.tsx --max-warnings 0
```

#### 5. **Type Errors**

**Cause:** TypeScript compilation errors

**Solution:**

```bash
# Check types locally
bunx tsc --noEmit

# Fix type errors in code
```

#### 6. **Cache Issues**

**Cause:** Stale dependency cache

**Solution:**

- Delete cache from GitHub Actions UI:
  1. Actions → Caches
  2. Delete outdated caches
- Or update `bun.lockb` to invalidate cache automatically

---

## Best Practices

### For Developers

**1. Run CI Checks Locally Before Pushing**

```bash
# Quick validation (runs all checks)
bun run validate

# Full CI simulation
bunx eslint . --ext .ts,.tsx --max-warnings 0 && \
bunx prettier --check . && \
bunx tsc --noEmit && \
bun test --coverage && \
bun run build
```

**2. Write Tests for New Features**

- Unit tests for utilities (`src/lib/__tests__/`)
- Integration tests for business logic (`src/actions/__tests__/`)
- Maintain ≥40% coverage

**3. Follow Conventional Commits**

```bash
feat(auth): add Google OAuth login
fix(invoices): correct payment calculation
test(db-utils): add decimal precision tests
docs(readme): update setup instructions
```

**4. Keep PRs Focused**

- One feature/fix per PR
- PR title follows conventional commit format
- Link related issues

**5. Monitor CI Feedback**

- Check CI results within 5-10 minutes
- Fix failures immediately
- Don't merge with failing CI

### For Maintainers

**1. Require CI Success for Merges**

- Configure branch protection rules
- Block merges with failing CI
- Require PR reviews

**2. Monitor Coverage Trends**

- Review Codecov reports weekly
- Ensure coverage doesn't decrease
- Target: maintain >90%

**3. Update Dependencies Regularly**

```bash
# Update dependencies monthly
bun update

# Run CI to catch breaking changes
git commit -am "chore: update dependencies"
git push
```

**4. Review Security Alerts**

- Check Snyk/Bun audit reports
- Update vulnerable dependencies promptly
- Use `bun audit` locally before releases

---

## Performance Optimization

### Current CI Performance

| Job        | Duration       | Can Cache?    |
| ---------- | -------------- | ------------- |
| Setup      | 5-10s (cached) | ✅ Yes        |
| Lint       | 15-30s         | ✅ Uses cache |
| Type Check | 20-40s         | ✅ Uses cache |
| Test       | 30-60s         | ✅ Uses cache |
| Build      | 2-4 min        | ✅ Uses cache |
| E2E        | 1-3 min        | ❌ No         |

**Total Pipeline Time:** ~3-5 minutes (with cache)

### Optimization Tips

**1. Leverage Caching**

- Cache key uses `bun.lockb` hash
- Cache invalidates on dependency changes
- Parallel jobs share cache

**2. Parallel Execution**

- Lint, Type Check, Test run in parallel
- Reduces total time by ~60%

**3. Concurrency Control**

- Cancels outdated runs automatically
- Saves compute resources
- Faster feedback on force pushes

**4. Selective Job Execution**

- E2E tests only run if Playwright configured
- Security scans continue on error
- Non-critical jobs don't block merges

---

## Monitoring and Metrics

### Key Metrics to Track

**Pipeline Health:**

- ✅ Success rate: Target >95%
- ⏱️ Average duration: Target <5 minutes
- 🔄 Cache hit rate: Target >90%

**Code Quality:**

- 📊 Test coverage: Current 97.5% (Target >40%)
- 🐛 Failing tests: Target 0
- 🔒 Security vulnerabilities: Target 0 high/critical

### Dashboard Links

- **GitHub Actions:** `https://github.com/{org}/{repo}/actions`
- **Codecov:** `https://codecov.io/gh/{org}/{repo}`
- **Snyk:** `https://snyk.io/org/{org}/projects`

---

## Maintenance

### Weekly Tasks

- [ ] Review CI failure trends
- [ ] Check coverage reports
- [ ] Update dependencies if needed
- [ ] Review security alerts

### Monthly Tasks

- [ ] Audit CI performance metrics
- [ ] Update GitHub Actions versions
- [ ] Review and update branch protection rules
- [ ] Clean up old workflow runs

### Quarterly Tasks

- [ ] Review and optimize workflow configuration
- [ ] Update Node/Bun versions
- [ ] Audit secrets and tokens
- [ ] Performance benchmarking

---

## Additional Resources

**Documentation:**

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Bun CI/CD Guide](https://bun.sh/docs/install/ci)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Playwright CI](https://playwright.dev/docs/ci)

**Tools:**

- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- [Codecov](https://codecov.io) - Coverage reporting
- [Snyk](https://snyk.io) - Security scanning

**Related Docs:**

- `docs/database-migrations.md` - Database migration workflow
- `docs/testing-guide.md` - Testing best practices (to be created)
- `README.md` - Project setup and development

---

## Changelog

| Date       | Version | Changes                                  |
| ---------- | ------- | ---------------------------------------- |
| 2025-12-18 | 1.0.0   | Initial CI/CD pipeline setup with 8 jobs |

---

## Unresolved Questions

None - CI/CD pipeline is production-ready.

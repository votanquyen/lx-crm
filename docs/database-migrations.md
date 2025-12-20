# Database Migrations Guide

## Overview

This project uses **Prisma Migrate** for database schema version control. Migrations provide a reliable way to evolve the database schema over time while maintaining data integrity.

## Current Status

⚠️ **CRITICAL:** Initial migration needs to be generated!

**Current State:**
- ❌ No migrations directory exists
- ❌ Using `prisma db push` (development only, unsafe for production)
- ✅ Complete schema in `prisma/schema.prisma`

**Required Action:**
```bash
# Generate initial migration (requires PostgreSQL running)
pnpm prisma migrate dev --name init
```

---

## Prerequisites

### 1. PostgreSQL 17 with PostGIS 3.5

**Using Docker (Recommended):**
```bash
# Start database
docker compose up -d db

# Verify database is running
docker compose ps

# Check logs
docker compose logs db
```

**Manual Installation:**
```bash
# Ubuntu/Debian
sudo apt install postgresql-17 postgresql-17-postgis-3

# macOS
brew install postgresql@17 postgis

# Windows
# Download from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
# Then install PostGIS from: https://postgis.net/windows_downloads/
```

### 2. Environment Variables

Ensure `.env` contains:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/locxanh?schema=public"
```

---

## Migration Workflow

### Creating First Migration (Initial Setup)

**Step 1: Ensure database is running**
```bash
# Docker
docker compose up -d db

# Or verify PostgreSQL service
pg_isready -h localhost -p 5432 -U postgres
```

**Step 2: Generate initial migration**
```bash
pnpm prisma migrate dev --name init
```

This will:
1. Create `prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql`
2. Apply migration to development database
3. Generate Prisma Client with latest schema

**Step 3: Review generated SQL**
```bash
# Linux/macOS
cat prisma/migrations/*/migration.sql

# Windows
type prisma\migrations\*\migration.sql
```

**Step 4: Commit migration**
```bash
git add prisma/migrations
git commit -m "feat(db): add initial Prisma migration"
```

### Making Schema Changes

**Workflow:**
1. Modify `prisma/schema.prisma`
2. Generate migration: `pnpm prisma migrate dev --name descriptive_name`
3. Review generated SQL
4. Test migration on development database
5. Commit migration files

**Example: Adding a new field**
```prisma
// prisma/schema.prisma
model Customer {
  // ... existing fields
  taxId String? // New field
}
```

```bash
# Generate migration
pnpm prisma migrate dev --name add_customer_tax_id

# Prisma will:
# 1. Create new migration file
# 2. Apply it to dev database
# 3. Regenerate Prisma Client
```

---

## Migration Commands

### Development

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm prisma migrate dev` | Create & apply migration | Schema changes in development |
| `pnpm prisma migrate dev --name <name>` | Create named migration | Schema changes (recommended) |
| `pnpm prisma migrate dev --create-only` | Create migration without applying | Review SQL before applying |
| `pnpm prisma db push` | Sync schema without migration | **ONLY for prototyping** |

### Production

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm prisma migrate deploy` | Apply pending migrations | Production deployments |
| `pnpm prisma migrate status` | Check migration status | Verify production state |
| `pnpm prisma migrate resolve --applied <name>` | Mark migration as applied | Resolve migration conflicts |

### Utilities

| Command | Purpose |
|---------|---------|
| `pnpm prisma migrate reset` | Drop database, apply all migrations, seed |
| `pnpm prisma migrate diff` | Compare database with schema |
| `pnpm prisma db seed` | Run seed script |

---

## Production Deployment

### Vercel Deployment

Add to build command in `package.json`:
```json
{
  "scripts": {
    "build": "prisma migrate deploy && prisma generate && next build --webpack"
  }
}
```

**Vercel Configuration:**
1. Set `DATABASE_URL` in environment variables
2. Deploy will automatically run migrations
3. Verify with: `pnpm prisma migrate status`

### Manual Deployment

```bash
# 1. Backup database
pg_dump -h localhost -U postgres locxanh > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
pnpm prisma migrate deploy

# 3. Verify status
pnpm prisma migrate status

# 4. Seed if needed
pnpm prisma db seed
```

---

## Migration Best Practices

### ✅ DO

1. **Always use descriptive migration names**
   ```bash
   # Good
   pnpm prisma migrate dev --name add_customer_loyalty_points
   pnpm prisma migrate dev --name create_invoice_templates_table

   # Bad
   pnpm prisma migrate dev --name update
   pnpm prisma migrate dev --name fix
   ```

2. **Review generated SQL before committing**
   - Check for data loss operations (DROP, TRUNCATE)
   - Verify indexes are created
   - Ensure foreign keys are correct

3. **Test migrations on staging before production**
   ```bash
   # Staging environment
   DATABASE_URL="postgresql://staging..." pnpm prisma migrate deploy
   ```

4. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to review and rollback

5. **Commit migrations immediately**
   ```bash
   git add prisma/migrations
   git commit -m "feat(db): <migration description>"
   ```

### ❌ DON'T

1. **Never edit applied migrations**
   - Migrations are immutable once applied
   - Create new migration to fix issues

2. **Never use `db push` in production**
   ```bash
   # Development only!
   pnpm prisma db push
   ```

3. **Never delete migration files manually**
   - Use `prisma migrate resolve` if needed
   - Breaks migration history

4. **Never skip migrations**
   - Always apply migrations in order
   - Missing migration causes inconsistent state

---

## Common Scenarios

### Scenario 1: Initial Setup (New Developer)

```bash
# 1. Clone repository
git clone <repo-url>
cd locxanh.vn

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Start database
docker compose up -d db

# 5. Apply all migrations
pnpm prisma migrate deploy

# 6. Seed database
pnpm prisma db seed

# 7. Start development server
pnpm dev
```

### Scenario 2: Schema Change

```bash
# 1. Edit schema
# Add new field to prisma/schema.prisma

# 2. Create migration
pnpm prisma migrate dev --name add_new_field

# 3. Review SQL
cat prisma/migrations/*/migration.sql

# 4. Test locally
pnpm dev  # Verify application works

# 5. Commit
git add prisma/migrations
git commit -m "feat(db): add new field to Customer model"
git push
```

### Scenario 3: Production Deployment

```bash
# 1. Backup database (ALWAYS!)
pg_dump -h prod-db.example.com -U postgres locxanh > backup.sql

# 2. Check pending migrations
pnpm prisma migrate status

# 3. Apply migrations
pnpm prisma migrate deploy

# 4. Verify
pnpm prisma migrate status
# Should show: "Database schema is up to date!"

# 5. Restart application
pm2 restart locxanh
```

### Scenario 4: Rollback Migration (Emergency)

**Option A: Restore from backup**
```bash
# 1. Restore database from backup
psql -h localhost -U postgres locxanh < backup_before_migration.sql

# 2. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back <migration_name>

# 3. Fix schema and create new migration
```

**Option B: Manual rollback**
```bash
# 1. Manually reverse SQL changes
psql -h localhost -U postgres locxanh

# 2. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back <migration_name>

# 3. Update schema.prisma to match database
pnpm prisma db pull
```

---

## Troubleshooting

### Error: "Database schema is not in sync with migration history"

**Cause:** Someone used `db push` or made manual changes

**Solution:**
```bash
# Option 1: Reset and reapply (development only)
pnpm prisma migrate reset

# Option 2: Mark as resolved (production)
pnpm prisma migrate resolve --applied <migration_name>
```

### Error: "Migration failed to apply cleanly"

**Cause:** Database state conflicts with migration

**Solution:**
```bash
# 1. Check database state
pnpm prisma migrate status

# 2. Review migration SQL
cat prisma/migrations/<migration>/migration.sql

# 3. Apply manually if needed
psql -h localhost -U postgres locxanh < prisma/migrations/<migration>/migration.sql

# 4. Mark as applied
pnpm prisma migrate resolve --applied <migration_name>
```

### Error: "P1000: Authentication failed"

**Cause:** Wrong database credentials or database not running

**Solution:**
```bash
# Check database is running
docker compose ps

# Verify .env DATABASE_URL is correct
echo $DATABASE_URL

# Start database if needed
docker compose up -d db
```

---

## Database Extensions

Our schema requires PostgreSQL extensions. These are automatically created by the initial migration.

**Required Extensions:**
```sql
-- PostGIS (spatial data)
CREATE EXTENSION IF NOT EXISTS postgis VERSION '3.5.0';

-- Trigram search (fuzzy text matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Accent-insensitive search (Vietnamese text)
CREATE EXTENSION IF NOT EXISTS unaccent;
```

**Verify extensions:**
```sql
SELECT * FROM pg_extension;
```

---

## Migration File Structure

```
prisma/
├── migrations/
│   ├── migration_lock.toml          # Migration metadata
│   └── 20251218123456_init/         # Initial migration
│       └── migration.sql             # SQL to create schema
│   └── 20251219100000_add_feature/  # Subsequent migrations
│       └── migration.sql
├── schema.prisma                     # Source of truth
└── seed.ts                           # Seed data script
```

**Migration Naming Convention:**
```
YYYYMMDDHHMMSS_descriptive_name
│              │
│              └─ Kebab-case description
└─ Timestamp (UTC)
```

---

## Seed Data

After applying migrations, seed initial data:

```bash
# Run seed script
pnpm prisma db seed

# Seed script location: prisma/seed.ts
```

**Seed script creates:**
- Admin user
- Sample plant types
- Sample customers
- Test data for development

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Run Database Migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: pnpm prisma migrate deploy
```

### Pre-deployment Checklist

- [ ] Database backup created
- [ ] Migrations tested on staging
- [ ] Migration status verified: `pnpm prisma migrate status`
- [ ] No pending manual changes
- [ ] Application compatible with new schema

---

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- [PostGIS Documentation](https://postgis.net/documentation/)

---

## FAQ

**Q: Can I use `db push` in production?**
A: **NO!** Always use `migrate deploy`. `db push` is for prototyping only.

**Q: How do I rollback a migration?**
A: Restore from backup, then create a new migration to undo changes. Never delete migration files.

**Q: What if migration fails halfway?**
A: Restore from backup, fix migration SQL, apply manually, mark as resolved.

**Q: Do I commit migration files?**
A: **YES!** Always commit migrations to Git. They are part of version control.

**Q: Can I edit an applied migration?**
A: **NO!** Migrations are immutable. Create a new migration to fix issues.

---

**Last Updated:** 2025-12-18
**Status:** ⚠️ **INITIAL MIGRATION PENDING**

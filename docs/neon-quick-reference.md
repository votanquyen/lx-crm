# Neon PostgreSQL Quick Reference

Quick commands and tips for using Neon with Lộc Xanh CRM.

---

## Setup (One-Time)

```bash
# 1. Create account at https://neon.tech (free, no credit card)

# 2. Run setup script
./scripts/setup-neon.sh

# 3. Test connection
bunx prisma db execute --sql "SELECT 1"
```

---

## Common Commands

```bash
# Apply migrations
bun run db:migrate

# Check migration status
bunx prisma migrate status

# Open Prisma Studio
bun run db:studio

# Test connection
bunx prisma db execute --sql "SELECT 1"

# Pull schema from database
bunx prisma db pull

# Generate Prisma client
bunx prisma generate
```

---

## Connection String Format

```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

**Example:**
```env
DATABASE_URL="postgresql://neondb_owner:npg_abc123@ep-tree-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

**Important:** Always include `?sslmode=require`

---

## Enable PostGIS

```sql
-- Run in Neon SQL Editor or via Prisma
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify
SELECT PostGIS_Version();
```

---

## Useful SQL Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- List tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count all records
SELECT
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection timeout | Check internet, verify DATABASE_URL |
| SSL required | Add `?sslmode=require` to URL |
| PostGIS not found | Run `CREATE EXTENSION postgis` |
| Migration failed | Check `bunx prisma migrate status` |
| Slow queries | Check Neon dashboard → Queries |

---

## Neon Dashboard Links

- **Console:** https://console.neon.tech
- **SQL Editor:** Projects → Select project → SQL Editor
- **Metrics:** Projects → Select project → Monitoring
- **Branches:** Projects → Select project → Branches

---

## Free Tier Limits

- **Storage:** 0.5GB
- **Compute:** Unlimited (auto-suspend after 5min)
- **Data transfer:** 1GB/month
- **Backups:** 7 days history

---

## Best Practices

✅ **Do:**
- Use connection pooling in production (`?pgbouncer=true`)
- Enable auto-suspend (default, saves costs)
- Create database branches for testing
- Monitor usage in Neon dashboard
- Use migrations for schema changes

❌ **Don't:**
- Store connection string in code
- Disable SSL (`sslmode=require` is required)
- Run `prisma db push` in production (use migrations)
- Exceed free tier limits without upgrading

---

## Need Help?

- Full guide: `docs/neon-setup-guide.md`
- Neon Docs: https://neon.tech/docs
- Neon Discord: https://discord.gg/neon
- Prisma + Neon: https://www.prisma.io/docs/guides/database/neon

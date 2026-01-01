# Neon PostgreSQL Setup Guide

Step-by-step guide to set up free PostgreSQL database on Neon for Lộc Xanh CRM.

---

## Why Neon?

- ✅ **Free Tier:** 0.5GB storage, auto-suspend after 5 minutes of inactivity
- ✅ **PostgreSQL 17:** Latest version with PostGIS support
- ✅ **Serverless:** Scales to zero, pay only for what you use
- ✅ **Fast:** Global edge network for low latency
- ✅ **Easy:** No server management required

---

## Step 1: Create Neon Account

### 1.1 Sign Up

1. Go to https://neon.tech
2. Click "Sign Up" (free, no credit card required)
3. Sign in with GitHub, Google, or email
4. Verify your email

### 1.2 Create Project

1. After login, click **"Create a project"**
2. Project settings:
   - **Project name:** locxanh-crm
   - **PostgreSQL version:** 17
   - **Region:** Choose closest to your location
     - Asia Pacific: Singapore (ap-southeast-1)
     - Europe: Frankfurt (eu-central-1)
     - US: Ohio (us-east-2)
3. Click **"Create project"**

### 1.3 Get Connection String

After project creation, you'll see:

```
Connection string
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Example:**
```
postgresql://neondb_owner:npg_abc123xyz@ep-blue-tree-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Copy this entire string** - you'll need it in the next step.

---

## Step 2: Update Environment Configuration

### 2.1 Update .env File

Open `.env` file and update the `DATABASE_URL`:

```env
# Database - Neon PostgreSQL (Free Tier)
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# Example (replace with your actual connection string):
# DATABASE_URL="postgresql://neondb_owner:npg_abc123xyz@ep-blue-tree-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

**Important:** Use the connection string from Neon dashboard, not the example above.

### 2.2 Keep Other Settings

Keep the rest of your `.env` file unchanged:

```env
# Authentication
AUTH_SECRET="your-auth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Services
GOOGLE_AI_API_KEY="your-google-ai-key"
GROQ_API_KEY="your-groq-key"

# Storage (MinIO) - still using local for development
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="locxanh"
```

---

## Step 3: Enable PostGIS Extension

### 3.1 Access Neon SQL Editor

1. In Neon dashboard, go to **SQL Editor**
2. Run this command to enable PostGIS:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Verify PostGIS is installed:

```sql
SELECT PostGIS_Version();
```

You should see the PostGIS version (e.g., "3.4.0").

---

## Step 4: Run Database Migrations

### 4.1 Generate Initial Migration

```bash
# Generate migration from Prisma schema
bun run db:migrate

# You'll be prompted to name the migration
# Suggested name: init
```

This will:
- Create migration files in `prisma/migrations/`
- Apply migration to Neon database
- Generate Prisma client

### 4.2 Verify Migration

Check Neon dashboard → **Tables** to see your database schema.

You should see tables like:
- User
- Customer
- Contract
- Invoice
- Payment
- etc.

---

## Step 5: Test Connection

### 5.1 Test Database Connection

```bash
# Test connection with Prisma
bunx prisma db execute --sql "SELECT 1 as test"
```

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "neondb"

┌──────┐
│ test │
├──────┤
│ 1    │
└──────┘
```

### 5.2 Open Prisma Studio

```bash
bun run db:studio
```

This opens Prisma Studio at http://localhost:5555 where you can:
- View all tables
- Add/edit/delete records
- Test queries

---

## Step 6: Seed Database (Optional)

### 6.1 Run Seed Script

```bash
bun run db:seed
```

This will populate the database with:
- Sample plant types
- Test customers
- Demo contracts
- Sample invoices

**Note:** Only run this in development, not in production!

---

## Troubleshooting

### Issue 1: Connection Timeout

**Error:**
```
P1001: Can't reach database server at ep-xxx.neon.tech:5432
```

**Solutions:**
- Check your internet connection
- Verify the connection string is correct
- Ensure `?sslmode=require` is in the URL
- Check firewall settings

### Issue 2: SSL Required

**Error:**
```
SSL connection is required
```

**Solution:**
Add `?sslmode=require` to your DATABASE_URL:
```
postgresql://user:pass@host/db?sslmode=require
```

### Issue 3: PostGIS Not Found

**Error:**
```
type "geometry" does not exist
```

**Solution:**
Enable PostGIS extension:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue 4: Migration Failed

**Error:**
```
Migration failed
```

**Solutions:**
1. Check migration status:
   ```bash
   bunx prisma migrate status
   ```

2. Reset migrations (development only):
   ```bash
   bunx prisma migrate reset --force
   ```

3. Deploy specific migration:
   ```bash
   bunx prisma migrate deploy
   ```

---

## Neon Dashboard Features

### Monitoring

1. **Metrics:** View database usage, connections, storage
2. **Queries:** See slow queries and optimize them
3. **Branches:** Create database branches for testing

### Database Branches

Neon supports database branching (like Git):

```bash
# Create a branch via CLI (optional)
neonctl branches create --name dev --parent main
```

**Use cases:**
- Test migrations without affecting main database
- Create preview environments
- Run experiments safely

### Auto-Suspend

Neon automatically suspends databases after 5 minutes of inactivity:
- **Free tier:** Database wakes up in ~1-2 seconds on first query
- **No data loss:** All data is preserved
- **Save costs:** Only pay for active time

---

## Connection Pooling

For production, use connection pooling to handle multiple connections:

### Update DATABASE_URL for Pooling

```env
# Pooled connection (recommended for production)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
```

### Configure Prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  connection_limit = 10
  pool_timeout     = 20
}
```

---

## Backup Strategy

### Neon Point-in-Time Restore

Neon provides automatic backups:
- **Free tier:** 7 days of history
- **Paid tier:** 30 days of history

### Restore from Backup

1. Go to Neon dashboard → **Restore**
2. Select point in time
3. Create new branch from backup
4. Test the restore
5. Promote branch to main if needed

### Manual Backup

```bash
# Export database to SQL file
bunx prisma db execute --sql "SELECT * FROM Customer" > backup.sql

# Or use pg_dump (if installed)
pg_dump $DATABASE_URL > backup.sql
```

---

## Cost Optimization

### Free Tier Limits

- **Storage:** 0.5GB
- **Compute:** Unlimited (auto-suspend)
- **Data transfer:** 1GB/month

### Tips to Stay Within Free Tier

1. **Enable auto-suspend:** Already enabled by default
2. **Delete old data:** Regular cleanup of test data
3. **Use database branches:** Create temporary branches for testing
4. **Monitor usage:** Check Neon dashboard regularly

### Upgrade Path

When you exceed free tier:
- **Scale:** $19/month for 10GB storage
- **Pro:** $69/month for 50GB + advanced features
- **Enterprise:** Custom pricing

---

## Next Steps

After Neon setup is complete:

1. ✅ Neon account created
2. ✅ DATABASE_URL updated in .env
3. ✅ PostGIS extension enabled
4. ✅ Migrations applied
5. ✅ Connection tested

**You can now:**
- Run the development server: `bun dev`
- Access Prisma Studio: `bun run db:studio`
- Deploy to staging/production
- Use the full CRM application

---

## Quick Reference

### Useful Commands

```bash
# Check connection
bunx prisma db execute --sql "SELECT 1"

# View schema
bunx prisma db pull

# Apply migrations
bun run db:migrate

# Open studio
bun run db:studio

# Check migration status
bunx prisma migrate status

# Reset database (dev only)
bunx prisma migrate reset
```

### Useful SQL Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check PostGIS version
SELECT PostGIS_Version();

-- Count records
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Resources

- **Neon Dashboard:** https://console.neon.tech
- **Neon Docs:** https://neon.tech/docs
- **Neon Status:** https://neonstatus.com
- **Prisma + Neon:** https://www.prisma.io/docs/guides/database/neon

---

## Support

**Neon Support:**
- Community: https://community.neon.tech
- Discord: https://discord.gg/neon
- Email: support@neon.tech

**Project Support:**
- Check `docs/database-migrations.md` for migration help
- Check `docs/troubleshooting.md` for common issues

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-18 | 1.0.0 | Initial Neon setup guide |

# Lộc Xanh CRM - Coolify Deployment Guide

**Complete Step-by-Step Deployment to Coolify Platform**

**Last Updated**: December 22, 2025
**Version**: 1.0
**Coolify Version**: v4.x
**Project Status**: Phase 3 (Performance Optimization)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Coolify Setup](#coolify-setup)
3. [Database Configuration](#database-configuration)
4. [Project Deployment](#project-deployment)
5. [Environment Variables](#environment-variables)
6. [Build & Deployment Process](#build--deployment-process)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Scaling & Optimization](#scaling--optimization)

---

## Prerequisites

### Coolify Requirements

- **Coolify Instance**: Self-hosted Coolify v4.x or Coolify Cloud
- **Server Resources**: Minimum 4GB RAM, 2 CPU cores
- **Storage**: 20GB+ free disk space
- **Domain**: Custom domain configured (optional but recommended)

### Project Requirements

- **Node.js**: 22.12+ (LTS)
- **Package Manager**: pnpm 10.26+
- **Database**: PostgreSQL 17+ with PostGIS 3.5
- **Build Time**: ~2-3 minutes
- **Runtime**: ~500MB RAM

### Coolify Resources Needed

- **Web Service**: Next.js application
- **Database Service**: PostgreSQL with PostGIS
- **Storage**: Optional MinIO/S3 for file uploads
- **Environment**: Docker-based deployment

---

## Coolify Setup

### Step 1: Access Coolify Dashboard

1. Navigate to your Coolify instance:

   ```bash
   # Self-hosted
   https://coolify.yourdomain.com

   # Or Coolify Cloud
   https://app.coolify.io
   ```

2. Log in with your credentials

### Step 2: Create New Project

1. Click **"New Project"** button
2. Enter project name: `locxanh-crm`
3. Select team/organization
4. Click **"Create Project"**

### Step 3: Configure Server

1. Go to **Servers** section
2. Ensure you have a server configured:
   - **Local Docker**: For testing
   - **Remote Server**: For production (recommended)
   - **VPS**: DigitalOcean, AWS, Hetzner, etc.

3. Verify server status is **"Healthy"**

---

## Database Configuration

### Option A: Coolify Managed PostgreSQL (Recommended)

#### Step 1: Create Database Service

1. In your project, click **"Add Service"**
2. Select **"PostgreSQL"** from database list
3. Configure service:
   - **Service Name**: `postgres-locxanh`
   - **Version**: `17.2` (or latest 17.x)
   - **Public**: No (keep internal only)
   - **Instant Deploy**: Yes

#### Step 2: Configure Database

1. After deployment, click on the PostgreSQL service
2. Go to **"Environment Variables"** tab
3. Add required variables:

   ```env
   POSTGRES_USER=locxanh
   POSTGRES_PASSWORD=<generate-secure-password>
   POSTGRES_DB=locxanh_crm
   ```

4. Click **"Save"** and **"Redeploy"**

#### Step 3: Enable PostGIS Extensions

1. Access database console:

   ```bash
   # In Coolify, click "Terminal" on PostgreSQL service
   psql -U locxanh -d locxanh_crm
   ```

2. Run extension commands:

   ```sql
   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS unaccent;

   -- Verify extensions
   SELECT * FROM pg_extension WHERE extname IN ('postgis', 'pg_trgm', 'unaccent');
   ```

3. Get connection details:
   - **Internal URL**: `postgres://locxanh:<password>@postgres-locxanh:5432/locxanh_crm`
   - **External URL**: Will be provided by Coolify

### Option B: External Database (Neon, Supabase, etc.)

#### Using Neon PostgreSQL

1. Create Neon project at [neon.tech](https://neon.tech)
2. Get connection string:

   ```env
   DATABASE_URL="postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/locxanh_crm?sslmode=require"
   ```

3. Enable extensions:
   ```sql
   -- In Neon SQL Editor
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS unaccent;
   ```

---

## Project Deployment

### Step 1: Add Git Repository

1. In Coolify project, click **"Add Resource"** → **"Application"**
2. Select **"GitHub"** or **"GitLab"**
3. Authorize if needed
4. Select repository: `your-username/locxanh.vn`
5. Choose branch: `main` or `dev` (for staging)

### Step 2: Configure Build Settings

#### General Settings

- **Application Name**: `locxanh-crm`
- **Build Command**: `pnpm install && pnpm prisma generate && pnpm next build --webpack`
- **Start Command**: `pnpm next start`
- **Port**: `3000`

#### Build Pack

- Select **"nixpacks"** (auto-detects Node.js)
- Or select **"Dockerfile"** if using custom Dockerfile

#### Source Settings

- **Build Context**: `/` (root directory)
- **Dockerfile Path**: `Dockerfile` (if using custom)
- **Monorepo Path**: Leave empty unless using monorepo

### Step 3: Configure Environment Variables

Add all required environment variables (see [Environment Variables](#environment-variables) section):

```env
# Database
DATABASE_URL=postgres://locxanh:<password>@postgres-locxanh:5432/locxanh_crm

# Authentication
NEXTAUTH_SECRET=<generate-secret>
GOOGLE_CLIENT_ID=<your-google-oauth-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-secret>

# Storage (Optional - MinIO/S3)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://minio:9000
AWS_BUCKET_NAME=locxanh

# Google Maps
GOOGLE_MAPS_API_KEY=<your-api-key>

# AI (Optional)
GEMINI_API_KEY=<your-gemini-key>

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 4: Configure Resource Limits

1. Go to **"Advanced"** tab
2. Set resource limits:
   - **Memory**: 1024 MB (minimum)
   - **CPU**: 500 mCPU
   - **Swap**: 512 MB

3. Set restart policy:
   - **Policy**: `unless-stopped`
   - **Max Retries**: 3

### Step 5: Configure Domains & SSL

1. Go to **"Domains"** tab
2. Add custom domain:
   - **Domain**: `crm.locxanh.vn`
   - **Path**: `/`
   - **Port**: `3000`

3. Enable **"SSL"** (Let's Encrypt)
4. Add redirect rules if needed:
   - `https://www.crm.locxanh.vn` → `https://crm.locxanh.vn`

### Step 6: Deploy Application

1. Click **"Deploy"** button
2. Monitor deployment logs:

   ```bash
   # Coolify will show real-time logs
   # Expected timeline:
   # 0-30s: Pulling base image
   # 30-60s: Installing dependencies (pnpm install)
   # 60-90s: Generating Prisma client
   # 90-120s: Building Next.js (webpack)
   # 120-150s: Finalizing deployment
   ```

3. Wait for **"Deployed Successfully"** status

---

## Environment Variables

### Required Variables

#### Database

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

#### Authentication (NextAuth)

```env
NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"
GOOGLE_CLIENT_ID="<from-google-cloud-console>"
GOOGLE_CLIENT_SECRET="<from-google-cloud-console>"
```

Generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

#### Security

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Add additional security
NEXTAUTH_URL="https://crm.locxanh.vn"
```

### Optional Variables

#### Storage (MinIO/S3)

```env
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_ENDPOINT_URL="http://minio:9000"  # or S3 endpoint
AWS_BUCKET_NAME="locxanh"
AWS_REGION="us-east-1"  # for AWS S3
```

#### Google Maps API

```env
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

Get from: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Maps JavaScript API

#### AI Features (Gemini)

```env
GEMINI_API_KEY="your-gemini-api-key"
```

Get from: [Google AI Studio](https://makersuite.google.com/)

#### Email (Future)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Environment Variables in Coolify

#### Adding Variables

1. Go to your application in Coolify
2. Click **"Environment Variables"** tab
3. Click **"Add Variable"**
4. Enter key and value
5. Click **"Save"**

#### Bulk Import

1. Click **"Bulk Edit"**
2. Paste variables in format:
   ```env
   KEY1=value1
   KEY2=value2
   ```
3. Click **"Save All"**

#### Secrets Management

Coolify automatically handles secrets:

- Variables are encrypted at rest
- Not visible in logs
- Can be marked as **"Secret"** for extra protection

---

## Build & Deployment Process

### Build Process Details

#### Phase 1: Dependencies Installation (30-60s)

```bash
pnpm install --frozen-lockfile
```

- Installs all dependencies from `pnpm-lock.yaml`
- Uses cache if available

#### Phase 2: Prisma Generation (10-20s)

```bash
pnpm prisma generate
```

- Generates Prisma Client
- Creates TypeScript types
- Validates schema

#### Phase 3: Next.js Build (60-90s)

```bash
pnpm next build --webpack
```

- **Standalone Mode**: Creates `standalone` folder with minimal production build
- **Webpack**: Custom loaders for .txt files (Vietnamese fonts)
- **Optimization**: Code splitting, tree shaking
- **Output**: `.next/standalone` + `.next/static`

#### Phase 4: Deployment (10-20s)

```bash
pnpm next start
```

- Starts production server
- Port: 3000
- Ready for traffic

### Deployment Triggers

#### Automatic Deployment

1. **Git Push**: Auto-deploy on push to connected branch
2. **Webhook**: GitHub/GitLab webhook triggers
3. **Scheduled**: Set deployment schedule (e.g., daily at 2 AM)

#### Manual Deployment

1. Click **"Redeploy"** in Coolify dashboard
2. Use Coolify CLI:
   ```bash
   coolify deploy locxanh-crm
   ```

#### Zero-Downtime Deployment

Coolify automatically:

1. Builds new version in parallel
2. Health checks new container
3. Switches traffic when ready
4. Keeps old container for rollback

---

## Post-Deployment Verification

### Step 1: Check Application Health

1. **Coolify Dashboard**:
   - Status: ✅ Healthy
   - Build Logs: No errors
   - Deployment Time: < 5 minutes

2. **Application Health Check**:
   ```bash
   curl -f https://crm.locxanh.vn/api/health
   # Expected: {"status":"ok"}
   ```

### Step 2: Database Verification

1. **Connect to Database**:

   ```bash
   # Using Coolify Terminal
   psql -U locxanh -d locxanh_crm
   ```

2. **Check Extensions**:

   ```sql
   SELECT extname, extversion FROM pg_extension
   WHERE extname IN ('postgis', 'pg_trgm', 'unaccent');
   ```

3. **Run Prisma Migrations**:
   ```bash
   # In Coolify, go to Application → Terminal
   pnpm prisma migrate deploy
   ```

### Step 3: Authentication Test

1. **Access Application**: `https://crm.locxanh.vn`
2. **Click "Login"**
3. **Select "Google OAuth"**
4. **Complete login flow**
5. **Verify**: Redirected to dashboard

### Step 4: Feature Verification

Test core features:

- ✅ Customer management (create, read, update, delete)
- ✅ Contract creation and PDF generation
- ✅ Invoice generation
- ✅ File uploads (if MinIO/S3 configured)
- ✅ Analytics dashboard loading
- ✅ Vietnamese search (fuzzy search)

### Step 5: Performance Check

1. **Page Load Speed**:

   ```bash
   # Use browser DevTools
   # Expected: < 2s for initial load
   ```

2. **API Response Time**:

   ```bash
   curl -w "@curl-format.txt" https://crm.locxanh.vn/api/customers
   # Expected: < 200ms
   ```

3. **Bundle Size**:
   - Check browser Network tab
   - Initial JS: < 500KB
   - Total: < 2MB

### Step 6: Monitoring Setup

1. **Coolify Metrics**:
   - CPU Usage: < 50%
   - Memory Usage: < 80%
   - Disk Usage: < 70%

2. **Application Logs**:
   - Check for errors in Coolify Logs tab
   - Look for slow queries
   - Monitor authentication attempts

---

## Troubleshooting

### Common Issues

#### Issue 1: Build Fails - "Prisma Generation Error"

**Symptom**: Build fails during `prisma generate`

**Solution**:

```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
pnpm prisma validate

# Clear cache and retry
rm -rf node_modules/.prisma
pnpm install
pnpm prisma generate
```

**Coolify Fix**:

1. Verify `DATABASE_URL` in Environment Variables
2. Check database service is running
3. Ensure extensions are enabled

#### Issue 2: "Module not found" Error

**Symptom**: Build fails with missing modules

**Solution**:

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

**Coolify Fix**:

1. Go to Application → Settings
2. Enable **"Force Rebuild"**
3. Redeploy

#### Issue 3: Database Connection Timeout

**Symptom**: Application can't connect to database

**Solution**:

```bash
# Check connection string format
# Should be: postgresql://user:pass@host:5432/dbname

# Test from application container
pnpm prisma db pull
```

**Coolify Fix**:

1. Verify database service name in `DATABASE_URL`
2. Check if database is healthy
3. Ensure network connectivity (same project)

#### Issue 4: "Out of Memory" During Build

**Symptom**: Build process killed

**Solution**:

1. Increase resource limits in Coolify:
   - Memory: 2048 MB
   - Swap: 1024 MB
2. Reduce build parallelism:
   ```bash
   NODE_OPTIONS="--max-old-space-size=1024" pnpm next build
   ```

#### Issue 5: Google OAuth Redirect Loop

**Symptom**: Login redirects endlessly

**Solution**:

1. Verify `NEXTAUTH_URL` is set correctly:
   ```env
   NEXTAUTH_URL=https://crm.locxanh.vn
   ```
2. Check Google OAuth redirect URI in Google Console:
   - `https://crm.locxanh.vn/api/auth/callback/google`
3. Ensure `NEXTAUTH_SECRET` is set

#### Issue 6: PDF Generation Fails

**Symptom**: Vietnamese fonts not rendering in PDF

**Solution**:

1. Verify webpack config is used:
   ```bash
   pnpm next build --webpack
   ```
2. Check font files exist in `public/fonts/`
3. Verify MinIO/S3 credentials if using external storage

#### Issue 7: File Upload Fails

**Symptom**: Can't upload files to MinIO/S3

**Solution**:

1. Verify AWS credentials:
   ```bash
   echo $AWS_ACCESS_KEY_ID
   echo $AWS_SECRET_ACCESS_KEY
   ```
2. Check endpoint URL:
   - Internal: `http://minio:9000`
   - External: `https://minio.yourdomain.com`
3. Test bucket access:
   ```bash
   # Using AWS CLI
   aws s3 ls s3://locxanh --endpoint-url http://minio:9000
   ```

### Debug Mode

#### Enable Debug Logging

Add to Environment Variables:

```env
NEXT_DEBUG=true
LOG_LEVEL=debug
```

#### View Real-time Logs

1. **Coolify Dashboard**:
   - Go to Application → Logs
   - Select **"Live"** view
   - Filter by level: `error`, `warn`

2. **Terminal Access**:
   ```bash
   # In Coolify, open Terminal on application
   tail -f /app/logs/app.log
   ```

#### Database Debug

```bash
# Enable query logging
pnpm prisma studio

# Check migrations status
pnpm prisma migrate status
```

### Rollback Procedure

#### Automatic Rollback (Coolify)

1. Go to Application → Deployments
2. Find previous successful deployment
3. Click **"Rollback to this version"**
4. Coolify will restore previous container

#### Manual Rollback

```bash
# In Coolify Terminal
# Stop current deployment
pnpm next stop

# Restore previous build
cp -r /app/backup/.next /app/

# Restart
pnpm next start
```

---

## Monitoring & Maintenance

### Daily Monitoring

#### Coolify Dashboard Checks

- ✅ Application status: Healthy
- ✅ Resource usage: < 80%
- ✅ Recent deployments: Success
- ✅ Error logs: Clear

#### Application Metrics

- User login count
- API response times
- Database query performance
- File upload success rate

### Weekly Maintenance

#### Database Maintenance

```sql
-- Run in PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE locxanh_crm;
```

#### Log Cleanup

```bash
# In Coolify, set log rotation
# Max size: 100MB
# Max age: 7 days
```

#### Dependency Updates

```bash
# Check for updates
pnpm outdated

# Update safely
pnpm update --latest
pnpm prisma generate
pnpm build
pnpm test
```

### Monthly Tasks

#### Security Updates

1. Update Coolify to latest version
2. Update Node.js base image
3. Review and rotate secrets
4. Check for CVEs in dependencies

#### Performance Optimization

1. Analyze slow queries:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```
2. Optimize indexes
3. Clear old sessions/logs
4. Review cache hit rates

#### Backup Verification

1. Test database restore
2. Verify file backups
3. Check disaster recovery plan

### Alerting Setup

#### Coolify Alerts

1. Go to Settings → Notifications
2. Configure:
   - Email alerts for failed deployments
   - Slack/Discord webhooks
   - Resource usage warnings

#### Application Monitoring (Optional)

Add to Environment Variables:

```env
# Sentry (Error Tracking)
SENTRY_DSN="your-sentry-dsn"
SENTRY_ENVIRONMENT="production"

# Uptime Monitoring
UPTIMEROBOT_API_KEY="your-key"
```

---

## Scaling & Optimization

### Horizontal Scaling

#### Multiple Instances

1. **Coolify Load Balancer**:
   - Go to Application → Settings
   - Set **"Replicas"**: 2-3
   - Coolify handles load balancing

2. **Database Scaling**:
   - Use connection pooling (PgBouncer)
   - Increase `max_connections` in PostgreSQL
   - Use read replicas for analytics

#### Vertical Scaling

1. **Increase Resources**:
   - Memory: 2GB → 4GB
   - CPU: 1000 mCPU
   - Disk: 50GB

2. **Database Resources**:
   - Memory: 2GB
   - CPU: 2 cores
   - Storage: 100GB SSD

### Performance Optimization

#### Next.js Optimization

1. **Enable ISR** (Incremental Static Regeneration):

   ```typescript
   export async function getStaticProps() {
     return {
       props: {
         /* data */
       },
       revalidate: 3600, // 1 hour
     };
   }
   ```

2. **Image Optimization**:

   ```bash
   pnpm add @next/image
   # Use next/image component
   ```

3. **Code Splitting**:
   ```typescript
   const HeavyComponent = dynamic(
     () => import('../components/HeavyComponent'),
     { loading: () => <Skeleton /> }
   );
   ```

#### Database Optimization

1. **Add Indexes**:

   ```sql
   -- For customer search
   CREATE INDEX idx_customer_name_norm ON customers USING gin(company_name_norm gin_trgm_ops);

   -- For geospatial queries
   CREATE INDEX idx_customer_location ON customers USING gist(location);
   ```

2. **Query Caching**:
   ```env
   # Add Redis for caching
   REDIS_URL="redis://redis:6379"
   ```

#### CDN Configuration

1. **Static Assets**:
   - Configure Cloudflare/CDN for `/_next/static/`
   - Set cache headers: 1 year
   - Enable Brotli compression

2. **Images**:
   - Use Cloudflare Images or Imgix
   - Optimize on-the-fly

### Cost Optimization

#### Resource Right-Sizing

1. **Monitor Usage**:
   - Use Coolify metrics
   - Identify underutilized resources
   - Scale down during low-traffic hours

2. **Database**:
   - Use connection pooling
   - Archive old data
   - Compress large tables

#### Storage Optimization

1. **File Cleanup**:

   ```bash
   # Remove old temp files
   find /app/uploads/temp -mtime +7 -delete
   ```

2. **Database Maintenance**:

   ```sql
   -- Archive old records
   CREATE TABLE archived_customers AS
   SELECT * FROM customers WHERE created_at < NOW() - INTERVAL '2 years';

   -- Delete archived
   DELETE FROM customers WHERE created_at < NOW() - INTERVAL '2 years';
   ```

---

## Advanced Configuration

### Custom Dockerfile (Optional)

If you need more control, create `Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22.12-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.26.0

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm next build --webpack

# Production image
FROM base AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "server.js"]
```

### Coolify Configuration File

Create `.coolify.yaml` in project root:

```yaml
# .coolify.yaml
services:
  web:
    type: application
    build:
      command: pnpm install && pnpm prisma generate && pnpm next build --webpack
      start: pnpm next start
      port: 3000
    environment:
      - NODE_ENV=production
    resources:
      memory: 1024
      cpu: 500
    healthcheck:
      path: /api/health
      interval: 30s
      timeout: 10s
      retries: 3

  database:
    type: postgresql
    version: 17.2
    environment:
      - POSTGRES_USER=locxanh
      - POSTGRES_DB=locxanh_crm
    resources:
      memory: 512
      cpu: 250
    volumes:
      - data:/var/lib/postgresql/data
```

### CI/CD Integration

#### GitHub Actions

Create `.github/workflows/deploy-coolify.yml`:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22.12"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Lint code
        run: pnpm lint

      - name: Deploy to Coolify
        if: github.ref == 'refs/heads/main'
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            https://coolify.yourdomain.com/api/v1/projects/locxanh-crm/deploy
```

---

## Security Best Practices

### Environment Variables

✅ **DO**:

- Use Coolify secrets management
- Rotate secrets regularly
- Use strong passwords
- Enable 2FA on all accounts

❌ **DON'T**:

- Commit `.env` files
- Hardcode credentials
- Use default secrets
- Share secrets in logs

### Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE locxanh_crm TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- Revoke dangerous permissions
REVOKE ALL ON DATABASE locxanh_crm FROM public;
```

### Application Security

1. **CSP Headers**: Already configured in `next.config.ts`
2. **Rate Limiting**: Implement for API routes
3. **Input Validation**: Use Zod schemas
4. **SQL Injection**: Prisma prevents this
5. **XSS Protection**: Next.js built-in

### SSL/TLS

Coolify automatically:

- Generates Let's Encrypt certificates
- Renews every 90 days
- Enforces HTTPS
- Provides HSTS headers

---

## Cost Estimation

### Monthly Costs (Self-Hosted Coolify)

| Service                  | Cost                 |
| ------------------------ | -------------------- |
| **VPS (4GB RAM, 2 CPU)** | $20-40               |
| **Coolify License**      | Free (self-hosted)   |
| **Domain**               | $1-2                 |
| **SSL Certificate**      | Free (Let's Encrypt) |
| **Storage (50GB)**       | $5-10                |
| **Backup Storage**       | $3-5                 |
| **Total**                | **$29-57/month**     |

### Coolify Cloud (Alternative)

| Plan      | Cost      | Features            |
| --------- | --------- | ------------------- |
| **Hobby** | $10/month | 1 project, 1GB RAM  |
| **Pro**   | $25/month | 5 projects, 4GB RAM |
| **Team**  | $50/month | Unlimited, 16GB RAM |

---

## Support & Resources

### Documentation

- **Coolify Docs**: https://coolify.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs

### Community

- **Coolify Discord**: https://coolify.io/discord
- **Next.js Discord**: https://nextjs.org/discord
- **GitHub Issues**: Report bugs on repository

### Troubleshooting Resources

- **Coolify Status**: https://status.coolify.io
- **Build Logs**: Check Coolify dashboard
- **Application Logs**: Coolify → Application → Logs
- **Database Logs**: Coolify → Database → Logs

---

## Quick Reference

### Essential Commands

```bash
# Deploy
pnpm prisma migrate deploy
pnpm next build --webpack
pnpm next start

# Database
pnpm prisma generate
pnpm prisma db push
pnpm prisma studio

# Development
pnpm dev

# Validation
pnpm run validate
pnpm lint:fix
pnpm format
pnpm typecheck

# Testing
pnpm test
pnpm test --coverage
```

### Coolify CLI

```bash
# Deploy
coolify deploy locxanh-crm

# View logs
coolify logs locxanh-crm

# Restart
coolify restart locxanh-crm

# Environment variables
coolify env set KEY=VALUE locxanh-crm
```

### Environment Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `NEXTAUTH_SECRET` - Authentication secret
- [ ] `GOOGLE_CLIENT_ID` - OAuth credentials
- [ ] `GOOGLE_CLIENT_SECRET` - OAuth credentials
- [ ] `AWS_ACCESS_KEY_ID` - Storage credentials
- [ ] `AWS_SECRET_ACCESS_KEY` - Storage credentials
- [ ] `GOOGLE_MAPS_API_KEY` - Maps API
- [ ] `GEMINI_API_KEY` - AI features (optional)

### Deployment Checklist

- [ ] Database created with extensions
- [ ] Environment variables configured
- [ ] Domain pointed to Coolify
- [ ] SSL certificate generated
- [ ] Prisma migrations run
- [ ] Application health check passes
- [ ] Authentication works
- [ ] Core features tested
- [ ] Monitoring enabled
- [ ] Backup configured

---

## Next Steps

After successful deployment:

1. **Monitor** application for 24-48 hours
2. **Optimize** based on usage patterns
3. **Scale** resources as needed
4. **Backup** regularly
5. **Update** dependencies monthly
6. **Review** security quarterly

---

**Document Version**: 1.0
**Last Updated**: December 22, 2025
**Status**: Production Ready
**Next Review**: After Phase 4 completion

---

_For issues or questions, refer to Coolify documentation or create an issue in the project repository._

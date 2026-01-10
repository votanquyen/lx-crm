# Deployment Guide

**Lộc Xanh CRM - Complete Deployment & Operations Guide**
**Last Updated**: December 22, 2025
**Version**: 2.0 (Updated for Phase 2.5)

---

## Table of Contents

- [Overview](#overview)
- [Deployment Options](#deployment-options)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Coolify Deployment](#coolify-deployment) **← NEW**
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Management](#database-management)
- [Monitoring & Observability](#monitoring--observability)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Checklist](#security-checklist)

---

## Overview

**Current Project Status:** Phase 2.5 (Bảng Kê) 50% Complete, 74% Overall

**Deployment Strategy:**

- **Development:** Local Docker Compose for development
- **Staging:** Automatic deployment on push to `dev` branch
- **Production:** Manual approval required, blue-green deployment
- **Method:** Docker containers with zero-downtime deployment
- **Database:** Automated migrations with pre-deployment backups
- **Platform:** Coolify (recommended) or traditional Docker deployment

**Environment Matrix:**
| Environment | Branch | URL | Purpose | Status |
|-------------|--------|-----|---------|--------|
| Development | feature/\* | localhost:3000 | Local development | Active |
| Staging | dev | staging.locxanh.vn | Integration testing | Active |
| Production | main | locxanh.vn | Live application | Active |

**Tech Stack for Deployment:**

- **Runtime:** Next.js 16 (Node.js 22 LTS)
- **Database:** PostgreSQL 17 + PostGIS 3.5 + pg_trgm + unaccent
- **Caching:** Redis (ready for implementation)
- **Storage:** MinIO/S3-compatible
- **Monitoring:** Application Insights + custom logging
- **CI/CD:** GitHub Actions

---

## Prerequisites

### Server Requirements

**Development (Local):**

- Docker Desktop 4.25+ or Docker Engine 24.0+
- Docker Compose 2.20+
- Node.js 22 LTS
- 8GB RAM minimum, 16GB recommended
- 20GB disk space

**Staging Server:**

- OS: Ubuntu 22.04 LTS or newer
- CPU: 2 cores minimum
- RAM: 4GB minimum (8GB recommended)
- Disk: 50GB SSD minimum
- Docker: 24.0+ & Docker Compose: 2.20+
- PostgreSQL 17 with PostGIS extension

**Production Server:**

- OS: Ubuntu 22.04 LTS or newer
- CPU: 4 cores minimum (8 recommended)
- RAM: 8GB minimum (16GB recommended)
- Disk: 100GB SSD minimum
- Docker: 24.0+ & Docker Compose: 2.20+
- PostgreSQL 17 with PostGIS extension
- Redis server (optional, for caching)
- Load balancer (nginx/HAProxy)

### Required Environment Variables

**GitHub Secrets (for CI/CD):**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/locxanh
POSTGRES_PASSWORD=strong_password

# Authentication
NEXTAUTH_SECRET=generate_with_openssl
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Storage (MinIO/S3)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://minio:9000
AWS_BUCKET_NAME=locxanh

# Maps
GOOGLE_MAPS_API_KEY=your_api_key

# AI (Optional)
GEMINI_API_KEY=your_gemini_key

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
```

---

## Environment Setup

### 1. Local Development Setup

**Clone and configure:**

```bash
git clone https://github.com/your-org/locxanh.vn.git
cd locxanh.vn

# Copy environment template
cp .env.example .env.local

# Configure .env.local with your values
# Required: DATABASE_URL, NEXTAUTH_SECRET, etc.

# Start development environment
docker-compose up -d

# Run database migrations
bunx prisma migrate dev

# Seed database (optional)
bunx prisma db seed

# Start development server
bun dev
```

**Docker Compose Services:**

- `app`: Next.js application (port 3000)
- `db`: PostgreSQL 17 with PostGIS
- `minio`: S3-compatible storage (port 9000)
- `redis`: Redis cache (port 6379) - optional

### 2. Staging/Production Server Setup

**Initial server provisioning:**

```bash
# Create deployment user
sudo adduser deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/locxanh/{backups,nginx,scripts}
sudo chown -R deploy:deploy /opt/locxanh

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Setup SSH access
ssh-keygen -t ed25519 -C "deploy@locxanh" -f ~/.ssh/locxanh_deploy
```

**Directory structure on server:**

```
/opt/locxanh/
├── docker-compose.prod.yml
├── docker-compose.staging.yml
├── .env.production
├── .env.staging
├── nginx/
│   ├── production.conf
│   └── staging.conf
├── backups/
└── scripts/
    ├── backup.sh
    └── health-check.sh
```

---

## Coolify Deployment

**Recommended for most users** - Coolify provides a modern, managed deployment platform with automatic SSL, monitoring, and easy scaling.

### Quick Start with Coolify

For detailed step-by-step instructions, see: **[Coolify Deployment Guide](./coolify-deployment.md)**

### Why Choose Coolify?

**Advantages:**

- ✅ **Zero Configuration SSL** - Automatic Let's Encrypt certificates
- ✅ **Built-in Monitoring** - Real-time logs, metrics, and health checks
- ✅ **Easy Rollbacks** - One-click rollback to previous versions
- ✅ **Auto Deployments** - Git push triggers automatic deployment
- ✅ **Resource Management** - Visual interface for CPU/RAM limits
- ✅ **Database Management** - Managed PostgreSQL with extensions
- ✅ **Environment Variables** - Secure secrets management
- ✅ **Multi-environment** - Dev, staging, production in one dashboard

**Best For:**

- Teams wanting modern deployment without DevOps complexity
- Projects needing quick setup and easy maintenance
- Environments requiring built-in monitoring and alerting
- Developers who prefer GUI over CLI for deployments

### Coolify vs Traditional Docker

| Feature          | Coolify    | Traditional Docker |
| ---------------- | ---------- | ------------------ |
| Setup Time       | 15 minutes | 1-2 hours          |
| SSL Certificates | Automatic  | Manual (Certbot)   |
| Monitoring       | Built-in   | Manual setup       |
| Rollbacks        | One-click  | Manual commands    |
| Scaling          | GUI slider | Manual config      |
| Database         | Managed    | Manual setup       |
| Complexity       | Low        | Medium-High        |

### When to Use Traditional Docker

Choose traditional Docker deployment if:

- You need full control over infrastructure
- You have existing Docker workflows
- You're deploying to custom infrastructure
- You need specific Docker configurations
- You prefer CLI over GUI

---

## Docker Deployment

### Local Development

**Start all services:**

```bash
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f db

# Stop services
docker-compose down

# Full reset (with data loss)
docker-compose down -v
```

**Database access:**

```bash
# Connect to PostgreSQL
docker exec -it locxanh-db psql -U postgres -d locxanh

# Run migrations manually
docker exec -it locxanh-app bunx prisma migrate deploy

# View Prisma Studio
docker exec -it locxanh-app bunx prisma studio
```

### Staging Deployment

**Docker Compose Staging:**

```yaml
# docker-compose.staging.yml
services:
  app:
    image: ghcr.io/your-org/locxanh:staging
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_ENV=staging
    depends_on:
      - db
      - minio
    restart: unless-stopped

  db:
    image: postgis/postgis:17-3.5
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - pgdata_staging:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - minio_data_staging:/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  pgdata_staging:
  minio_data_staging:
```

**Deploy to staging:**

```bash
# On staging server
cd /opt/locxanh
export IMAGE_TAG=staging-$(git rev-parse --short HEAD)

# Pull and deploy
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d

# Run migrations
docker exec locxanh-staging-app bunx prisma migrate deploy

# Health check
curl https://staging.locxanh.vn/api/health
```

### Production Deployment (Blue-Green)

**Docker Compose Production:**

```yaml
# docker-compose.prod.yml
services:
  app:
    image: ghcr.io/your-org/locxanh:${IMAGE_TAG:-latest}
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_ENV=production
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/production.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

  # ... db, minio, redis same as staging
```

**Blue-Green Deployment:**

```bash
# On production server
cd /opt/locxanh

# 1. Create backup before deployment
./scripts/backup.sh

# 2. Pull new image
export IMAGE_TAG=prod-$(git rev-parse --short HEAD)
docker-compose -f docker-compose.prod.yml pull

# 3. Deploy (blue-green)
docker-compose -f docker-compose.prod.yml up -d --no-deps app

# 4. Health check on new containers
sleep 30
curl http://localhost:3000/api/health

# 5. If healthy, scale down old containers
# Docker automatically handles this with proper config

# 6. If unhealthy, auto-rollback
# (Configured in update_config.failure_action)
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

**1. Development Workflow (.github/workflows/dev.yml):**

```yaml
name: Development CI

on:
  push:
    branches: [dev]
  pull_request:
    branches: [dev]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Format check
        run: bun run format:check

      - name: Run tests
        run: bun test

      - name: Build
        run: bun run build
```

**2. Staging Deployment (.github/workflows/deploy-staging.yml):**

```yaml
name: Deploy to Staging

on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}:staging-${{ github.sha }} .
          docker push ghcr.io/${{ github.repository }}:staging-${{ github.sha }}

      - name: Deploy to staging
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/locxanh
            export IMAGE_TAG=staging-${{ github.sha }}
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d
            docker exec locxanh-staging-app bunx prisma migrate deploy

      - name: Health check
        run: curl -f https://staging.locxanh.vn/api/health || exit 1
```

**3. Production Deployment (.github/workflows/deploy-production.yml):**

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      reason:
        description: "Deployment reason"
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Pre-deployment checks
        run: |
          bun run typecheck
          bun run lint
          bun test

      - name: Create database backup
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/locxanh
            ./scripts/backup.sh

      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}:prod-${{ github.sha }} .
          docker push ghcr.io/${{ github.repository }}:prod-${{ github.sha }}

      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/locxanh
            export IMAGE_TAG=prod-${{ github.sha }}
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --no-deps app
            sleep 30

      - name: Post-deployment health check
        run: |
          curl -f https://locxanh.vn/api/health || \
          (echo "Health check failed, triggering rollback" && exit 1)

      - name: Create GitHub release
        run: |
          gh release create prod-${{ github.sha }} \
            --title "Production Release ${{ github.sha }}" \
            --notes "Deployed by ${{ github.actor }}: ${{ github.event.inputs.reason }}"
```

---

## Database Management

### Migrations

**Development:**

```bash
# Create migration from schema changes
bunx prisma migrate dev --name add_monthly_statement_model

# Reset database (development only)
bunx prisma migrate reset
```

**Production/Staging:**

```bash
# Check migration status
bunx prisma migrate status

# Apply migrations
bunx prisma migrate deploy

# Create backup before migration
./scripts/backup.sh
```

### Backups

**Automated backup script (`scripts/backup.sh`):**

```bash
#!/bin/bash
BACKUP_DIR="/opt/locxanh/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"

echo "Creating database backup: $BACKUP_FILE"
docker exec locxanh-db pg_dump -U postgres locxanh | gzip > $BACKUP_FILE

# Keep last 7 days only
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
ls -lh $BACKUP_FILE
```

**Manual backup:**

```bash
# Create backup
./scripts/backup.sh

# List backups
ls -lh /opt/locxanh/backups/

# Restore backup
gunzip -c /opt/locxanh/backups/backup-20251222-120000.sql.gz | \
docker exec -i locxanh-db psql -U postgres locxanh
```

### Performance Monitoring

**Database queries:**

```bash
# Active connections
docker exec locxanh-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries (requires pg_stat_statements extension)
docker exec locxanh-db psql -U postgres -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Index usage
docker exec locxanh-db psql -U postgres -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';"
```

---

## Monitoring & Observability

### Health Checks

**Application health endpoint:**

```bash
curl https://locxanh.vn/api/health
# Expected: {"status":"ok","timestamp":"2025-12-22T10:00:00Z","version":"1.0.0"}
```

**Container health:**

```bash
docker ps --filter name=locxanh --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"
```

### Logs

**View application logs:**

```bash
# Real-time
docker-compose -f docker-compose.prod.yml logs -f app

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 app

# Error logs only
docker-compose -f docker-compose.prod.yml logs app | grep -i error

# Follow specific container
docker logs -f locxanh-app-1
```

**Structured logging format:**

```json
{
  "timestamp": "2025-12-22T10:00:00Z",
  "level": "INFO",
  "service": "locxanh-app",
  "traceId": "abc123",
  "message": "Customer created",
  "metadata": {
    "userId": "user-123",
    "customerId": "cust-456"
  }
}
```

### Metrics

**Resource usage:**

```bash
# CPU and Memory
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Disk usage
df -h /opt/locxanh
docker system df

# Network
docker network stats locxanh_default
```

**Application metrics (custom):**

```bash
# API response times
curl https://locxanh.vn/api/metrics/response-times

# Database query times
curl https://locxanh.vn/api/metrics/query-times

# Active users
curl https://locxanh.vn/api/metrics/active-users
```

### Monitoring Tools

**Recommended setup:**

1. **Application monitoring:** Sentry or DataDog
2. **Infrastructure:** Prometheus + Grafana
3. **Log aggregation:** ELK Stack or Loki
4. **Uptime monitoring:** UptimeRobot or Pingdom

**Quick setup with docker-compose:**

```yaml
# Add to docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Rollback Procedures

### Automatic Rollback

**Trigger conditions:**

- Health check fails after deployment
- Application crashes within 5 minutes
- Database migration fails
- Error rate exceeds threshold

**Automatic rollback (configured in CI/CD):**

```yaml
update_config:
  failure_action: rollback
  rollback: true
```

### Manual Rollback

**Quick rollback to previous version:**

```bash
# On production server
cd /opt/locxanh

# Find previous working image
docker images | grep locxanh

# Rollback to previous version
export IMAGE_TAG=prod-abc123  # Previous working version
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps app

# Verify
curl https://locxanh.vn/api/health
```

**Rollback with database restore:**

```bash
# 1. Stop application
docker-compose -f docker-compose.prod.yml stop app

# 2. Restore database
gunzip -c /opt/locxanh/backups/backup-20251222-080000.sql.gz | \
docker exec -i locxanh-db psql -U postgres locxanh

# 3. Deploy previous version
export IMAGE_TAG=prod-abc123
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
curl https://locxanh.vn/api/health
```

**Emergency rollback (no CI/CD):**

```bash
# Direct docker commands on server
docker stop locxanh-app-prod
docker rm locxanh-app-prod
docker run -d --name locxanh-app-prod \
  -e NODE_ENV=production \
  --network locxanh_default \
  ghcr.io/your-org/locxanh:prod-abc123
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptom:** Application won't start, "connection refused" errors

**Solution:**

```bash
# Check database container
docker ps | grep db
docker logs locxanh-db

# Verify database is ready
docker exec locxanh-db pg_isready -U postgres

# Check connection string
echo $DATABASE_URL

# Restart database
docker-compose restart db
```

#### 2. Migration Failed

**Symptom:** "Migration failed: table already exists"

**Solution:**

```bash
# Check migration status
docker exec locxanh-app bunx prisma migrate status

# For staging: reset and re-migrate
docker exec locxanh-app bunx prisma migrate reset --force
docker exec locxanh-app bunx prisma migrate dev

# For production: fix migration manually
docker exec -it locxanh-db psql -U postgres locxanh
# Then manually fix the schema
```

#### 3. Container Won't Start

**Symptom:** Container exits immediately

**Solution:**

```bash
# Check logs
docker logs locxanh-app

# Check environment variables
docker exec locxanh-app env

# Verify all dependencies are healthy
docker-compose ps

# Check specific error
docker inspect locxanh-app --format='{{.State.Error}}'
```

#### 4. Out of Disk Space

**Symptom:** "no space left on device"

**Solution:**

```bash
# Check disk usage
df -h
docker system df

# Clean up old images
docker system prune -af --volumes
docker image prune -af --filter "until=168h"

# Remove old backups (keep last 7 days)
find /opt/locxanh/backups -name "backup-*.sql.gz" -mtime +7 -delete

# Clear logs
docker logs --since 24h locxanh-app > /dev/null
```

#### 5. Slow Performance

**Symptom:** High response times, slow queries

**Solution:**

```bash
# Check database connections
docker exec locxanh-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
docker exec locxanh-db psql -U postgres -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Add indexes if needed
docker exec locxanh-db psql -U postgres -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_name_norm ON customers(company_name_norm);"

# Restart application
docker-compose restart app
```

#### 6. Health Check Failing

**Symptom:** Load balancer marks container as unhealthy

**Solution:**

```bash
# Test health endpoint manually
docker exec locxanh-app curl -f http://localhost:3000/api/health

# Check application logs for errors
docker logs locxanh-app | grep -i error

# Verify database connectivity
docker exec locxanh-app bunx prisma db execute --sql "SELECT 1"

# Restart container
docker-compose restart app
```

#### 7. File Upload Issues

**Symptom:** Uploads fail, "access denied" errors

**Solution:**

```bash
# Check MinIO/S3 service
docker ps | grep minio
docker logs locxanh-minio

# Verify bucket exists
docker exec locxanh-minio mc ls s3/locxanh

# Check credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Restart storage service
docker-compose restart minio
```

#### 8. Authentication Issues

**Symptom:** Login fails, "invalid credentials" or "session expired"

**Solution:**

```bash
# Check NextAuth secret
echo $NEXTAUTH_SECRET

# Verify Google OAuth credentials
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check session table
docker exec locxanh-db psql -U postgres -c "SELECT COUNT(*) FROM session;"

# Clear sessions (forces re-login)
docker exec locxanh-db psql -U postgres -c "DELETE FROM session;"
```

### Advanced Troubleshooting

**Debug mode:**

```bash
# Enable debug logging
export DEBUG=locxanh:*
export NODE_OPTIONS="--inspect=0.0.0.0:9229"

# Run in foreground
docker-compose up app
```

**Database debugging:**

```bash
# Connection pool status
docker exec locxanh-db psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Lock monitoring
docker exec locxanh-db psql -U postgres -c "SELECT * FROM pg_locks;"

# Slow query log (requires config)
docker exec locxanh-db psql -U postgres -c "SHOW log_min_duration_statement;"
```

**Application debugging:**

```bash
# Memory usage
docker exec locxanh-app ps aux --sort=-%mem

# Network connections
docker exec locxanh-app netstat -tulpn

# File descriptors
docker exec locxanh-app cat /proc/sys/fs/file-nr
```

---

## Performance Optimization

### Database Optimization

**Index strategy:**

```sql
-- Vietnamese search optimization
CREATE INDEX idx_customer_name_trgm ON customers USING gin(company_name_norm gin_trgm_ops);

-- Common query patterns
CREATE INDEX idx_customer_status_tier ON customers(status, tier);
CREATE INDEX idx_invoice_due_status ON invoices(dueDate, status);
CREATE INDEX idx_contract_end_status ON contracts(endDate, status);

-- Date range queries
CREATE INDEX idx_care_schedule_date ON care_schedule(scheduledDate);
CREATE INDEX idx_activity_log_created ON activity_logs(createdAt);
```

**Query optimization:**

```bash
# Use raw SQL for complex aggregations (60% faster)
# Instead of 5 separate Prisma queries, use single raw query

# Example from codebase:
const stats = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE status != 'TERMINATED') as total,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    COUNT(*) FILTER (WHERE tier = 'VIP') as vip
  FROM customers;
`;
```

### Application Optimization

**Code splitting:**

```typescript
// Dynamic imports for heavy components
const RevenueChart = dynamic(
  () => import('@/components/analytics/revenue-dashboard'),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false
  }
);
```

**Caching strategy:**

```typescript
// Redis-ready architecture
export async function getCustomerStats() {
  const cacheKey = "stats:customer";

  // Layer 1: Memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // Layer 2: Redis (when implemented)
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  // Layer 3: Database
  const stats = await prisma.$queryRaw`...`;

  // Cache for 5 minutes
  if (redis) {
    await redis.setex(cacheKey, 300, JSON.stringify(stats));
  }
  memoryCache.set(cacheKey, stats);

  return stats;
}
```

### Infrastructure Optimization

**Nginx configuration:**

```nginx
# Production nginx config
upstream locxanh {
    server app:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name locxanh.vn;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://locxanh;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Docker resource limits:**

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
```

---

## Security Checklist

### Pre-Deployment Security Checklist

- [ ] **Environment Variables**
  - [ ] All secrets stored in GitHub Secrets
  - [ ] No secrets in code or .env files
  - [ ] NEXTAUTH_SECRET generated with `openssl rand -base64 32`
  - [ ] Database passwords are strong (32+ chars)

- [ ] **Database Security**
  - [ ] PostgreSQL uses strong passwords
  - [ ] Database not exposed to internet
  - [ ] Regular backups configured
  - [ ] Encryption at rest enabled

- [ ] **Network Security**
  - [ ] Firewall configured (ports 80, 443, 22 only)
  - [ ] SSL/TLS certificates installed
  - [ ] HTTPS enforced
  - [ ] Security headers configured

- [ ] **Application Security**
  - [ ] All inputs validated with Zod
  - [ ] SQL injection prevented (Prisma)
  - [ ] XSS protection enabled
  - [ ] CSRF protection enabled
  - [ ] Rate limiting configured

- [ ] **Access Control**
  - [ ] RBAC implemented (5 roles)
  - [ ] Authentication required for all routes
  - [ ] Session timeout configured
  - [ ] Password reset flow secure

- [ ] **File Uploads**
  - [ ] File type validation
  - [ ] Size limits enforced
  - [ ] Virus scanning (optional)
  - [ ] Presigned URLs with expiration

- [ ] **Monitoring & Logging**
  - [ ] Audit logging enabled
  - [ ] Error tracking configured
  - [ ] Security events logged
  - [ ] Alerting configured

### Post-Deployment Security Verification

```bash
# 1. Verify SSL certificate
echo | openssl s_client -servername locxanh.vn -connect locxanh.vn:443 2>/dev/null | openssl x509 -noout -dates

# 2. Check security headers
curl -I https://locxanh.vn | grep -i "security\|x-\|strict-transport"

# 3. Test rate limiting
for i in {1..20}; do curl -s https://locxanh.vn/api/health > /dev/null; done

# 4. Verify no sensitive data in logs
docker logs locxanh-app | grep -i "password\|secret\|key"

# 5. Check file permissions
ls -la /opt/locxanh/.env.production
# Should be 600 or 400

# 6. Verify database access
docker exec locxanh-db psql -U postgres -c "SELECT usename, usesuper FROM pg_user;"
# Should only show postgres and application user
```

### Security Incident Response

**If you suspect a breach:**

1. **Immediate:** Change all secrets in GitHub
2. **Within 1 hour:** Rotate database passwords
3. **Within 2 hours:** Review audit logs
4. **Within 4 hours:** Deploy with new secrets
5. **Within 24 hours:** Full security audit

**Emergency contacts:**

- Security team: security@locxanh.vn
- Database admin: dba@locxanh.vn
- DevOps lead: devops@locxanh.vn

---

## Maintenance Schedule

### Daily Tasks (Automated)

- [ ] Health check monitoring
- [ ] Error log review
- [ ] Disk space monitoring
- [ ] Backup verification

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Verify backup restoration process
- [ ] Review access logs

### Monthly Tasks

- [ ] Test disaster recovery
- [ ] Update dependencies
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Clean up old Docker images

### Quarterly Tasks

- [ ] Rotate all secrets
- [ ] Update SSL certificates
- [ ] Review and update documentation
- [ ] Load testing
- [ ] Architecture review

---

## Deployment Checklist

### Before Any Deployment

**Development to Staging:**

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Database migrations tested locally
- [ ] Documentation updated

**Staging to Production:**

- [ ] All above checks pass
- [ ] Staging deployment tested
- [ ] Health checks pass on staging
- [ ] Database backup created
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

### During Deployment

- [ ] Monitor logs in real-time
- [ ] Watch health endpoint
- [ ] Check error rates
- [ ] Verify database migrations
- [ ] Confirm container health

### After Deployment

- [ ] Verify all services healthy
- [ ] Test critical user flows
- [ ] Monitor for 30 minutes
- [ ] Update deployment records
- [ ] Notify team of completion

---

## Related Documentation

- **Coolify Deployment**: `./coolify-deployment.md` - Complete step-by-step Coolify deployment (1200+ lines)
- **Architecture**: `./system-architecture.md`
- **Code Standards**: `./code-standards.md`
- **Project Roadmap**: `./project-roadmap.md`
- **Database Schema**: `../prisma/schema.prisma`

---

## Changelog

| Date       | Version | Changes                                                                                                       |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| 2025-12-18 | 1.0.0   | Initial deployment guide                                                                                      |
| 2025-12-22 | 2.0.0   | Updated for Phase 2.5, added Redis, monitoring, performance optimization, troubleshooting, security checklist |
| 2025-12-22 | 2.1.0   | Added Coolify deployment section with link to comprehensive guide                                             |

---

## Unresolved Questions

1. **Redis Implementation**: Should Redis be required or optional for production?
2. **Monitoring Stack**: Which monitoring solution (Sentry, DataDog, Prometheus) should be recommended?
3. **Auto-scaling**: Should we document Kubernetes deployment for future scaling needs?
4. **CDN Integration**: When to add CDN for static assets?
5. **Disaster Recovery**: Need detailed DR plan with RTO/RPO targets?

**Next Review**: After Phase 3 completion (Performance Optimization)

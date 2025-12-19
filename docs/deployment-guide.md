# Deployment Guide

Comprehensive guide for deploying Lộc Xanh Plant Rental CRM to staging and production environments.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Deployment Strategy:**
- **Staging:** Automatic deployment on push to `dev` branch
- **Production:** Automatic deployment on push to `main`/`master` branch or version tags
- **Method:** Docker containers with blue-green deployment for zero-downtime
- **Database:** Automated migrations with backup before deployment

**Environments:**
| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | * | localhost:3000 | Local development |
| Staging | dev | staging.locxanh.vn | Pre-production testing |
| Production | main/master | locxanh.vn | Live application |

---

## Prerequisites

### Server Requirements

**Staging Server:**
- OS: Ubuntu 22.04 LTS or newer
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Disk: 50GB minimum
- Docker: 24.0+ & Docker Compose: 2.20+

**Production Server:**
- OS: Ubuntu 22.04 LTS or newer
- CPU: 4 cores minimum (8 recommended)
- RAM: 8GB minimum (16GB recommended)
- Disk: 100GB minimum (SSD recommended)
- Docker: 24.0+ & Docker Compose: 2.20+

### GitHub Repository Secrets

Configure these secrets in GitHub Settings → Secrets and variables → Actions:

**Staging Secrets:**
```bash
STAGING_HOST=staging.locxanh.vn
STAGING_USER=deploy
STAGING_SSH_KEY=<private-ssh-key>
STAGING_SSH_PORT=22
STAGING_DEPLOY_PATH=/opt/locxanh
STAGING_URL=https://staging.locxanh.vn
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/locxanh_staging
```

**Production Secrets:**
```bash
PROD_HOST=locxanh.vn
PROD_USER=deploy
PROD_SSH_KEY=<private-ssh-key>
PROD_SSH_PORT=22
PROD_DEPLOY_PATH=/opt/locxanh
PROD_URL=https://locxanh.vn
PROD_DATABASE_URL=postgresql://user:pass@host:5432/locxanh
```

**GitHub Token (automatic):**
- `GITHUB_TOKEN` - Auto-provided by GitHub Actions

---

## Environment Setup

### 1. Server Preparation

**Create deployment user:**
```bash
# On deployment server
sudo adduser deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/locxanh
sudo chown deploy:deploy /opt/locxanh
```

**Install Docker:**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Setup SSH access:**
```bash
# On your local machine
ssh-keygen -t ed25519 -C "deploy@locxanh" -f ~/.ssh/locxanh_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/locxanh_deploy.pub deploy@server

# Add private key to GitHub Secrets
cat ~/.ssh/locxanh_deploy | pbcopy  # macOS
cat ~/.ssh/locxanh_deploy | xclip   # Linux
```

### 2. Server Directory Structure

```bash
/opt/locxanh/
├── docker-compose.prod.yml      # Production compose file
├── docker-compose.staging.yml   # Staging compose file
├── .env.production              # Production environment variables
├── .env.staging                 # Staging environment variables
├── nginx/
│   ├── production.conf          # Production nginx config
│   ├── staging.conf             # Staging nginx config
│   └── ssl/                     # SSL certificates
│       ├── cert.pem
│       └── key.pem
├── backups/                     # Database backups
└── scripts/
    ├── backup.sh                # Backup script
    └── init-db.sql              # Database initialization
```

### 3. Environment Variables

**Create `/opt/locxanh/.env.production`:**
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db:5432/locxanh
POSTGRES_USER=postgres
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=locxanh

# Authentication
NEXTAUTH_URL=https://locxanh.vn
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Storage
MINIO_ACCESS_KEY=<generate-random-string>
MINIO_SECRET_KEY=<generate-random-string>
MINIO_CONSOLE_URL=https://minio.locxanh.vn

# GitHub Container Registry
GITHUB_REPOSITORY=your-org/locxanh
IMAGE_TAG=latest

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

**Create `/opt/locxanh/.env.staging`:**
```env
# Similar to production but with staging values
NODE_ENV=production
NEXT_PUBLIC_ENV=staging
PORT=3000

DATABASE_URL=postgresql://postgres:PASSWORD@db:5432/locxanh_staging
# ... (staging-specific values)
```

---

## Staging Deployment

### Automatic Deployment

**Trigger:** Push to `dev` branch

```bash
git checkout dev
git add .
git commit -m "feat: new feature"
git push origin dev
```

**Workflow Steps:**
1. ✅ Build Docker image
2. ✅ Push to GitHub Container Registry
3. ✅ Run database migrations
4. ✅ Deploy to staging server
5. ✅ Run smoke tests
6. ✅ Create deployment record

**Monitoring:**
```bash
# Watch deployment logs
gh run watch

# Check deployment status
gh run list --workflow=deploy-staging.yml
```

### Manual Deployment

```bash
# Trigger manual deployment
gh workflow run deploy-staging.yml

# On staging server (manual rollout)
cd /opt/locxanh
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d
```

---

## Production Deployment

### Automatic Deployment

**Trigger 1:** Push to `main`/`master` branch
```bash
git checkout main
git merge dev
git push origin main
```

**Trigger 2:** Create version tag
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

**Workflow Steps:**
1. ✅ Pre-deployment checks
2. ✅ Build production Docker image
3. ✅ Create database backup
4. ✅ Run database migrations
5. ✅ Blue-green deployment
6. ✅ Post-deployment tests
7. ✅ Create GitHub release
8. ⚠️  Auto-rollback on failure

### Manual Deployment

```bash
# Trigger with reason
gh workflow run deploy-production.yml -f reason="Hotfix for bug #123"

# On production server (emergency manual deployment)
cd /opt/locxanh
export IMAGE_TAG=prod-abc123  # Specific commit SHA
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-build
```

---

## Rollback Procedures

### Automatic Rollback

Production deployment automatically rolls back if:
- Deployment fails
- Post-deployment tests fail
- Health checks fail

### Manual Rollback

**Quick Rollback (to previous version):**
```bash
# On production server
cd /opt/locxanh

# Restart with previous image
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl https://locxanh.vn/api/health
```

**Rollback to Specific Version:**
```bash
# Find desired version
docker images | grep locxanh

# Set image tag
export IMAGE_TAG=prod-abc123  # Replace with desired version

# Deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**Database Rollback:**
```bash
# List backups
ls -lh /opt/locxanh/backups/

# Restore backup
cd /opt/locxanh/backups
gunzip backup-20251218-120000.sql.gz
docker exec -i locxanh-db psql -U postgres locxanh < backup-20251218-120000.sql

# Restart application
docker-compose -f docker-compose.prod.yml restart app
```

---

## Monitoring

### Health Checks

**Application Health:**
```bash
curl https://locxanh.vn/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Container Health:**
```bash
docker ps --filter name=locxanh --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"
```

**Resource Usage:**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Logs

**View application logs:**
```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f app

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 app

# Error logs only
docker-compose -f docker-compose.prod.yml logs app | grep -i error
```

**View database logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f db
```

### Metrics

**Database connections:**
```bash
docker exec locxanh-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**Disk usage:**
```bash
df -h /opt/locxanh
docker system df
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Failed: Image Pull Error

**Symptom:**
```
Error response from daemon: manifest unknown
```

**Solution:**
```bash
# Verify image exists
docker images | grep locxanh

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull manually
docker pull ghcr.io/org/repo:tag
```

#### 2. Container Won't Start

**Symptom:**
```
Container exits immediately after start
```

**Solution:**
```bash
# Check logs
docker logs locxanh-app-staging

# Check environment variables
docker exec locxanh-app-staging env

# Verify database connection
docker exec locxanh-app-staging bunx prisma db execute --sql "SELECT 1"
```

#### 3. Database Migration Failed

**Symptom:**
```
Error: Migration failed
```

**Solution:**
```bash
# Check migration status
docker exec locxanh-app-staging bunx prisma migrate status

# Reset migrations (staging only!)
docker exec locxanh-app-staging bunx prisma migrate reset --force

# Apply migrations manually
docker exec locxanh-app-staging bunx prisma migrate deploy
```

#### 4. Health Check Failing

**Symptom:**
```
Health check failed
```

**Solution:**
```bash
# Check application logs
docker logs locxanh-app-staging

# Test health endpoint manually
docker exec locxanh-app-staging wget -q0- http://localhost:3000/api/health

# Restart container
docker-compose -f docker-compose.prod.yml restart app
```

#### 5. Out of Disk Space

**Symptom:**
```
no space left on device
```

**Solution:**
```bash
# Check disk usage
df -h
docker system df

# Clean up
docker system prune -af --volumes
docker image prune -af --filter "until=48h"

# Remove old backups
find /opt/locxanh/backups -name "backup-*.sql.gz" -mtime +30 -delete
```

---

## Maintenance

### Daily Tasks
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor disk space

### Weekly Tasks
- [ ] Verify backups are created
- [ ] Review performance metrics
- [ ] Check for security updates

### Monthly Tasks
- [ ] Test backup restoration
- [ ] Review and update dependencies
- [ ] Audit access logs
- [ ] Clean up old Docker images

---

## Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] SSL certificates installed and auto-renewing
- [ ] Environment variables stored securely
- [ ] Database backups encrypted
- [ ] Regular security updates applied
- [ ] Access logs monitored
- [ ] Secrets rotated quarterly

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| DevOps Lead | devops@locxanh.vn | 24/7 |
| Database Admin | dba@locxanh.vn | Business hours |
| Security Team | security@locxanh.vn | 24/7 |

---

## Additional Resources

- [CI/CD Pipeline Documentation](./ci-cd-pipeline.md)
- [Database Migrations Guide](./database-migrations.md)
- [Monitoring Setup](./monitoring.md) (to be created)
- [Backup and Restore](./backup-restore.md) (to be created)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-18 | 1.0.0 | Initial deployment guide |

---

## Unresolved Questions

None - deployment workflows are production-ready.

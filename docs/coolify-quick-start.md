# Coolify Quick Start Guide

**TL;DR: Deploy Lộc Xanh CRM to Coolify in 15 minutes**

---

## Prerequisites

- Coolify instance (v4.x) or Coolify Cloud account
- GitHub repository with your code
- Domain name (optional but recommended)

---

## 5-Step Deployment

### Step 1: Create Database in Coolify

1. Go to Coolify → New → PostgreSQL
2. Configure:
   - Name: `postgres-locxanh`
   - Version: `17.2`
   - User: `locxanh`
   - Database: `locxanh_crm`
3. Deploy and wait for "Healthy" status
4. **Critical**: Enable extensions in terminal:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS unaccent;
   ```

### Step 2: Add Application

1. New → Application → GitHub
2. Select your repository
3. Configure:
   - **Build Command**: `pnpm install && pnpm prisma generate && pnpm next build --webpack`
   - **Start Command**: `pnpm next start`
   - **Port**: `3000`

### Step 3: Set Environment Variables

Add these in Coolify → Application → Environment Variables:

```env
# Database (get from PostgreSQL service)
DATABASE_URL=postgres://locxanh:<password>@postgres-locxanh:5432/locxanh_crm

# Authentication (generate these)
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<your-google-oauth-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-secret>

# Optional: Storage, Maps, AI
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://minio:9000
AWS_BUCKET_NAME=locxanh
GOOGLE_MAPS_API_KEY=<your-key>
GEMINI_API_KEY=<your-key>
```

### Step 4: Configure Domain & Deploy

1. Add domain: `crm.yourdomain.com`
2. Enable SSL (automatic)
3. Click **"Deploy"**
4. Monitor logs - should take 2-3 minutes

### Step 5: Post-Deployment

1. **Run migrations**: Application → Terminal → `pnpm prisma migrate deploy`
2. **Health check**: `https://crm.yourdomain.com/api/health`
3. **Test login**: Access site → Login with Google
4. **Verify features**: Create customer, contract, invoice

---

## Troubleshooting

### Build fails
- Check `DATABASE_URL` is correct
- Ensure PostgreSQL extensions are enabled
- Try "Force Rebuild" in settings

### Database connection error
- Verify database service name in `DATABASE_URL`
- Check database is "Healthy"
- Ensure same project network

### OAuth redirect loop
- Set `NEXTAUTH_URL=https://crm.yourdomain.com`
- Add redirect URI in Google Console: `https://crm.yourdomain.com/api/auth/callback/google`

### Out of memory
- Increase memory to 2048 MB
- Add swap: 1024 MB

---

## Essential Commands

```bash
# In Coolify Terminal
pnpm prisma migrate deploy
pnpm prisma studio
pnpm run validate
```

---

## Next Steps

- **Full Guide**: See `coolify-deployment-guide.md` for detailed instructions
- **Troubleshooting**: See `deployment-guide.md` for common issues
- **Monitoring**: Set up alerts in Coolify → Settings → Notifications

---

**Status**: Production Ready ✅
**Last Updated**: 2025-12-22
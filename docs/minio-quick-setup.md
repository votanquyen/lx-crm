# MinIO S3 Setup Checklist

**Purpose:** Quick reference for setting up MinIO S3 photo storage
**Target:** External MinIO server (separate from VPS)

---

## Pre-Setup Checklist

- [ ] MinIO server accessible (external host or VPS)
- [ ] Domain or IP for MinIO (`minio.yourserver.com`)
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Nginx or reverse proxy configured
- [ ] Firewall ports open (9000, 9001)

---

## Quick Setup Steps

### 1. Install MinIO (Ubuntu/Debian)

```bash
# Download and install
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create user and directories
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /mnt/data/minio
sudo chown minio-user:minio-user /mnt/data/minio
```

### 2. Configure MinIO

**Edit:** `/etc/default/minio`
```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your-strong-password-here
MINIO_VOLUMES="/mnt/data/minio"
MINIO_SERVER_URL="https://minio.yourserver.com"
```

### 3. Create systemd service

```bash
# Copy service file
sudo cp /path/to/minio.service /etc/systemd/system/

# Enable and start
sudo systemctl enable minio.service
sudo systemctl start minio.service
sudo systemctl status minio.service
```

### 4. Configure Nginx (HTTPS)

```bash
# Copy nginx config
sudo cp /path/to/minio-nginx.conf /etc/nginx/sites-available/minio

# Enable site
sudo ln -s /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot --nginx -d minio.yourserver.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Create Bucket via Console

1. Open `https://console.minio.yourserver.com`
2. Login with root credentials
3. Create bucket: `locxanh-photos`
4. Set bucket policy to **public read**
5. Configure CORS rules

### 6. Create Service Account

1. **Identity** → **Service Accounts**
2. Click **Create Service Account**
3. Copy Access Key and Secret Key
4. Save to `.env` file

---

## Application Configuration

### Update .env file

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required variables:**
```bash
MINIO_ENDPOINT=https://minio.yourserver.com
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_access_key_here
MINIO_SECRET_KEY=your_secret_key_here
MINIO_BUCKET=locxanh-photos
MINIO_PUBLIC_URL=https://minio.yourserver.com/locxanh-photos
```

---

## Testing

### 1. Test connection

```bash
bun run scripts/test-minio-upload.ts
```

**Expected output:**
```
✅ MinIO connection successful
✅ Upload successful
✅ Public URL accessible
✅ All tests passed! ✨
```

### 2. Test from browser

1. Start dev server: `bun run dev`
2. Navigate to `/care/new`
3. Create a care schedule
4. Go to completion page
5. Upload a test photo
6. Verify photo displays

---

## Verification Checklist

### MinIO Server
- [ ] MinIO service running (`systemctl status minio`)
- [ ] Ports accessible (9000, 9001)
- [ ] Console accessible via browser
- [ ] Can login with root credentials

### Nginx/SSL
- [ ] HTTPS certificate valid
- [ ] HTTP redirects to HTTPS
- [ ] No certificate warnings
- [ ] Reverse proxy working

### Bucket Configuration
- [ ] Bucket `locxanh-photos` exists
- [ ] Public read policy applied
- [ ] CORS configured correctly
- [ ] Service account created

### Application Integration
- [ ] `.env` file configured
- [ ] Test script passes all tests
- [ ] Photo upload works from browser
- [ ] Public URLs accessible
- [ ] Photos display in care detail page

---

## Common Issues & Fixes

### Connection Refused
```bash
# Check MinIO status
sudo systemctl status minio.service

# Check logs
sudo journalctl -u minio.service -n 50

# Restart if needed
sudo systemctl restart minio.service
```

### CORS Errors
```bash
# Install mc CLI
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc && sudo mv mc /usr/local/bin/

# Configure alias
mc alias set myminio https://minio.yourserver.com minioadmin password

# Apply CORS
mc cors set myminio/locxanh-photos cors.json
```

### Upload Fails
```bash
# Check bucket policy
mc policy get myminio/locxanh-photos

# Set public download
mc anonymous set download myminio/locxanh-photos

# Check Nginx body size
# Edit /etc/nginx/nginx.conf
client_max_body_size 100M;
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate
openssl s_client -connect minio.yourserver.com:443

# Reload Nginx
sudo systemctl reload nginx
```

---

## Performance Optimization

### Enable Nginx Caching
```nginx
proxy_cache_path /var/cache/nginx/minio levels=1:2 keys_zone=minio_cache:10m max_size=1g;

location / {
    proxy_cache minio_cache;
    proxy_cache_valid 200 1h;
    # ... other settings
}
```

### Enable Compression
```nginx
gzip on;
gzip_types image/jpeg image/png application/octet-stream;
gzip_min_length 1000;
```

---

## Security Best Practices

- [ ] Changed default MinIO credentials
- [ ] Using service account (not root) in app
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall configured (only 80, 443 open)
- [ ] Bucket policy set to read-only
- [ ] Regular backups configured

---

## Monitoring

### Health Checks
```bash
# MinIO health
curl https://minio.yourserver.com/minio/health/live

# Disk usage
mc admin info myminio

# Storage stats
mc du myminio/locxanh-photos
```

### Logs
```bash
# MinIO service logs
sudo journalctl -u minio.service -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Next Steps After Setup

1. ✅ MinIO configured and running
2. ✅ Bucket created and accessible
3. ✅ Application `.env` updated
4. ✅ Tests passing
5. ⏳ **Test care schedule photo upload**
6. ⏳ **Test exchange schedule photos**
7. ⏳ **Verify photos display correctly**
8. ⏳ **Production deployment**

---

## Quick Reference

**MinIO Console:** `https://console.minio.yourserver.com`
**API Endpoint:** `https://minio.yourserver.com`
**Bucket URL:** `https://minio.yourserver.com/locxanh-photos`

**Systemd Commands:**
```bash
sudo systemctl status minio    # Check status
sudo systemctl start minio     # Start service
sudo systemctl stop minio      # Stop service
sudo systemctl restart minio   # Restart service
sudo journalctl -u minio -f    # View logs
```

**mc CLI Commands:**
```bash
mc ls myminio/locxanh-photos                    # List files
mc cp photo.jpg myminio/locxanh-photos/         # Upload file
mc rm myminio/locxanh-photos/photo.jpg          # Delete file
mc policy get myminio/locxanh-photos            # Check policy
mc anonymous set download myminio/locxanh-photos # Set public
```

---

**Ready to upload photos!** 📸

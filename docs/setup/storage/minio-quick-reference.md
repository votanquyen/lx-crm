# MinIO Quick Reference

**For comprehensive setup guide, see:** `minio-s3-storage.md`

---

## Environment Variables

```bash
MINIO_ENDPOINT=https://minio.yourserver.com
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=locxanh-photos
MINIO_REGION=us-east-1
MINIO_PUBLIC_URL=https://minio.yourserver.com/locxanh-photos
```

---

## Systemd Commands

```bash
sudo systemctl status minio    # Check status
sudo systemctl start minio     # Start service
sudo systemctl stop minio      # Stop service
sudo systemctl restart minio   # Restart service
sudo journalctl -u minio -f    # View logs
```

---

## mc CLI Commands

### Setup
```bash
# Install mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc && sudo mv mc /usr/local/bin/

# Configure alias
mc alias set myminio https://minio.yourserver.com minioadmin password
```

### Bucket Operations
```bash
mc ls myminio                              # List buckets
mc ls myminio/locxanh-photos              # List files
mc mb myminio/new-bucket                  # Create bucket
mc rb myminio/bucket                      # Remove bucket
```

### File Operations
```bash
mc cp photo.jpg myminio/locxanh-photos/   # Upload file
mc cp myminio/locxanh-photos/photo.jpg .  # Download file
mc rm myminio/locxanh-photos/photo.jpg    # Delete file
mc rm --recursive myminio/bucket/folder/  # Delete folder
```

### Policy & Permissions
```bash
mc policy get myminio/locxanh-photos              # Check policy
mc policy set download myminio/locxanh-photos     # Set public read
mc anonymous set download myminio/locxanh-photos  # Alternative
mc anonymous set upload myminio/bucket            # Public write
mc anonymous set public myminio/bucket            # Public read/write
```

### CORS
```bash
mc cors set myminio/locxanh-photos cors.json  # Apply CORS
mc cors get myminio/locxanh-photos            # View CORS
```

### Admin Operations
```bash
mc admin info myminio                         # Server info
mc admin user list myminio                    # List users
mc admin user add myminio username            # Add user
mc admin policy attach myminio readwrite --user username  # Set policy
mc admin bucket quota myminio/bucket --size 10GB  # Set quota
```

### Monitoring
```bash
mc du myminio/locxanh-photos             # Storage usage
mc stat myminio/locxanh-photos/file.jpg  # File info
mc admin trace myminio                   # Real-time trace
```

---

## Testing Commands

```bash
# Test connection
bun run scripts/test-minio-connection.ts

# Full test suite (upload, public access, performance)
bun run scripts/test-minio-upload.ts
```

---

## Nginx Commands

```bash
sudo nginx -t                # Test config
sudo systemctl reload nginx  # Reload config
sudo systemctl status nginx  # Check status
sudo tail -f /var/log/nginx/access.log  # Access logs
sudo tail -f /var/log/nginx/error.log   # Error logs
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d minio.yourserver.com

# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting Quick Fixes

### Connection Refused
```bash
sudo systemctl restart minio
sudo systemctl status minio
sudo journalctl -u minio -n 50
```

### CORS Errors
```bash
mc cors set myminio/locxanh-photos cors.json
```

### Upload Fails (403)
```bash
mc anonymous set download myminio/locxanh-photos
```

### SSL Issues
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Check Firewall
```bash
sudo ufw status
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
```

---

## Useful URLs

- **Console:** `https://console.minio.yourserver.com`
- **API:** `https://minio.yourserver.com`
- **Health:** `https://minio.yourserver.com/minio/health/live`
- **Metrics:** `https://minio.yourserver.com/minio/v2/metrics/cluster`

---

## File Organization

```
locxanh-photos/
├── care/                    # Care schedule photos
│   └── [timestamp]-[random]-[filename].jpg
├── exchange/                # Exchange schedule photos
│   └── [timestamp]-[random]-[filename].jpg
└── test/                    # Test files
    └── [timestamp]-[random]-test.png
```

---

**Full Documentation:** `docs/minio-s3-storage.md`

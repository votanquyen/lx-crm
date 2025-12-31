# MinIO S3 Setup Guide

**Purpose:** Configure external MinIO S3 server for photo storage
**Use Case:** Care schedule photos, exchange photos, plant images
**Architecture:** External MinIO server (different from VPS)

---

## Prerequisites

- MinIO server running (external host or VPS)
- Access to MinIO admin console
- Domain or IP address for MinIO server
- SSL certificate (recommended for HTTPS)

---

## Option 1: External MinIO Server (Recommended)

### Step 1: Install MinIO Server

**On Ubuntu/Debian:**
```bash
# Download MinIO binary
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create MinIO user and directories
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /mnt/data/minio
sudo chown minio-user:minio-user /mnt/data/minio
```

**On Windows:**
```powershell
# Download from https://dl.min.io/server/minio/release/windows-amd64/minio.exe
# Move to C:\minio\minio.exe
```

### Step 2: Configure MinIO

**Create environment file:** `/etc/default/minio`
```bash
# MinIO root credentials
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin-change-this

# Storage path
MINIO_VOLUMES="/mnt/data/minio"

# Console address
MINIO_SERVER_URL="https://minio.yourserver.com"
MINIO_BROWSER_REDIRECT_URL="https://console.minio.yourserver.com"
```

### Step 3: Create Systemd Service

**File:** `/etc/systemd/system/minio.service`
```ini
[Unit]
Description=MinIO
Documentation=https://min.io/docs/minio/linux/index.html
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/usr/local

User=minio-user
Group=minio-user
ProtectProc=invisible

EnvironmentFile=-/etc/default/minio
ExecStartPre=/bin/bash -c "if [ -z \"${MINIO_VOLUMES}\" ]; then echo \"Variable MINIO_VOLUMES not set in /etc/default/minio\"; exit 1; fi"
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES

# MinIO RELEASE.2023-05-04T21-44-30Z adds support for Type=notify (https://www.freedesktop.org/software/systemd/man/systemd.service.html#Type=)
# This may improve systemctl setups where other services use `After=minio.server`
# Uncomment the line to enable the functionality
# Type=notify

# Let systemd restart this service always
Restart=always

# Specifies the maximum file descriptor number that can be opened by this process
LimitNOFILE=65536

# Specifies the maximum number of threads this process can create
TasksMax=infinity

# Disable timeout logic and wait until process is stopped
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

### Step 4: Start MinIO

```bash
# Enable and start service
sudo systemctl enable minio.service
sudo systemctl start minio.service

# Check status
sudo systemctl status minio.service

# View logs
sudo journalctl -u minio.service -f
```

### Step 5: Configure Nginx Reverse Proxy (HTTPS)

**File:** `/etc/nginx/sites-available/minio`
```nginx
# MinIO API
server {
    listen 80;
    listen [::]:80;
    server_name minio.yourserver.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name minio.yourserver.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/minio.yourserver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/minio.yourserver.com/privkey.pem;

    # Ignore cert check for internal connections
    proxy_ssl_verify off;

    # Allow large uploads
    client_max_body_size 100M;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;

        proxy_pass http://localhost:9000;
    }
}

# MinIO Console
server {
    listen 80;
    listen [::]:80;
    server_name console.minio.yourserver.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name console.minio.yourserver.com;

    ssl_certificate /etc/letsencrypt/live/console.minio.yourserver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/console.minio.yourserver.com/privkey.pem;

    proxy_ssl_verify off;
    client_max_body_size 100M;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;

        real_ip_header X-Real-IP;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        chunked_transfer_encoding off;

        proxy_pass http://localhost:9001;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Certificates (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d minio.yourserver.com
sudo certbot --nginx -d console.minio.yourserver.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Option 2: Docker Compose (Quick Setup)

**File:** `docker-compose.minio.yml`
```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin-change-this
      MINIO_SERVER_URL: https://minio.yourserver.com
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.yourserver.com
    volumes:
      - minio-data:/data
    restart: unless-stopped
    networks:
      - minio-network

volumes:
  minio-data:
    driver: local

networks:
  minio-network:
    driver: bridge
```

**Start:**
```bash
docker-compose -f docker-compose.minio.yml up -d
```

---

## Configure MinIO Bucket

### Step 1: Access Console

Open browser: `https://console.minio.yourserver.com`

Login:
- Username: `minioadmin`
- Password: `minioadmin-change-this`

### Step 2: Create Bucket

1. Click **Buckets** → **Create Bucket**
2. Bucket Name: `locxanh-photos`
3. Click **Create Bucket**

### Step 3: Set Bucket Policy (Public Read)

**Policy JSON:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::locxanh-photos/*"
      ]
    }
  ]
}
```

**Apply via Console:**
1. Click bucket `locxanh-photos`
2. Go to **Access** tab
3. Click **Add Access Rule**
4. Prefix: `*` (all objects)
5. Access: **readonly** or **readwrite**

**Apply via mc CLI:**
```bash
# Install mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure alias
mc alias set myminio https://minio.yourserver.com minioadmin minioadmin-change-this

# Set public policy
mc anonymous set download myminio/locxanh-photos
```

### Step 4: Configure CORS

**CORS Rules (via Console):**
1. Bucket → **Settings** → **CORS**
2. Add rule:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://locxanh.vn</AllowedOrigin>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
  </CORSRule>
</CORSConfiguration>
```

**Via mc CLI:**
```bash
# Create cors.json
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://locxanh.vn", "http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

# Apply CORS
mc cors set myminio/locxanh-photos cors.json
```

### Step 5: Create Access Keys

**Via Console:**
1. **Identity** → **Service Accounts**
2. Click **Create Service Account**
3. Copy Access Key and Secret Key
4. Save to `.env` file

**Via mc CLI:**
```bash
mc admin user add myminio locxanh-app
mc admin policy attach myminio readwrite --user locxanh-app
```

---

## Application Configuration

### Environment Variables

**File:** `.env`
```bash
# MinIO S3 Configuration (External Host)
MINIO_ENDPOINT=https://minio.yourserver.com
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_access_key_here
MINIO_SECRET_KEY=your_secret_key_here
MINIO_BUCKET=locxanh-photos
MINIO_REGION=us-east-1

# Public URL for uploaded files
MINIO_PUBLIC_URL=https://minio.yourserver.com/locxanh-photos
```

### Test Connection

**Script:** `scripts/test-minio-connection.ts`
```typescript
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  region: process.env.MINIO_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
  tls: process.env.MINIO_USE_SSL === "true",
});

async function testConnection() {
  try {
    const command = new ListBucketsCommand({});
    const response = await client.send(command);

    console.log("✅ MinIO connection successful!");
    console.log("Buckets:", response.Buckets?.map(b => b.Name));
  } catch (error) {
    console.error("❌ MinIO connection failed:", error);
  }
}

testConnection();
```

**Run:**
```bash
bun run scripts/test-minio-connection.ts
```

---

## Troubleshooting

### Connection Refused
```bash
# Check MinIO is running
sudo systemctl status minio.service

# Check ports
sudo netstat -tulpn | grep minio

# Check firewall
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
```

### CORS Errors
```bash
# Verify CORS configuration
mc cors get myminio/locxanh-photos

# Re-apply CORS
mc cors set myminio/locxanh-photos cors.json
```

### SSL Certificate Issues
```bash
# Verify certificate
curl -v https://minio.yourserver.com

# Renew Let's Encrypt
sudo certbot renew

# Check Nginx config
sudo nginx -t
```

### Upload Fails
```bash
# Check bucket policy
mc policy get myminio/locxanh-photos

# Set public policy
mc anonymous set download myminio/locxanh-photos

# Check client max body size (Nginx)
# Edit /etc/nginx/nginx.conf
client_max_body_size 100M;
```

### Access Denied
```bash
# Verify credentials
mc alias ls

# Test with mc
mc ls myminio/locxanh-photos

# Check permissions
mc admin policy info myminio readwrite
```

---

## Security Best Practices

### 1. Change Default Credentials
```bash
# Update in /etc/default/minio
MINIO_ROOT_USER=admin-custom
MINIO_ROOT_PASSWORD=strong-password-here
```

### 2. Use Service Accounts
- Create separate service account for app
- Don't use root credentials in app
- Rotate keys regularly

### 3. Enable HTTPS Only
- Use SSL certificates (Let's Encrypt)
- Redirect HTTP to HTTPS
- Set `MINIO_USE_SSL=true`

### 4. Restrict Bucket Access
- Public read-only for photos
- Write access via API only
- Use presigned URLs for sensitive files

### 5. Monitor Storage
```bash
# Check disk usage
mc admin info myminio

# Set quotas (optional)
mc admin bucket quota myminio/locxanh-photos --size 10GB
```

---

## Performance Optimization

### 1. Enable Caching (Nginx)
```nginx
location / {
    proxy_cache minio_cache;
    proxy_cache_valid 200 1h;
    proxy_cache_key $uri;
    # ... other proxy settings
}
```

### 2. Use CDN
- CloudFlare in front of MinIO
- Cache static assets
- DDoS protection

### 3. Compression
```nginx
gzip on;
gzip_types image/jpeg image/png;
gzip_min_length 1000;
```

---

## Monitoring

### Check Health
```bash
# Health check endpoint
curl https://minio.yourserver.com/minio/health/live

# Prometheus metrics
curl https://minio.yourserver.com/minio/v2/metrics/cluster
```

### Logs
```bash
# MinIO logs
sudo journalctl -u minio.service -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Next Steps

1. ✅ Set up MinIO server (external host)
2. ✅ Configure SSL certificates
3. ✅ Create `locxanh-photos` bucket
4. ✅ Set public read policy
5. ✅ Configure CORS
6. ✅ Create service account
7. ✅ Update `.env` file
8. ⏳ Test photo upload
9. ⏳ Verify public URLs work
10. ⏳ Test from care completion form

**Ready to test photo uploads!** 🚀

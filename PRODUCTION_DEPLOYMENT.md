# SikaRemit Production Deployment Guide

## Overview

This guide covers deploying SikaRemit to production without Docker, using traditional server deployment methods.

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 22.04 LTS or Windows Server 2019+
- **RAM**: Minimum 4GB, recommended 8GB
- **CPU**: 2+ cores
- **Storage**: 50GB SSD minimum

### Software Requirements
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Nginx (reverse proxy)
- Certbot (SSL certificates)

---

## 1. Server Setup

### Ubuntu Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.11 python3.11-venv python3-pip \
    postgresql postgresql-contrib redis-server nginx certbot \
    python3-certbot-nginx git curl

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Windows Server

1. Install Python 3.11 from python.org
2. Install Node.js 18 from nodejs.org
3. Install PostgreSQL from postgresql.org
4. Install Redis (use Memurai or Redis for Windows)
5. Install IIS or use nginx for Windows

---

## 2. Database Setup

### PostgreSQL Configuration

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE sikaremit_prod;
CREATE USER sikaremit_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sikaremit_prod TO sikaremit_user;
ALTER USER sikaremit_user CREATEDB;  # For running tests
\q

# Configure PostgreSQL for production
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add/modify these settings:
```ini
# Performance tuning
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
work_mem = 16MB
max_connections = 100

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 3. Backend Deployment

### Clone and Setup

```bash
# Create application directory
sudo mkdir -p /var/www/sikaremit
sudo chown $USER:$USER /var/www/sikaremit
cd /var/www/sikaremit

# Clone repository
git clone https://github.com/your-org/sikaremit.git .

# Create virtual environment
cd backend
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### Environment Configuration

```bash
# Copy production environment file
cp .env.production .env

# Edit with your production values
nano .env
```

**Critical settings to update:**
```ini
# MUST CHANGE
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(64))">
DEBUG=False
ENVIRONMENT=production
DJANGO_USE_SQLITE=false

# Database
DB_NAME=sikaremit_prod
DB_USER=sikaremit_user
DB_PASSWORD=<your_secure_password>
DB_HOST=localhost
DB_PORT=5432

# Allowed hosts
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Payment providers (get from provider dashboards)
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Mobile Money (get from provider APIs)
MTN_MOMO_API_KEY=xxxxx
MTN_MOMO_API_SECRET=xxxxx
MTN_MOMO_API_URL=https://proxy.momoapi.mtn.com

# Email
EMAIL_HOST_PASSWORD=<sendgrid_api_key>

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Redis
REDIS_URL=redis://localhost:6379/0
```

### Database Migration

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### Gunicorn Service

Create systemd service file:
```bash
sudo nano /etc/systemd/system/sikaremit.service
```

```ini
[Unit]
Description=SikaRemit Django Backend
After=network.target postgresql.service redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/sikaremit/backend
Environment="PATH=/var/www/sikaremit/backend/venv/bin"
EnvironmentFile=/var/www/sikaremit/backend/.env
ExecStart=/var/www/sikaremit/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/run/sikaremit.sock \
    --access-logfile /var/log/sikaremit/access.log \
    --error-logfile /var/log/sikaremit/error.log \
    --capture-output \
    core.wsgi:application

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Create log directory and start service:
```bash
sudo mkdir -p /var/log/sikaremit
sudo chown www-data:www-data /var/log/sikaremit

sudo systemctl daemon-reload
sudo systemctl enable sikaremit
sudo systemctl start sikaremit
```

### Celery Worker Service

```bash
sudo nano /etc/systemd/system/sikaremit-celery.service
```

```ini
[Unit]
Description=SikaRemit Celery Worker
After=network.target redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/sikaremit/backend
Environment="PATH=/var/www/sikaremit/backend/venv/bin"
EnvironmentFile=/var/www/sikaremit/backend/.env
ExecStart=/var/www/sikaremit/backend/venv/bin/celery \
    -A core worker \
    --loglevel=info \
    --logfile=/var/log/sikaremit/celery.log

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sikaremit-celery
sudo systemctl start sikaremit-celery
```

---

## 4. Frontend Deployment

### Environment Setup

```bash
cd /var/www/sikaremit/frontend

# Install dependencies
npm ci

# Create production environment file
nano .env.local
```

Add the following (update with your values):
```ini
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment Provider Public Keys
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_xxxxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
```

### Build for Production

```bash
# Option 1: Standard build with validation
npm run build:production

# Option 2: Quick build (skip tests)
npm run build:production -- --skip-tests

# Option 3: Direct build
npm run build
```

The build creates a standalone output in `.next/standalone/`.

### Deploy Standalone Build

```bash
# Copy static files to standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Test locally
node .next/standalone/server.js
```

### PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sikaremit-frontend',
    script: '.next/standalone/server.js',
    cwd: '/var/www/sikaremit/frontend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/sikaremit/frontend-error.log',
    out_file: '/var/log/sikaremit/frontend-out.log',
    merge_logs: true,
    max_memory_restart: '500M',
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Systemd Alternative (No PM2)

```bash
sudo nano /etc/systemd/system/sikaremit-frontend.service
```

```ini
[Unit]
Description=SikaRemit Next.js Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sikaremit/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable sikaremit-frontend
sudo systemctl start sikaremit-frontend
```

---

## 5. Nginx Configuration

### Backend API

```bash
sudo nano /etc/nginx/sites-available/sikaremit-api
```

```nginx
upstream sikaremit_backend {
    server unix:/run/sikaremit.sock fail_timeout=0;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/sikaremit-api-access.log;
    error_log /var/log/nginx/sikaremit-api-error.log;

    # Max upload size
    client_max_body_size 10M;

    location /static/ {
        alias /var/www/sikaremit/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://sikaremit_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Frontend

```bash
sudo nano /etc/nginx/sites-available/sikaremit-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Sites and Get SSL

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/sikaremit-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/sikaremit-frontend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Restart nginx
sudo systemctl restart nginx
```

---

## 6. Monitoring Setup

### Prometheus Metrics

The backend already exposes Prometheus metrics at `/metrics/`. Configure Prometheus to scrape:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sikaremit'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics/'
```

### Log Rotation

```bash
sudo nano /etc/logrotate.d/sikaremit
```

```
/var/log/sikaremit/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload sikaremit >/dev/null 2>&1 || true
    endscript
}
```

---

## 7. Backup Configuration

### Automated Daily Backups

```bash
# Copy backup script
sudo cp /var/www/sikaremit/backend/scripts/backup.sh /usr/local/bin/sikaremit-backup
sudo chmod +x /usr/local/bin/sikaremit-backup

# Add to crontab
sudo crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/sikaremit-backup >> /var/log/sikaremit/backup.log 2>&1
```

---

## 8. Security Checklist

- [ ] All API keys are production keys (not test/sandbox)
- [ ] DEBUG=False in production
- [ ] SECRET_KEY is unique and secure (64+ characters)
- [ ] Database password is strong
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key authentication only (disable password auth)
- [ ] Regular security updates scheduled
- [ ] Backup system tested
- [ ] Monitoring alerts configured

---

## 9. Post-Deployment Verification

```bash
# Check services
sudo systemctl status sikaremit
sudo systemctl status sikaremit-celery
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# Test API
curl -I https://api.yourdomain.com/api/v1/health/

# Check logs
sudo tail -f /var/log/sikaremit/error.log
sudo tail -f /var/log/nginx/sikaremit-api-error.log
```

---

## 10. Rollback Procedure

If deployment fails:

```bash
# Stop services
sudo systemctl stop sikaremit sikaremit-celery

# Restore previous version
cd /var/www/sikaremit
git checkout <previous-commit-hash>

# Restore database if needed
gunzip -c /var/backups/sikaremit/latest.sql.gz | psql -U sikaremit_user sikaremit_prod

# Restart services
sudo systemctl start sikaremit sikaremit-celery
```

---

## Support

For issues, check:
1. Application logs: `/var/log/sikaremit/`
2. Nginx logs: `/var/log/nginx/`
3. PostgreSQL logs: `/var/log/postgresql/`
4. Sentry dashboard for error tracking

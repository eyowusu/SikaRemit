# SikaRemit Local Server Setup Guide
## Complete Guide to Building Your Ghana-Based Backup Infrastructure

---

## Why You Need a Local Server

### BOG Requirements
1. **Data Sovereignty** - Ghanaian financial data must be accessible within Ghana
2. **Disaster Recovery** - Backup in case of international network failures
3. **Regulatory Audits** - BOG inspectors need local access to data
4. **Business Continuity** - Operations must continue even if cloud fails

---

## Option 1: Colocation at Ghana Data Center (Recommended)

### Recommended Providers

| Provider | Location | Monthly Cost | Contact |
|----------|----------|--------------|---------|
| **MainOne** | Accra | GHS 4,000-8,000 | www.mainone.net |
| **Busy Internet** | Accra | GHS 3,000-6,000 | www.busy.com.gh |
| **Vodafone Business** | Accra | GHS 5,000-10,000 | enterprise.vodafone.com.gh |

### Hardware Requirements

```
SERVER SPECIFICATIONS
=====================

Minimum Configuration:
├── CPU: Intel Xeon Silver 4314 (16 cores)
├── RAM: 64GB ECC DDR4
├── Storage: 2x 1TB NVMe SSD (RAID 1)
├── Network: 2x 10GbE ports
└── Power: Dual redundant PSU

Recommended Configuration:
├── CPU: 2x Intel Xeon Gold 6326 (32 cores total)
├── RAM: 128GB ECC DDR4
├── Storage: 4x 2TB NVMe SSD (RAID 10)
├── Network: 4x 10GbE ports (2 active, 2 failover)
└── Power: Dual redundant PSU + UPS

Recommended Server Models:
├── Dell PowerEdge R750
├── HP ProLiant DL380 Gen10
└── Lenovo ThinkSystem SR650
```

### Estimated Costs (Ghana Cedis)

| Item | One-Time Cost | Monthly Cost |
|------|---------------|--------------|
| Server Hardware | GHS 80,000 - 150,000 | - |
| Firewall (FortiGate 60F) | GHS 8,000 - 15,000 | - |
| UPS (3000VA) | GHS 5,000 - 10,000 | - |
| Network Switch | GHS 3,000 - 8,000 | - |
| Rack Space (1U-2U) | - | GHS 1,500 - 3,000 |
| Bandwidth (100Mbps) | - | GHS 2,000 - 4,000 |
| Power | - | GHS 500 - 1,000 |
| **TOTAL** | **~GHS 100,000 - 185,000** | **~GHS 4,000 - 8,000** |

---

## Option 2: Build Your Own Server Room (Advanced)

### Requirements

```
PHYSICAL REQUIREMENTS
=====================

Space:
├── Minimum: 10 sqm dedicated room
├── Floor: Raised floor with cable management
├── Access: Biometric + key card access control
└── Fire: FM-200 fire suppression system

Power:
├── Dedicated electrical circuit (32A, 3-phase)
├── UPS: 10kVA minimum with 30-minute runtime
├── Generator: Diesel backup with auto-transfer switch
└── Surge protection: Industrial-grade SPD

Cooling:
├── Precision AC: 5kW minimum capacity
├── Redundancy: N+1 cooling units
├── Temperature: Maintain 18-24°C
└── Humidity: 45-55% relative humidity

Network:
├── ISP 1: Fiber connection (minimum 100Mbps)
├── ISP 2: Backup connection (different provider)
├── Router: Enterprise-grade with BGP support
└── Firewall: Next-gen firewall with IPS/IDS
```

### Estimated Costs for Own Server Room

| Item | Cost (GHS) |
|------|------------|
| Room preparation | 50,000 - 100,000 |
| Electrical work | 30,000 - 50,000 |
| Cooling system | 40,000 - 80,000 |
| Fire suppression | 30,000 - 60,000 |
| Access control | 15,000 - 30,000 |
| Server + networking | 100,000 - 185,000 |
| **TOTAL SETUP** | **265,000 - 505,000** |
| Monthly operations | 8,000 - 15,000 |

**Recommendation:** For startups, colocation is more cost-effective. Build your own only when you need 5+ servers.

---

## Step-by-Step Setup Guide

### Phase 1: Hardware Procurement (Week 1-2)

```bash
SHOPPING LIST
=============

1. Server
   - Dell PowerEdge R750 or equivalent
   - Configure with: 2x Xeon, 128GB RAM, 4x 2TB NVMe

2. Network Equipment
   - Firewall: Fortinet FortiGate 60F
   - Switch: Cisco Catalyst 1000 or Ubiquiti UniFi
   - Cables: Cat6A patch cables

3. Power Protection
   - UPS: APC Smart-UPS 3000VA
   - PDU: Rack-mount PDU with surge protection

4. Storage Backup
   - External NAS: Synology DS920+ (for local backups)
   - External drives: 2x 8TB for offline backup
```

### Phase 2: Operating System Installation (Week 2)

```bash
# 1. Install Ubuntu Server 22.04 LTS
# Download: https://ubuntu.com/download/server

# 2. Initial Setup
sudo apt update && sudo apt upgrade -y

# 3. Install essential packages
sudo apt install -y \
    postgresql-15 \
    nginx \
    python3.11 \
    python3.11-venv \
    redis-server \
    certbot \
    fail2ban \
    ufw \
    htop \
    git

# 4. Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 5432/tcp  # PostgreSQL (from specific IPs only)
sudo ufw enable

# 5. Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Phase 3: PostgreSQL Setup (Week 2-3)

```bash
# 1. Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# 2. Configure PostgreSQL for replication
sudo nano /etc/postgresql/15/main/postgresql.conf
```

```ini
# postgresql.conf settings for REPLICA server
listen_addresses = '*'
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
hot_standby = on
```

```bash
# 3. Configure pg_hba.conf for replication
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

```ini
# Allow replication from primary server (cloud)
host    replication     replicator      PRIMARY_SERVER_IP/32    scram-sha-256
host    all             sikaremit_user  PRIMARY_SERVER_IP/32    scram-sha-256
```

```bash
# 4. Create replication user on PRIMARY (cloud) server
sudo -u postgres psql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_password_here';

# 5. Initialize replica from primary
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/15/main/*
sudo -u postgres pg_basebackup -h PRIMARY_IP -U replicator -D /var/lib/postgresql/15/main -P -R
sudo systemctl start postgresql

# 6. Verify replication status
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"
```

### Phase 4: Application Deployment (Week 3)

```bash
# 1. Create application user
sudo adduser sikaremit
sudo usermod -aG sudo sikaremit

# 2. Clone application
sudo -u sikaremit git clone https://github.com/your-repo/sikaremit.git /home/sikaremit/app

# 3. Create virtual environment
cd /home/sikaremit/app/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Configure environment variables
sudo nano /home/sikaremit/app/backend/.env
```

```ini
# .env file for local server
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=localhost,your-domain.com,local-ip

# Database (local PostgreSQL)
DATABASE_URL=postgresql://sikaremit_user:password@localhost:5432/sikaremit_prod

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
CSRF_TRUSTED_ORIGINS=https://your-domain.com
SECURE_SSL_REDIRECT=True
```

```bash
# 5. Run migrations
python manage.py migrate

# 6. Collect static files
python manage.py collectstatic --noinput

# 7. Create systemd service
sudo nano /etc/systemd/system/sikaremit.service
```

```ini
[Unit]
Description=SikaRemit Gunicorn Daemon
After=network.target

[Service]
User=sikaremit
Group=sikaremit
WorkingDirectory=/home/sikaremit/app/backend
ExecStart=/home/sikaremit/app/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/run/gunicorn.sock \
    core.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
# 8. Start service
sudo systemctl enable sikaremit
sudo systemctl start sikaremit
```

### Phase 5: Nginx Configuration (Week 3)

```bash
sudo nano /etc/nginx/sites-available/sikaremit
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/sikaremit/app/backend/staticfiles/;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sikaremit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Phase 6: Backup Configuration (Week 4)

```bash
# 1. Create backup script
sudo nano /home/sikaremit/scripts/local_backup.sh
```

```bash
#!/bin/bash
# SikaRemit Local Backup Script

set -e

BACKUP_DIR="/var/backups/sikaremit"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sikaremit_prod"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U sikaremit_user -Fc $DB_NAME > "$BACKUP_DIR/db_$DATE.dump"

# Application backup
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /home/sikaremit/app

# Keep only last 30 days
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Copy to external NAS (if available)
if [ -d "/mnt/nas/backups" ]; then
    cp "$BACKUP_DIR/db_$DATE.dump" /mnt/nas/backups/
fi

echo "Backup completed: $DATE"
```

```bash
# 2. Schedule backup
sudo crontab -e
# Add: 0 3 * * * /home/sikaremit/scripts/local_backup.sh >> /var/log/sikaremit_backup.log 2>&1
```

### Phase 7: Monitoring Setup (Week 4)

```bash
# 1. Install monitoring stack
sudo apt install -y prometheus grafana

# 2. Configure Prometheus
sudo nano /etc/prometheus/prometheus.yml
```

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'sikaremit'
    static_configs:
      - targets: ['localhost:8000']
  
  - job_name: 'postgresql'
    static_configs:
      - targets: ['localhost:9187']
  
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

```bash
# 3. Start monitoring
sudo systemctl enable prometheus grafana-server
sudo systemctl start prometheus grafana-server

# Grafana available at: http://your-server:3000
# Default login: admin/admin
```

---

## Failover Procedure

### Automatic Failover (Recommended)

```
PRIMARY (Cloud) ──[Health Check]──► FAILOVER MANAGER
                                          │
                                          ▼
                                   Primary Down?
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                            NO ↓                    YES ↓
                              │                       │
                        Continue                 Switch DNS
                                                      │
                                                      ▼
                                            LOCAL (Ghana)
                                            becomes PRIMARY
```

### Manual Failover Steps

```bash
# 1. Verify primary is down
ping primary-server-ip
curl https://api.sikaremit.com/health

# 2. Promote local replica to primary
sudo -u postgres psql -c "SELECT pg_promote();"

# 3. Update DNS (at your DNS provider)
# Point api.sikaremit.com to local server IP

# 4. Verify application
curl https://api.sikaremit.com/health

# 5. Notify team
# Send alert to team about failover
```

---

## Maintenance Checklist

### Daily
- [ ] Check replication lag: `SELECT pg_last_wal_replay_lsn();`
- [ ] Verify backup completed
- [ ] Check disk space: `df -h`
- [ ] Review error logs: `tail -100 /var/log/nginx/error.log`

### Weekly
- [ ] Test backup restoration
- [ ] Security updates: `sudo apt update && sudo apt upgrade`
- [ ] Review access logs for anomalies
- [ ] Check SSL certificate expiry

### Monthly
- [ ] Full disaster recovery drill
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Update documentation

---

## Emergency Contacts

| Issue | Contact | Phone |
|-------|---------|-------|
| Server down | Data Center NOC | [Phone] |
| Network issue | ISP Support | [Phone] |
| Application error | CTO | [Phone] |
| Security incident | Security Team | [Phone] |

---

## Summary: What You Need

### Minimum Viable Setup (Colocation)

| Item | Cost (One-time) | Cost (Monthly) |
|------|-----------------|----------------|
| Dell PowerEdge R750 | GHS 100,000 | - |
| Firewall | GHS 10,000 | - |
| UPS | GHS 7,000 | - |
| Colocation | - | GHS 3,000 |
| Bandwidth | - | GHS 2,500 |
| **TOTAL** | **GHS 117,000** | **GHS 5,500** |

### Timeline

| Week | Activity |
|------|----------|
| 1-2 | Hardware procurement |
| 2 | OS installation & hardening |
| 3 | Database replication setup |
| 3 | Application deployment |
| 4 | Backup & monitoring |
| 4 | Testing & documentation |

**Total Setup Time: 4 weeks**

---

*This server setup ensures SikaRemit meets BOG data sovereignty requirements and provides robust disaster recovery capabilities.*

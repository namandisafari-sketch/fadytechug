# Self-Hosting Supabase Guide

This guide provides complete instructions for self-hosting Supabase on your own server, enabling you to use it across multiple projects with full control over your data.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Installing Docker](#installing-docker)
4. [Deploying Supabase](#deploying-supabase)
5. [Configuration](#configuration)
6. [Nginx Reverse Proxy](#nginx-reverse-proxy)
7. [SSL Certificates](#ssl-certificates)
8. [Connecting Your App](#connecting-your-app)
9. [Backup & Maintenance](#backup--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements (Minimum)
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended for production)
- **Storage**: 20GB SSD (more for production data)
- **OS**: Ubuntu 22.04 LTS (recommended)

### Software Requirements
- Domain name pointing to your server (e.g., `db.yourdomain.com`)
- SSH access to your server
- Basic command-line knowledge

### Ports Required
- `80` - HTTP (for SSL certificate verification)
- `443` - HTTPS (main access)
- `5432` - PostgreSQL (optional, for direct DB access)

---

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nano ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Create Supabase User (Optional but Recommended)

```bash
# Create dedicated user
sudo adduser supabase
sudo usermod -aG sudo supabase
sudo usermod -aG docker supabase

# Switch to supabase user
su - supabase
```

---

## Installing Docker

### 1. Install Docker Engine

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER
```

### 2. Verify Installation

```bash
docker --version
docker compose version
```

---

## Deploying Supabase

### 1. Clone Supabase Repository

```bash
# Create directory for Supabase
mkdir -p /opt/supabase
cd /opt/supabase

# Clone the official Supabase docker setup
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy example environment file
cp .env.example .env
```

### 2. Generate Secure Keys

```bash
# Generate JWT Secret (save this!)
echo "JWT_SECRET: $(openssl rand -base64 32)"

# Generate Anon Key and Service Role Key using the JWT secret
# You'll need to generate these using the Supabase JWT generator
# Or use this script:

cat << 'EOF' > generate_keys.sh
#!/bin/bash

JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# For ANON_KEY and SERVICE_ROLE_KEY, you need to generate JWT tokens
# Visit: https://supabase.com/docs/guides/self-hosting#api-keys
# Or use the supabase CLI to generate them

echo ""
echo "Generate your API keys at:"
echo "https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys"
echo ""
echo "Use the JWT_SECRET above when generating keys"
EOF

chmod +x generate_keys.sh
./generate_keys.sh
```

### 3. Generate API Keys

Visit the [Supabase API Key Generator](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) and use your JWT_SECRET to generate:
- `ANON_KEY` - Public key for client-side access
- `SERVICE_ROLE_KEY` - Private key for server-side access (keep secret!)

---

## Configuration

### 1. Edit Environment File

```bash
nano .env
```

### 2. Essential Configuration Values

```env
############
# Secrets - CHANGE ALL OF THESE!
############

# PostgreSQL password (use a strong password)
POSTGRES_PASSWORD=your-super-secure-postgres-password-here

# JWT Secret (32+ characters, generated above)
JWT_SECRET=your-jwt-secret-from-generation-step

# API Keys (generated from Supabase tool)
ANON_KEY=your-generated-anon-key
SERVICE_ROLE_KEY=your-generated-service-role-key

# Dashboard credentials
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-secure-dashboard-password

############
# URLs - Update with your domain
############

# Your domain (used for auth callbacks, emails, etc.)
SITE_URL=https://db.yourdomain.com
API_EXTERNAL_URL=https://db.yourdomain.com

# Studio URL (can be same as API or different subdomain)
SUPABASE_PUBLIC_URL=https://db.yourdomain.com

############
# Email Configuration (Optional but recommended)
############

# SMTP settings for auth emails
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_SENDER_NAME=Your App Name

############
# Storage
############

# S3 compatible storage (optional, uses local by default)
# STORAGE_BACKEND=s3
# GLOBAL_S3_BUCKET=your-bucket-name

############
# Additional Settings
############

# Disable signup if you want invite-only
# GOTRUE_DISABLE_SIGNUP=true

# Enable email confirmation (set to false for development)
GOTRUE_MAILER_AUTOCONFIRM=false

# Rate limiting
RATE_LIMIT_HEADER=X-Forwarded-For
```

### 3. Start Supabase

```bash
# Pull latest images
docker compose pull

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 4. Verify Services Running

```bash
# Check all containers are running
docker compose ps

# Expected services:
# - supabase-db (PostgreSQL)
# - supabase-auth (GoTrue)
# - supabase-rest (PostgREST)
# - supabase-realtime
# - supabase-storage
# - supabase-studio (Dashboard)
# - supabase-kong (API Gateway)
```

---

## Nginx Reverse Proxy

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/supabase
```

### 3. Nginx Configuration File

```nginx
# Supabase Reverse Proxy Configuration
# /etc/nginx/sites-available/supabase

# Upstream definitions
upstream supabase_kong {
    server 127.0.0.1:8000;
    keepalive 64;
}

upstream supabase_studio {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=supabase_limit:10m rate=10r/s;

# Main server block (HTTP - redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name db.yourdomain.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name db.yourdomain.com;

    # SSL certificates (will be created by Certbot)
    ssl_certificate /etc/letsencrypt/live/db.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/db.yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Logging
    access_log /var/log/nginx/supabase_access.log;
    error_log /var/log/nginx/supabase_error.log;

    # Max upload size (adjust as needed)
    client_max_body_size 100M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Common proxy headers
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # Studio Dashboard (root path)
    location / {
        limit_req zone=supabase_limit burst=20 nodelay;
        proxy_pass http://supabase_studio;
    }

    # API Routes via Kong
    location ~ ^/(rest|auth|realtime|storage|graphql|functions|pg) {
        limit_req zone=supabase_limit burst=50 nodelay;
        proxy_pass http://supabase_kong;
        
        # WebSocket support for realtime
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Inbucket (email testing) - remove in production
    location /inbucket {
        proxy_pass http://127.0.0.1:9000;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 4. Enable Site and Test

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificates

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Create Certificate Directory

```bash
sudo mkdir -p /var/www/certbot
```

### 3. Obtain SSL Certificate

```bash
# Stop nginx temporarily for standalone verification
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d db.yourdomain.com

# Start nginx again
sudo systemctl start nginx
```

### 4. Alternative: Use Nginx Plugin

```bash
# This method doesn't require stopping nginx
sudo certbot --nginx -d db.yourdomain.com
```

### 5. Auto-Renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically creates a cron job/systemd timer
# Verify it exists:
sudo systemctl list-timers | grep certbot
```

### 6. Manual Renewal Cron (if needed)

```bash
# Add to crontab
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## Connecting Your App

### 1. Update Your Application

In your Fady Technologies app, update the Supabase client configuration:

```typescript
// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';

// Self-hosted Supabase configuration
const SUPABASE_URL = "https://db.yourdomain.com";
const SUPABASE_ANON_KEY = "your-anon-key-from-env-file";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### 2. Environment Variables

Create/update your `.env` file:

```env
VITE_SUPABASE_URL=https://db.yourdomain.com
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=self-hosted
```

### 3. Edge Functions (Optional)

For edge functions on self-hosted Supabase, you'll need to deploy them manually:

```bash
# Install Supabase CLI
npm install -g supabase

# Login (for local development)
supabase login

# Deploy functions to self-hosted instance
supabase functions deploy --project-ref self-hosted
```

---

## Backup & Maintenance

### 1. Database Backup Script

```bash
#!/bin/bash
# /opt/supabase/backup.sh

BACKUP_DIR="/opt/supabase/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="supabase-db"

mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME pg_dump -U postgres -d postgres > "$BACKUP_DIR/supabase_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/supabase_$DATE.sql"

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: supabase_$DATE.sql.gz"
```

### 2. Schedule Automated Backups

```bash
# Make script executable
chmod +x /opt/supabase/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /opt/supabase/backup.sh >> /var/log/supabase-backup.log 2>&1
```

### 3. Restore from Backup

```bash
# Decompress backup
gunzip supabase_20241217_020000.sql.gz

# Restore to database
docker exec -i supabase-db psql -U postgres -d postgres < supabase_20241217_020000.sql
```

### 4. Update Supabase

```bash
cd /opt/supabase/supabase/docker

# Pull latest changes
git pull

# Pull new images
docker compose pull

# Restart with new images
docker compose down
docker compose up -d
```

### 5. Monitor Services

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f supabase-db
docker compose logs -f supabase-auth

# Check disk usage
df -h
docker system df
```

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

```bash
# Check logs for errors
docker compose logs

# Restart all services
docker compose down
docker compose up -d

# Check if ports are in use
sudo netstat -tulpn | grep -E '(8000|3000|5432)'
```

#### 2. Cannot Connect to Database

```bash
# Check if PostgreSQL is running
docker exec supabase-db pg_isready

# Test connection
docker exec -it supabase-db psql -U postgres -d postgres -c "SELECT 1"

# Check PostgreSQL logs
docker compose logs supabase-db
```

#### 3. Auth Not Working

```bash
# Check GoTrue logs
docker compose logs supabase-auth

# Verify JWT secret matches in all services
grep JWT_SECRET .env

# Test auth endpoint
curl https://db.yourdomain.com/auth/v1/health
```

#### 4. Realtime Not Connecting

```bash
# Check realtime logs
docker compose logs supabase-realtime

# Verify WebSocket upgrade is working
# In browser console:
# const ws = new WebSocket('wss://db.yourdomain.com/realtime/v1/websocket?apikey=YOUR_ANON_KEY')
```

#### 5. Storage Upload Fails

```bash
# Check storage logs
docker compose logs supabase-storage

# Verify storage directory permissions
ls -la volumes/storage

# Check Nginx client_max_body_size
grep client_max_body_size /etc/nginx/sites-available/supabase
```

#### 6. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t
```

### Useful Commands

```bash
# Restart single service
docker compose restart supabase-auth

# View resource usage
docker stats

# Enter container shell
docker exec -it supabase-db bash

# Clear Docker cache (use with caution)
docker system prune -a

# Check Nginx logs
sudo tail -f /var/log/nginx/supabase_error.log
```

---

## Security Checklist

- [ ] Changed all default passwords in `.env`
- [ ] Generated secure JWT_SECRET (32+ characters)
- [ ] Generated new ANON_KEY and SERVICE_ROLE_KEY
- [ ] Configured firewall (UFW)
- [ ] SSL certificate installed and auto-renewing
- [ ] Dashboard protected with strong password
- [ ] Regular backups configured
- [ ] SMTP configured for auth emails
- [ ] Rate limiting enabled in Nginx
- [ ] Logs monitored regularly

---

## Quick Reference

| Service | Internal Port | External URL |
|---------|---------------|--------------|
| Kong (API Gateway) | 8000 | https://db.yourdomain.com |
| Studio (Dashboard) | 3000 | https://db.yourdomain.com |
| PostgreSQL | 5432 | Direct connection (optional) |
| GoTrue (Auth) | 9999 | /auth/v1 |
| PostgREST (REST API) | 3001 | /rest/v1 |
| Realtime | 4000 | /realtime/v1 |
| Storage | 5000 | /storage/v1 |

---

## Support Resources

- [Official Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Supabase Discord](https://discord.supabase.com)
- [Docker Documentation](https://docs.docker.com)

---

*Guide created for Fady Technologies self-hosting deployment. Last updated: December 2024*

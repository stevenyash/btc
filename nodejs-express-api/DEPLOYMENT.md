# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Copy `.env.example` to `.env.production`
- [ ] Generate secure JWT secrets: `openssl rand -hex 32`
- [ ] Configure production database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Update `APP_FRONTEND_URL` to production frontend URL
- [ ] Configure all external services (M-Pesa, AWS, Bunny.net, SMTP, Google, Pusher)

### 2. Security
- [x] CORS configured for production origins only
- [x] Helmet security headers enabled
- [x] Global rate limiting enabled
- [x] Environment variables validated on startup
- [x] Global error handler prevents stack trace leaks
- [ ] Run `npm audit fix` to address vulnerabilities
- [ ] Rotate any secrets that were previously committed to git

### 3. Database
- [ ] Run migrations: `npm run migrate` (if using migration scripts)
- [ ] Verify database connection pool settings
- [ ] Set up database backups
- [ ] Configure connection limits based on production load

### 4. Process Management with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the TypeScript code
cd nodejs-express-api
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 5. Monitoring & Logs

Logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs (JSON format)

View logs:
```bash
pm2 logs btc-api
pm2 logs btc-api --lines 100
```

### 6. Health Check

The API provides a health check endpoint:
```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "environment": "production",
  "database": "connected"
}
```

### 7. Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:8060;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. Grafana/Prometheus Monitoring (Optional)

Add Prometheus metrics endpoint:
```bash
npm install prom-client
```

### 9. Backup Strategy

- Database: Set up automated daily backups
- Uploads: Back up user uploads directory
- Logs: Rotate logs with PM2 or logrotate

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.production
# Edit .env.production with production values

# 3. Build
npm run build

# 4. Start with PM2
pm2 start ecosystem.config.js --env production
```

## Troubleshooting

### Check API status
```bash
pm2 status
```

### View errors
```bash
pm2 logs btc-api --err
```

### Restart API
```bash
pm2 restart btc-api
```

### Check database connection
```bash
curl https://yourdomain.com/health
```

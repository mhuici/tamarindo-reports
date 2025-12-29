# Railway Deployment Guide

This guide covers deploying TamarindoReports to Railway.

## Prerequisites

- Railway account (free tier available)
- GitHub repository connected to Railway
- API keys ready (Google, Facebook, OpenAI, etc.)

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Railway Project                     │
├─────────────────────────────────────────────────┤
│  🌐 Web Service (Nuxt)                          │
│     └── Docker container (Node 20 + Chromium)   │
│                                                 │
│  🐘 PostgreSQL                                  │
│     └── Linked via DATABASE_URL                 │
│                                                 │
│  🔴 Redis                                       │
│     └── Linked via REDIS_URL                    │
└─────────────────────────────────────────────────┘
```

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

## Step 2: Add PostgreSQL

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will auto-create the database

## Step 3: Add Redis

1. Click **"+ New"** again
2. Select **"Database"** → **"Redis"**
3. Railway will auto-create Redis

## Step 4: Configure Environment Variables

Click on your **web service** → **Variables** tab.

### Required Variables

Add these manually (Railway doesn't auto-fill them):

```bash
# Application
NUXT_PUBLIC_APP_URL=https://your-app.up.railway.app
JWT_SECRET=generate-a-secure-32-char-minimum-string

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-token

# Facebook OAuth (from Meta Developer)
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-secret

# AI Services (optional but recommended)
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Storage - Cloudflare R2 (optional)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=tamarindo-reports
R2_PUBLIC_URL=https://your-bucket-url
```

### Auto-Linked Variables

Click **"+ Add Variable"** → **"Add Reference"** to link:

| Variable | Reference |
|----------|-----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |

## Step 5: Configure Build Settings

Railway should auto-detect the `railway.toml` and `Dockerfile`.

If not, go to **Settings** → **Build**:
- Builder: **Dockerfile**
- Dockerfile Path: `Dockerfile`

## Step 6: Run Database Migrations

After first deploy, you need to run migrations:

### Option A: Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run pnpm db:generate
railway run pnpm --filter @tamarindo/db migrate:deploy
```

### Option B: Railway Dashboard

1. Go to your web service
2. Click **"Settings"** → **"Deploy"**
3. Add a **Deploy Command**:
   ```bash
   pnpm --filter @tamarindo/db migrate:deploy && node .output/server/index.mjs
   ```

## Step 7: Configure Domain

1. Go to your web service → **Settings** → **Networking**
2. Click **"Generate Domain"** for a `.up.railway.app` domain
3. Or add your custom domain

### Update OAuth Redirect URIs

After getting your domain, update:

**Google Cloud Console:**
- Authorized redirect URIs: `https://your-domain/api/integrations/google-ads/callback`

**Meta Developer:**
- Valid OAuth Redirect URIs: `https://your-domain/api/integrations/facebook-ads/callback`

## Step 8: Verify Deployment

1. Visit your app URL
2. Check health endpoint: `https://your-domain/api/health`
3. Test login flow
4. Test OAuth connections

## Monitoring

### Health Check

The app exposes `/api/health` which returns:
- Database connection status
- Memory usage
- Uptime

### Logs

View logs in Railway dashboard:
1. Click your web service
2. Go to **"Deployments"** tab
3. Click on a deployment to see logs

### Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic

## Troubleshooting

### Build Fails

```bash
# Check build logs in Railway dashboard
# Common issues:
# - Missing environment variables
# - pnpm-lock.yaml out of sync: run `pnpm install` locally and commit
```

### Database Connection Error

```bash
# Verify DATABASE_URL is linked correctly
# Check PostgreSQL service is running
# Ensure migrations have run
```

### Puppeteer/PDF Issues

```bash
# The Dockerfile includes Chromium
# If PDFs fail, check memory usage
# Consider increasing resources or using external PDF service
```

### Out of Memory

If you see OOM errors:
1. Go to **Settings** → **Resources**
2. Increase memory limit (recommend 2GB minimum for Puppeteer)

## Cost Estimation

| Resource | Usage (estimated) | Cost/month |
|----------|------------------|------------|
| Web (2GB RAM) | ~720h | ~$10-15 |
| PostgreSQL | 1GB | ~$5 |
| Redis | 256MB | ~$3 |
| **Total** | | **~$18-23** |

Railway charges by resource usage, not fixed plans.

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Custom domain configured (optional)
- [ ] OAuth redirect URIs updated
- [ ] Health check responding at `/api/health`
- [ ] SSL/HTTPS working
- [ ] Tested login flow
- [ ] Tested OAuth integrations
- [ ] Tested PDF generation
- [ ] Monitoring set up (optional: Sentry, etc.)

## Updating

Railway auto-deploys on push to main branch.

For manual deploy:
```bash
railway up
```

## Rollback

1. Go to **"Deployments"** tab
2. Find a previous working deployment
3. Click **"Redeploy"**

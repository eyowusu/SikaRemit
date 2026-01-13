# SikaRemit Deployment Guide - Netlify + Render

## Overview
This guide covers deploying SikaRemit to production using **Render** (backend) and **Netlify** (frontend).

## Prerequisites
- GitHub repository with your SikaRemit code
- Domain name: sikaremit.com (registered with Namecheap)
- Render account (free tier available)
- Netlify account (free tier available)

## 1. Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to https://render.com and sign up for a free account
2. Connect your GitHub repository

### Step 2: Deploy PostgreSQL Database
1. In Render dashboard, click **"New +"** button (top right corner)
2. Select **"PostgreSQL"** from the dropdown menu
3. Configure your database:
   - **Name**: `sikaremit-db`
   - **Database**: `sikaremit` (or leave default)
   - **Region**: Choose the closest to your users (e.g., Frankfurt, London, or Oregon)
   - **Plan**: **Free** tier
4. Click **"Create Database"**
5. **Important**: Note these credentials immediately:
   - **Host**: `your-db-name.onrender.com`
   - **Database**: `your-database-name`
   - **Username**: `your-username`
   - **Password**: `your-password` (shown only once!)
   - **External Database URL**: `postgresql://user:pass@host:5432/db`

### Step 3: Deploy Redis (Optional, for caching)
**Note**: On Render, Redis is called **"Key Value"**

1. In Render dashboard, click **"New +"** button (top right corner)
2. Select **"Key Value"** from the dropdown menu (this is Redis!)
3. Configure your instance:
   - **Name**: `sikaremit-redis`
   - **Region**: Choose the same region as your database (e.g., Frankfurt, London, or Oregon)
   - **Plan**: **Free** tier
4. Click **"Create Key Value"**
5. **Important**: Note the connection details immediately:
   - **Redis URL**: `redis://your-key-value-instance:6379` (shown on the instance page)
   - Use this URL in your Django settings as `REDIS_URL`

### Step 4: Deploy Django Backend

#### **How to Connect Your GitHub Repository:**

1. **Click "New +"** → **"Web Service"**
2. **Connect Repository:**
   - If you haven't connected GitHub yet:
     - Click **"Connect account"** next to GitHub
     - Authorize Render to access your GitHub account
     - Grant permissions to access repositories
   - Select your repository: `your-username/SikaRemit`
3. **Configure Service:**
   - **Name**: `sikaremit-api` (or your preferred name)
   - **Environment**: `Python 3`
   - **Region**: Choose the same region as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
4. **Advanced Settings** (Optional):
   - **Plan**: Free tier
   - **Health Check Path**: `/api/v1/health/` (we'll create this endpoint)
5. **Create Web Service**

**Note**: Make sure your repository is **public** or you've granted Render access to private repos.

### Step 5: Configure Environment Variables
In your Render web service settings, add these environment variables:

```
SECRET_KEY=generate-a-secure-key-here-replace-this
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=api.sikaremit.com,your-render-url.onrender.com,localhost
DJANGO_SETTINGS_MODULE=core.settings
PYTHON_VERSION=3.11.2
DJANGO_USE_SQLITE=false
DB_PASSWORD=your-postgres-password-from-step-2
REDIS_URL=your-redis-url-from-step-3
PAYMENT_CALLBACK_URL=https://api.sikaremit.com/api/v1/payments/webhooks
BASE_COUNTRY=GHA
DEFAULT_CURRENCY=GHS
```

## 2. Frontend Deployment (Netlify)

### Step 1: Create Netlify Account
1. Go to https://netlify.com and sign up (use GitHub for easiest setup)
2. Connect your GitHub repository

### Step 2: Deploy to Netlify
1. Click "New site from Git"
2. Select GitHub and choose your repository: `your-username/SikaRemit`
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/out`
   - **Base directory**: `frontend`

### Step 3: Environment Variables
In your Netlify site settings, add these environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://sikaremit.com
```

### Step 4: Deploy
1. Click "Deploy site"
2. Netlify will automatically build and deploy your frontend
3. You'll get a preview URL like: `https://sikaremit-[random].netlify.app`

## 3. Domain Configuration

### Step 1: Add Custom Domain to Netlify
1. In your Netlify site dashboard, go to "Settings" → "Domains"
2. Add `sikaremit.com` as a custom domain
3. Netlify will provide DNS records to add

### Step 2: Add Custom Domain to Render
1. In Render web service, go to "Settings" → "Custom Domains"
2. Add `api.sikaremit.com`
3. Render will provide DNS records

### Step 3: Configure DNS at Namecheap

Go to your Namecheap dashboard and add these DNS records:

```
# Frontend (Netlify)
Type: CNAME
Host: @
Value: your-netlify-site.netlify.app
TTL: 30 min

Type: CNAME
Host: www
Value: your-netlify-site.netlify.app
TTL: 30 min

# Backend API (Render)
Type: CNAME
Host: api
Value: your-render-service.onrender.com
TTL: 30 min

# Netlify TXT record (for domain verification)
Type: TXT
Host: _netlify-verification
Value: netlify-provided-verification-token
TTL: 30 min
```

### Step 4: SSL Certificates
- Netlify automatically provisions free SSL certificates
- Render provides free SSL certificates for custom domains

## 4. Post-Deployment Configuration

### Update Environment Variables
Once domains are live (may take 24-48 hours), update:

**Backend (Render):**
```
ALLOWED_HOSTS=api.sikaremit.com,your-render-url.onrender.com,localhost
PAYMENT_CALLBACK_URL=https://api.sikaremit.com/api/v1/payments/webhooks
```

**Frontend (Netlify):**
```
NEXT_PUBLIC_API_URL=https://api.sikaremit.com
NEXT_PUBLIC_APP_URL=https://sikaremit.com
```

### Database Setup
1. SSH into your Render service or use the Render shell
2. Run: `python manage.py migrate`
3. Create superuser: `python manage.py createsuperuser`

## 5. Testing

### Test URLs:
- **Frontend**: https://sikaremit.com
- **API**: https://api.sikaremit.com/api/v1/health/
- **Admin**: https://api.sikaremit.com/admin/

### Health Check:
Visit https://api.sikaremit.com/api/v1/health/ to verify API is running.

## 6. Payment Gateway Setup (Production)

### MTN Mobile Money:
1. Register at https://momodeveloper.mtn.com
2. Get production API credentials
3. Update environment variables in Render

### Stripe:
1. Register at https://dashboard.stripe.com
2. Get live API keys
3. Update environment variables

## 7. Monitoring and Maintenance

### Netlify Features:
- **Analytics**: Real-time performance metrics
- **Build Logs**: Detailed build and deploy logs
- **Error Tracking**: Automatic error reporting
- **Preview Deployments**: Every PR gets a preview URL

### Render Features:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and response time graphs
- **Backups**: Automatic PostgreSQL backups

### Updates:
- Push code changes to GitHub
- Netlify and Render will auto-deploy
- Preview deployments for testing before production

## 8. Troubleshooting

### Common Issues:

**Netlify Build Fails:**
- Check build logs in Netlify dashboard
- Verify build settings in Netlify
- Ensure all dependencies are in `package.json`

**Render Build Fails:**
- Check build logs in Render dashboard
- Verify environment variables are set correctly
- Ensure `requirements.txt` includes all dependencies

**Domain Not Working:**
- DNS propagation can take 24-48 hours
- Check DNS records with online tools
- Verify domain ownership in both platforms

### Support:
- **Netlify**: https://www.netlify.com/support/
- **Render**: https://render.com/docs/support
- **Django**: https://docs.djangoproject.com/
- **Next.js**: https://nextjs.org/docs

## Cost Estimate (Free Tier)
- **Render**: $0/month (750 hours, PostgreSQL free tier)
- **Netlify**: $0/month (100GB bandwidth, 300 minutes build time)
- **Domain**: ~$10-15/year at Namecheap
- **SSL**: Free with both platforms

## Quick Deployment Commands

```bash
# Deploy frontend to Netlify
cd frontend
npm install
npm run build
netlify deploy --prod --dir=out

# Backend deploys automatically via Render when you push to GitHub
```

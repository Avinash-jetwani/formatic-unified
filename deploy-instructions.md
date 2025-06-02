# 🚀 Formatic App Deployment Instructions

## Overview
Your app is now configured for flexible EC2 deployment with automatic CI/CD. This guide will help you deploy to any EC2 instance with your preferred domain.

## 📋 What I've Fixed

### 1. **User Password Reset**
- Created a script that automatically resets passwords during deployment
- **New Credentials:**
  - Email: `admin@formatic.com` → Password: `NewAdmin2024!`
  - Email: `john@doe.com` → Password: `JohnDoe2024!`

### 2. **Domain Configuration Issues**
- Made the deployment script flexible to work with any domain
- Fixed CORS configuration for production
- Updated API routing to handle domain changes
- Fixed Nginx configuration template

### 3. **Environment Configuration**
- Backend now uses port 3001 in production (standard)
- Frontend environment variables are dynamically generated
- API URLs are configurable via GitHub secrets

## 🎯 Quick Deployment (3 Steps)

### Step 1: Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

**Required Secrets:**
```
SERVER_IP: your.ec2.public.ip
SSH_PRIVATE_KEY: (paste your entire SSH private key)
```

**Optional Domain Secrets (use your own domain):**
```
DOMAIN: yourdomain.com
API_URL: https://yourdomain.com/api  
FRONTEND_URL: https://yourdomain.com
NEXTAUTH_SECRET: your-super-secret-jwt-key-here
```

### Step 2: Commit & Push Changes
```bash
git add .
git commit -m "🚀 Deploy: Fix domain config and reset user passwords"
git push origin main
```

### Step 3: Monitor Deployment
- Go to your GitHub repository → Actions tab
- Watch the "Deploy to Production" workflow run
- The deployment will automatically:
  ✅ Build frontend and backend
  ✅ Deploy to your EC2 instance  
  ✅ Reset user passwords
  ✅ Configure Nginx with SSL
  ✅ Start services with PM2

## 🔧 EC2 Server Requirements

Your EC2 instance must have:
- **Node.js 18+** (via NVM): `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`
- **PM2**: `npm install -g pm2`
- **Nginx**: `sudo yum install nginx` (Amazon Linux) or `sudo apt install nginx` (Ubuntu)
- **PostgreSQL**: Database configured and running
- **Git repository cloned** at: `/home/ec2-user/formatic-unified`

## 🌐 After Deployment

### Access Your App
Your app will be available at:
- **Your Domain**: `https://yourdomain.com` (if you set DOMAIN secret)
- **Default**: `https://datizmo.com` (if using defaults)

### Login Credentials
```
Admin User:
Email: admin@formatic.com
Password: NewAdmin2024!

Test User:  
Email: john@doe.com
Password: JohnDoe2024!
```

### Health Check Commands (SSH to EC2)
```bash
# Check PM2 processes
pm2 status

# Check Nginx status  
sudo systemctl status nginx

# Check application logs
pm2 logs

# Check Nginx configuration
sudo nginx -t
```

## 🔍 Troubleshooting

### Domain Issues
If you see "datizmo.com" references after deployment with your own domain:
1. Check that you set the `DOMAIN`, `API_URL`, and `FRONTEND_URL` GitHub secrets
2. Re-run the deployment workflow

### API Connection Issues
- Ensure your EC2 security group allows inbound traffic on ports 80, 443
- Check that your domain's DNS points to your EC2 public IP
- Verify Nginx is running: `sudo systemctl status nginx`

### Database Issues
- Ensure PostgreSQL is running on your EC2 instance
- Check that the backend `.env` file exists with correct DATABASE_URL
- Verify database migrations ran: `cd backend && npx prisma migrate status`

### SSL Certificate Issues
- The deployment creates self-signed certificates
- For production, replace with real SSL certificates from Let's Encrypt or your provider

## 🔄 Manual Deployment Trigger

You can manually trigger deployment anytime:
1. Go to your GitHub repository
2. Actions tab → "Deploy to Production" workflow  
3. Click "Run workflow" → "Run workflow"

## 📱 Local Development Setup

If you want to run locally (though you said you prefer EC2):
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (separate terminal)
cd frontend  
npm install
npm run dev
```

## 🎉 Success Indicators

✅ **Deployment successful** when you see:
```
=== Deployment completed! Your app should be available at https://yourdomain.com ===

📋 USER CREDENTIALS RESET:
=========================
Email: admin@formatic.com
Password: NewAdmin2024!
-------------------------  
Email: john@doe.com
Password: JohnDoe2024!
=========================
```

✅ **App working** when you can:
- Access your domain in browser
- Login with the provided credentials
- See the dashboard without console errors
- API calls work properly

---

**Next Steps:** Just set your GitHub secrets and push to main branch! 🚀 
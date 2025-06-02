# Formatic Application - Complete CI/CD Deployment Guide

This guide will help you deploy your Formatic application to AWS EC2 using GitHub Actions.

## 🚀 Overview

The deployment process consists of:
1. **GitHub Actions** - Builds and deploys your application
2. **AWS EC2** - Hosts your application
3. **PostgreSQL** - Database
4. **Nginx** - Web server and reverse proxy
5. **PM2** - Process manager for Node.js applications

## 📋 Prerequisites

### GitHub Repository Setup

1. **GitHub Secrets** - Add these to your repository secrets (Settings → Secrets and variables → Actions):
   ```
   SERVER_IP=your.ec2.public.ip
   SSH_PRIVATE_KEY=your-private-key-content
   ```

2. **SSH Key Setup**:
   - Generate SSH key pair: `ssh-keygen -t rsa -b 4096 -f ~/.ssh/formatic_deploy`
   - Add public key to EC2: Copy `~/.ssh/formatic_deploy.pub` to EC2 `~/.ssh/authorized_keys`
   - Add private key to GitHub: Copy content of `~/.ssh/formatic_deploy` to `SSH_PRIVATE_KEY` secret

### EC2 Server Setup

1. **Launch EC2 Instance**:
   - Amazon Linux 2 or Ubuntu 20.04+
   - At least t3.medium (2 vCPU, 4GB RAM)
   - Security group allowing ports 22, 80, 443, 3000, 3001

2. **Install Dependencies**:
   ```bash
   # Connect to your EC2 instance
   ssh -i your-key.pem ec2-user@your-server-ip
   
   # Install Node.js via NVM
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   nvm alias default 18
   
   # Install PM2 globally
   npm install -g pm2
   
   # Install PostgreSQL
   sudo yum update -y
   sudo yum install postgresql postgresql-server postgresql-contrib -y
   sudo postgresql-setup initdb
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   
   # Install Nginx
   sudo yum install nginx -y
   sudo systemctl enable nginx
   sudo systemctl start nginx
   
   # Install Git
   sudo yum install git -y
   ```

3. **Setup Database**:
   ```bash
   # Switch to postgres user
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE formatic;
   CREATE USER formatic_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE formatic TO formatic_user;
   \q
   ```

4. **Prepare Application Directory**:
   ```bash
   # Download and run the setup script
   curl -o deploy-setup.sh https://raw.githubusercontent.com/your-username/formatic-unified/main/deploy-setup.sh
   chmod +x deploy-setup.sh
   ./deploy-setup.sh
   ```

## 🔧 Configuration

### 1. Backend Environment (.env)

Edit `/home/ec2-user/formatic-unified/backend/.env`:

```env
# Database
DATABASE_URL="postgresql://formatic_user:your_secure_password@localhost:5432/formatic?schema=public"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-at-least-32-characters"

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# App Settings
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://datizmo.com,https://www.datizmo.com"
```

### 2. Frontend Environment (.env.production)

Edit `/home/ec2-user/formatic-unified/frontend/.env.production`:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=https://datizmo.com
NEXTAUTH_SECRET=your-nextauth-secret-at-least-32-characters
```

### 3. Nginx Configuration

Create `/etc/nginx/conf.d/datizmo.conf`:

```nginx
server {
    listen 80;
    server_name datizmo.com www.datizmo.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name datizmo.com www.datizmo.com;
    
    # SSL configuration (add your SSL certificates)
    ssl_certificate /path/to/your/ssl_certificate.crt;
    ssl_certificate_key /path/to/your/ssl_private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
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

## 🚀 Deployment Process

### Manual Deployment (First Time)

1. **Test Locally**:
   ```bash
   ./test-deployment.sh
   ```

2. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: complete CI/CD setup with improved deployment"
   git push origin main
   ```

3. **Monitor GitHub Actions**:
   - Go to your GitHub repository
   - Click "Actions" tab
   - Watch the deployment workflow

### Automatic Deployment

Every push to the `main` branch will automatically:
1. ✅ Build backend and frontend
2. ✅ Generate Prisma clients
3. ✅ Copy build files to EC2
4. ✅ Run database migrations
5. ✅ Start/restart services with PM2
6. ✅ Perform health checks

## 🔍 Monitoring & Troubleshooting

### Check Application Status

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-server-ip

# Check PM2 status
sudo pm2 status

# Check logs
sudo pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Check database connection
sudo -u postgres psql -d formatic -c "SELECT NOW();"
```

### Common Issues

1. **Deployment fails at "Execute deployment commands on EC2"**:
   - Check SSH key is correct in GitHub secrets
   - Ensure EC2 security group allows SSH (port 22)
   - Verify EC2 instance is running

2. **Backend fails to start**:
   - Check `.env` file exists and has correct database URL
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check PM2 logs: `sudo pm2 logs backend`

3. **Frontend fails to start**:
   - Check `.env.production` file exists
   - Verify backend is running first
   - Check PM2 logs: `sudo pm2 logs frontend`

4. **Domain not accessible**:
   - Check Nginx configuration: `sudo nginx -t`
   - Verify SSL certificates are valid
   - Check domain DNS points to your EC2 IP

## 📱 Application URLs

After successful deployment:

- **Main Application**: https://datizmo.com
- **API Health Check**: https://datizmo.com/api/auth/session
- **Direct Frontend** (debugging): http://your-ec2-ip:3000
- **Direct Backend** (debugging): http://your-ec2-ip:3001

## 🔄 Updating Your Application

1. Make changes to your code
2. Test locally: `./test-deployment.sh`
3. Commit and push to GitHub
4. Deployment happens automatically
5. Monitor the GitHub Actions workflow

## 🎯 Next Steps

1. **SSL Certificate**: Set up SSL certificate (Let's Encrypt or AWS Certificate Manager)
2. **Domain**: Configure your domain DNS to point to your EC2 IP
3. **Monitoring**: Set up application monitoring (PM2 web dashboard, logs)
4. **Backups**: Configure database backups
5. **Scaling**: Consider Load Balancer and Auto Scaling for production

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. SSH into EC2 and check PM2 logs
3. Verify all configuration files are correct
4. Ensure all services (PostgreSQL, Nginx) are running

Your Formatic application should now be fully deployed and accessible! 🎉 
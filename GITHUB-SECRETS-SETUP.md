# GitHub Secrets Setup Guide

## Required Secrets for CI/CD Workflow

To use the automated deployment workflow, you need to configure the following secrets in your GitHub repository settings.

### Navigation
1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Required Secrets

#### 🖥️ Server Configuration

**`PRODUCTION_HOST`**
- **Description**: IP address or hostname of your production server
- **Example**: `123.45.67.89` or `your-server.com`
- **Value**: Your EC2 instance IP or domain name

**`PRODUCTION_USER`**
- **Description**: SSH username for your production server
- **Example**: `ec2-user` (for Amazon Linux) or `ubuntu` (for Ubuntu)
- **Value**: The SSH user that has deployment permissions

**`PRODUCTION_PRIVATE_KEY`**
- **Description**: Private SSH key for server access
- **Format**: Complete private key including headers
- **Example**:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
[your private key content]
...
-----END RSA PRIVATE KEY-----
```

**`PRODUCTION_PATH`**
- **Description**: Full path where the application should be deployed
- **Example**: `/home/ec2-user/formatic-unified`
- **Value**: Target directory on your server

#### 🌐 Domain Configuration

**`DOMAIN_NAME`**
- **Description**: Your production domain name
- **Example**: `datizmo.com`
- **Value**: Domain where your app will be accessible

#### 🔑 Application Secrets

**`NEXTAUTH_SECRET`** (Optional)
- **Description**: Secret key for NextAuth.js
- **Example**: `your-secret-key-here`
- **Value**: A random secure string for authentication

#### ☁️ AWS Configuration (if using S3)

**`AWS_ACCESS_KEY_ID`** (Optional)
- **Description**: AWS access key for S3 uploads
- **Value**: Your AWS access key

**`AWS_SECRET_ACCESS_KEY`** (Optional)
- **Description**: AWS secret access key for S3 uploads
- **Value**: Your AWS secret key

## Server Prerequisites

Before running the CI/CD workflow, ensure your server has:

### 1. Node.js and NPM
```bash
# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. PM2 Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

### 3. Git Repository
```bash
# Clone your repository
git clone https://github.com/yourusername/formatic-unified.git
cd formatic-unified
```

### 4. Environment Files
Create `.env.production` file in your server directory:
```bash
# Example .env.production
NODE_ENV=production
DATABASE_URL="postgresql://username:password@localhost:5432/formatic_db"
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# API Configuration
BACKEND_URL=http://127.0.0.1:4000
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000

# AWS S3 Configuration (optional)
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=your-bucket-name
NEXT_PUBLIC_S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

### 5. Database Setup
```bash
# Setup PostgreSQL (if using)
sudo yum install -y postgresql postgresql-server
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb formatic_db
sudo -u postgres createuser -P formatic_user
```

### 6. Nginx (Optional - for reverse proxy)
```bash
# Install Nginx
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Testing the Setup

### 1. Test SSH Connection
```bash
# Test SSH access from your local machine
ssh -i your-private-key.pem ec2-user@your-server-ip

# Verify you can access the deployment directory
ls -la /home/ec2-user/formatic-unified
```

### 2. Test Manual Deployment
Before using the automated workflow, test manual deployment:

```bash
# On your server
cd /home/ec2-user/formatic-unified
git pull origin main

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build applications
cd backend && npm run build
cd ../frontend && npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

## Workflow Triggers

The CI/CD workflow will automatically run when:

1. **Push to main branch**: `git push origin main`
2. **Manual trigger**: Go to Actions tab → Deploy to Production → Run workflow

## Monitoring Deployment

### 1. GitHub Actions
- Go to **Actions** tab in your GitHub repository
- Click on the latest workflow run
- Monitor the progress of build and deployment

### 2. Server Logs
```bash
# Check PM2 process status
pm2 status

# View application logs
pm2 logs

# View specific service logs
pm2 logs formatic-backend
pm2 logs formatic-frontend
```

### 3. Application Health
```bash
# Test backend API
curl http://localhost:4000/api/health

# Test frontend
curl http://localhost:3000/

# Test external access (if Nginx is configured)
curl https://your-domain.com/
```

## Troubleshooting

### Common Issues

**1. SSH Connection Failed**
- Verify the private key format
- Check server IP/hostname
- Ensure SSH key has correct permissions

**2. Dependencies Installation Failed**
- Check Node.js version (should be 18+)
- Verify npm permissions
- Clear npm cache: `npm cache clean --force`

**3. PM2 Services Not Starting**
- Check application logs: `pm2 logs`
- Verify environment variables
- Test manual start: `cd backend && npm start`

**4. Database Connection Failed**
- Verify DATABASE_URL in .env.production
- Check PostgreSQL service: `sudo systemctl status postgresql`
- Test database connection manually

### Recovery Steps

**If deployment fails:**
1. Check the GitHub Actions logs for specific errors
2. SSH into the server and check PM2 status
3. Review application logs
4. Roll back to previous version if necessary:
   ```bash
   cd /home/ec2-user/formatic-unified
   ls -la backup-*  # List available backups
   rm -rf current
   mv backup-YYYYMMDD_HHMMSS current
   pm2 restart all
   ```

## Security Considerations

1. **SSH Keys**: Never commit private keys to your repository
2. **Secrets**: Use GitHub Secrets for all sensitive information
3. **Server Access**: Limit SSH access to specific IP addresses
4. **Database**: Use strong passwords and limit database access
5. **Environment Files**: Keep .env files secure and backed up

---

**Last Updated**: June 3, 2025
**Setup Status**: Ready for Production Use 
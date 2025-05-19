#!/bin/bash

# Datizmo Production Deployment Script (Fixed for Amazon Linux 2023)
# This script deploys the Datizmo application to your live domain
# while addressing issues with the original deployment script

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Domain settings
DOMAIN="www.datizmo.com"
DOMAIN_ALT="datizmo.com"

echo -e "${BLUE}🚀 Datizmo Production Deployment (Fixed Script)${NC}"
echo -e "${YELLOW}This script will deploy Datizmo to ${DOMAIN}${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Stop services if they're already running with PM2
echo -e "${BLUE}🛑 Stopping any existing services...${NC}"
pm2 stop datizmo-frontend datizmo-backend 2>/dev/null || true
echo -e "${GREEN}✅ Services stopped${NC}"

# Clean caches to ensure a fresh build
echo -e "${BLUE}🧹 Cleaning caches...${NC}"
if [ -d "frontend/.next" ]; then
  rm -rf frontend/.next
  echo -e "${GREEN}✅ Cleared frontend build cache${NC}"
fi

if [ -d "backend/dist" ]; then
  rm -rf backend/dist
  echo -e "${GREEN}✅ Cleared backend build cache${NC}"
fi

echo -e "${BLUE}⚙️ Setting up environment variables...${NC}"

# Database configuration
# Install PostgreSQL if not already installed
echo -e "${BLUE}🔍 Installing PostgreSQL if needed...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}⚠️ PostgreSQL not found, installing...${NC}"
  amazon-linux-extras enable postgresql14
  yum clean metadata
  yum -y install postgresql postgresql-server postgresql-devel postgresql-contrib
  /usr/bin/postgresql-setup --initdb
  systemctl start postgresql
  systemctl enable postgresql
  echo -e "${GREEN}✅ PostgreSQL installed and started${NC}"
fi

# PostgreSQL configuration
DB_NAME="formatic"
DB_USER="postgres"
DB_PASSWORD="postgres"  # Better to use a secure password
DB_HOST="localhost" 
DB_PORT="5432"
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Check if PostgreSQL is running
echo -e "${BLUE}🔍 Checking PostgreSQL status...${NC}"
if systemctl is-active --quiet postgresql; then
  echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
  echo -e "${YELLOW}⚠️ PostgreSQL not running, starting...${NC}"
  systemctl start postgresql
  echo -e "${GREEN}✅ PostgreSQL started${NC}"
fi

# Create database user and database if they don't exist
echo -e "${BLUE}🔍 Setting up PostgreSQL database...${NC}"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN SUPERUSER PASSWORD '${DB_PASSWORD}';"
  echo -e "${GREEN}✅ Database user created${NC}"
fi

if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} WITH OWNER ${DB_USER};"
  echo -e "${GREEN}✅ Database created${NC}"
fi

# Set S3 details - prompt for credentials if environment variables aren't set
AWS_REGION=${AWS_REGION:-"eu-west-2"}
AWS_ACCESS_KEY=${AWS_ACCESS_KEY_ID:-""}
AWS_SECRET_KEY=${AWS_SECRET_ACCESS_KEY:-""}
S3_BUCKET=${S3_BUCKET_NAME:-"formatic-uploads-dev"}
S3_PUBLIC_URL=${S3_PUBLIC_URL:-"https://formatic-uploads-dev.s3.amazonaws.com"}

# If credentials aren't set, ask for them
if [ -z "$AWS_ACCESS_KEY" ] || [ -z "$AWS_SECRET_KEY" ]; then
  echo -e "${YELLOW}⚠️ AWS credentials not found in environment. Please enter them now:${NC}"
  read -p "AWS Access Key ID: " AWS_ACCESS_KEY
  read -p "AWS Secret Access Key: " AWS_SECRET_KEY
  
  # Store them temporarily for this session
  export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
  export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY
fi

echo -e "${GREEN}✅ Using S3 bucket: ${S3_BUCKET} in ${AWS_REGION}${NC}"

# Create frontend environment file
echo -e "${BLUE}📝 Creating frontend environment file...${NC}"
cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=production-deployment-secret
NEXT_PUBLIC_S3_PUBLIC_URL=${S3_PUBLIC_URL}
NEXT_PUBLIC_AWS_REGION=${AWS_REGION}
NEXT_PUBLIC_S3_BUCKET_NAME=${S3_BUCKET}
EOL

# Also create a production env file
cp frontend/.env.local frontend/.env.production
echo -e "${GREEN}✅ Frontend environment setup complete${NC}"

# Create backend environment file
echo -e "${BLUE}📝 Creating backend environment file...${NC}"
cat > backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=production

# Database connection
DATABASE_URL=${DB_URL}

# JWT configuration
JWT_SECRET=production-deployment-jwt-secret

# Frontend URL (for CORS)
FRONTEND_URL=https://${DOMAIN}

# Email settings (if using email functionality)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com

# AWS S3 configuration
AWS_REGION=${AWS_REGION}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY}
S3_BUCKET_NAME=${S3_BUCKET}
S3_PUBLIC_URL=${S3_PUBLIC_URL}
EOL

echo -e "${GREEN}✅ Backend environment setup complete${NC}"

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
echo -e "${YELLOW}⚠️ Installing dependencies...${NC}"

# Install NestJS CLI globally
echo -e "${BLUE}📦 Installing NestJS CLI globally...${NC}"
npm install -g @nestjs/cli

# Frontend dependencies
cd frontend
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install slugify
npm install --legacy-peer-deps
cd "$PROJECT_ROOT"

# Backend dependencies  
cd backend
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
npm install --legacy-peer-deps
cd "$PROJECT_ROOT"

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Apply database migrations
echo -e "${BLUE}🔄 Applying database migrations...${NC}"
cd backend
npx prisma generate
npx prisma migrate deploy
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Database schema updated${NC}"

# Build the frontend
echo -e "${BLUE}🔨 Building the frontend...${NC}"
cd frontend
NODE_ENV=production npm run build
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Build the backend
echo -e "${BLUE}🔨 Building the backend...${NC}"
cd backend
npm run build
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Backend built successfully${NC}"

# Set up Nginx configuration for Amazon Linux 2023
echo -e "${BLUE}📝 Setting up Nginx configuration...${NC}"

# Amazon Linux 2023 uses /etc/nginx/conf.d/ instead of sites-available/sites-enabled
cat > /etc/nginx/conf.d/datizmo.conf << EOL
server {
    listen 80;
    server_name ${DOMAIN} ${DOMAIN_ALT};

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN} ${DOMAIN_ALT};

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Basic SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    
    # Frontend Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # IMPORTANT: Next Auth specific endpoints
    location ~ ^/api/auth/(session|login|logout|me|_log) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

echo -e "${GREEN}✅ Nginx config created at /etc/nginx/conf.d/datizmo.conf${NC}"

# Check if Let's Encrypt certificates exist
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${YELLOW}⚠️ SSL certificates not found. Running certbot to obtain certificates...${NC}"
  
  # Install certbot if not already installed
  if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}⚠️ Certbot not found, installing...${NC}"
    yum install -y certbot python3-certbot-nginx
  fi
  
  # Get SSL certificate
  certbot --nginx -d ${DOMAIN} -d ${DOMAIN_ALT} --non-interactive --agree-tos --email admin@datizmo.com
  echo -e "${GREEN}✅ SSL certificates obtained${NC}"
fi

# Test Nginx configuration
echo -e "${BLUE}🔍 Testing Nginx configuration...${NC}"
nginx -t
if [ $? -ne 0 ]; then
  echo -e "${RED}⛔ Nginx configuration test failed. Please check the errors above.${NC}"
  exit 1
fi

# Restart Nginx
echo -e "${BLUE}🔄 Restarting Nginx...${NC}"
systemctl restart nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"

# Start the applications with PM2
echo -e "${BLUE}🚀 Starting applications with PM2...${NC}"

# Start backend
cd backend
pm2 start dist/src/main.js --name datizmo-backend
cd "$PROJECT_ROOT"

# Start frontend
cd frontend
pm2 start npm --name datizmo-frontend -- start
cd "$PROJECT_ROOT"

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
echo -e "${BLUE}⚙️ Configuring PM2 to start on system boot...${NC}"
pm2 startup
echo -e "${GREEN}✅ PM2 configured${NC}"

echo -e "${GREEN}🎉 Deployment complete! Your application is now running at https://${DOMAIN}${NC}"
echo -e "${YELLOW}Pro Tip: You can verify your services with:${NC}"
echo -e "${BLUE}  - Frontend: curl -I https://${DOMAIN}${NC}"
echo -e "${BLUE}  - Backend: curl -I https://${DOMAIN}/api/auth/me${NC}"
echo -e "${BLUE}  - Check services: pm2 status${NC}" 
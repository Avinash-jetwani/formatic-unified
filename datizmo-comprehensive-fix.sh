#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Datizmo Comprehensive Fix Script${NC}"
echo -e "${BLUE}This script addresses all known deployment issues with Datizmo${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ] && [ -z "$SKIP_ROOT_CHECK" ]; then
  echo -e "${YELLOW}⚠️ This script should ideally be run as root or with sudo${NC}"
  echo -e "${YELLOW}⚠️ If you want to continue anyway, rerun with: SKIP_ROOT_CHECK=1 $0${NC}"
  exit 1
fi

# Get the absolute path of the project
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Step 1: Clean up all PM2 processes
echo -e "${BLUE}🧹 Cleaning up PM2 processes...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
  echo -e "${GREEN}✅ All PM2 processes stopped and removed${NC}"
else
  echo -e "${YELLOW}⚠️ PM2 not found, skipping process cleanup${NC}"
fi

# Step 2: Set up proper directory structure
echo -e "${BLUE}🔧 Setting up proper directory structure...${NC}"

# Create necessary directories
mkdir -p ${PROJECT_ROOT}/backend/dist
mkdir -p ${PROJECT_ROOT}/frontend/.next
mkdir -p /var/www/datizmo 2>/dev/null || echo "Could not create /var/www/datizmo"

# Create symbolic links if possible
if [ -d "/var/www" ] && [ -w "/var/www" ]; then
  echo -e "${BLUE}Creating symbolic links for proper paths...${NC}"
  
  # Remove existing symbolic links if they exist
  rm -rf /var/www/datizmo/frontend 2>/dev/null
  rm -rf /var/www/datizmo/backend 2>/dev/null
  
  # Create fresh symbolic links
  ln -sf ${PROJECT_ROOT}/frontend /var/www/datizmo/frontend
  ln -sf ${PROJECT_ROOT}/backend /var/www/datizmo/backend
  
  echo -e "${GREEN}✅ Symbolic links created${NC}"
else
  echo -e "${YELLOW}⚠️ Could not create symbolic links in /var/www/datizmo${NC}"
  echo -e "${YELLOW}⚠️ Will proceed without symbolic links${NC}"
fi

# Step 3: Fix PostgreSQL setup
echo -e "${BLUE}🐘 Setting up PostgreSQL connection...${NC}"

# Define database variables
DB_NAME="formatic"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Create PostgreSQL connection string
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Step 4: Fix backend environment
echo -e "${BLUE}📝 Updating backend environment...${NC}"

# Backup .env file if it exists
if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
  cp ${PROJECT_ROOT}/backend/.env ${PROJECT_ROOT}/backend/.env.bak.$(date +%s)
fi

# Create a fresh .env file with all necessary settings
cat > ${PROJECT_ROOT}/backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=production

# Database connection
DATABASE_URL=${DB_URL}

# JWT configuration
JWT_SECRET=production-deployment-jwt-secret-$(date +%s)

# Frontend URL (for CORS)
FRONTEND_URL=https://www.datizmo.com

# Email settings
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com

# AWS S3 configuration
AWS_REGION=eu-west-2
S3_BUCKET_NAME=formatic-uploads-dev
S3_PUBLIC_URL=https://formatic-uploads-dev.s3.amazonaws.com

# Prisma configuration - absolute paths
PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma

# Fix for Prisma working directory issue
PRISMA_BINARY_TARGETS=native
EOL

echo -e "${GREEN}✅ Backend environment updated${NC}"

# Step 5: Create special fix for Prisma uv_cwd error
echo -e "${BLUE}🔧 Creating fix for Prisma uv_cwd error...${NC}"

# Create Node.js wrapper script
cat > ${PROJECT_ROOT}/backend/node-cwd-fix.js << EOL
#!/usr/bin/env node

/**
 * This is a wrapper script that fixes the Prisma "ENOENT: no such file or directory, uv_cwd" error
 * by ensuring the working directory is set correctly before loading the application.
 */

// Log the process start
console.log('Starting backend application with CWD fix');
console.log('Current directory before fix:', process.cwd());

// Set the current working directory explicitly before loading the app
const path = require('path');
process.chdir('${PROJECT_ROOT}/backend');
console.log('Current directory after fix:', process.cwd());

// Load the actual application
console.log('Loading main application...');
require('./dist/src/main.js');
EOL

chmod +x ${PROJECT_ROOT}/backend/node-cwd-fix.js
echo -e "${GREEN}✅ Node.js wrapper script created${NC}"

# Step 6: Regenerate Prisma client if needed
echo -e "${BLUE}🔄 Regenerating Prisma client...${NC}"

# Create a Prisma generator script
cat > ${PROJECT_ROOT}/backend/generate-prisma.sh << EOL
#!/bin/bash

# Set working directory
cd ${PROJECT_ROOT}/backend

# Load environment variables
set -a
source ${PROJECT_ROOT}/backend/.env
set +a

# Regenerate Prisma client
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma
export NODE_OPTIONS="--max_old_space_size=512"

echo "Generating Prisma client..."
npx prisma generate
EOL

chmod +x ${PROJECT_ROOT}/backend/generate-prisma.sh
echo -e "${GREEN}✅ Prisma generator script created${NC}"

# Run the Prisma generator if node_modules exists
if [ -d "${PROJECT_ROOT}/backend/node_modules" ]; then
  ${PROJECT_ROOT}/backend/generate-prisma.sh
  echo -e "${GREEN}✅ Prisma client regenerated${NC}"
else
  echo -e "${YELLOW}⚠️ node_modules not found, skipping Prisma client generation${NC}"
  echo -e "${YELLOW}⚠️ Run npm install in backend directory first, then run the generate-prisma.sh script${NC}"
fi

# Step 7: Create improved backend start script
echo -e "${BLUE}📝 Creating improved backend start script...${NC}"
cat > ${PROJECT_ROOT}/backend/start-backend.sh << EOL
#!/bin/bash

# Set working directory
cd ${PROJECT_ROOT}/backend

# Load environment variables
set -a
source ${PROJECT_ROOT}/backend/.env
set +a

# Set Prisma environment variables
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma
export NODE_OPTIONS="--max_old_space_size=512"

# Start the application with the fixed loader
echo "Starting backend application with CWD fix..."
node ${PROJECT_ROOT}/backend/node-cwd-fix.js
EOL

chmod +x ${PROJECT_ROOT}/backend/start-backend.sh
echo -e "${GREEN}✅ Backend start script created${NC}"

# Step 8: Fix Next.js configuration for auth and dynamic routes
echo -e "${BLUE}📝 Creating Next.js configuration fixes...${NC}"

# Create a next.config.js with proper settings
cat > ${PROJECT_ROOT}/frontend/next.config.js << EOL
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['formatic-uploads-dev.s3.amazonaws.com', 'formatic-uploads-dev.s3.eu-west-2.amazonaws.com'],
  },
  // Fix for Next.js auth and dynamic routes
  experimental: {
    outputStandalone: true,
  },
  // Avoid issues with static pages and dynamic data
  output: 'standalone',
}
EOL

# Create frontend environment file
cat > ${PROJECT_ROOT}/frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=next-auth-secret-$(date +%s)
NEXT_PUBLIC_S3_PUBLIC_URL=https://formatic-uploads-dev.s3.amazonaws.com
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_S3_BUCKET_NAME=formatic-uploads-dev
EOL

# Create custom server.js for Next.js
cat > ${PROJECT_ROOT}/frontend/server.js << EOL
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

// Create the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true)

      // Let Next.js handle the request
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(
        \`> Ready on http://\${hostname}:\${port} - env \${process.env.NODE_ENV}\`
      )
    })
})
EOL

echo -e "${GREEN}✅ Next.js configuration fixes created${NC}"

# Step 9: Create frontend start script
echo -e "${BLUE}📝 Creating frontend start script...${NC}"
cat > ${PROJECT_ROOT}/frontend/start-frontend.sh << EOL
#!/bin/bash

# Set working directory
cd ${PROJECT_ROOT}/frontend

# Start the frontend application
NODE_OPTIONS="--max_old_space_size=512" node server.js
EOL

chmod +x ${PROJECT_ROOT}/frontend/start-frontend.sh
echo -e "${GREEN}✅ Frontend start script created${NC}"

# Step 10: Create Nginx configuration
echo -e "${BLUE}📝 Creating Nginx configuration...${NC}"

# Check if we can write to Nginx config directory
if [ -d "/etc/nginx/conf.d" ] && [ -w "/etc/nginx/conf.d" ]; then
  cat > /etc/nginx/conf.d/datizmo.conf << EOL
server {
    listen 80;
    server_name www.datizmo.com datizmo.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name www.datizmo.com datizmo.com;

    # SSL configuration - update paths as needed
    ssl_certificate /etc/letsencrypt/live/www.datizmo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.datizmo.com/privkey.pem;
    
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
    
    # NextAuth specific endpoints
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
  echo -e "${GREEN}✅ Nginx configuration created${NC}"
else
  # Create the config file locally for reference
  cat > ${PROJECT_ROOT}/nginx-datizmo.conf << EOL
server {
    listen 80;
    server_name www.datizmo.com datizmo.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name www.datizmo.com datizmo.com;

    # SSL configuration - update paths as needed
    ssl_certificate /etc/letsencrypt/live/www.datizmo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.datizmo.com/privkey.pem;
    
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
    
    # NextAuth specific endpoints
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
  echo -e "${YELLOW}⚠️ Could not write to Nginx config directory${NC}"
  echo -e "${YELLOW}⚠️ Created config file at ${PROJECT_ROOT}/nginx-datizmo.conf for reference${NC}"
  echo -e "${YELLOW}⚠️ Copy this file to /etc/nginx/conf.d/datizmo.conf manually${NC}"
fi

# Step 11: Start services with PM2 if available
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}🚀 Starting services with PM2...${NC}"
  
  # Stop any existing processes
  pm2 delete datizmo-backend 2>/dev/null || true
  pm2 delete datizmo-frontend 2>/dev/null || true
  
  # Start backend
  cd ${PROJECT_ROOT}
  pm2 start ${PROJECT_ROOT}/backend/start-backend.sh --name datizmo-backend
  
  # Start frontend
  pm2 start ${PROJECT_ROOT}/frontend/start-frontend.sh --name datizmo-frontend
  
  # Save PM2 configuration
  pm2 save
  
  echo -e "${GREEN}✅ Services started with PM2${NC}"
else
  echo -e "${YELLOW}⚠️ PM2 not found, skipping service startup${NC}"
  echo -e "${YELLOW}⚠️ Start services manually:${NC}"
  echo -e "${YELLOW}   - Backend: ${PROJECT_ROOT}/backend/start-backend.sh${NC}"
  echo -e "${YELLOW}   - Frontend: ${PROJECT_ROOT}/frontend/start-frontend.sh${NC}"
fi

# Final step: Print summary
echo -e "${GREEN}🎉 All fixes applied!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Ensure your domain points to this server${NC}"
echo -e "${BLUE}2. Set up SSL certificates with Let's Encrypt if needed${NC}"
echo -e "${BLUE}3. If using PM2, check if services are running: pm2 list${NC}"
echo -e "${BLUE}4. Check logs for issues:${NC}"
echo -e "${BLUE}   - Backend: pm2 logs datizmo-backend${NC}"
echo -e "${BLUE}   - Frontend: pm2 logs datizmo-frontend${NC}"
echo -e "${BLUE}5. If everything looks good, restart Nginx: sudo systemctl restart nginx${NC}" 
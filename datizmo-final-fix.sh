#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Final Production Fix Script${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Fix 1: Create proper symbolic links for the application path
echo -e "${BLUE}🔧 Creating symbolic links for proper paths...${NC}"

# Check if directories exist
if [ ! -d "/var/www/datizmo/frontend" ]; then
  echo -e "${BLUE}Creating symbolic link for frontend...${NC}"
  mkdir -p /var/www/datizmo
  ln -sf ${PROJECT_ROOT}/frontend /var/www/datizmo/frontend
  echo -e "${GREEN}✅ Frontend symbolic link created${NC}"
else
  echo -e "${YELLOW}⚠️ Frontend directory already exists${NC}"
  rm -rf /var/www/datizmo/frontend
  ln -sf ${PROJECT_ROOT}/frontend /var/www/datizmo/frontend
  echo -e "${GREEN}✅ Frontend symbolic link re-created${NC}"
fi

if [ ! -d "/var/www/datizmo/backend" ]; then
  echo -e "${BLUE}Creating symbolic link for backend...${NC}"
  mkdir -p /var/www/datizmo
  ln -sf ${PROJECT_ROOT}/backend /var/www/datizmo/backend
  echo -e "${GREEN}✅ Backend symbolic link created${NC}"
else
  echo -e "${YELLOW}⚠️ Backend directory already exists${NC}"
  rm -rf /var/www/datizmo/backend
  ln -sf ${PROJECT_ROOT}/backend /var/www/datizmo/backend
  echo -e "${GREEN}✅ Backend symbolic link re-created${NC}"
fi

# Fix 2: Update Nginx configuration for proper SSL setup
echo -e "${BLUE}📝 Updating Nginx configuration for proper SSL...${NC}"

# Disable SSL temporarily to allow Let's Encrypt to provision certificates
cat > /etc/nginx/conf.d/datizmo.conf << EOL
server {
    listen 80;
    server_name www.datizmo.com datizmo.com;

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

    # Next Auth specific endpoints
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
}
EOL

echo -e "${GREEN}✅ Nginx config updated${NC}"

# Fix 3: Install dependencies needed for SSL
echo -e "${BLUE}📦 Installing SSL dependencies...${NC}"

# Check and install certbot if needed
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}⚠️ Certbot not found, installing...${NC}"
  yum install -y certbot python3-certbot-nginx
fi

# Restart nginx with new config
echo -e "${BLUE}🔄 Restarting Nginx...${NC}"
systemctl restart nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"

# Fix 4: Generate SSL certificates using Let's Encrypt
echo -e "${BLUE}🔒 Generating SSL certificates with Let's Encrypt...${NC}"
if [ ! -d "/etc/letsencrypt/live/www.datizmo.com" ]; then
  certbot --nginx -d www.datizmo.com -d datizmo.com --non-interactive --agree-tos --email admin@datizmo.com
  echo -e "${GREEN}✅ SSL certificates obtained${NC}"
else
  echo -e "${YELLOW}⚠️ SSL certificates already exist, renewing...${NC}"
  certbot renew
  echo -e "${GREEN}✅ SSL certificates renewed${NC}"
fi

# Fix 5: Restart the services properly
echo -e "${BLUE}🔄 Restarting services...${NC}"

# Stop existing PM2 processes
pm2 stop all

# Start the backend
cd ${PROJECT_ROOT}/backend
pm2 start dist/src/main.js --name datizmo-backend

# Start the frontend with node server.js
cd ${PROJECT_ROOT}/frontend
pm2 start server.js --name datizmo-frontend

# Save the PM2 configuration
pm2 save
pm2 startup

cd "$PROJECT_ROOT"

echo -e "${GREEN}🎉 All fixes applied!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Check if all services are running: pm2 list${NC}"
echo -e "${BLUE}2. Check frontend/backend logs: pm2 logs${NC}"
echo -e "${BLUE}3. Test your website at https://www.datizmo.com${NC}" 
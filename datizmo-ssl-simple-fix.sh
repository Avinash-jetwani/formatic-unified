#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Simple SSL Certificate Fix for Datizmo${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Domain configuration
DOMAIN="www.datizmo.com"
DOMAIN_ALT="datizmo.com"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "unknown")

# Get the absolute path of the project
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Step 1: Install Certbot if needed
echo -e "${BLUE}🔍 Checking if Certbot is installed...${NC}"
if ! command -v certbot &> /dev/null; then
  echo -e "${BLUE}📦 Installing Certbot...${NC}"
  
  # Detect OS and install certbot appropriately
  if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
  elif [ -f /etc/redhat-release ]; then
    # RHEL/CentOS/Amazon Linux
    if grep -q "Amazon Linux" /etc/os-release; then
      # Amazon Linux 2023
      dnf install -y certbot python3-certbot-nginx
    else
      # RHEL/CentOS
      yum install -y epel-release
      yum install -y certbot python3-certbot-nginx
    fi
  else
    echo -e "${RED}⛔ Unsupported OS. Please install Certbot manually.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Certbot installed${NC}"
else
  echo -e "${GREEN}✅ Certbot is already installed${NC}"
fi

# Step 2: Check and fix DNS
echo -e "${BLUE}🌐 Checking DNS resolution...${NC}"
echo -e "${BLUE}Your server IP address is: ${SERVER_IP}${NC}"

resolved_ip=$(dig +short ${DOMAIN} || host -t A ${DOMAIN} | grep "has address" | awk '{print $4}' || echo "")
if [ -z "$resolved_ip" ]; then
  echo -e "${YELLOW}⚠️ Could not resolve ${DOMAIN}. DNS may not be configured correctly.${NC}"
else
  echo -e "${BLUE}${DOMAIN} currently resolves to: ${resolved_ip}${NC}"
  
  if [ "$resolved_ip" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️ WARNING: ${DOMAIN} does not point to this server's IP (${SERVER_IP})${NC}"
    echo -e "${YELLOW}⚠️ Please update your DNS settings to point ${DOMAIN} to ${SERVER_IP}${NC}"
    echo -e "${YELLOW}⚠️ Continuing anyway, but certificate validation may fail${NC}"
  else
    echo -e "${GREEN}✅ DNS configuration looks correct${NC}"
  fi
fi

# Step 3: Create basic Nginx config for Certbot
echo -e "${BLUE}📝 Creating basic Nginx config for Certbot validation...${NC}"

# Stop Nginx temporarily to free up port 80
systemctl stop nginx

# Create simple Nginx config
cat > /etc/nginx/conf.d/datizmo-temp.conf << EOL
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${DOMAIN_ALT};
    
    root /var/www/html;
    
    location / {
        return 200 "Datizmo SSL setup in progress";
    }
}
EOL

# Remove any existing SSL configs to avoid conflicts
rm -f /etc/nginx/conf.d/datizmo.conf 2>/dev/null

# Create webroot directory
mkdir -p /var/www/html
chmod -R 755 /var/www/html
echo "Datizmo SSL setup in progress" > /var/www/html/index.html

# Start Nginx with clean config
systemctl start nginx
echo -e "${GREEN}✅ Basic Nginx config created${NC}"

# Step 4: Create a real certificate with standalone plugin
echo -e "${BLUE}🔐 Obtaining SSL certificate with standalone plugin...${NC}"
echo -e "${BLUE}(This method temporarily stops Nginx during validation)${NC}"

# Try to get certificate with standalone plugin (more reliable)
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@${DOMAIN_ALT} \
  --domains ${DOMAIN},${DOMAIN_ALT} \
  --preferred-challenges http \
  --force-renewal

# Check if certificate was created
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${GREEN}✅ Certificate successfully obtained!${NC}"
else
  echo -e "${YELLOW}⚠️ Certificate issuance failed. Using Certbot's nginx plugin as fallback...${NC}"
  
  # Try with the nginx plugin as fallback
  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email admin@${DOMAIN_ALT} \
    --domains ${DOMAIN},${DOMAIN_ALT} \
    --redirect
  
  if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo -e "${GREEN}✅ Certificate successfully obtained with nginx plugin!${NC}"
  else
    echo -e "${RED}⛔ Both certificate methods failed. Please ensure:${NC}"
    echo -e "${RED}1. Your domains (${DOMAIN} and ${DOMAIN_ALT}) point to this server's IP (${SERVER_IP})${NC}"
    echo -e "${RED}2. Port 80 is accessible from the internet${NC}"
    echo -e "${RED}3. There are no firewalls or security groups blocking HTTP access${NC}"
    
    echo -e "${YELLOW}⚠️ Creating a temporary self-signed certificate instead...${NC}"
    
    # Generate self-signed certificate
    mkdir -p /etc/ssl/datizmo
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/datizmo/selfsigned.key \
      -out /etc/ssl/datizmo/selfsigned.crt \
      -subj "/CN=${DOMAIN}" \
      -addext "subjectAltName = DNS:${DOMAIN}, DNS:${DOMAIN_ALT}"
  fi
fi

# Step 5: Configure Nginx with the certificate
echo -e "${BLUE}📝 Configuring Nginx with SSL certificate...${NC}"

# Determine which certificate to use
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  KEY_PATH="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
  echo -e "${GREEN}✅ Using Let's Encrypt certificates${NC}"
else
  CERT_PATH="/etc/ssl/datizmo/selfsigned.crt"
  KEY_PATH="/etc/ssl/datizmo/selfsigned.key"
  echo -e "${YELLOW}⚠️ Using self-signed certificates${NC}"
fi

# Create proper Nginx configuration
cat > /etc/nginx/conf.d/datizmo.conf << EOL
server {
    listen 80;
    server_name ${DOMAIN} ${DOMAIN_ALT};
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
    
    # Allow Certbot verification (keep this for renewal)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN} ${DOMAIN_ALT};

    # SSL configuration
    ssl_certificate ${CERT_PATH};
    ssl_certificate_key ${KEY_PATH};
    
    # Improved SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';
    
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

# Remove temporary config
rm -f /etc/nginx/conf.d/datizmo-temp.conf

# Step 6: Check Nginx configuration and reload
echo -e "${BLUE}🔍 Testing Nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
  echo -e "${BLUE}🔄 Restarting Nginx...${NC}"
  systemctl restart nginx
  echo -e "${GREEN}✅ Nginx restarted with SSL configuration${NC}"
else
  echo -e "${RED}⛔ Nginx configuration test failed. Please check the configuration manually.${NC}"
  exit 1
fi

# Step 7: Set up auto-renewal for Let's Encrypt certificates
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${BLUE}🔄 Setting up certificate auto-renewal...${NC}"
  
  # Create renewal script
  cat > /usr/local/bin/renew-ssl-certs.sh << EOL
#!/bin/bash
certbot renew --quiet --no-self-upgrade
systemctl reload nginx
EOL
  
  chmod +x /usr/local/bin/renew-ssl-certs.sh
  
  # Try to set up cron job
  if command -v crontab &> /dev/null; then
    (crontab -l 2>/dev/null | grep -v "renew-ssl-certs.sh" ; echo "0 3 * * * /usr/local/bin/renew-ssl-certs.sh") | crontab -
    echo -e "${GREEN}✅ Cron job for certificate renewal added${NC}"
  else
    # Add to system cron
    echo "0 3 * * * root /usr/local/bin/renew-ssl-certs.sh" > /etc/cron.d/renew-ssl-certs
    chmod 644 /etc/cron.d/renew-ssl-certs
    echo -e "${GREEN}✅ System cron job for certificate renewal added${NC}"
  fi
fi

# Step 8: Update frontend environment to use HTTPS
echo -e "${BLUE}📝 Updating frontend environment for HTTPS...${NC}"

# Create frontend environment file
cat > ${PROJECT_ROOT}/frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=next-auth-secret-$(date +%s)
NEXT_PUBLIC_S3_PUBLIC_URL=https://formatic-uploads-dev.s3.amazonaws.com
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_S3_BUCKET_NAME=formatic-uploads-dev
EOL

# Step 9: Restart services if running with PM2
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}🚀 Restarting services with PM2...${NC}"
  
  # Update PM2 environment variables
  pm2 restart datizmo-frontend --update-env || pm2 start ${PROJECT_ROOT}/frontend/start-frontend.sh --name datizmo-frontend
  
  echo -e "${GREEN}✅ Frontend service restarted with PM2${NC}"
fi

# Final step: Show status and instructions
echo -e "${BLUE}📡 Checking firewall settings...${NC}"
if command -v firewall-cmd &> /dev/null; then
  echo -e "${BLUE}Ensuring ports 80 and 443 are open in firewalld...${NC}"
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
  echo -e "${GREEN}✅ Firewall updated to allow HTTP and HTTPS traffic${NC}"
elif command -v ufw &> /dev/null; then
  echo -e "${BLUE}Ensuring ports 80 and 443 are open in UFW...${NC}"
  ufw allow http
  ufw allow https
  echo -e "${GREEN}✅ UFW updated to allow HTTP and HTTPS traffic${NC}"
else
  echo -e "${YELLOW}⚠️ No supported firewall found. Please ensure ports 80 and 443 are open.${NC}"
fi

echo -e "${GREEN}🎉 SSL certificate setup complete!${NC}"
echo -e "${GREEN}--------------------------------------------${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Verify your site is accessible: https://${DOMAIN}${NC}"
echo -e "${BLUE}2. Check certificate info: curl -vI https://${DOMAIN} 2>&1 | grep -i 'server certificate'${NC}"

if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${RED}⚠️ WARNING: Using a self-signed certificate which browsers will flag as insecure.${NC}"
  echo -e "${RED}⚠️ To fix this:${NC}"
  echo -e "${RED}  1. Make sure your domain DNS points to: ${SERVER_IP}${NC}"
  echo -e "${RED}  2. Make sure port 80 is accessible from the internet${NC}"
  echo -e "${RED}  3. Check your AWS security group settings if using EC2${NC}"
  echo -e "${RED}  4. Run this script again after fixing these issues${NC}"
else
  echo -e "${GREEN}✅ Let's Encrypt certificate installed successfully. Your site should be secure!${NC}"
fi 
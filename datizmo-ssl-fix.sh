#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing SSL Certificate Issues for Datizmo${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Domain configuration
DOMAIN="www.datizmo.com"
DOMAIN_ALT="datizmo.com"

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

# Step 2: Check if Nginx is installed and running
echo -e "${BLUE}🔍 Checking Nginx status...${NC}"
if ! command -v nginx &> /dev/null; then
  echo -e "${RED}⛔ Nginx is not installed. Please install Nginx first.${NC}"
  exit 1
fi

# Check if Nginx is running
nginx_running=$(systemctl is-active nginx)
if [ "$nginx_running" != "active" ]; then
  echo -e "${BLUE}🚀 Starting Nginx...${NC}"
  systemctl start nginx
fi

echo -e "${GREEN}✅ Nginx is installed and running${NC}"

# Step 3: Check for existing certificates
echo -e "${BLUE}🔍 Checking for existing certificates...${NC}"
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${YELLOW}⚠️ Certificate already exists for ${DOMAIN}${NC}"
  echo -e "${BLUE}🔄 Do you want to renew/replace the certificate? (y/n)${NC}"
  read -r renew_cert
  if [[ "$renew_cert" =~ ^[Yy]$ ]]; then
    certbot_action="--force-renewal"
    echo -e "${BLUE}🔄 Will force certificate renewal${NC}"
  else
    certbot_action=""
    echo -e "${BLUE}🔄 Will attempt standard certificate validation${NC}"
  fi
else
  certbot_action=""
  echo -e "${BLUE}🔄 Will obtain a new certificate${NC}"
fi

# Step 4: Configure Nginx for Certbot
echo -e "${BLUE}📝 Configuring Nginx temporarily for Certbot...${NC}"

# Create a simple configuration for Certbot verification
cat > /etc/nginx/conf.d/datizmo-temp-http.conf << EOL
server {
    listen 80;
    server_name ${DOMAIN} ${DOMAIN_ALT};
    
    location / {
        return 200 'Ready for Certbot';
    }
    
    # Allow Certbot verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOL

# Create the challenge directory
mkdir -p /var/www/html/.well-known/acme-challenge
chmod -R 755 /var/www/html

# Reload Nginx to apply temporary config
echo -e "${BLUE}🔄 Reloading Nginx...${NC}"
systemctl reload nginx

# Step 5: Obtain the certificate
echo -e "${BLUE}🔐 Obtaining SSL certificate...${NC}"
certbot certonly --webroot \
  -w /var/www/html \
  -d ${DOMAIN} \
  -d ${DOMAIN_ALT} \
  --email admin@${DOMAIN_ALT} \
  --agree-tos \
  --non-interactive \
  ${certbot_action} || {
    echo -e "${RED}⛔ Certificate issuance failed. Please check your domain DNS settings.${NC}"
    echo -e "${YELLOW}⚠️ Ensure that the domain ${DOMAIN} points to this server's IP address.${NC}"
    echo -e "${YELLOW}⚠️ Setting up a self-signed certificate for development instead.${NC}"
    
    # Generate self-signed certificate
    mkdir -p /etc/ssl/datizmo
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/datizmo/selfsigned.key \
      -out /etc/ssl/datizmo/selfsigned.crt \
      -subj "/CN=${DOMAIN}" \
      -addext "subjectAltName = DNS:${DOMAIN}, DNS:${DOMAIN_ALT}"
    
    # Update self-signed cert paths
    CERT_PATH="/etc/ssl/datizmo/selfsigned.crt"
    KEY_PATH="/etc/ssl/datizmo/selfsigned.key"
    echo -e "${YELLOW}⚠️ Using self-signed certificate (not secure for production)${NC}"
}

# Step 6: Update Nginx configuration
echo -e "${BLUE}📝 Updating Nginx configuration with SSL settings...${NC}"

# Remove temporary config
rm -f /etc/nginx/conf.d/datizmo-temp-http.conf

# Set certificate paths based on whether we're using Let's Encrypt or self-signed
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  KEY_PATH="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
  echo -e "${GREEN}✅ Using Let's Encrypt certificates${NC}"
else
  # If we didn't explicitly create self-signed above but also don't have Let's Encrypt
  if [ -z "$CERT_PATH" ]; then
    echo -e "${RED}⛔ No certificates found and Let's Encrypt failed.${NC}"
    exit 1
  fi
  # Otherwise CERT_PATH and KEY_PATH were set to self-signed values
fi

# Create the final Nginx configuration
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
    
    # HSTS (optional, uncomment if desired)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
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

# Step 7: Check Nginx configuration and reload
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

# Step 8: Set up auto-renewal for Let's Encrypt certificates
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${BLUE}🔄 Setting up certificate auto-renewal...${NC}"
  
  # Check if crontab is available
  if command -v crontab &> /dev/null; then
    # Check if renewal cron job exists
    cron_exists=$(crontab -l | grep -c "certbot renew")
    
    if [ "$cron_exists" -eq 0 ]; then
      # Add renewal to crontab
      (crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
      echo -e "${GREEN}✅ Certificate renewal cron job added${NC}"
    else
      echo -e "${GREEN}✅ Certificate renewal cron job already exists${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Crontab not available. You will need to set up certificate renewal manually.${NC}"
  fi
fi

# Step 9: Update frontend environment to use HTTPS
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

# Step 10: Restart services if running with PM2
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}🚀 Restarting services with PM2...${NC}"
  
  # Restart frontend to pick up new environment variables
  pm2 restart datizmo-frontend || pm2 start ${PROJECT_ROOT}/frontend/start-frontend.sh --name datizmo-frontend
  
  echo -e "${GREEN}✅ Frontend service restarted with PM2${NC}"
fi

echo -e "${GREEN}🎉 SSL certificate setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Test your secure site: https://${DOMAIN}${NC}"
echo -e "${BLUE}2. Check certificate info: curl -v https://${DOMAIN} 2>&1 | grep -i 'server certificate'${NC}"
echo -e "${BLUE}3. If using Let's Encrypt, certificates will auto-renew every 90 days${NC}"

if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${YELLOW}⚠️ Warning: Using a self-signed certificate which browsers will flag as insecure.${NC}"
  echo -e "${YELLOW}⚠️ For production, ensure DNS is properly configured and re-run this script.${NC}"
fi 
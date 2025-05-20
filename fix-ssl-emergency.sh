#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 EMERGENCY SSL FIX FOR DATIZMO${NC}"
echo -e "${BLUE}This script will fix the SSL certificate issues by addressing port conflicts and DNS issues${NC}"

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

# Step 1: Check DNS thoroughly
echo -e "${BLUE}🌐 Checking DNS resolution thoroughly...${NC}"
echo -e "${BLUE}Your server IP address is: ${SERVER_IP}${NC}"

# Check both domains
for domain in "${DOMAIN}" "${DOMAIN_ALT}"; do
  echo -e "${YELLOW}Checking DNS for ${domain}...${NC}"
  resolved_ip=$(dig +short ${domain} || host -t A ${domain} 2>/dev/null | grep "has address" | awk '{print $4}' || nslookup ${domain} 2>/dev/null | grep "Address:" | tail -n1 | awk '{print $2}' || echo "")
  
  if [ -z "$resolved_ip" ]; then
    echo -e "${RED}⚠️ Could not resolve ${domain}. DNS is not configured.${NC}"
  else
    echo -e "${BLUE}${domain} resolves to: ${resolved_ip}${NC}"
    
    if [[ "$resolved_ip" != *"$SERVER_IP"* ]]; then
      echo -e "${RED}⚠️ DNS MISMATCH: ${domain} points to ${resolved_ip} but should point to ${SERVER_IP}${NC}"
      echo -e "${RED}⚠️ Certificate validation will fail until you update your DNS settings${NC}"
    else
      echo -e "${GREEN}✅ DNS for ${domain} is correctly pointing to this server${NC}"
    fi
  fi
done

echo -e "${YELLOW}-----------------------------------------------${NC}"
echo -e "${RED}⚠️ IMPORTANT: If your domains don't point to ${SERVER_IP}, SSL won't work!${NC}"
read -p "Do you want to continue anyway? (y/n): " continue_anyway
if [[ "$continue_anyway" != "y" && "$continue_anyway" != "Y" ]]; then
  echo -e "${RED}Exiting. Please update your DNS settings and try again.${NC}"
  exit 1
fi
echo -e "${YELLOW}-----------------------------------------------${NC}"

# Step 2: Really make sure port 80 is free
echo -e "${BLUE}🔍 Checking for processes using port 80...${NC}"

# Find and list processes using port 80
echo -e "${BLUE}Processes currently using port 80:${NC}"
processes_using_port=$(lsof -i :80 -t || netstat -tulpn 2>/dev/null | grep ":80 " | awk '{print $7}' | cut -d'/' -f1 || ss -tulpn | grep ":80 " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2 || echo "")

if [ -n "$processes_using_port" ]; then
  echo -e "${YELLOW}Found processes using port 80. Will stop them now:${NC}"
  echo "$processes_using_port"
  
  # Stop all services that might be using port 80
  systemctl stop nginx 2>/dev/null || true
  systemctl stop httpd 2>/dev/null || true
  systemctl stop apache2 2>/dev/null || true
  
  # Kill remaining processes directly
  for pid in $processes_using_port; do
    echo "Stopping process $pid..."
    kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
  done
  
  # Wait a moment
  echo -e "${BLUE}Waiting for port 80 to be released...${NC}"
  sleep 5
  
  # Check if port is now free
  if lsof -i :80 -t >/dev/null 2>&1 || netstat -tulpn 2>/dev/null | grep -q ":80 " || ss -tulpn | grep -q ":80 "; then
    echo -e "${RED}⚠️ Port 80 is still in use! Will try to force kill processes...${NC}"
    
    # More aggressive killing
    lsof -i :80 -t | xargs kill -9 2>/dev/null || true
    sleep 2
    
    if lsof -i :80 -t >/dev/null 2>&1 || netstat -tulpn 2>/dev/null | grep -q ":80 " || ss -tulpn | grep -q ":80 "; then
      echo -e "${RED}⛔ Could not free port 80. Certificate validation will likely fail.${NC}"
      echo -e "${RED}⛔ Please manually stop all services using port 80 and try again.${NC}"
    else
      echo -e "${GREEN}✅ Port 80 is now free${NC}"
    fi
  else
    echo -e "${GREEN}✅ Port 80 is now free${NC}"
  fi
else
  echo -e "${GREEN}✅ Port 80 is already free${NC}"
fi

# Step 3: Delete existing certificates to start fresh
echo -e "${BLUE}🔄 Cleaning up existing certificates...${NC}"
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${BLUE}Backing up old certificates...${NC}"
  mkdir -p /root/cert-backups
  tar -czf /root/cert-backups/letsencrypt-backup-$(date +%Y-%m-%d-%H-%M-%S).tar.gz /etc/letsencrypt/
  echo -e "${BLUE}Removing old certificates...${NC}"
  certbot delete --cert-name ${DOMAIN} --non-interactive || true
  echo -e "${GREEN}✅ Old certificates cleaned up${NC}"
fi

# Step 4: Create a real certificate with standalone plugin
echo -e "${BLUE}🔐 Obtaining SSL certificate with standalone plugin...${NC}"
echo -e "${BLUE}(This method requires port 80 to be free)${NC}"

# Try to get certificate with standalone plugin (more reliable)
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@${DOMAIN_ALT} \
  --domains ${DOMAIN},${DOMAIN_ALT} \
  --preferred-challenges http \
  --debug-challenges \
  --verbose

# Check very carefully if certificate was created
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" ]; then
  echo -e "${GREEN}✅ Certificate successfully obtained!${NC}"
  
  # Verify certificate validity
  echo -e "${BLUE}Verifying certificate validity...${NC}"
  CERT_VALID=$(openssl x509 -noout -text -in /etc/letsencrypt/live/${DOMAIN}/cert.pem | grep -A2 "Validity" || echo "")
  CERT_ISSUER=$(openssl x509 -noout -text -in /etc/letsencrypt/live/${DOMAIN}/cert.pem | grep "Issuer:" || echo "")
  
  echo -e "${BLUE}Certificate details:${NC}"
  echo -e "${BLUE}$CERT_VALID${NC}"
  echo -e "${BLUE}$CERT_ISSUER${NC}"
  
  if [[ "$CERT_ISSUER" == *"Let's Encrypt"* ]]; then
    echo -e "${GREEN}✅ Valid Let's Encrypt certificate confirmed!${NC}"
  else
    echo -e "${YELLOW}⚠️ Certificate doesn't appear to be from Let's Encrypt${NC}"
  fi
else
  echo -e "${RED}⛔ Certificate issuance failed.${NC}"
  echo -e "${YELLOW}⚠️ Creating a temporary self-signed certificate instead...${NC}"
  
  # Generate self-signed certificate
  mkdir -p /etc/ssl/datizmo
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/datizmo/selfsigned.key \
    -out /etc/ssl/datizmo/selfsigned.crt \
    -subj "/CN=${DOMAIN}/O=Datizmo Self-Signed" \
    -addext "subjectAltName = DNS:${DOMAIN}, DNS:${DOMAIN_ALT}"
  
  echo -e "${YELLOW}Self-signed certificate created.${NC}"
fi

# Step 5: Configure Nginx with the certificate
echo -e "${BLUE}📝 Configuring Nginx with SSL certificate...${NC}"

# Determine which certificate to use
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" ]; then
  CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  KEY_PATH="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
  echo -e "${GREEN}✅ Using Let's Encrypt certificates${NC}"
else
  CERT_PATH="/etc/ssl/datizmo/selfsigned.crt"
  KEY_PATH="/etc/ssl/datizmo/selfsigned.key"
  echo -e "${YELLOW}⚠️ Using self-signed certificates${NC}"
fi

# Create proper Nginx configuration with very explicit permissions
cat > /etc/nginx/conf.d/datizmo.conf << EOL
# This configuration was generated by the emergency SSL fix script

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${DOMAIN_ALT};
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
    
    # Allow Certbot verification (keep this for renewal)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
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

# Create webroot directory with proper permissions
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R nginx:nginx /var/www/html 2>/dev/null || true  # For NGINX
chown -R www-data:www-data /var/www/html 2>/dev/null || true  # For Apache
chmod -R 755 /var/www/html

# Step 6: Check Nginx configuration and start
echo -e "${BLUE}🔍 Testing Nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
  echo -e "${BLUE}🔄 Starting Nginx...${NC}"
  systemctl start nginx
  echo -e "${GREEN}✅ Nginx started with SSL configuration${NC}"
else
  echo -e "${RED}⛔ Nginx configuration test failed.${NC}"
  echo -e "${BLUE}Creating simplified configuration...${NC}"
  
  cat > /etc/nginx/conf.d/datizmo-simple.conf << EOL
# Simplified emergency configuration
server {
    listen 80;
    server_name ${DOMAIN} ${DOMAIN_ALT};
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN} ${DOMAIN_ALT};

    # SSL configuration
    ssl_certificate ${CERT_PATH};
    ssl_certificate_key ${KEY_PATH};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
    }
    
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host \$host;
    }
}
EOL

  # Remove the problematic config
  rm -f /etc/nginx/conf.d/datizmo.conf
  
  # Test and start with simple config
  nginx -t
  
  if [ $? -eq 0 ]; then
    echo -e "${BLUE}🔄 Starting Nginx with simplified config...${NC}"
    systemctl start nginx
    echo -e "${GREEN}✅ Nginx started with simplified SSL configuration${NC}"
  else
    echo -e "${RED}⛔ Nginx configuration still failing. Please check logs.${NC}"
  fi
fi

# Step 7: Set up proper certificate renewal
echo -e "${BLUE}🔄 Setting up proper certificate auto-renewal...${NC}"

# Create the directories if they don't exist
mkdir -p /usr/local/bin
mkdir -p /etc/cron.d

# Create renewal script with port handling
cat > /usr/local/bin/renew-ssl-certs.sh << EOL
#!/bin/bash
# Stop Nginx before renewal to free port 80
systemctl stop nginx

# Attempt renewal
certbot renew --quiet --no-self-upgrade

# Start Nginx again
systemctl start nginx
EOL

chmod +x /usr/local/bin/renew-ssl-certs.sh

# Create cron job in system cron directory
echo "0 3 * * * root /usr/local/bin/renew-ssl-certs.sh" > /etc/cron.d/renew-ssl-certs
chmod 644 /etc/cron.d/renew-ssl-certs

echo -e "${GREEN}✅ Certificate renewal properly configured${NC}"

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

# Step 9: Restart services with PM2
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}🚀 Restarting services with PM2...${NC}"
  
  # First list all processes
  pm2 list
  
  # Update PM2 environment variables and restart
  echo -e "${BLUE}Restarting backend...${NC}"
  pm2 restart datizmo-backend --update-env || pm2 start ${PROJECT_ROOT}/backend/start-backend.sh --name datizmo-backend
  
  echo -e "${BLUE}Restarting frontend...${NC}"
  pm2 restart datizmo-frontend --update-env || pm2 start ${PROJECT_ROOT}/frontend/start-frontend.sh --name datizmo-frontend
  
  # Save PM2 configuration
  pm2 save
  
  echo -e "${GREEN}✅ Services restarted with PM2${NC}"
fi

# Final step: Show status and instructions
echo -e "${GREEN}🎉 SSL certificate emergency fix complete!${NC}"
echo -e "${GREEN}--------------------------------------------${NC}"
echo -e "${YELLOW}Next steps:${NC}"

if [[ "$resolved_ip" != *"$SERVER_IP"* ]]; then
  echo -e "${RED}⚠️ CRITICAL DNS ISSUE DETECTED!${NC}"
  echo -e "${RED}Your domain is pointing to ${resolved_ip} instead of ${SERVER_IP}${NC}"
  echo -e "${RED}You MUST update your DNS settings:${NC}"
  echo -e "${RED}1. Log into your domain registrar (e.g., GoDaddy, Namecheap)${NC}"
  echo -e "${RED}2. Find the DNS management section${NC}"
  echo -e "${RED}3. Update the A records for both ${DOMAIN} and ${DOMAIN_ALT} to:${NC}"
  echo -e "${RED}   ${SERVER_IP}${NC}"
  echo -e "${RED}4. Wait for DNS to propagate (can take up to 24-48 hours)${NC}"
  echo -e "${RED}5. Then run this script again${NC}"
else
  echo -e "${GREEN}✅ DNS is correctly configured${NC}"
fi

echo -e "${YELLOW}To verify SSL certificate:${NC}"
echo -e "${BLUE}1. Check your site in browser: https://${DOMAIN}${NC}"
echo -e "${BLUE}2. View certificate details: curl -vI https://${DOMAIN} 2>&1 | grep -i 'server certificate'${NC}"

# Create a diagnostic command to help with troubleshooting
cat > /usr/local/bin/check-datizmo-ssl.sh << EOL
#!/bin/bash
echo "=== DATIZMO SSL DIAGNOSTICS ==="
echo "Server IP: \$(curl -s ifconfig.me)"
echo "Domain resolution:"
echo "\$(dig +short ${DOMAIN})"
echo "\$(dig +short ${DOMAIN_ALT})"
echo 
echo "Certificate path: ${CERT_PATH}"
if [ -f "${CERT_PATH}" ]; then
  echo "Certificate exists: Yes"
  echo
  echo "Certificate details:"
  openssl x509 -noout -text -in ${CERT_PATH} | grep -A2 "Validity"
  openssl x509 -noout -text -in ${CERT_PATH} | grep "Issuer:"
else
  echo "Certificate exists: No"
fi
echo
echo "Processes using port 80:"
lsof -i :80 || netstat -tulpn 2>/dev/null | grep ":80"
echo
echo "Processes using port 443:"
lsof -i :443 || netstat -tulpn 2>/dev/null | grep ":443"
echo
echo "Nginx status:"
systemctl status nginx
EOL

chmod +x /usr/local/bin/check-datizmo-ssl.sh

echo -e "${BLUE}3. For detailed diagnostics run: /usr/local/bin/check-datizmo-ssl.sh${NC}"

if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo -e "${GREEN}✅ Let's Encrypt certificate installed.${NC}"
else
  echo -e "${RED}⚠️ Using a self-signed certificate which browsers will flag as insecure.${NC}"
fi 
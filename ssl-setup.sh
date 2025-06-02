#!/bin/bash

# SSL Setup Script for Formatic App
# This script sets up SSL certificates using Let's Encrypt

set -e

# Configuration
DOMAIN="${1:-datizmo.com}"
EMAIL="admin@$DOMAIN"

echo "🔧 Setting up SSL certificates for: $DOMAIN"
echo "📧 Using email: $EMAIL"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

echo "=== Stopping services ==="
systemctl stop nginx || echo "Nginx not running"

echo "=== Cleaning up existing SSL setup ==="
# Remove old certbot installation
yum remove -y certbot python3-certbot-nginx || echo "Certbot not installed"
rm -rf /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt || echo "No existing certbot files"
rm -f /etc/ssl/certs/$DOMAIN.* /etc/ssl/private/$DOMAIN.* || echo "No existing SSL files"

echo "=== Installing Let's Encrypt ==="
# Install certbot (handle different Amazon Linux versions)
echo "Attempting to install certbot..."

# Method 1: Direct installation (Amazon Linux 2023)
if yum install -y certbot python3-certbot-nginx 2>/dev/null; then
    echo "✅ Certbot installed directly from default repos"
else
    echo "Direct installation failed, trying alternative methods..."
    
    # Method 2: Try with dnf (Amazon Linux 2023 might use dnf)
    if command -v dnf >/dev/null 2>&1; then
        echo "Trying dnf installation..."
        if dnf install -y certbot python3-certbot-nginx; then
            echo "✅ Certbot installed via dnf"
        else
            echo "DNF installation failed"
        fi
    fi
    
    # Method 3: Try EPEL (Amazon Linux 2)
    if ! command -v certbot >/dev/null 2>&1; then
        echo "Trying EPEL installation..."
        if yum install -y epel-release 2>/dev/null || amazon-linux-extras install epel 2>/dev/null; then
            yum install -y certbot python3-certbot-nginx
            echo "✅ Certbot installed via EPEL"
        fi
    fi
    
    # Method 4: Snap installation as last resort
    if ! command -v certbot >/dev/null 2>&1; then
        echo "Trying snap installation as last resort..."
        if yum install -y snapd 2>/dev/null; then
            systemctl enable --now snapd.socket
            snap install certbot --classic
            ln -sf /snap/bin/certbot /usr/bin/certbot
            echo "✅ Certbot installed via snap"
        fi
    fi
fi

# Verify installation
certbot --version

echo "=== Creating temporary Nginx config ==="
mkdir -p /var/www/html
chown -R nginx:nginx /var/www/html

# Create basic nginx config for HTTP verification
tee /etc/nginx/conf.d/formatic.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    location / {
        return 200 "SSL setup in progress...";
        add_header Content-Type text/plain;
    }
}
EOF

echo "=== Starting nginx for verification ==="
nginx -t && systemctl start nginx
sleep 5

echo "=== Obtaining SSL certificates ==="
# Try nginx plugin first
if certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN,www.$DOMAIN \
    --expand \
    --renew-by-default; then
    
    echo "✅ SSL certificates obtained successfully with nginx plugin"
    
else
    echo "⚠️  Nginx plugin failed, trying standalone mode..."
    
    # Stop nginx for standalone mode
    systemctl stop nginx
    
    # Try standalone mode
    if certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN,www.$DOMAIN \
        --expand \
        --renew-by-default; then
        
        echo "✅ SSL certificates obtained successfully with standalone mode"
        
        # Create SSL-enabled nginx config
        tee /etc/nginx/conf.d/formatic.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
    
    # Static assets
    location ~* \.(ico|css|js|gif|jpeg|jpg|png|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # All other routes
    location / {
        proxy_pass http://127.0.0.1:3000;
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
EOF
        
    else
        echo "❌ Failed to obtain SSL certificates"
        echo "Creating self-signed certificate as fallback..."
        
        mkdir -p /etc/ssl/certs /etc/ssl/private
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/private/$DOMAIN.key \
            -out /etc/ssl/certs/$DOMAIN.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$DOMAIN"
        
        # Create self-signed SSL nginx config
        tee /etc/nginx/conf.d/formatic.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration with self-signed certificates
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
    
    # Static assets
    location ~* \.(ico|css|js|gif|jpeg|jpg|png|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # All other routes
    location / {
        proxy_pass http://127.0.0.1:3000;
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
EOF
    fi
fi

echo "=== Setting up automatic renewal ==="
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    # Test renewal
    certbot renew --dry-run
    
    # Set up cron job for automatic renewal (remove any existing entries first)
    crontab -l 2>/dev/null | grep -v "certbot renew" | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
    
    echo "✅ Automatic renewal set up successfully"
fi

echo "=== Starting services ==="
nginx -t
if [ $? -eq 0 ]; then
    systemctl enable nginx
    systemctl restart nginx
    echo "✅ Nginx started successfully"
else
    echo "❌ Nginx configuration error"
    exit 1
fi

echo "=== SSL Setup Complete! ==="
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Let's Encrypt SSL certificate installed successfully!"
    echo "🌐 Your site is now available at: https://$DOMAIN"
    echo "🔄 Automatic renewal is configured"
    
    echo ""
    echo "📜 Certificate details:"
    certbot certificates
else
    echo "⚠️  Self-signed SSL certificate installed"
    echo "🌐 Your site is available at: https://$DOMAIN (browser will show warning)"
    echo "❗ Consider fixing DNS/firewall issues and running this script again"
fi

echo ""
echo "🧪 Testing SSL:"
echo "HTTP redirect: curl -I http://$DOMAIN"
echo "HTTPS access: curl -I https://$DOMAIN" 
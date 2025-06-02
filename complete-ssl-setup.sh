#!/bin/bash

# Complete SSL Setup Script
# This script finishes the SSL setup since certificates were already obtained

set -e

DOMAIN="${1:-datizmo.com}"

echo "🚀 Completing SSL setup for: $DOMAIN"

# Check if certificates exist
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Let's Encrypt certificates found - configuring SSL nginx"
    
    # Create SSL-enabled nginx config
    sudo tee /etc/nginx/conf.d/formatic.conf << 'SSLEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # SSL configuration using Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # HSTS (optional but recommended)
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
SSLEOF

    # Replace placeholder with actual domain
    sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/conf.d/formatic.conf
    
    echo "=== Setting up automatic SSL renewal ==="
    # Test renewal
    sudo certbot renew --dry-run
    
    # Set up cron job for automatic renewal
    (sudo crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | sudo crontab -
    
else
    echo "❌ Let's Encrypt certificates not found"
    echo "Creating self-signed certificate as fallback..."
    
    # Create SSL directory if it doesn't exist
    sudo mkdir -p /etc/ssl/certs /etc/ssl/private
    
    # Generate self-signed certificate as fallback
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/$DOMAIN.key \
        -out /etc/ssl/certs/$DOMAIN.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$DOMAIN"
    
    # Create self-signed SSL nginx config
    sudo tee /etc/nginx/conf.d/formatic.conf << 'SELFEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # SSL configuration with self-signed certificates
    ssl_certificate /etc/ssl/certs/DOMAIN_PLACEHOLDER.crt;
    ssl_certificate_key /etc/ssl/private/DOMAIN_PLACEHOLDER.key;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
SELFEOF

    # Replace placeholder with actual domain
    sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/conf.d/formatic.conf
fi

echo "=== Testing and Starting Nginx ==="
if sudo nginx -t; then
    echo "✅ Nginx config valid - restarting nginx"
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    sleep 5
    
    # Verify nginx is running with new config
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ Nginx restarted successfully with SSL"
    else
        echo "❌ Nginx failed to restart with SSL config"
        sudo systemctl status nginx
        exit 1
    fi
else
    echo "❌ Nginx config invalid"
    sudo nginx -T 2>&1 | head -20
    exit 1
fi

echo "=== Final health checks ==="
sleep 5

echo "Testing HTTP redirect..."
curl -s --head http://$DOMAIN | head -5

echo "Testing HTTPS access..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "Using Let's Encrypt certificate"
    curl -s --head https://$DOMAIN | head -5
else
    echo "Using self-signed certificate (will show browser warning)"
    curl -s -k --head https://$DOMAIN | head -5
fi

echo "=== SSL Setup Complete! ==="
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Let's Encrypt SSL certificate configured successfully!"
    echo "🌐 Your site is now available at: https://$DOMAIN"
    echo "🔄 Automatic renewal is configured"
    
    echo ""
    echo "📜 Certificate details:"
    sudo certbot certificates
else
    echo "⚠️  Self-signed SSL certificate configured"
    echo "🌐 Your site is available at: https://$DOMAIN (browser will show warning)"
fi

echo ""
echo "🎉 Your webapp is now running with SSL!"
echo "📋 LOGIN CREDENTIALS:"
echo "========================="
echo "Email: admin@formatic.com"
echo "Password: NewAdmin2024!"
echo "-------------------------"
echo "Email: john@doe.com"
echo "Password: JohnDoe2024!"
echo "=========================" 
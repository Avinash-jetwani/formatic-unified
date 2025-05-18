#!/bin/bash

# Stop services
echo "📋 Stopping services..."
pm2 stop datizmo-frontend datizmo-backend

# Fix frontend environment
echo "📋 Setting up correct frontend environment variables..."
cat > /var/www/datizmo/frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=a-secure-random-string-for-auth
EOL

# Fix backend environment if needed
echo "📋 Setting up backend environment variables..."
cat > /var/www/datizmo/backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=production

# Database - Make sure these match your actual DB credentials
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/formatic

# JWT Secret (keep this secure and don't change after set)
JWT_SECRET=your-secure-jwt-secret-replace-this

# Frontend URL
FRONTEND_URL=https://www.datizmo.com

# CORS configuration
CORS_ORIGIN=https://www.datizmo.com

# Email settings
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com
EOL

# Fix the Nginx configuration
echo "📋 Updating Nginx configuration to properly handle auth routes..."
cat > /etc/nginx/sites-available/datizmo << EOL
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

    # SSL configuration
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

# Create symbolic link if not exists
if [ ! -f /etc/nginx/sites-enabled/datizmo ]; then
    ln -s /etc/nginx/sites-available/datizmo /etc/nginx/sites-enabled/
fi

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "📋 Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "📋 Restarting Nginx..."
systemctl restart nginx

# Rebuild the Next.js app
echo "📋 Rebuilding Next.js app..."
cd /var/www/datizmo/frontend
npm run build

# Restart services
echo "📋 Restarting services..."
pm2 restart datizmo-backend
pm2 restart datizmo-frontend

echo "✅ Deployment completed!"

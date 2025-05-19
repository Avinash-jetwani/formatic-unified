#!/bin/bash

echo "🚀 Starting complete authentication fix script..."

# Change to the datizmo application directory
cd /var/www/datizmo

# 1. Stop all services
echo "📋 Stopping all services..."
pm2 stop datizmo-frontend datizmo-backend

# 2. Fix frontend Next.js auth configuration
echo "📋 Setting up correct frontend environment variables..."
cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOL

# 3. Create middleware.ts to properly handle auth routes
echo "📋 Creating middleware.ts to properly handle auth routes..."
cat > frontend/src/middleware.ts << EOL
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked \`async\` if using \`await\` inside
export function middleware(request: NextRequest) {
  // We specifically want to AVOID intercepting these auth API routes
  // to ensure they use Next.js's built-in API routes
  if (
    request.nextUrl.pathname.startsWith('/api/auth/session') ||
    request.nextUrl.pathname.startsWith('/api/auth/login') ||
    request.nextUrl.pathname.startsWith('/api/auth/logout') ||
    request.nextUrl.pathname.startsWith('/api/auth/me') ||
    request.nextUrl.pathname.startsWith('/api/auth/_log') ||
    request.nextUrl.pathname.startsWith('/api/auth/profile')
  ) {
    return NextResponse.next()
  }

  // Continue with normal middleware handling for other routes
  return NextResponse.next()
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
EOL

# 4. Create auth debugging route
echo "📋 Creating auth debugging route..."
mkdir -p frontend/src/app/api/auth/debug
cat > frontend/src/app/api/auth/debug/route.ts << EOL
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Get all cookies
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  // Get all environment variables related to auth
  const authEnv = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[REDACTED]' : undefined,
  };
  
  return NextResponse.json({
    cookies: {
      auth_token: authToken ? '[PRESENT]' : undefined,
    },
    env: authEnv,
    headers: {
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
    },
  });
}
EOL

# 5. Fix backend environment if needed
echo "📋 Setting up backend environment variables..."
# Check if the actual database credentials already exist
if [ -f backend/.env ]; then
  # Extract the current DATABASE_URL
  DB_URL=$(grep DATABASE_URL backend/.env | cut -d= -f2-)
  # Extract the current JWT_SECRET
  JWT_SECRET=$(grep JWT_SECRET backend/.env | cut -d= -f2-)
else
  # Default values if env file doesn't exist
  DB_URL="postgresql://your_db_user:your_db_password@localhost:5432/formatic"
  JWT_SECRET="your-secure-jwt-secret-replace-this"
fi

cat > backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=${DB_URL}

# JWT Secret
JWT_SECRET=${JWT_SECRET}

# Frontend URL
FRONTEND_URL=https://www.datizmo.com

# CORS configuration
CORS_ORIGIN=https://www.datizmo.com

# Email settings (update with actual values if needed)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com
EOL

# 6. Fix the Nginx configuration
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
    
    # CRITICAL: Explicitly handle Next Auth API routes - must go to frontend
    location ~ ^/api/auth/(session|login|logout|me|_log|profile|debug|callback|csrf|verify-request|providers) {
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
    
    # Backend API routes - for everything else
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

# 7. Ensure symbolic link for Nginx config
if [ ! -f /etc/nginx/sites-enabled/datizmo ]; then
    echo "📋 Creating Nginx symbolic link..."
    ln -s /etc/nginx/sites-available/datizmo /etc/nginx/sites-enabled/
fi

# 8. Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "📋 Removing default Nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# 9. Test Nginx configuration
echo "📋 Testing Nginx configuration..."
nginx -t

# 10. Rebuild the application
echo "📋 Rebuilding Next.js app..."
cd frontend
npm run build

# 11. Apply database migrations (if needed)
echo "📋 Applying database migrations..."
cd ../backend
npx prisma generate
npx prisma migrate deploy

# 12. Restart everything
echo "📋 Restarting all services..."
systemctl restart nginx
pm2 restart datizmo-backend
pm2 restart datizmo-frontend

echo "✅ Comprehensive auth fix completed!"
echo "📋 You can test auth by visiting:"
echo "   https://www.datizmo.com/api/auth/debug"
echo "   https://www.datizmo.com/login"

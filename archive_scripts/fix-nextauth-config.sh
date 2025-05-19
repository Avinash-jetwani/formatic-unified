#!/bin/bash

echo "🔧 Creating updated Next Auth configuration fix script..."

# Create the file with updated Next Auth configuration
cat << 'EOF' > nextauth-fix.sh
#!/bin/bash

# Go to application directory
cd /var/www/datizmo

# Stop services
echo "📋 Stopping Next.js frontend service..."
pm2 stop datizmo-frontend

# Create a temporary middleware.ts file that ensures auth routes work properly
echo "📋 Creating middleware.ts to properly handle auth routes..."

mkdir -p frontend/src/middleware
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
  // Match all request paths except for the ones starting with:
  // - api/webhooks (API routes that need direct backend forwarding)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
EOL

# Ensure .env.local has the correct Next Auth settings
echo "📋 Updating Next.js environment configuration..."
cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOL

# Create a Next Auth debugging route
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

# Rebuild Next.js application
echo "📋 Rebuilding Next.js application..."
cd frontend
npm run build

# Start the service
echo "📋 Starting frontend service..."
pm2 restart datizmo-frontend

echo "✅ Next Auth configuration fixed!"
EOF

chmod +x nextauth-fix.sh

echo "📋 Created Next Auth fix script"
echo "🚀 To fix the Next Auth configuration on the server:"
echo "1. Upload this file to your EC2 server:"
echo "   scp -i datizmo_deploy_key nextauth-fix.sh ubuntu@3.87.190.229:/home/ubuntu/"
echo ""
echo "2. SSH to your server:"
echo "   ssh -i datizmo_deploy_key ubuntu@3.87.190.229"
echo ""
echo "3. Run these commands:"
echo "   chmod +x nextauth-fix.sh"
echo "   sudo ./nextauth-fix.sh"
echo ""
echo "This will create a middleware.ts file, update the .env.local configuration,"
echo "and add a debug route to help verify the auth setup is working." 
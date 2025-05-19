#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Next.js Config Fix Script${NC}"

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Update next.config.js to handle dynamic routes properly
echo -e "${BLUE}📝 Updating Next.js configuration...${NC}"

cat > frontend/next.config.js << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['formatic-uploads-dev.s3.amazonaws.com', 'formatic-uploads-dev.s3.eu-west-2.amazonaws.com'],
  },
  // Disable static generation for API routes that use headers/cookies
  experimental: {
    isrFlushToDisk: true,
  },
  // Mark specific pages as dynamic routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'x-dynamic-route',
            value: 'true',
          },
        ],
      },
    ]
  },
  // Add redirect fallback for reset-password page
  async redirects() {
    return []
  },
  // Configure dynamic routes that shouldn't be prerendered
  async rewrites() {
    return {
      beforeFiles: [
        // API routes should be dynamic and not prerendered
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
    }
  },
  // Set up route configuration
  experimental: {
    // Mark reset-password page and API routes as dynamic
    outputFileTracingIncludes: {
      '/reset-password': true,
      '/api': true,
    },
  },
}

module.exports = nextConfig
EOL

echo -e "${GREEN}✅ Next.js config updated${NC}"

# Create a new .env.local file with correct settings
echo -e "${BLUE}📝 Updating environment settings...${NC}"

cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=production-deployment-secret

# Disable static generation for APIs
NEXT_STATIC_GEN_TOKEN=production-secret-token
NEXT_PUBLIC_VERCEL_ENV=production

# AWS S3 configuration
NEXT_PUBLIC_S3_PUBLIC_URL=https://formatic-uploads-dev.s3.amazonaws.com
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_S3_BUCKET_NAME=formatic-uploads-dev
EOL

# Also update production env file
cp frontend/.env.local frontend/.env.production

echo -e "${GREEN}✅ Environment files updated${NC}"

# Update package.json to include a production start that bypasses static generation issues
echo -e "${BLUE}📝 Updating package.json start script...${NC}"

# Update start script in package.json to use dynamic server rendering
cd frontend
if grep -q "\"start-dynamic\":" package.json; then
  echo -e "${YELLOW}Dynamic start script already exists in package.json${NC}"
else
  # Create a backup
  cp package.json package.json.bak
  
  # Use sed to add a new script
  sed -i 's/"start": "next start"/"start": "next start",\n    "start-dynamic": "next start -H 0.0.0.0"/g' package.json
  echo -e "${GREEN}✅ Added dynamic start script to package.json${NC}"
fi
cd "$PROJECT_ROOT"

# Create a Next.js reset-password page wrapper with Suspense
echo -e "${BLUE}📝 Fixing reset-password page with Suspense boundary...${NC}"

mkdir -p frontend/src/app/reset-password-fixed
cat > frontend/src/app/reset-password-fixed/page.jsx << EOL
'use client';

import { Suspense } from 'react';
import ResetPasswordPage from '../reset-password/page';

export default function ResetPasswordWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
EOL

echo -e "${GREEN}✅ Fixed reset-password page created${NC}"

# Create a middleware to handle dynamic routes
echo -e "${BLUE}📝 Creating middleware for dynamic routes...${NC}"

cat > frontend/src/middleware.js << EOL
import { NextResponse } from 'next/server';

export function middleware(request) {
  // For reset-password page, redirect to the fixed version
  if (request.nextUrl.pathname === '/reset-password') {
    return NextResponse.rewrite(new URL('/reset-password-fixed', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/reset-password',
    '/api/:path*',
  ],
};
EOL

echo -e "${GREEN}✅ Middleware created${NC}"

echo -e "${GREEN}🎉 Next.js configuration fixes complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Build the frontend: cd frontend && npm run build-low-memory${NC}"
echo -e "${BLUE}2. Update PM2 to use dynamic start: pm2 restart datizmo-frontend --update-env -- start-dynamic${NC}"
echo -e "${BLUE}3. Save the PM2 config: pm2 save${NC}" 
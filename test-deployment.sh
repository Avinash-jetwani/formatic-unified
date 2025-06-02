#!/bin/bash

# Test Deployment Script
# This simulates the GitHub Actions workflow locally

set -e

echo "=== Testing Formatic Deployment Process ==="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the root of the formatic-unified project"
    exit 1
fi

echo "=== Step 1: Installing root dependencies ==="
npm install

echo "=== Step 2: Testing Prisma generation ==="
npm run prisma:generate

echo "=== Step 3: Building backend ==="
cd backend
npm ci
npx prisma generate
npm run build
echo "Backend build successful!"

echo "=== Step 4: Building frontend ==="
cd ../frontend
npm ci
npx prisma generate
npm run build
echo "Frontend build successful!"

echo "=== Step 5: Testing production setup ==="
cd ..
npm run setup:prod
echo "Production setup successful!"

echo "=== Step 6: Checking build artifacts ==="
if [ -d "backend/dist" ]; then
    echo "✅ Backend dist directory exists"
else
    echo "❌ Backend dist directory missing"
    exit 1
fi

if [ -d "frontend/.next" ]; then
    echo "✅ Frontend .next directory exists"
else
    echo "❌ Frontend .next directory missing"
    exit 1
fi

echo "=== Step 7: Testing PM2 ecosystem ==="
if [ -f "ecosystem.config.js" ]; then
    echo "✅ PM2 ecosystem file exists"
    echo "PM2 configuration:"
    cat ecosystem.config.js
else
    echo "❌ PM2 ecosystem file missing"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Your deployment should work correctly."
echo ""
echo "Next steps to deploy to EC2:"
echo "1. Ensure your EC2 server is set up (run deploy-setup.sh on the server)"
echo "2. Commit and push your changes to GitHub"
echo "3. Monitor the GitHub Actions workflow"
echo "4. Your application will be deployed automatically"
echo ""
echo "Deployment workflow will:"
echo "- Build your application"
echo "- Copy files to EC2"
echo "- Start services with PM2"
echo "- Run health checks" 
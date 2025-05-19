#!/bin/bash

echo "🚀 Started force restart process..."
echo "🧹 Killing all Node.js processes..."
pkill -9 node 2>/dev/null || true

echo "🧹 Cleaning all caches..."
# Clear frontend cache
if [ -d "frontend/.next" ]; then
  rm -rf frontend/.next
  echo "✅ Cleared frontend build cache"
fi

# Clear backend cache and dist
if [ -d "backend/dist" ]; then
  rm -rf backend/dist
  echo "✅ Cleared backend build cache"
fi

if [ -d "backend/node_modules/.cache" ]; then
  rm -rf backend/node_modules/.cache
  echo "✅ Cleared backend module cache"
fi

# Clear environment variables cache
rm -f frontend/.env.local 2>/dev/null || true

# Apply any database migrations
echo "🔄 Applying database migrations..."
cd backend
npx prisma generate
npx prisma migrate dev
cd ..
echo "✅ Database migrations applied"

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
cd ..

# Start services
echo "🚀 Starting services..."
npm run start:both 
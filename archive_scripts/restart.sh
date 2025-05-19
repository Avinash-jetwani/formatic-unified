#!/bin/bash

echo "🚀 Cleaning caches..."
# Clear frontend cache
if [ -d "frontend/.next/cache" ]; then
  rm -rf frontend/.next/cache
  echo "✅ Cleared frontend cache"
fi

# Clear backend cache
if [ -d "backend/node_modules/.cache" ]; then
  rm -rf backend/node_modules/.cache
  echo "✅ Cleared backend cache"
fi

# Kill existing processes
echo "🛑 Stopping existing services..."
kill -9 $(lsof -t -i:3000) $(lsof -t -i:4000) 2>/dev/null || true
echo "✅ Services stopped"

# Apply any database migrations
echo "🔄 Applying database migrations..."
cd backend
npx prisma migrate dev
echo "✅ Database migrations applied"

# Restart services
echo "🚀 Starting services..."
cd ..
npm run start:both 
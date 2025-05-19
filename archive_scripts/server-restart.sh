#!/bin/bash

echo "🚀 Restarting Datizmo application on server..."

# Go to application directory
cd /var/www/datizmo

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Clean caches
echo "🧹 Cleaning caches..."
if [ -d "frontend/.next/cache" ]; then
  rm -rf frontend/.next/cache
  echo "✅ Cleared frontend cache"
fi

# Apply database migrations
echo "🔄 Applying database migrations..."
cd backend
npx prisma generate
npx prisma migrate deploy
echo "✅ Database migrations applied"

# Restart services with PM2
echo "🔄 Restarting services..."
pm2 restart datizmo-backend
pm2 restart datizmo-frontend

# Restart Nginx just in case
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Datizmo application restarted successfully!" 
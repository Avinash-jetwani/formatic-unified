#!/bin/bash

# Debug Backend Script
# Run this on your EC2 server to diagnose the 502 Bad Gateway issue

echo "=== Backend Debugging ==="

# Source NVM
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "=== 1. Checking PM2 status ==="
pm2 status

echo "=== 2. Checking PM2 logs ==="
pm2 logs --lines 50

echo "=== 3. Checking if backend is responding on localhost ==="
curl -i http://localhost:3001/api/auth/session || echo "Backend not responding on localhost:3001"

echo "=== 4. Checking if frontend is responding on localhost ==="
curl -i http://localhost:3000 || echo "Frontend not responding on localhost:3000"

echo "=== 5. Checking ports in use ==="
sudo netstat -tlnp | grep -E ':3000|:3001'

echo "=== 6. Checking Nginx configuration ==="
sudo nginx -t

echo "=== 7. Checking Nginx status ==="
sudo systemctl status nginx

echo "=== 8. Checking Nginx error logs ==="
sudo tail -n 20 /var/log/nginx/error.log

echo "=== 9. Testing backend directly ==="
if curl -s http://localhost:3001/api/auth/session > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding - restarting services..."
    pm2 restart all
    sleep 5
    curl -s http://localhost:3001/api/auth/session && echo "✅ Backend now responding" || echo "❌ Backend still not responding"
fi

echo "=== Debug completed ===" 
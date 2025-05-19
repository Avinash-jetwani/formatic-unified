#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Frontend Build Fix Script${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Create or increase swap space to help with memory-intensive builds
echo -e "${BLUE}🔄 Setting up swap space for memory-intensive builds...${NC}"

# Check current swap
CURRENT_SWAP=$(free -m | awk '/^Swap:/ {print $2}')
echo -e "${YELLOW}Current swap: ${CURRENT_SWAP}MB${NC}"

# If swap is less than 2GB, create or increase it
if [ "$CURRENT_SWAP" -lt 2048 ]; then
  echo -e "${BLUE}Creating 2GB swap file...${NC}"
  
  # Remove existing swap if it exists
  if [ "$CURRENT_SWAP" -gt 0 ]; then
    swapoff /swapfile
    rm -f /swapfile
    echo -e "${YELLOW}Removed existing swap file${NC}"
  fi
  
  # Create a new 2GB swap file
  dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  
  # Make swap permanent
  if ! grep -q "/swapfile" /etc/fstab; then
    echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
  fi
  
  echo -e "${GREEN}✅ 2GB swap space created and enabled${NC}"
else
  echo -e "${GREEN}✅ Swap space is already sufficient${NC}"
fi

# Optimize Node.js memory limit for builds
echo -e "${BLUE}🔧 Optimizing Node.js memory settings...${NC}"

# Create a reduced memory build script for frontend
echo -e "${BLUE}📝 Creating optimized build script for frontend...${NC}"

cat > frontend/build-with-memory-limit.js << EOL
const { execSync } = require('child_process');

console.log('Starting optimized Next.js build with memory limits...');

// Run build with reduced memory limit
try {
  execSync('NODE_OPTIONS="--max-old-space-size=512" next build', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
EOL

# Create a custom build command in package.json
cd frontend
if grep -q "\"build-low-memory\":" package.json; then
  echo -e "${YELLOW}Low memory build script already exists in package.json${NC}"
else
  # Use sed to add the new script before the closing bracket of "scripts"
  sed -i 's/"scripts": {/"scripts": {\n    "build-low-memory": "node build-with-memory-limit.js",/g' package.json
  echo -e "${GREEN}✅ Added low-memory build script to package.json${NC}"
fi
cd "$PROJECT_ROOT"

# Update the PM2 startup script to use the low memory build
echo -e "${BLUE}🔄 Updating PM2 configuration...${NC}"
pm2 delete datizmo-frontend 2>/dev/null || true
cd frontend
pm2 start npm --name datizmo-frontend -- run start
cd "$PROJECT_ROOT"
pm2 save

echo -e "${GREEN}🎉 Build fix setup complete!${NC}"
echo -e "${YELLOW}To build the frontend with limited memory:${NC}"
echo -e "${BLUE}cd frontend && npm run build-low-memory${NC}"
echo -e "${YELLOW}Then restart the service:${NC}"
echo -e "${BLUE}pm2 restart datizmo-frontend${NC}" 
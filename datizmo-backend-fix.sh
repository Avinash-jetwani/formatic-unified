#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Backend Working Directory Fix Script${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Fix 1: Create an explicit backend startup script with absolute paths
echo -e "${BLUE}📝 Creating backend startup script...${NC}"

cat > ${PROJECT_ROOT}/backend/start.js << EOL
#!/usr/bin/env node

// Force working directory to be the backend directory
process.chdir('${PROJECT_ROOT}/backend');

// Set absolute path for .env file
process.env.DOTENV_CONFIG_PATH = '${PROJECT_ROOT}/backend/.env';

// Ensure necessary directories exist
const fs = require('fs');
const path = require('path');

// Import and run the main application
require('./dist/src/main');
EOL

# Make the script executable
chmod +x ${PROJECT_ROOT}/backend/start.js
echo -e "${GREEN}✅ Backend startup script created${NC}"

# Fix 2: Make sure the .env file is properly set up with absolute paths
echo -e "${BLUE}📝 Updating environment file with absolute paths...${NC}"

# Create a backup of the original .env file
cp ${PROJECT_ROOT}/backend/.env ${PROJECT_ROOT}/backend/.env.bak

# Update the .env file with DATABASE_URL if needed
if grep -q "DATABASE_URL" ${PROJECT_ROOT}/backend/.env; then
  DB_URL=$(grep "DATABASE_URL" ${PROJECT_ROOT}/backend/.env | cut -d '=' -f2-)
  echo -e "${YELLOW}⚠️ Found existing DATABASE_URL: ${DB_URL}${NC}"
else
  echo -e "${YELLOW}⚠️ DATABASE_URL not found, setting default value${NC}"
  echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/formatic" >> ${PROJECT_ROOT}/backend/.env
fi

# Add PRISMA_SCHEMA_ENGINE_BINARY and PRISMA_QUERY_ENGINE_BINARY
if ! grep -q "PRISMA_SCHEMA_ENGINE_BINARY" ${PROJECT_ROOT}/backend/.env; then
  echo "PRISMA_SCHEMA_ENGINE_BINARY=${PROJECT_ROOT}/backend/node_modules/.prisma/client/schema-engine" >> ${PROJECT_ROOT}/backend/.env
  echo -e "${GREEN}✅ Added PRISMA_SCHEMA_ENGINE_BINARY to .env${NC}"
fi

if ! grep -q "PRISMA_QUERY_ENGINE_BINARY" ${PROJECT_ROOT}/backend/.env; then
  echo "PRISMA_QUERY_ENGINE_BINARY=${PROJECT_ROOT}/backend/node_modules/.prisma/client/query-engine" >> ${PROJECT_ROOT}/backend/.env
  echo -e "${GREEN}✅ Added PRISMA_QUERY_ENGINE_BINARY to .env${NC}"
fi

# Fix 3: Update PM2 configuration for the backend service
echo -e "${BLUE}🔄 Updating PM2 configuration...${NC}"

# Stop and remove existing backend service
pm2 stop datizmo-backend 2>/dev/null || true
pm2 delete datizmo-backend 2>/dev/null || true

# Start the backend with the new script and explicit cwd
cd ${PROJECT_ROOT}
pm2 start ${PROJECT_ROOT}/backend/start.js \
  --name datizmo-backend \
  --cwd ${PROJECT_ROOT}/backend \
  --node-args="--require=dotenv/config" \
  --env_file=${PROJECT_ROOT}/backend/.env

echo -e "${GREEN}✅ Backend service restarted with correct working directory${NC}"

# Save PM2 configuration
pm2 save

echo -e "${GREEN}🎉 Backend working directory fix complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Check backend logs: pm2 logs datizmo-backend${NC}"
echo -e "${BLUE}2. Test backend API: curl -I http://localhost:4000/api${NC}" 
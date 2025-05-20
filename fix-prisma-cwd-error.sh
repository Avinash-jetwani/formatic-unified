#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Prisma uv_cwd Error${NC}"

# Get the absolute path of the project
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Create a special loader script for Node.js that sets correct working directory
echo -e "${BLUE}📝 Creating Node.js loader script...${NC}"

cat > ${PROJECT_ROOT}/backend/node-cwd-fix.js << EOL
#!/usr/bin/env node

/**
 * This is a wrapper script that fixes the Prisma "ENOENT: no such file or directory, uv_cwd" error
 * by ensuring the working directory is set correctly before loading the application.
 */

// Set the current working directory explicitly before loading the app
const path = require('path');
process.chdir('${PROJECT_ROOT}/backend');

// Load the actual application
require('./dist/src/main.js');
EOL

chmod +x ${PROJECT_ROOT}/backend/node-cwd-fix.js
echo -e "${GREEN}✅ Node.js loader script created${NC}"

# Create an improved start script that uses the loader
echo -e "${BLUE}📝 Creating improved start script...${NC}"
cat > ${PROJECT_ROOT}/backend/start-with-cwd-fix.sh << EOL
#!/bin/bash

# Set working directory
cd ${PROJECT_ROOT}/backend

# Load environment variables
set -a
source ${PROJECT_ROOT}/backend/.env 2>/dev/null || echo "No .env file found, using system environment variables"
set +a

# Set Prisma environment variables
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma
export NODE_OPTIONS="--max_old_space_size=512"

# Regenerate Prisma client if needed
if [ ! -d "${PROJECT_ROOT}/backend/node_modules/.prisma" ]; then
  echo "Regenerating Prisma client..."
  npx prisma generate
fi

# Start the application with the fixed loader
echo "Starting backend application with CWD fix..."
node ${PROJECT_ROOT}/backend/node-cwd-fix.js
EOL

chmod +x ${PROJECT_ROOT}/backend/start-with-cwd-fix.sh
echo -e "${GREEN}✅ Fixed start script created${NC}"

# Update PM2 configuration if needed
if command -v pm2 &> /dev/null; then
    echo -e "${BLUE}🚀 Updating PM2 configuration...${NC}"
    
    # Stop existing backend if running
    pm2 stop datizmo-backend 2>/dev/null || true
    
    # Start with the new script
    cd ${PROJECT_ROOT}
    pm2 start ${PROJECT_ROOT}/backend/start-with-cwd-fix.sh --name datizmo-backend
    
    # Save PM2 configuration
    pm2 save
    
    echo -e "${GREEN}✅ PM2 configuration updated${NC}"
fi

echo -e "${GREEN}🎉 Prisma uv_cwd error fix applied!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Run backend with: ${PROJECT_ROOT}/backend/start-with-cwd-fix.sh${NC}"
echo -e "${BLUE}2. If using PM2, check status with: pm2 list${NC}"
echo -e "${BLUE}3. Check logs for remaining issues: pm2 logs datizmo-backend${NC}" 
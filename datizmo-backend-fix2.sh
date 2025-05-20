#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Backend Fix Script (Attempt 2)${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Create a shell wrapper script instead of a JS wrapper
echo -e "${BLUE}📝 Creating shell wrapper script...${NC}"

# Make a shell script to start the backend with the correct working directory
cat > ${PROJECT_ROOT}/backend/start.sh << EOL
#!/bin/bash

# Change to the backend directory
cd ${PROJECT_ROOT}/backend

# Set up environment variables
export NODE_ENV=production
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma
export PRISMA_SCHEMA_ENGINE_BINARY=${PROJECT_ROOT}/backend/node_modules/.prisma/client/schema-engine
export PRISMA_QUERY_ENGINE_BINARY=${PROJECT_ROOT}/backend/node_modules/.prisma/client/query-engine

# Run the backend
node dist/src/main.js
EOL

# Make the script executable
chmod +x ${PROJECT_ROOT}/backend/start.sh
echo -e "${GREEN}✅ Shell wrapper script created${NC}"

# Update the PM2 configuration
echo -e "${BLUE}🔄 Updating PM2 configuration...${NC}"

# Stop and delete existing backend service
pm2 stop datizmo-backend 2>/dev/null || true
pm2 delete datizmo-backend 2>/dev/null || true

# Make a fresh build of the backend to ensure everything is up to date
echo -e "${BLUE}🔨 Rebuilding backend...${NC}"
cd ${PROJECT_ROOT}/backend
npm run build
cd ${PROJECT_ROOT}
echo -e "${GREEN}✅ Backend rebuilt${NC}"

# Start the backend with the new shell script
pm2 start ${PROJECT_ROOT}/backend/start.sh \
  --name datizmo-backend \
  --interpreter bash

# Save PM2 configuration
pm2 save

echo -e "${GREEN}🎉 Backend fix complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Check backend logs: pm2 logs datizmo-backend${NC}"
echo -e "${BLUE}2. Test backend API: curl http://localhost:4000/api${NC}" 
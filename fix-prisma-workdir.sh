#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Prisma Working Directory Issue${NC}"

# Get the absolute path of the project
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Create or update the backend .env file
echo -e "${BLUE}📝 Creating/updating backend .env file...${NC}"
mkdir -p ${PROJECT_ROOT}/backend

# Create a fresh .env file with absolute paths
cat > ${PROJECT_ROOT}/backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=production

# Database connection - with absolute path to the run directory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/formatic?schema=public

# JWT configuration
JWT_SECRET=production-deployment-jwt-secret

# Frontend URL (for CORS)
FRONTEND_URL=https://www.datizmo.com

# Email settings
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com

# AWS S3 configuration
AWS_REGION=eu-west-2
S3_BUCKET_NAME=formatic-uploads-dev
S3_PUBLIC_URL=https://formatic-uploads-dev.s3.amazonaws.com

# Prisma configuration - absolute paths
PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma

# Fix for Prisma working directory issue
PRISMA_BINARY_TARGETS=native
EOL

echo -e "${GREEN}✅ Backend environment updated${NC}"

# Create a special wrapper script for prisma commands
echo -e "${BLUE}📝 Creating Prisma wrapper script...${NC}"

cat > ${PROJECT_ROOT}/backend/prisma-wrapper.sh << EOL
#!/bin/bash

# Set working directory explicitly
cd ${PROJECT_ROOT}/backend

# Load environment variables
set -a
source ${PROJECT_ROOT}/backend/.env
set +a

# Ensure Prisma can find its schema
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma

# Run the Prisma command
npx prisma \$@
EOL

chmod +x ${PROJECT_ROOT}/backend/prisma-wrapper.sh
echo -e "${GREEN}✅ Prisma wrapper created${NC}"

# Create backend start script with fixed working directory
echo -e "${BLUE}📝 Creating improved backend start script...${NC}"
cat > ${PROJECT_ROOT}/backend/start-backend-fixed.sh << EOL
#!/bin/bash

# Set working directory
cd ${PROJECT_ROOT}/backend

# Load environment variables
set -a
source ${PROJECT_ROOT}/backend/.env
set +a

# Ensure Prisma can find its schema
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma
export PRISMA_BINARY_TARGETS=native

# Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

# Start the backend application
echo "Starting backend application..."
node dist/src/main.js
EOL

chmod +x ${PROJECT_ROOT}/backend/start-backend-fixed.sh
echo -e "${GREEN}✅ Fixed backend start script created${NC}"

# Update PM2 configuration if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo -e "${BLUE}🚀 Updating PM2 configuration...${NC}"
    
    # Stop existing backend if running
    pm2 stop datizmo-backend 2>/dev/null || true
    
    # Start with the new script
    cd ${PROJECT_ROOT}
    pm2 start ${PROJECT_ROOT}/backend/start-backend-fixed.sh --name datizmo-backend
    
    # Save PM2 configuration
    pm2 save
    
    echo -e "${GREEN}✅ PM2 configuration updated${NC}"
fi

echo -e "${GREEN}🎉 Prisma working directory fix applied!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Run backend with: ${PROJECT_ROOT}/backend/start-backend-fixed.sh${NC}"
echo -e "${BLUE}2. Run Prisma commands with: ${PROJECT_ROOT}/backend/prisma-wrapper.sh [command]${NC}"
echo -e "${BLUE}   For example: ${PROJECT_ROOT}/backend/prisma-wrapper.sh studio${NC}"
echo -e "${BLUE}3. If using PM2, check status with: pm2 list${NC}" 
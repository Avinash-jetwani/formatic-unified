#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing PostgreSQL Authentication Issues${NC}"

# Get the absolute path of the project
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Step 1: Check PostgreSQL is running
echo -e "${BLUE}🔍 Checking PostgreSQL status...${NC}"
if command -v systemctl &> /dev/null; then
  systemctl status postgresql || systemctl status postgresql-13 || echo "PostgreSQL service not found"
fi

# Step 2: Update PostgreSQL password and create database if needed
echo -e "${BLUE}🔑 Setting up PostgreSQL credentials...${NC}"

# DB configuration
DB_NAME="formatic"
DB_USER="postgres"
DB_PASSWORD="postgres"
NEW_PASSWORD="datizmo2025" # More secure password

# Update PostgreSQL password
if command -v sudo &> /dev/null && command -v su &> /dev/null && command -v psql &> /dev/null; then
  echo -e "${BLUE}Attempting to update PostgreSQL password...${NC}"
  
  # Method 1: Using sudo with postgres user (Amazon Linux, Ubuntu)
  sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';" || \
  
  # Method 2: Using su - postgres (CentOS/RHEL)
  echo "ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';" | sudo su - postgres -c psql || \
  
  # Method 3: Direct psql connect if postgres user has no password yet
  PGPASSWORD="${DB_PASSWORD}" psql -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';" || \
  
  echo -e "${YELLOW}⚠️ Could not update PostgreSQL password automatically${NC}"
  echo -e "${YELLOW}⚠️ You may need to update password manually:${NC}"
  echo -e "${YELLOW}sudo -u postgres psql -c \"ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';\"${NC}"
  
  # Create database if it doesn't exist
  echo -e "${BLUE}Creating database if it doesn't exist...${NC}"
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" || \
  echo "CREATE DATABASE ${DB_NAME};" | sudo su - postgres -c psql || \
  PGPASSWORD="${NEW_PASSWORD}" psql -U postgres -h localhost -c "CREATE DATABASE ${DB_NAME};" || \
  echo -e "${YELLOW}⚠️ Database ${DB_NAME} may already exist or could not be created${NC}"
  
else
  echo -e "${YELLOW}⚠️ PostgreSQL CLI tools not found or insufficient permissions${NC}"
  echo -e "${YELLOW}⚠️ Please install PostgreSQL and set up manually${NC}"
fi

# Step 3: Update .env file with new credentials
echo -e "${BLUE}📝 Updating backend environment with new credentials...${NC}"

# Backup .env file if it exists
if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
  cp ${PROJECT_ROOT}/backend/.env ${PROJECT_ROOT}/backend/.env.bak.$(date +%s)
fi

# Get environment variables from existing .env file
if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
  # Extract existing configuration
  EXISTING_PORT=$(grep "PORT=" "${PROJECT_ROOT}/backend/.env" | cut -d '=' -f2)
  EXISTING_NODE_ENV=$(grep "NODE_ENV=" "${PROJECT_ROOT}/backend/.env" | cut -d '=' -f2)
  EXISTING_JWT_SECRET=$(grep "JWT_SECRET=" "${PROJECT_ROOT}/backend/.env" | cut -d '=' -f2)
  EXISTING_FRONTEND_URL=$(grep "FRONTEND_URL=" "${PROJECT_ROOT}/backend/.env" | cut -d '=' -f2)
  
  # Use existing values or defaults
  PORT=${EXISTING_PORT:-4000}
  NODE_ENV=${EXISTING_NODE_ENV:-production}
  JWT_SECRET=${EXISTING_JWT_SECRET:-production-deployment-jwt-secret-$(date +%s)}
  FRONTEND_URL=${EXISTING_FRONTEND_URL:-https://www.datizmo.com}
else
  # Default values
  PORT=4000
  NODE_ENV=production
  JWT_SECRET=production-deployment-jwt-secret-$(date +%s)
  FRONTEND_URL=https://www.datizmo.com
fi

# Create a fresh .env file with updated credentials
cat > ${PROJECT_ROOT}/backend/.env << EOL
# Server configuration
PORT=${PORT}
NODE_ENV=${NODE_ENV}

# Database connection with updated credentials
DATABASE_URL=postgresql://postgres:${NEW_PASSWORD}@localhost:5432/${DB_NAME}?schema=public

# JWT configuration
JWT_SECRET=${JWT_SECRET}

# Frontend URL (for CORS)
FRONTEND_URL=${FRONTEND_URL}

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

echo -e "${GREEN}✅ Backend environment updated with new PostgreSQL credentials${NC}"

# Step 4: Regenerate Prisma client
echo -e "${BLUE}🔄 Regenerating Prisma client...${NC}"

# Create a Prisma generator script
cat > ${PROJECT_ROOT}/backend/generate-prisma.sh << EOL
#!/bin/bash

# Set working directory
cd ${PROJECT_ROOT}/backend

# Load environment variables
set -a
source ${PROJECT_ROOT}/backend/.env
set +a

# Regenerate Prisma client
export PRISMA_SCHEMA_PATH=${PROJECT_ROOT}/backend/prisma/schema.prisma
export NODE_OPTIONS="--max_old_space_size=512"

echo "Generating Prisma client..."
npx prisma generate
EOL

chmod +x ${PROJECT_ROOT}/backend/generate-prisma.sh
echo -e "${GREEN}✅ Prisma generator script created${NC}"

# Run the Prisma generator if node_modules exists
if [ -d "${PROJECT_ROOT}/backend/node_modules" ]; then
  ${PROJECT_ROOT}/backend/generate-prisma.sh
  echo -e "${GREEN}✅ Prisma client regenerated${NC}"
else
  echo -e "${YELLOW}⚠️ node_modules not found, skipping Prisma client generation${NC}"
  echo -e "${YELLOW}⚠️ Run npm install in backend directory first, then run the generate-prisma.sh script${NC}"
fi

# Step 5: Restart services if running with PM2
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}🚀 Restarting services with PM2...${NC}"
  
  # Restart backend
  pm2 restart datizmo-backend || pm2 start ${PROJECT_ROOT}/backend/start-backend.sh --name datizmo-backend
  
  echo -e "${GREEN}✅ Services restarted with PM2${NC}"
fi

echo -e "${GREEN}🎉 PostgreSQL authentication fix applied!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Test PostgreSQL connection: psql -U postgres -h localhost -d ${DB_NAME} -W${NC}"
echo -e "${BLUE}   (Use the password: ${NEW_PASSWORD})${NC}"
echo -e "${BLUE}2. Check backend logs for remaining issues: pm2 logs datizmo-backend${NC}" 
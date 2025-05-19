#!/bin/bash

# Datizmo Local Development Script
# This script sets up and runs the Datizmo application locally
# while connecting to production resources (database, S3, etc.)

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Datizmo Local Development Setup${NC}"
echo -e "${YELLOW}This script will configure and start Datizmo locally while connecting to production resources${NC}"

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Kill any existing node processes on the relevant ports
echo -e "${BLUE}🛑 Stopping any existing services...${NC}"
kill -9 $(lsof -t -i:3000) $(lsof -t -i:4000) 2>/dev/null || true
echo -e "${GREEN}✅ Port cleanup complete${NC}"

# Clean caches to ensure a fresh start
echo -e "${BLUE}🧹 Cleaning caches...${NC}"
if [ -d "frontend/.next" ]; then
  rm -rf frontend/.next
  echo -e "${GREEN}✅ Cleared frontend build cache${NC}"
fi

if [ -d "backend/dist" ]; then
  rm -rf backend/dist
  echo -e "${GREEN}✅ Cleared backend build cache${NC}"
fi

if [ -d "backend/node_modules/.cache" ]; then
  rm -rf backend/node_modules/.cache
  echo -e "${GREEN}✅ Cleared backend module cache${NC}"
fi

# Setup environment variables for local development with production connections
echo -e "${BLUE}⚙️ Setting up environment variables...${NC}"

# Database configuration - use current user instead of 'postgres'
DB_NAME="formatic"
DB_USER=$(whoami)
DB_PASSWORD="" # No password for local macOS PostgreSQL
DB_HOST="localhost" 
DB_PORT="5432"
DB_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Check if PostgreSQL is running
echo -e "${BLUE}🔍 Checking PostgreSQL status...${NC}"
if ! pg_isready -h ${DB_HOST} -p ${DB_PORT} > /dev/null 2>&1; then
  echo -e "${RED}⛔ PostgreSQL is not running. Please start PostgreSQL and try again.${NC}"
  echo -e "${YELLOW}💡 Try running: brew services start postgresql@14${NC}"
  exit 1
fi

# Check if database exists, create if not
echo -e "${BLUE}🔍 Checking for database...${NC}"
if ! psql -h ${DB_HOST} -p ${DB_PORT} -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
  echo -e "${YELLOW}⚠️ Database '${DB_NAME}' does not exist. Creating it...${NC}"
  createdb ${DB_NAME}
  echo -e "${GREEN}✅ Database created${NC}"
fi

echo -e "${GREEN}✅ Using local database: ${DB_NAME} with user ${DB_USER}${NC}"

# Set S3 details - prompt for credentials if environment variables aren't set
AWS_REGION=${AWS_REGION:-"eu-west-2"}
AWS_ACCESS_KEY=${AWS_ACCESS_KEY_ID:-""}
AWS_SECRET_KEY=${AWS_SECRET_ACCESS_KEY:-""}
S3_BUCKET=${S3_BUCKET_NAME:-"formatic-uploads-dev"}
S3_PUBLIC_URL=${S3_PUBLIC_URL:-"https://formatic-uploads-dev.s3.amazonaws.com"}

# If credentials aren't set, ask for them
if [ -z "$AWS_ACCESS_KEY" ] || [ -z "$AWS_SECRET_KEY" ]; then
  echo -e "${YELLOW}⚠️ AWS credentials not found in environment. Please enter them now:${NC}"
  read -p "AWS Access Key ID: " AWS_ACCESS_KEY
  read -p "AWS Secret Access Key: " AWS_SECRET_KEY
  
  # Store them temporarily for this session
  export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
  export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY
fi

echo -e "${GREEN}✅ Using S3 bucket: ${S3_BUCKET} in ${AWS_REGION}${NC}"

# Set domain
DOMAIN="www.datizmo.com"

# Create frontend environment file
echo -e "${BLUE}📝 Creating frontend environment file...${NC}"
cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-development-secret
NEXT_PUBLIC_S3_PUBLIC_URL=${S3_PUBLIC_URL}
NEXT_PUBLIC_AWS_REGION=${AWS_REGION}
NEXT_PUBLIC_S3_BUCKET_NAME=${S3_BUCKET}
EOL
echo -e "${GREEN}✅ Frontend environment setup complete${NC}"

# Create backend environment file
echo -e "${BLUE}📝 Creating backend environment file...${NC}"
cat > backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=development

# Database connection
DATABASE_URL=${DB_URL}

# JWT configuration
JWT_SECRET=local-development-jwt-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email settings (if using email functionality)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com

# AWS S3 configuration
AWS_REGION=${AWS_REGION}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY}
S3_BUCKET_NAME=${S3_BUCKET}
S3_PUBLIC_URL=${S3_PUBLIC_URL}
EOL

echo -e "${GREEN}✅ Backend environment setup complete${NC}"

# Apply database migrations
echo -e "${BLUE}🔄 Applying database migrations...${NC}"
cd backend
npx prisma generate
npx prisma migrate dev --create-only || true
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Database schema generated${NC}"

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}⚠️ Node modules missing, installing dependencies...${NC}"
  
  cd frontend
  npm install
  cd "$PROJECT_ROOT"
  
  cd backend
  npm install
  cd "$PROJECT_ROOT"
  
  echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Start the application
echo -e "${BLUE}🚀 Starting Datizmo application...${NC}"
echo -e "${YELLOW}Frontend will be available at: ${GREEN}http://localhost:3000${NC}"
echo -e "${YELLOW}Backend API will be available at: ${GREEN}http://localhost:4000${NC}"
echo -e "${YELLOW}Using local database: ${GREEN}${DB_NAME} with user ${DB_USER}${NC}"
echo -e "${YELLOW}Using S3 bucket: ${GREEN}${S3_BUCKET}${NC}"

echo -e "${BLUE}Starting services...${NC}"
npm run start:both
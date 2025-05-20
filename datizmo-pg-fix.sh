#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 DATIZMO DATABASE AND PORT FIX SCRIPT${NC}"
echo -e "${BLUE}This script will fix database credentials and port conflicts${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Step 1: Fix port conflict for frontend
echo -e "${BLUE}🔍 Checking for processes using port 3000...${NC}"

# Find processes using port 3000
port_processes=$(lsof -i :3000 -t || netstat -tulpn 2>/dev/null | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1)

if [ -n "$port_processes" ]; then
  echo -e "${YELLOW}Found processes using port 3000. Will stop them now:${NC}"
  echo "$port_processes"
  
  # Kill processes using port 3000
  for pid in $port_processes; do
    echo "Stopping process $pid..."
    kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
  done
  
  echo -e "${GREEN}✅ Port 3000 is now free${NC}"
else
  echo -e "${GREEN}✅ Port 3000 is already free${NC}"
fi

# Step 2: Update PostgreSQL credentials in backend .env
echo -e "${BLUE}📝 Updating database credentials...${NC}"

# Backup the existing .env file
if [ -f /var/www/datizmo/formatic-unified/backend/.env ]; then
  cp /var/www/datizmo/formatic-unified/backend/.env /var/www/datizmo/formatic-unified/backend/.env.backup
  echo -e "${GREEN}✅ Backed up existing .env file${NC}"
fi

# Check current PostgreSQL credentials
echo -e "${YELLOW}Checking current PostgreSQL configuration...${NC}"
pg_user="postgres"  # Default user
pg_password="postgres"  # Default password
pg_host="localhost"  # Default host
pg_port="5432"  # Default port
pg_db="formatic"  # Default database name

# Try to get valid postgres credentials from postgres itself
if command -v psql &> /dev/null; then
  echo -e "${BLUE}PostgreSQL client found, checking connection...${NC}"
  
  # Test connection with default postgres user
  if psql -h localhost -U postgres -c '\conninfo' &> /dev/null; then
    echo -e "${GREEN}✅ Default PostgreSQL credentials work!${NC}"
  else
    echo -e "${YELLOW}Default credentials didn't work, asking for manual input...${NC}"
    read -p "Enter PostgreSQL username [postgres]: " input_user
    pg_user=${input_user:-$pg_user}
    read -s -p "Enter PostgreSQL password: " input_password
    echo
    pg_password=${input_password:-$pg_password}
    read -p "Enter PostgreSQL host [localhost]: " input_host
    pg_host=${input_host:-$pg_host}
    read -p "Enter PostgreSQL port [5432]: " input_port
    pg_port=${input_port:-$pg_port}
    read -p "Enter PostgreSQL database name [formatic]: " input_db
    pg_db=${input_db:-$pg_db}
  fi
else
  echo -e "${YELLOW}PostgreSQL client not found, using default values${NC}"
  echo -e "${YELLOW}You may need to modify these if defaults don't work${NC}"
  read -p "Enter PostgreSQL username [postgres]: " input_user
  pg_user=${input_user:-$pg_user}
  read -s -p "Enter PostgreSQL password: " input_password
  echo
  pg_password=${input_password:-$pg_password}
  read -p "Enter PostgreSQL database name [formatic]: " input_db
  pg_db=${input_db:-$pg_db}
fi

# Create or update .env file
cat > /var/www/datizmo/formatic-unified/backend/.env << EOL
# Database Configuration
DATABASE_URL=postgresql://${pg_user}:${pg_password}@${pg_host}:${pg_port}/${pg_db}

# JWT Configuration
JWT_SECRET=jwt-secret-key
JWT_EXPIRATION=1d

# AWS Configuration
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=formatic-uploads-dev

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASSWORD=email-password
EMAIL_FROM=noreply@example.com

# Frontend URL
FRONTEND_URL=https://www.datizmo.com
EOL

echo -e "${GREEN}✅ Database credentials updated in .env file${NC}"

# Step 3: Regenerate Prisma client
echo -e "${BLUE}🔄 Regenerating Prisma client...${NC}"
cd /var/www/datizmo/formatic-unified/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# Pull database schema if needed
echo -e "${YELLOW}Checking database connection...${NC}"
if npx prisma db pull &> /dev/null; then
  echo -e "${GREEN}✅ Database connection successful!${NC}"
else
  echo -e "${RED}⚠️ Database connection failed. Trying to create database...${NC}"
  
  # Try to create the database
  if command -v psql &> /dev/null; then
    PGPASSWORD="$pg_password" psql -h "$pg_host" -U "$pg_user" -c "CREATE DATABASE $pg_db;" || true
    echo -e "${YELLOW}Database may have been created or already exists${NC}"
    
    # Try to run migrations
    echo -e "${YELLOW}Attempting to run migrations...${NC}"
    npx prisma migrate deploy
  else
    echo -e "${RED}⚠️ Could not create database automatically. Please create it manually:${NC}"
    echo -e "${BLUE}psql -h $pg_host -U $pg_user -c \"CREATE DATABASE $pg_db;\"${NC}"
  fi
fi

# Step 4: Configure frontend to use free port
echo -e "${BLUE}📝 Updating frontend configuration...${NC}"

# Create or update frontend .env file
cat > /var/www/datizmo/formatic-unified/frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=next-auth-secret-$(date +%s)
NEXT_PUBLIC_S3_PUBLIC_URL=https://formatic-uploads-dev.s3.amazonaws.com
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_S3_BUCKET_NAME=formatic-uploads-dev
EOL

echo -e "${GREEN}✅ Frontend configuration updated${NC}"

# Step 5: Restart services
echo -e "${BLUE}🔄 Restarting services...${NC}"

# Stop services first
pm2 stop all

# Wait a moment to ensure all ports are free
sleep 3

# Restart services
pm2 restart datizmo-backend datizmo-frontend || pm2 start all
pm2 save

echo -e "${GREEN}✅ Services restarted${NC}"

# Final output
echo -e "${GREEN}🎉 DATIZMO DATABASE AND PORT FIX COMPLETE!${NC}"
echo -e "${BLUE}--------------------------------------------${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Check services status: ${GREEN}pm2 status${NC}"
echo -e "${BLUE}2. View logs: ${GREEN}pm2 logs${NC}"
echo -e "${BLUE}3. Test the application: ${GREEN}https://www.datizmo.com${NC}"
echo -e "${BLUE}4. If issues persist, check detailed logs: ${GREEN}pm2 logs --lines 100${NC}" 
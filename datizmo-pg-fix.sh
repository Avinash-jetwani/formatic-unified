#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 PostgreSQL Permission Fix Script${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# PostgreSQL configuration
DB_NAME="formatic"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo -e "${BLUE}🔍 Fixing PostgreSQL permissions...${NC}"

# Update PostgreSQL configuration to allow password authentication
echo -e "${BLUE}📝 Updating PostgreSQL authentication configuration...${NC}"
PG_HBA_CONF="/var/lib/pgsql/data/pg_hba.conf"

# Backup the original configuration
cp "$PG_HBA_CONF" "$PG_HBA_CONF.bak"
echo -e "${GREEN}✅ Configuration backup created${NC}"

# Replace 'ident' with 'md5' or 'password' authentication for local connections
sed -i 's/local   all             all                                     peer/local   all             all                                     md5/g' "$PG_HBA_CONF"
sed -i 's/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/g' "$PG_HBA_CONF"
sed -i 's/host    all             all             ::1\/128                 ident/host    all             all             ::1\/128                 md5/g' "$PG_HBA_CONF"

echo -e "${GREEN}✅ Authentication configuration updated${NC}"

# Restart PostgreSQL
echo -e "${BLUE}🔄 Restarting PostgreSQL...${NC}"
systemctl restart postgresql
echo -e "${GREEN}✅ PostgreSQL restarted${NC}"

# Set password for postgres user
echo -e "${BLUE}🔑 Setting password for postgres user...${NC}"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';"
echo -e "${GREEN}✅ Password set for postgres user${NC}"

# Ensure the database exists and postgres has access
echo -e "${BLUE}🔍 Ensuring database exists with correct permissions...${NC}"
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
  echo -e "${GREEN}✅ Database created${NC}"
fi

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO postgres;"
echo -e "${GREEN}✅ Permissions granted${NC}"

# Update environment files with the correct DATABASE_URL
echo -e "${BLUE}📝 Updating DATABASE_URL in environment files...${NC}"
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# Update backend .env file
if [ -f "backend/.env" ]; then
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DB_URL}|g" backend/.env
  echo -e "${GREEN}✅ Updated DATABASE_URL in backend/.env${NC}"
fi

echo -e "${BLUE}🔄 Creating swap file to prevent memory issues...${NC}"
# Check if swap already exists
if free | grep -q Swap && [ "$(free | grep Swap | awk '{print $2}')" -gt 0 ]; then
  echo -e "${YELLOW}⚠️ Swap file already exists. Skipping swap creation.${NC}"
else
  # Create a 2GB swap file
  dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
  echo -e "${GREEN}✅ 2GB swap file created and enabled${NC}"
fi

echo -e "${GREEN}🎉 PostgreSQL fixes complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Run database migrations: cd backend && npx prisma migrate deploy${NC}"
echo -e "${BLUE}2. Restart services: pm2 restart all${NC}"
echo -e "${BLUE}3. Verify with: curl -I https://www.datizmo.com/api/auth/me${NC}" 
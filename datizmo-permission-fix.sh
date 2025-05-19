#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Permission Fix Script${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⛔ This script needs to be run as root or with sudo${NC}"
  exit 1
fi

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
EC2_USER="ec2-user"
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Fix ownership of the project directory
echo -e "${BLUE}🔧 Changing ownership of project files to ${EC2_USER}...${NC}"
chown -R ${EC2_USER}:${EC2_USER} ${PROJECT_ROOT}
echo -e "${GREEN}✅ Directory ownership changed${NC}"

# Create the necessary directories with correct permissions
echo -e "${BLUE}🔧 Creating build directories with correct permissions...${NC}"

# Frontend build directories
mkdir -p ${PROJECT_ROOT}/frontend/.next
chown -R ${EC2_USER}:${EC2_USER} ${PROJECT_ROOT}/frontend/.next
chmod -R 755 ${PROJECT_ROOT}/frontend/.next

# Backend build directories
mkdir -p ${PROJECT_ROOT}/backend/dist
chown -R ${EC2_USER}:${EC2_USER} ${PROJECT_ROOT}/backend/dist
chmod -R 755 ${PROJECT_ROOT}/backend/dist

echo -e "${GREEN}✅ Build directories created with proper permissions${NC}"

# Add the ec2-user to a group that can run the necessary commands
echo -e "${BLUE}🔧 Setting up permissions for running services...${NC}"

# Create a script that can be run by ec2-user but with sudo privileges
cat > /usr/local/bin/restart-services << EOL
#!/bin/bash
pm2 restart all
pm2 save
EOL

chmod +x /usr/local/bin/restart-services
chown root:root /usr/local/bin/restart-services

# Allow ec2-user to run this script without password
if ! grep -q "ec2-user ALL=(ALL) NOPASSWD: /usr/local/bin/restart-services" /etc/sudoers; then
  echo "ec2-user ALL=(ALL) NOPASSWD: /usr/local/bin/restart-services" >> /etc/sudoers
  echo -e "${GREEN}✅ Added sudo permission for service restart${NC}"
fi

echo -e "${GREEN}🎉 Permission fixes complete!${NC}"
echo -e "${YELLOW}Now you can run these commands as ec2-user:${NC}"
echo -e "${BLUE}cd ${PROJECT_ROOT}/frontend && npm run build-low-memory${NC}"
echo -e "${BLUE}sudo /usr/local/bin/restart-services${NC}" 
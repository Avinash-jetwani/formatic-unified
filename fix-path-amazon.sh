#!/bin/bash
set -e

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log function
log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
  echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if running as root
if [ "$(id -u)" != "0" ]; then
  error "This script must be run as root"
  exit 1
fi

# Get current directory
CURRENT_DIR="$(pwd)"
log "Current directory: $CURRENT_DIR"

# Check and update APP_DIR in fix-deployment-amazon.sh
log "Updating application path in deployment script..."
sed -i "s|APP_DIR=\"/home/ec2-user/formatic-unified\"|APP_DIR=\"$CURRENT_DIR\"|g" fix-deployment-amazon.sh

# Run the deployment script
log "Running deployment script..."
chmod +x fix-deployment-amazon.sh
./fix-deployment-amazon.sh 
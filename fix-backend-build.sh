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
BACKEND_DIR="$CURRENT_DIR/backend"
FRONTEND_DIR="$CURRENT_DIR/frontend"

# Build backend application
build_backend() {
  log "Building backend application..."
  cd "$BACKEND_DIR"
  
  # Check if dist directory exists and fix permissions if it does
  if [ -d "dist" ]; then
    log "Fixing permissions for dist directory..."
    chmod -R 777 dist
  fi
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ] || [ "$1" == "--reinstall" ]; then
    log "Installing dependencies..."
    npm install --legacy-peer-deps
  fi
  
  # Build TypeScript code
  log "Building TypeScript code..."
  npm run build
  
  # Verify build
  if [ -f "$BACKEND_DIR/dist/src/main.js" ]; then
    log "Backend built successfully"
  else
    error "Backend build failed, dist/src/main.js not found"
    return 1
  fi
}

# Start backend service
start_backend() {
  log "Starting backend service..."
  cd "$BACKEND_DIR"
  
  # Remove previous PM2 process if exists
  pm2 delete backend 2>/dev/null || true
  
  # Start with PM2
  pm2 start dist/main.js --name backend
  
  log "Backend service started"
}

# Build frontend application if needed
build_frontend() {
  log "Building frontend application if needed..."
  cd "$FRONTEND_DIR"
  
  if [ ! -d "$FRONTEND_DIR/.next" ]; then
    log "Building frontend..."
    npm install --legacy-peer-deps
    npm run build
  else
    log "Frontend already built, skipping"
  fi
}

# Start frontend service
start_frontend() {
  log "Starting frontend service..."
  cd "$FRONTEND_DIR"
  
  # Remove previous PM2 process if exists
  pm2 delete frontend 2>/dev/null || true
  
  # Start with PM2
  pm2 start npm --name frontend -- start
  
  log "Frontend service started"
}

# Save PM2 configuration for auto-restart
save_pm2_config() {
  log "Saving PM2 process list for auto-restart on reboot..."
  pm2 save
  env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
}

# Main function
main() {
  log "Starting application build and deployment..."
  
  build_backend "$1"
  build_frontend
  start_backend
  start_frontend
  save_pm2_config
  
  log "Application deployed successfully!"
  echo -e "${GREEN}"
  echo "======================================================================"
  echo "    Datizmo application has been deployed successfully!"
  echo "    Frontend: http://localhost"
  echo "    Backend API: http://localhost/api"
  echo "    Access using your EC2 public IP address"
  echo "======================================================================"
  echo -e "${NC}"
  
  # Get public IP
  PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
  if [ -n "$PUBLIC_IP" ]; then
    echo -e "${GREEN}"
    echo "    Direct access URL: http://$PUBLIC_IP"
    echo "======================================================================"
    echo -e "${NC}"
  fi
}

# Execute main function
main "$1" 
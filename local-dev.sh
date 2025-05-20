#!/bin/bash

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
    chmod -R 777 dist || sudo chmod -R 777 dist
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

# Start backend service locally
start_backend_local() {
  log "Starting backend service in development mode..."
  cd "$BACKEND_DIR"
  
  # Start in a new terminal window (macOS specific)
  osascript -e "tell app \"Terminal\" to do script \"cd $BACKEND_DIR && npm run start:dev\""
  
  log "Backend service started in a new terminal window"
}

# Build frontend application
build_frontend() {
  log "Building frontend application..."
  cd "$FRONTEND_DIR"
  
  if [ ! -d "node_modules" ] || [ "$1" == "--reinstall" ]; then
    log "Installing frontend dependencies..."
    npm install --legacy-peer-deps
  fi
  
  log "Ready to start frontend in development mode"
}

# Start frontend service locally
start_frontend_local() {
  log "Starting frontend service in development mode..."
  cd "$FRONTEND_DIR"
  
  # Start in a new terminal window (macOS specific)
  osascript -e "tell app \"Terminal\" to do script \"cd $FRONTEND_DIR && npm run dev\""
  
  log "Frontend service started in a new terminal window"
}

# Main function
main() {
  log "Starting local development environment..."
  
  build_backend "$1"
  build_frontend "$1"
  start_backend_local
  start_frontend_local
  
  log "Development environment is running!"
  echo -e "${GREEN}"
  echo "======================================================================"
  echo "    Datizmo application is running in development mode!"
  echo "    Frontend: http://localhost:3000"
  echo "    Backend API: http://localhost:3001/api"
  echo "======================================================================"
  echo -e "${NC}"
}

# Execute main function
main "$1" 
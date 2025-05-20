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

# Auto-detect system type
detect_system() {
  log "Detecting system type..."
  
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
  elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si)
  elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
  else
    OS=$(uname -s)
  fi
  
  # Check if it's Amazon Linux
  if echo "$OS" | grep -q "Amazon"; then
    log "Detected Amazon Linux system"
    return 0
  # Check if it's Ubuntu
  elif echo "$OS" | grep -q "Ubuntu"; then
    log "Detected Ubuntu system"
    return 1
  else
    warn "Could not determine specific system type: $OS"
    # Default to Amazon Linux if we're using ec2-user
    if id ec2-user >/dev/null 2>&1; then
      log "Defaulting to Amazon Linux based on ec2-user existence"
      return 0
    else
      log "Defaulting to Ubuntu"
      return 1
    fi
  fi
}

# Copy appropriate files
setup_scripts() {
  is_amazon=$1
  
  # Get the directory where this script is located
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  
  if [ "$is_amazon" -eq 0 ]; then
    # For Amazon Linux
    log "Setting up Amazon Linux scripts..."
    cp "$SCRIPT_DIR/server-deployment-amazon.sh" "$SCRIPT_DIR/server-deployment.sh"
    cp "$SCRIPT_DIR/health-check-amazon.sh" "$SCRIPT_DIR/health-check.sh"
  else
    # For Ubuntu
    log "Ubuntu scripts are already in place"
  fi
  
  # Make scripts executable
  chmod +x "$SCRIPT_DIR/server-deployment.sh" 
  chmod +x "$SCRIPT_DIR/health-check.sh"
  
  log "Scripts prepared successfully"
}

# Main execution
log "Starting system detection and setup..."

detect_system
is_amazon=$?

setup_scripts $is_amazon

if [ "$is_amazon" -eq 0 ]; then
  log "Running Amazon Linux version of deployment script..."
  "$SCRIPT_DIR/server-deployment.sh" "$@"
else
  log "Running Ubuntu version of deployment script..."
  "$SCRIPT_DIR/server-deployment.sh" "$@"
fi

exit $? 
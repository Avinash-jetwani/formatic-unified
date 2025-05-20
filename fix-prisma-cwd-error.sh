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
ENV_FILE="$CURRENT_DIR/.env"

# Update environment file with correct database credentials
update_env_file() {
  log "Updating environment file with correct database credentials..."
  
  # Database credentials
  DB_HOST="formatic-dev-db.c7edc3pems97.eu-west-2.rds.amazonaws.com"
  DB_NAME="formatic-dev-db"
  DB_PORT="5432"
  DB_USER="postgres"
  DB_PASSWORD="immortal1497db"
  DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  
  # Create or update .env file
  if [ -f "$ENV_FILE" ]; then
    # Update existing env file
    log "Updating existing .env file..."
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DB_URL}|g" "$ENV_FILE"
    sed -i "s|^POSTGRES_USER=.*|POSTGRES_USER=${DB_USER}|g" "$ENV_FILE"
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|g" "$ENV_FILE"
    sed -i "s|^POSTGRES_DB=.*|POSTGRES_DB=${DB_NAME}|g" "$ENV_FILE"
    sed -i "s|^POSTGRES_HOST=.*|POSTGRES_HOST=${DB_HOST}|g" "$ENV_FILE"
    sed -i "s|^POSTGRES_PORT=.*|POSTGRES_PORT=${DB_PORT}|g" "$ENV_FILE"
  else
    # Create new env file
    log "Creating new .env file with correct credentials..."
    cat > "$ENV_FILE" <<EOL
# Database Configuration
DATABASE_URL=${DB_URL}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=${DB_NAME}
POSTGRES_HOST=${DB_HOST}
POSTGRES_PORT=${DB_PORT}

# JWT Configuration
JWT_SECRET=datizmo_jwt_secret_key
JWT_EXPIRATION=1d

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost/api
NEXTAUTH_URL=http://localhost
NEXTAUTH_SECRET=datizmo_nextauth_secret_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=noreply@datizmo.com

# S3 Configuration for File Uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=datizmo-uploads

# Other Settings
NODE_ENV=production
PORT=3000
BACKEND_PORT=3001
EOL
  fi
  
  log "Environment file updated successfully with correct database credentials"
}

# Create backend .env link for Prisma
create_backend_env_link() {
  log "Creating .env symlink in backend directory for Prisma..."
  
  if [ -f "$BACKEND_DIR/.env" ]; then
    log "Removing existing .env file in backend directory..."
    rm "$BACKEND_DIR/.env"
  fi
  
  # Create symbolic link
  ln -s "$ENV_FILE" "$BACKEND_DIR/.env"
  log "Symlink created successfully"
}

# Restart deployment
restart_deployment() {
  log "Restarting deployment with correct database credentials..."
  
  # If deploy_fixed.sh exists, run it
  if [ -f "$CURRENT_DIR/deploy_fixed.sh" ]; then
    chmod +x "$CURRENT_DIR/deploy_fixed.sh"
    "$CURRENT_DIR/deploy_fixed.sh"
  else
    log "Running fix-npm-deps-amazon.sh to create and run deploy_fixed.sh..."
    chmod +x "$CURRENT_DIR/fix-npm-deps-amazon.sh"
    "$CURRENT_DIR/fix-npm-deps-amazon.sh"
  fi
}

# Main function
main() {
  log "Starting database credentials fix..."
  
  update_env_file
  create_backend_env_link
  restart_deployment
}

# Execute main function
main 
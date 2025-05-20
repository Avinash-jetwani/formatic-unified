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

# Environment variables
APP_DIR="/home/ec2-user/formatic-unified"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
ENV_FILE="$APP_DIR/.env"
NGINX_CONF="/etc/nginx/conf.d/datizmo.conf"

# Check if running as root
if [ "$(id -u)" != "0" ]; then
  error "This script must be run as root"
  exit 1
fi

# Create or update environment file
setup_environment() {
  log "Setting up environment variables..."
  
  if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" <<EOL
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/datizmo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DB=datizmo
POSTGRES_HOST=YOUR_RDS_ENDPOINT
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1d

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://datizmo.com/api
NEXTAUTH_URL=https://datizmo.com
NEXTAUTH_SECRET=your_nextauth_secret_here

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
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
    log "Created default environment file at $ENV_FILE"
    warn "Please update the environment variables with your actual credentials"
  else
    log "Environment file already exists"
  fi
}

# Setup Nginx configuration
setup_nginx() {
  log "Setting up Nginx configuration..."
  
  # Make sure nginx conf directory exists
  mkdir -p /etc/nginx/conf.d/
  
  cat > "$NGINX_CONF" <<EOL
server {
  listen 80;
  server_name datizmo.com www.datizmo.com;
  
  location / {
    return 301 https://\$host\$request_uri;
  }

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }
}

server {
  listen 443 ssl;
  server_name datizmo.com www.datizmo.com;

  ssl_certificate /etc/letsencrypt/live/datizmo.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/datizmo.com/privkey.pem;
  
  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;

  # HSTS
  add_header Strict-Transport-Security "max-age=63072000" always;

  # Frontend
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
  }

  # Backend API with special handling for auth endpoints
  location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    
    # Fix for auth endpoints
    location /api/auth {
      proxy_pass http://localhost:3001/auth;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host \$host;
      proxy_cache_bypass \$http_upgrade;
    }
  }

  # WebSockets support
  location /socket.io {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
  }

  # File uploads
  client_max_body_size 50M;
}
EOL

  log "Testing Nginx configuration..."
  nginx -t && systemctl reload nginx
  log "Nginx configuration applied successfully"
}

# Setup SSL certificates
setup_ssl() {
  log "Setting up SSL certificates..."
  
  if [ ! -d "/etc/letsencrypt/live/datizmo.com" ]; then
    log "Installing certbot..."
    amazon-linux-extras install epel -y
    yum -y install certbot python2-certbot-nginx
    
    log "Requesting SSL certificate..."
    mkdir -p /var/www/certbot
    certbot --nginx -d datizmo.com -d www.datizmo.com --non-interactive --agree-tos --email admin@datizmo.com
  else
    log "SSL certificates already exist, checking renewal..."
    certbot renew --dry-run
  fi
}

# Install dependencies for Amazon Linux
install_dependencies() {
  log "Updating system packages..."
  yum update -y
  
  log "Installing essential packages..."
  yum install -y curl wget git unzip
  
  log "Installing Nginx..."
  amazon-linux-extras install nginx1 -y
  systemctl enable nginx
  systemctl start nginx
  
  log "Installing Node.js 18.x..."
  if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    npm install -g pm2
    log "Node.js and PM2 installed successfully"
  else
    current_version=$(node -v)
    log "Node.js $current_version already installed"
  fi
}

# Pull latest code
pull_code() {
  log "Pulling latest code from git repository..."
  
  if [ ! -d "$APP_DIR" ]; then
    log "Cloning repository..."
    mkdir -p $(dirname "$APP_DIR")
    git clone https://github.com/Avinash-jetwani/formatic-unified.git "$APP_DIR"
    chown -R ec2-user:ec2-user "$APP_DIR"
  else
    log "Updating existing repository..."
    cd "$APP_DIR"
    git pull
  fi
}

# Build and deploy backend
deploy_backend() {
  log "Deploying backend..."
  cd "$BACKEND_DIR"
  
  log "Installing backend dependencies..."
  npm ci --production
  
  log "Generating Prisma client..."
  npx prisma generate
  
  log "Running database migrations..."
  npx prisma migrate deploy
  
  log "Restarting backend service..."
  pm2 delete backend 2>/dev/null || true
  pm2 start dist/main.js --name backend
  
  log "Backend deployed successfully"
}

# Build and deploy frontend
deploy_frontend() {
  log "Deploying frontend..."
  cd "$FRONTEND_DIR"
  
  log "Installing frontend dependencies..."
  npm ci --production
  
  log "Building frontend application..."
  npm run build
  
  log "Restarting frontend service..."
  pm2 delete frontend 2>/dev/null || true
  pm2 start npm --name frontend -- start
  
  log "Frontend deployed successfully"
}

# Fix NextAuth configuration
fix_nextauth_config() {
  log "Fixing NextAuth configuration..."
  
  NEXTAUTH_CONFIG="$FRONTEND_DIR/src/app/api/auth/[...nextauth]/route.ts"
  
  if [ -f "$NEXTAUTH_CONFIG" ]; then
    # Check if we need to update the callback URLs
    if grep -q "http://localhost" "$NEXTAUTH_CONFIG"; then
      log "Updating callback URLs in NextAuth config..."
      sed -i 's|http://localhost:3000|https://datizmo.com|g' "$NEXTAUTH_CONFIG"
      sed -i 's|NEXTAUTH_URL=http://localhost:3000|NEXTAUTH_URL=https://datizmo.com|g' "$FRONTEND_DIR/.env.local"
      log "NextAuth configuration updated"
    else
      log "NextAuth configuration appears to be correct"
    fi
  else
    warn "NextAuth configuration file not found at $NEXTAUTH_CONFIG"
  fi
}

# Save PM2 process list for auto-restart on reboot
save_pm2_config() {
  log "Saving PM2 process list for auto-restart on reboot..."
  pm2 save
  env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
}

# Setup monitoring and logging
setup_monitoring() {
  log "Setting up monitoring..."
  
  # Install PM2 monitoring
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 5
  
  log "PM2 log rotation configured"
}

# Main deployment function
deploy_all() {
  log "Starting Datizmo deployment..."
  
  install_dependencies
  setup_environment
  pull_code
  deploy_backend
  deploy_frontend
  fix_nextauth_config
  setup_nginx
  setup_ssl
  save_pm2_config
  setup_monitoring
  
  log "Deployment completed successfully!"
  echo -e "${GREEN}"
  echo "======================================================================"
  echo "    Datizmo application has been deployed successfully!"
  echo "    Frontend: https://datizmo.com"
  echo "    Backend API: https://datizmo.com/api"
  echo "======================================================================"
  echo -e "${NC}"
}

# Check command line arguments
case "$1" in
  backend)
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    ;;
  nginx)
    setup_nginx
    ;;
  ssl)
    setup_ssl
    ;;
  env)
    setup_environment
    ;;
  all|*)
    deploy_all
    ;;
esac

exit 0 
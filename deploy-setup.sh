#!/bin/bash

# Formatic Application Deployment Setup Script
# Run this script on your EC2 server to prepare for deployment

set -e

echo "=== Formatic Deployment Setup ==="

# Variables
APP_DIR="/home/ec2-user/formatic-unified"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "Setting up application directories..."
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR

echo "Checking if Git repository exists..."
if [ ! -d "$APP_DIR/.git" ]; then
    echo "Cloning repository..."
    cd /home/ec2-user
    git clone https://github.com/your-username/formatic-unified.git
else
    echo "Repository already exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
fi

echo "Setting up backend environment..."
cd $BACKEND_DIR

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating backend .env file template..."
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/formatic?schema=public"

# JWT
JWT_SECRET="your-jwt-secret-here"

# AWS S3 (optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-password"

# App Settings
NODE_ENV="production"
PORT=3001
EOF
    echo "IMPORTANT: Please edit $BACKEND_DIR/.env with your actual configuration values!"
fi

echo "Setting up frontend environment..."
cd $FRONTEND_DIR

# Create .env.production file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "Creating frontend .env.production file template..."
    cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=https://datizmo.com
NEXTAUTH_SECRET=your-nextauth-secret-here
EOF
    echo "IMPORTANT: Please edit $FRONTEND_DIR/.env.production with your actual configuration values!"
fi

echo "Setting up PM2 ecosystem file..."
cd $APP_DIR
if [ ! -f ecosystem.config.js ]; then
    cp ecosystem.config.js.example ecosystem.config.js 2>/dev/null || echo "Using existing ecosystem.config.js"
fi

echo "Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

echo "Setting up PostgreSQL database..."
if ! systemctl is-active --quiet postgresql; then
    echo "PostgreSQL is not running. Please ensure PostgreSQL is installed and running."
    echo "To install PostgreSQL on Amazon Linux 2:"
    echo "sudo yum update -y"
    echo "sudo yum install postgresql postgresql-server postgresql-contrib -y"
    echo "sudo postgresql-setup initdb"
    echo "sudo systemctl enable postgresql"
    echo "sudo systemctl start postgresql"
fi

echo "Checking Nginx configuration..."
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is not running. Please ensure Nginx is installed and configured."
    echo "Sample Nginx configuration should be in datizmo-nginx.conf"
fi

echo "Setting correct permissions..."
chown -R ec2-user:ec2-user $APP_DIR
chmod +x $APP_DIR/deploy-setup.sh

echo "=== Setup completed! ==="
echo "Next steps:"
echo "1. Edit $BACKEND_DIR/.env with your database and other configuration"
echo "2. Edit $FRONTEND_DIR/.env.production with your frontend configuration"
echo "3. Ensure PostgreSQL is running and create the database"
echo "4. Ensure Nginx is configured and running"
echo "5. Push your code to GitHub to trigger deployment"
echo ""
echo "Your application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- Domain: https://datizmo.com (if Nginx is configured)" 
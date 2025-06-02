#!/bin/bash

# PM2 Startup Setup Script for EC2
# Run this script on your EC2 server to set up PM2 properly

echo "=== Setting up PM2 for startup ==="

# Source NVM
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

echo "PM2 version: $(pm2 --version)"

# Generate startup script
echo "Generating PM2 startup script..."
pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "=== PM2 startup configuration completed ==="
echo "PM2 will now automatically start your applications on system boot"
echo "Current PM2 processes:"
pm2 status 
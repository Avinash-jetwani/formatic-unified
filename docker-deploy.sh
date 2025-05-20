#!/bin/bash

# Make script executable: chmod +x docker-deploy.sh

# Domain is already set
DOMAIN="datizmo.com"
EMAIL="your-email@example.com"  # Replace with your actual email

echo "Deploying for domain: $DOMAIN"

# Create directories for Certbot
mkdir -p certbot/conf
mkdir -p certbot/www

# Initial startup to obtain SSL certificate
echo "Starting containers for initial SSL certificate setup..."
docker-compose up -d nginx

# Wait for nginx to start
sleep 5

# Get SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --no-eff-email --force-renewal

# Restart nginx to load the SSL certificate
docker-compose restart nginx

# Start all services
echo "Starting all services..."
docker-compose up -d

echo "Deployment completed! The application should be available at https://$DOMAIN"
echo "Monitor logs with: docker-compose logs -f" 
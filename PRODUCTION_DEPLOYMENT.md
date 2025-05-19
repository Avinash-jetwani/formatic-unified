# Datizmo Production Deployment Guide

This guide explains how to deploy the Datizmo application to your live domain while using the same underlying resources as your local development setup.

## Prerequisites

1. A server with:
   - Ubuntu/Debian Linux (recommended)
   - Node.js v16+ installed
   - PostgreSQL installed and running
   - Nginx installed
   - PM2 installed globally (`npm install -g pm2`)
   - Root or sudo access

2. A domain name pointed to your server (e.g., datizmo.com and www.datizmo.com)

3. The Datizmo codebase cloned to your server (e.g., in `/var/www/datizmo`)

## Deployment Steps

### 1. Prepare Your Server

Ensure your server has all the required dependencies:

```bash
# Update package lists
sudo apt update

# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL if not already installed
sudo apt install -y postgresql postgresql-contrib

# Install Nginx if not already installed
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Deploy the Application

1. Navigate to your project directory:
   ```bash
   cd /var/www/datizmo
   ```

2. Run the production deployment script:
   ```bash
   sudo ./datizmo-production.sh
   ```

The script will automatically:

- Stop any existing services
- Set up environment variables for production
- Check and configure PostgreSQL
- Set up the same AWS S3 credentials as local development
- Apply database migrations
- Install dependencies
- Build both frontend and backend applications
- Configure Nginx with SSL
- Obtain SSL certificates if needed
- Start the application with PM2
- Configure PM2 to start on boot

### 3. After Deployment

Once the deployment is complete:

- Your app will be accessible at: https://www.datizmo.com
- The backend API will be running at: https://www.datizmo.com/api
- The Next.js frontend will be running on port 3000 internally
- The NestJS backend will be running on port 4000 internally
- Nginx will handle proxying and SSL termination

## Important Notes

1. **Database**: The application will use the same database configuration as your local setup. This means it will connect to a PostgreSQL database named `formatic` on localhost.

2. **S3 Storage**: The application uses the same AWS S3 bucket as your local development.

3. **SSL Certificates**: The script will automatically obtain and configure SSL certificates via Let's Encrypt if they don't exist already.

4. **PM2 Process Management**: The application processes will be managed by PM2, which will restart them if they crash and also restart them when your server reboots.

## Troubleshooting

If you encounter issues during or after deployment:

1. **Check Nginx logs**:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Check application logs**:
   ```bash
   pm2 logs datizmo-frontend
   pm2 logs datizmo-backend
   ```

3. **Restart services manually**:
   ```bash
   pm2 restart datizmo-frontend datizmo-backend
   sudo systemctl restart nginx
   ```

4. **Verify database connection**:
   ```bash
   cd backend
   npx prisma db pull
   ```

5. **Check SSL certificate status**:
   ```bash
   sudo certbot certificates
   ```

## Security Considerations

1. The script includes hardcoded AWS credentials for simplicity. In a real production environment, you should use more secure methods to manage credentials, such as environment variables or AWS IAM roles.

2. For a production system, you should follow best practices for PostgreSQL security, including setting up proper passwords and access controls.

3. Consider setting up a firewall on your server to restrict access to only necessary ports (80, 443). 
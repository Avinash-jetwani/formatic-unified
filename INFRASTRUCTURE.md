# Datizmo Infrastructure Documentation

## Overview

This document describes the infrastructure setup for the Datizmo application, including the AWS resources used, server configuration, deployment process, and monitoring setup.

## AWS Infrastructure

### EC2 Instance
- **Instance Type**: t3.small (2 vCPU, 2GB RAM)
- **Operating System**: Ubuntu 22.04 LTS
- **Region**: us-east-1
- **Storage**: 20GB gp3 EBS volume

### Database
- **Type**: Amazon RDS PostgreSQL
- **Version**: PostgreSQL 14
- **Instance Type**: db.t3.micro
- **Storage**: 20GB gp3 SSD
- **Backup**: Daily automated backups, retained for 7 days

### S3 Bucket
- **Name**: datizmo-uploads
- **Region**: us-east-1
- **Purpose**: File uploads storage (images, documents, etc.)

### IAM Users
- **Admin User**: Full access to AWS resources (Console access)
- **Service User**: Programmatic access for S3 operations
- **Deployment User**: Used by CI/CD for deployment

## Server Configuration

### Installed Software
- **Node.js**: v18.x
- **PM2**: Process manager for Node.js applications
- **Nginx**: Web server and reverse proxy
- **PostgreSQL Client**: For database connection
- **Certbot**: For SSL certificate management

### Directory Structure
```
/home/ubuntu/
└── formatic-unified/
    ├── backend/
    ├── frontend/
    └── .env
```

### Services
1. **Backend (NestJS)**:
   - Port: 3001
   - Managed by PM2
   - Process name: `backend`

2. **Frontend (Next.js)**:
   - Port: 3000
   - Managed by PM2
   - Process name: `frontend`

3. **Nginx**:
   - Configured as a reverse proxy
   - Terminates SSL
   - Routes traffic to backend/frontend
   - Config location: `/etc/nginx/conf.d/datizmo.conf`

## Domain and SSL

- **Domain**: datizmo.com
- **SSL**: Let's Encrypt, auto-renewal configured
- **Certificate Path**: `/etc/letsencrypt/live/datizmo.com/`

## Deployment Process

### Deployment Script

The `server-deployment.sh` script handles the complete deployment process:

```bash
sudo ./server-deployment.sh
```

This script:
1. Updates system packages
2. Installs necessary dependencies
3. Pulls the latest code
4. Builds and deploys both backend and frontend
5. Configures Nginx and SSL
6. Sets up PM2 for auto-restart

### CI/CD Pipeline

The GitHub Actions workflow at `.github/workflows/deploy.yml` automates the deployment process:
1. Triggered on push to main branch or manually
2. Connects to the server via SSH
3. Runs the deployment script
4. Verifies successful deployment

### Environment Variables

Required environment variables are stored in `/home/ubuntu/formatic-unified/.env`:
- Database configuration
- JWT secrets
- Frontend configuration
- Email settings
- S3 access credentials

## Monitoring and Maintenance

### Process Monitoring

PM2 is configured to:
- Monitor application health
- Restart applications on crash
- Start applications on system boot
- Rotate logs (10MB max size, keep 5 recent files)

### Logs

- **Application Logs**: Located in `~/.pm2/logs/`
- **Nginx Access Logs**: `/var/log/nginx/access.log`
- **Nginx Error Logs**: `/var/log/nginx/error.log`
- **System Logs**: `/var/log/syslog`

### Backup Strategy

1. **Database**:
   - RDS automated daily backups
   - Manual snapshot before major changes

2. **Application Code**:
   - Maintained through Git repository
   - Regular backups of environment files

3. **User Uploads**:
   - Automatically stored in S3
   - S3 versioning enabled for recovery

## Security Considerations

- SSH access restricted to key authentication only
- Firewall configured to allow only necessary traffic
- All services running behind Nginx
- SSL enforced for all traffic
- Regular security updates applied
- JWT used for API authentication
- Database accessible only from application server

## Scaling Considerations

For increased traffic, consider:
1. Upgrading EC2 instance to larger size
2. Implementing horizontal scaling with load balancer
3. Using CloudFront for static asset caching
4. Separating database to dedicated instance
5. Implementing Redis for caching and session storage

## Troubleshooting

### Common Issues and Solutions

1. **Application not reachable**:
   - Check PM2 status: `pm2 status`
   - Verify Nginx is running: `systemctl status nginx`
   - Check logs: `pm2 logs`

2. **Database connection issues**:
   - Verify environment variables
   - Check network connectivity to RDS
   - Test connection with `psql`

3. **SSL certificate errors**:
   - Run `certbot renew` to renew certificates
   - Check Nginx configuration
   - Verify certificate paths are correct

4. **Deployment failures**:
   - Check GitHub Actions logs for SSH issues
   - Verify permissions on deployment script
   - Check disk space: `df -h`

## Recovery Procedures

1. **Application recovery**:
   - Restart services: `pm2 restart all`
   - Check for code issues: `git status`
   - Revert to last working commit if needed

2. **Database recovery**:
   - Restore from RDS snapshot
   - Run migrations: `npx prisma migrate deploy`

3. **Complete server recovery**:
   - Launch new EC2 instance
   - Run deployment script
   - Restore environment variables
   - Update DNS settings

## Support and Maintenance

For ongoing maintenance:
1. Regularly update system packages
2. Monitor disk usage and performance
3. Review application logs for errors
4. Test backups periodically
5. Update SSL certificates before expiry

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/) 
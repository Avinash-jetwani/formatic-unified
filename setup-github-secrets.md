# GitHub Secrets Configuration

To deploy your Formatic app to any domain/EC2 instance, you need to configure these GitHub secrets in your repository settings.

## Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### Essential Secrets:
1. **SERVER_IP** - Your EC2 instance public IP address
2. **SSH_PRIVATE_KEY** - Your EC2 SSH private key (entire content)

### Optional Domain Configuration Secrets:
3. **DOMAIN** - Your domain name (default: datizmo.com)
   - Example: `yourapp.com` or `yourdomain.net`
4. **API_URL** - Your API endpoint URL (default: https://www.datizmo.com/api)
   - Example: `https://api.yourapp.com` or `https://yourapp.com/api`
5. **FRONTEND_URL** - Your frontend URL (default: https://www.datizmo.com)
   - Example: `https://yourapp.com`
6. **NEXTAUTH_SECRET** - NextAuth secret for JWT signing (generate a random string)

## How to Set Up Each Secret:

### 1. SERVER_IP
```
Value: 1.2.3.4 (your EC2 public IP)
```

### 2. SSH_PRIVATE_KEY
```
Value: (paste your entire SSH private key, including -----BEGIN and -----END lines)
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...your full private key content...
-----END OPENSSH PRIVATE KEY-----
```

### 3. DOMAIN (Optional)
```
Value: yourdomain.com
```

### 4. API_URL (Optional)
```
Value: https://yourdomain.com/api
```

### 5. FRONTEND_URL (Optional)
```
Value: https://yourdomain.com
```

### 6. NEXTAUTH_SECRET (Optional)
```
Value: a-very-long-random-string-for-jwt-signing-at-least-32-characters
```

## Default Values
If you don't set the optional secrets, the deployment will use these defaults:
- DOMAIN: `datizmo.com`
- API_URL: `https://www.datizmo.com/api`
- FRONTEND_URL: `https://www.datizmo.com`
- NEXTAUTH_SECRET: `change-this-in-production`

## EC2 Requirements
Your EC2 instance should have:
- Node.js 18+ installed (via NVM)
- PM2 installed globally
- Nginx installed and running
- PostgreSQL database configured
- Git repository cloned at `/home/ec2-user/formatic-unified`

## Deployment Process
1. Push to main branch or trigger manual deployment
2. GitHub Actions will build and deploy automatically
3. User passwords will be reset to:
   - admin@formatic.com: NewAdmin2024!
   - john@doe.com: JohnDoe2024!

## Notes
- The deployment script will automatically create SSL certificates (self-signed)
- Nginx configuration will be updated with your domain
- Environment variables will be configured correctly
- PM2 will manage both frontend and backend processes 
# Datizmo Deployment Workflow

## Complete CI/CD Process

### 🔄 Standard Development Workflow

1. **Code Changes**: Make edits in Cursor IDE ✅
2. **Commit & Push**: Triggers GitHub Actions deployment ✅  
3. **SSL Preservation**: Existing certificates are preserved during deployment ✅
4. **Applications Restart**: Both frontend and backend running smoothly ✅

### 📋 Step-by-Step Process

#### 1. Development Phase
- Make code changes in Cursor IDE
- Test changes locally if needed
- Commit changes with descriptive messages

#### 2. Deployment Phase
```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

#### 3. Automatic CI/CD (GitHub Actions)
- GitHub Actions workflow automatically triggers
- Builds and deploys to EC2 server
- SSL certificates are preserved
- Services restart automatically

#### 4. Monitoring & Verification
```bash
# SSH into EC2 server
ssh -i "datizmo_deploy_key" ec2-user@18.133.10.17

# Check PM2 applications status
pm2 list

# View logs
pm2 logs formatic-app        # Backend logs
pm2 logs formatic-frontend   # Frontend logs

# Restart services if needed
pm2 restart formatic-app
pm2 restart formatic-frontend

# Check nginx status
sudo systemctl status nginx

# Check SSL certificates
sudo certbot certificates
```

### 🔧 Key Application Details

#### Ports & Services
- **Backend**: Port 3001
- **Frontend**: Port 3000  
- **Nginx**: Port 80/443 (SSL)
- **Domain**: https://www.datizmo.com

#### PM2 Process Names
- `formatic-app` - Backend application
- `formatic-frontend` - Frontend application

### 🚨 Troubleshooting

#### Common Issues & Solutions

1. **Port Conflicts**
   ```bash
   sudo lsof -i :3000  # Check port 3000
   sudo lsof -i :3001  # Check port 3001
   ```

2. **Memory Issues**
   ```bash
   free -h  # Check memory usage
   pm2 monit  # Monitor processes
   ```

3. **Service Restart Required**
   ```bash
   pm2 restart all
   pm2 save
   ```

4. **SSL Issues**
   ```bash
   sudo certbot renew --dry-run
   sudo systemctl reload nginx
   ```

#### API Endpoint Issues
- Ensure all API routes use relative URLs or `NEXT_PUBLIC_API_URL`
- Backend API base: `/api/*`
- Check for hardcoded localhost URLs

### 📝 Important Commands

#### Git Workflow
```bash
git status
git add .
git commit -m "Description"
git push origin main
```

#### Server Management
```bash
# SSH Access
ssh -i "datizmo_deploy_key" ec2-user@18.133.10.17

# PM2 Management
pm2 list
pm2 logs <app-name>
pm2 restart <app-name>
pm2 monit

# System Health
htop
df -h
free -h

# Nginx Management
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t
```

### 🔐 Security Features

- SSL certificates auto-renewal via cron
- GitHub Actions secure deployment
- Environment variables protection
- Domain-based SSL (datizmo.com)

### 📚 Documentation Files

- `formatic-app-documentation.md` - Application overview
- `deploy-instructions.md` - Deployment setup
- `setup-github-secrets.md` - GitHub configuration
- `validate-deployment.js` - Deployment validation

### ⚡ Quick Reference

**One-Command Deployment**: Just push to main branch
**Emergency Restart**: `pm2 restart all` on EC2
**SSL Status**: `sudo certbot certificates`
**Logs**: `pm2 logs` for real-time monitoring

---

**Note**: Always use the CI/CD pipeline for deployments. Only use EC2 terminal for monitoring, troubleshooting, and emergency restarts to avoid memory issues. 
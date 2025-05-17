# Datizmo CI/CD Workflow Guide

## Overview

This document outlines the complete workflow for developing and deploying the Datizmo application. Follow these steps to ensure consistent, reliable deployments from local development to production.

## Development Workflow

### 1. Local Development

1. Clone the repository (first time only)
   ```bash
   git clone https://github.com/Avinash-jetwani/formatic-unified.git
   cd formatic-unified
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create feature branch (recommended for new features)
   ```bash
   git checkout -b feature-name
   ```

4. Make code changes and test locally
   ```bash
   # Start development server
   npm run dev
   ```

5. Commit changes
   ```bash
   git add .
   git commit -m "Descriptive message about changes"
   ```

### 2. Code Integration

#### Option A: Direct to Main (for small changes)

1. Pull latest changes from main
   ```bash
   git checkout main
   git pull origin main
   ```

2. Push changes to GitHub
   ```bash
   git push origin main
   ```

#### Option B: Pull Request Workflow (for larger features)

1. Push feature branch to GitHub
   ```bash
   git push origin feature-name
   ```

2. Create Pull Request on GitHub
   - Go to repository on GitHub
   - Click "Pull requests" tab
   - Click "New pull request"
   - Select your feature branch
   - Add description and reviewers
   - Create pull request

3. Merge to main after approval
   - After code review and approval
   - Merge pull request on GitHub

## Deployment Process

### 1. Automatic Deployment via GitHub Actions

When code is pushed to the main branch, GitHub Actions automatically:

1. Checks out the code
2. Sets up SSH connection to EC2
3. Connects to production server
4. Pulls latest code
5. Runs the server-restart.sh script
6. Restarts necessary services

You can monitor this process in the GitHub Actions tab of the repository.

### 2. Manual Deployment (if needed)

If automatic deployment fails or you need to deploy manually:

1. SSH into the EC2 server
   ```bash
   ssh ec2-user@your-server-ip
   ```

2. Navigate to application directory
   ```bash
   cd /var/www/datizmo
   ```

3. Pull latest changes
   ```bash
   git pull
   ```

4. Run restart script
   ```bash
   chmod +x server-restart.sh
   ./server-restart.sh
   ```

## Testing Without Affecting Production

### Option 1: Feature Branches

1. Work in feature branches for isolated development
2. Push to feature branches without triggering deployment
3. Test locally before merging to main

### Option 2: Staging Environment (Future Implementation)

For a more robust workflow, consider setting up:
1. A separate staging server
2. A workflow file targeting the staging environment
3. Deployment to staging before production

## Troubleshooting

### GitHub Actions Failures

1. Check the workflow logs in GitHub Actions tab
2. Verify all secrets are correctly set:
   - EC2_SSH_KEY
   - EC2_HOST_KEY
   - EC2_HOST
   - EC2_USER

### Server Issues

1. SSH into server and check logs
   ```bash
   ssh ec2-user@your-server
   cd /var/www/datizmo
   tail -f logs/app.log
   ```

2. Check service status
   ```bash
   sudo systemctl status nginx
   sudo systemctl status pm2
   ```

3. Restart services manually if needed
   ```bash
   sudo systemctl restart nginx
   pm2 restart all
   ```

## Best Practices

1. Always test changes locally before pushing
2. Use descriptive commit messages
3. Keep secrets secure and never commit them to the repository
4. Pull latest changes before starting new work
5. For major changes, use feature branches
6. Review GitHub Actions logs after deployment
7. Document API changes or configuration updates
8. Keep dependencies updated regularly

---

*This document serves as a reference guide for the Datizmo team's development and deployment workflow. Update as processes evolve.* 
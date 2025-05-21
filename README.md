# Datizmo - Modern Form Management

A powerful platform for creating, managing, and analyzing forms. Build beautiful forms, collect responses, and integrate with your existing systems.

## Features

- Intuitive form builder
- Conditional logic
- Analytics dashboard
- Webhook integrations
- File uploads
- Multi-page forms

## Getting Started 2

Visit [datizmo.com](https://datizmo.com) to start creating your first form.

## Deployment

Automated deployments via GitHub Actions CI/CD.

### Deployment Process
1. Commits to the main branch trigger automatic deployments
2. Run `./setup-env.sh` on first deployment to set up environment variables
3. Update environment files with your production credentials
4. Run `./restart.sh` or `./force-restart.sh` to apply changes

### Troubleshooting
- If API endpoints return 404, check that environment variables are correctly set
- For authentication issues, verify the API_URL is configured correctly

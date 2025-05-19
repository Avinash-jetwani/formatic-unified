# Datizmo Local Deployment Guide

This guide explains how to run the Datizmo application locally while connecting to production resources.

## Prerequisites

1. Node.js v16+ installed on your local machine
2. Connection information for the production database
3. AWS S3 credentials (if using file uploads)
4. Git repository cloned to your local machine

## Running the Application Locally

A single script has been created to handle the entire setup and deployment process:

```bash
./datizmo-local.sh
```

This script will:

1. Stop any existing Node.js processes running on ports 3000 and 4000
2. Clean up caches to ensure a fresh start
3. Prompt you for database connection information
4. Prompt you for S3 credentials if needed
5. Set up the necessary environment variables
6. Apply database migrations
7. Install dependencies if needed
8. Start both the frontend and backend applications

## After Running the Script

Once the script completes:

- Frontend will be available at: http://localhost:3000
- Backend API will be available at: http://localhost:4000
- The application will be connected to your production database
- File uploads will use the production S3 bucket (if configured)

## Important Notes

1. **Database**: The application will connect to your production database. Be careful with any operations that modify data.

2. **Environment Variables**: The script creates local environment files in both the frontend and backend directories. These files contain sensitive information and should not be committed to the repository.

3. **Ports**: Make sure ports 3000 and 4000 are available on your local machine.

4. **Customization**: If you need to customize the setup further, you can edit the `datizmo-local.sh` script.

## Troubleshooting

If you encounter any issues:

1. Check that the database connection string is correct
2. Verify that your AWS credentials have the necessary permissions
3. Make sure you have the latest code from the repository
4. Review the console output for specific error messages

## Supporting Files

All previous deployment scripts have been archived in the `archive_scripts` directory for reference. 
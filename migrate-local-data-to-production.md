# 📦 Migrate Local Data to Production

If you want to copy your local database data (forms, submissions, etc.) to production, follow these steps:

## Option 1: PostgreSQL Dump & Restore (Recommended)

### Step 1: Export Local Database
```bash
# From your local environment where data exists
cd backend
pg_dump $DATABASE_URL > local_backup.sql

# Or if you have the database connection details:
pg_dump -h localhost -U your_username -d your_database_name > local_backup.sql
```

### Step 2: Copy to Production Server
```bash
# Copy the backup file to your EC2 instance
scp local_backup.sql ec2-user@YOUR_EC2_IP:/home/ec2-user/
```

### Step 3: Import to Production Database
```bash
# SSH into your EC2 instance
ssh ec2-user@YOUR_EC2_IP

# Import the data
cd /home/ec2-user/formatic-unified/backend
psql $DATABASE_URL < /home/ec2-user/local_backup.sql

# Or with connection details:
psql -h your_prod_db_host -U your_prod_username -d your_prod_database < /home/ec2-user/local_backup.sql
```

## Option 2: Prisma Data Export/Import

### Step 1: Create Data Seeding Script
```bash
# In your local backend directory
cd backend
npx prisma studio  # Open Prisma Studio to view your data

# Or create a custom export script
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const users = await prisma.user.findMany();
  const forms = await prisma.form.findMany();
  const formFields = await prisma.formField.findMany();
  const submissions = await prisma.submission.findMany();
  
  const exportData = {
    users,
    forms,
    formFields,
    submissions
  };
  
  fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
  console.log('Data exported to data-export.json');
  
  await prisma.\$disconnect();
}

exportData();
"
```

### Step 2: Create Import Script for Production
```javascript
// Save this as import-data.js in backend/scripts/
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  console.log('🔄 Starting data import...');
  
  const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));
  
  // Import users first (excluding the ones created by password reset)
  for (const user of data.users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`✅ Imported user: ${user.email}`);
    }
  }
  
  // Import forms
  for (const form of data.forms) {
    await prisma.form.create({ data: form });
    console.log(`✅ Imported form: ${form.title}`);
  }
  
  // Import form fields
  for (const field of data.formFields) {
    await prisma.formField.create({ data: field });
  }
  
  // Import submissions
  for (const submission of data.submissions) {
    await prisma.submission.create({ data: submission });
  }
  
  console.log('🎉 Data import completed!');
  await prisma.$disconnect();
}

importData().catch(console.error);
```

## Option 3: Manual Recreation (Recommended for Testing)

Since you mentioned this is for testing, it might be easier to:

1. **Login to production** with: `admin@formatic.com` / `NewAdmin2024!`
2. **Create new test forms** using the form builder
3. **Submit test data** through the forms
4. **Test all functionality** with fresh data

This ensures everything works correctly in the production environment.

## 🔍 Current Status Check

After the deployment completes (~5-10 minutes), test these:

### ✅ Login Test
```
URL: https://your-domain.com/login
Email: admin@formatic.com
Password: NewAdmin2024!
```

### ✅ API Test
- Dashboard should load without 404 errors
- Forms page should be accessible
- Submissions page should work
- No more "Cannot GET /api/api/..." errors in console

### ✅ Create Test Data
1. Go to "Create Form" 
2. Add some fields
3. Publish the form
4. Submit test data
5. View submissions

## 🚨 If Issues Persist

If you still see errors after deployment:

1. **Check deployment logs** in GitHub Actions
2. **SSH into EC2** and check PM2 status: `pm2 status` and `pm2 logs`
3. **Check Nginx**: `sudo systemctl status nginx` and `sudo nginx -t`
4. **Verify backend is running**: `curl http://localhost:3001/api/users` from EC2

---

**Recommendation**: Start with fresh test data in production rather than migrating, since this ensures your deployment is working correctly! 
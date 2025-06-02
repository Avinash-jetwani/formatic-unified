#!/bin/bash

# Database Migration Script
# This script helps migrate data from local database to production

echo "=== Database Migration Helper ==="

# Check if we're on local machine or production server
if [ -f "backend/.env.local" ] || [ -f ".env.local" ]; then
    echo "Running on LOCAL machine - exporting data..."
    
    # Export data from local database
    echo "Step 1: Export Users..."
    cd backend
    npx prisma db seed --preview-feature || echo "No seed file found"
    
    # Create data export script
    cat > export-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Exporting users...');
    const users = await prisma.user.findMany({
      include: {
        forms: {
          include: {
            fields: true,
            submissions: true,
            webhooks: true
          }
        }
      }
    });
    
    console.log('Exporting forms...');
    const forms = await prisma.form.findMany({
      include: {
        fields: true,
        submissions: true,
        webhooks: true
      }
    });
    
    console.log('Exporting submissions...');
    const submissions = await prisma.submission.findMany();
    
    const exportData = {
      users,
      forms,
      submissions,
      exportDate: new Date().toISOString()
    };
    
    fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Data exported to data-export.json');
    console.log(`Exported: ${users.length} users, ${forms.length} forms, ${submissions.length} submissions`);
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
EOF
    
    echo "Running export script..."
    node export-data.js
    
    echo "✅ Local data exported!"
    echo "Next steps:"
    echo "1. Copy data-export.json to your EC2 server"
    echo "2. Run this script on EC2 to import the data"
    
else
    echo "Running on PRODUCTION server - importing data..."
    
    if [ ! -f "data-export.json" ]; then
        echo "❌ data-export.json not found!"
        echo "Please copy the exported data file to this directory first."
        exit 1
    fi
    
    # Import data to production database
    cat > import-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function importData() {
  try {
    const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));
    
    console.log(`Importing ${data.users.length} users...`);
    
    // Import users
    for (const user of data.users) {
      // Hash password if it's not already hashed
      let hashedPassword = user.password;
      if (!user.password.startsWith('$2b$')) {
        hashedPassword = await bcrypt.hash(user.password, 10);
      }
      
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            role: user.role,
            status: user.status,
            lastLogin: user.lastLogin,
            company: user.company,
            phone: user.phone,
            website: user.website
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: hashedPassword,
            role: user.role,
            status: user.status,
            lastLogin: user.lastLogin,
            company: user.company,
            phone: user.phone,
            website: user.website,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
        console.log(`✅ User imported: ${user.email}`);
      } catch (error) {
        console.log(`⚠️  User ${user.email} already exists or error:`, error.message);
      }
    }
    
    console.log(`Importing ${data.forms.length} forms...`);
    
    // Import forms
    for (const form of data.forms) {
      try {
        await prisma.form.upsert({
          where: { id: form.id },
          update: {
            title: form.title,
            description: form.description,
            slug: form.slug,
            published: form.published,
            settings: form.settings,
            submissionMessage: form.submissionMessage,
            categories: form.categories,
            tags: form.tags,
            isTemplate: form.isTemplate,
            isMultiPage: form.isMultiPage,
            successPageSettings: form.successPageSettings,
            multiPageSettings: form.multiPageSettings
          },
          create: {
            id: form.id,
            title: form.title,
            description: form.description,
            slug: form.slug,
            userId: form.userId,
            published: form.published,
            settings: form.settings,
            submissionMessage: form.submissionMessage,
            categories: form.categories,
            tags: form.tags,
            isTemplate: form.isTemplate,
            isMultiPage: form.isMultiPage,
            successPageSettings: form.successPageSettings,
            multiPageSettings: form.multiPageSettings,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt
          }
        });
        
        // Import form fields
        for (const field of form.fields) {
          await prisma.formField.upsert({
            where: { id: field.id },
            update: {
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              options: field.options,
              validation: field.validation,
              config: field.config,
              conditions: field.conditions,
              order: field.order,
              page: field.page
            },
            create: {
              id: field.id,
              formId: field.formId,
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              options: field.options,
              validation: field.validation,
              config: field.config,
              conditions: field.conditions,
              order: field.order,
              page: field.page,
              createdAt: field.createdAt,
              updatedAt: field.updatedAt
            }
          });
        }
        
        console.log(`✅ Form imported: ${form.title}`);
      } catch (error) {
        console.log(`⚠️  Form ${form.title} error:`, error.message);
      }
    }
    
    console.log(`Importing ${data.submissions.length} submissions...`);
    
    // Import submissions
    for (const submission of data.submissions) {
      try {
        await prisma.submission.upsert({
          where: { id: submission.id },
          update: {
            data: submission.data,
            status: submission.status,
            notes: submission.notes,
            tags: submission.tags,
            deviceInfo: submission.deviceInfo,
            locationInfo: submission.locationInfo
          },
          create: {
            id: submission.id,
            formId: submission.formId,
            data: submission.data,
            status: submission.status,
            notes: submission.notes,
            tags: submission.tags,
            deviceInfo: submission.deviceInfo,
            locationInfo: submission.locationInfo,
            submittedAt: submission.submittedAt,
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt
          }
        });
        console.log(`✅ Submission imported: ${submission.id}`);
      } catch (error) {
        console.log(`⚠️  Submission ${submission.id} error:`, error.message);
      }
    }
    
    console.log('🎉 Data import completed!');
    
    // Summary
    const userCount = await prisma.user.count();
    const formCount = await prisma.form.count();
    const submissionCount = await prisma.submission.count();
    
    console.log('\n=== Production Database Summary ===');
    console.log(`Users: ${userCount}`);
    console.log(`Forms: ${formCount}`);
    console.log(`Submissions: ${submissionCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
EOF
    
    echo "Running import script..."
    cd /home/ec2-user/formatic-unified/backend
    
    # Source NVM
    export NVM_DIR="/home/ec2-user/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    
    node import-data.js
    
    echo "✅ Production data imported!"
fi

echo "=== Migration completed ===" 
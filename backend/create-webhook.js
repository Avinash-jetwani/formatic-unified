// Script to create a webhook for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration (replace with your actual values)
const config = {
  formId: process.env.FORM_ID || '', // Set via environment variable or command line arg
  webhookUrl: process.env.WEBHOOK_URL || '', // Set via environment variable or command line arg
};

// Get command line arguments
const args = process.argv.slice(2);
if (args.length >= 1) {
  config.formId = args[0];
}
if (args.length >= 2) {
  config.webhookUrl = args[1];
}

async function main() {
  // Validate config
  if (!config.formId) {
    console.error('Error: Form ID is required. Please provide it as an env var or command line argument.');
    process.exit(1);
  }
  
  if (!config.webhookUrl) {
    console.error('Error: Webhook URL is required. Please provide it as an env var or command line argument.');
    process.exit(1);
  }
  
  console.log('Using configuration:');
  console.log(`Form ID: ${config.formId}`);
  console.log(`Webhook URL: ${config.webhookUrl}`);
  console.log('Checking for existing webhooks...');
  
  // Find existing webhooks for this form
  const existingWebhooks = await prisma.webhook.findMany({
    where: {
      formId: config.formId
    }
  });
  
  console.log(`Found ${existingWebhooks.length} webhooks for form ${config.formId}`);
  
  if (existingWebhooks.length === 0) {
    console.log('No webhooks found. Creating new webhook...');
    
    // Create a new webhook
    const newWebhook = await prisma.webhook.create({
      data: {
        formId: config.formId,
        name: 'Dynamic Webhook',
        url: config.webhookUrl,
        active: true,
        adminApproved: true,
        eventTypes: ['SUBMISSION_CREATED'],
        retryCount: 3,
        retryInterval: 60
      }
    });
    
    console.log('Created new webhook:', newWebhook);
  } else {
    // Check if any are active and approved
    const activeApproved = existingWebhooks.filter(w => w.active && w.adminApproved);
    
    if (activeApproved.length === 0) {
      console.log('Found webhooks but none are active and approved. Activating first webhook...');
      
      // Update the first webhook to be active and approved
      const updated = await prisma.webhook.update({
        where: { id: existingWebhooks[0].id },
        data: {
          active: true,
          adminApproved: true,
          url: config.webhookUrl // Update URL to the configured one
        }
      });
      
      console.log('Updated webhook:', updated);
    } else {
      console.log('Found active and approved webhooks:', activeApproved);
    }
  }
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
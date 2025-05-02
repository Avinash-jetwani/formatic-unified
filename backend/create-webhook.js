// Script to create a webhook for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The form ID from your submissions
const FORM_ID = '65fef360-29a5-40ed-a79e-78fccdc4842c';
// Your PHP endpoint URL - UPDATE THIS TO YOUR ACTUAL URL
const WEBHOOK_URL = 'https://test.glassshop.aeapp.uk/webhook-receiver.php';

async function main() {
  console.log('Checking for existing webhooks...');
  
  // Find existing webhooks for this form
  const existingWebhooks = await prisma.webhook.findMany({
    where: {
      formId: FORM_ID
    }
  });
  
  console.log(`Found ${existingWebhooks.length} webhooks for form ${FORM_ID}`);
  
  if (existingWebhooks.length === 0) {
    console.log('No webhooks found. Creating new webhook...');
    
    // Create a new webhook
    const newWebhook = await prisma.webhook.create({
      data: {
        formId: FORM_ID,
        name: 'PHP Form Webhook',
        url: WEBHOOK_URL,
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
          url: WEBHOOK_URL // Update URL just in case
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
import { PrismaClient } from '@prisma/client';

/**
 * This is a utility script to create a test webhook for a specific form.
 * Run this script using:
 * node -e "require('./dist/webhooks/webhook-test-creator').createTestWebhook('your-form-id-here', 'https://your-test-endpoint.com')"
 */

export async function createTestWebhook(formId: string, url: string = 'https://webhook.site/') {
  if (!formId) {
    console.error('Error: Form ID is required');
    return;
  }
  
  const prisma = new PrismaClient();
  
  try {
    console.log(`Creating test webhook for form ${formId}...`);
    
    // First check if the form exists
    const form = await prisma.form.findUnique({
      where: { id: formId }
    });
    
    if (!form) {
      console.error(`Error: Form with ID ${formId} not found`);
      return;
    }
    
    // Create a test webhook
    const webhook = await prisma.webhook.create({
      data: {
        formId,
        name: 'Test Webhook',
        url,
        active: true,
        adminApproved: true, // Auto-approve for testing
        eventTypes: ['SUBMISSION_CREATED'],
        retryCount: 3,
        retryInterval: 60
      }
    });
    
    console.log('Test webhook created successfully:');
    console.log(JSON.stringify(webhook, null, 2));
    
    return webhook;
  } catch (error) {
    console.error('Error creating test webhook:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is executed directly
if (require.main === module) {
  // Get command line arguments
  const formId = process.argv[2];
  const webhookUrl = process.argv[3] || 'https://webhook.site/';
  
  if (!formId) {
    console.error('Usage: node webhook-test-creator.js <formId> [webhookUrl]');
    process.exit(1);
  }
  
  createTestWebhook(formId, webhookUrl)
    .then(() => console.log('Webhook creation script completed'))
    .catch(e => console.error('Error running webhook creation script:', e));
} 
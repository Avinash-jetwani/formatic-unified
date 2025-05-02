import { approveAllWebhooks } from './webhook-fix';
import { createTestWebhook } from './webhook-test-creator';

/**
 * This script combines webhook fixes to make the webhook system work
 * 1. Approves all existing webhooks
 * 2. Creates a test webhook for a form if specified
 * 
 * Run with:
 * node -e "require('./dist/webhooks/fix-all').fixAll('FORM_ID', 'WEBHOOK_URL')"
 */
export async function fixAll(formId?: string, webhookUrl?: string) {
  try {
    // First approve all existing webhooks
    await approveAllWebhooks();
    
    // Then create a test webhook if a form ID is provided
    if (formId) {
      console.log(`\nCreating test webhook for form ${formId}...`);
      await createTestWebhook(formId, webhookUrl);
    }
    
    console.log('\nWebhook fixes have been applied successfully!');
    console.log('Your webhooks should now trigger properly when new submissions are created.');
  } catch (error) {
    console.error('Error applying webhook fixes:', error);
  }
}

// Run this function if this script is executed directly
if (require.main === module) {
  const formId = process.argv[2];
  const webhookUrl = process.argv[3];
  
  fixAll(formId, webhookUrl)
    .then(() => console.log('All webhook fixes completed'))
    .catch(e => console.error('Error running webhook fixes:', e));
} 
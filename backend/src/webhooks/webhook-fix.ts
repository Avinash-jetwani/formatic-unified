import { PrismaClient } from '@prisma/client';

/**
 * This is a utility script to approve all webhooks for testing purposes.
 * Run this script using:
 * node -e "require('./dist/webhooks/webhook-fix').approveAllWebhooks()"
 */

export async function approveAllWebhooks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Approving all webhooks for testing...');
    
    // Find all webhooks that are not approved
    const webhooks = await prisma.webhook.findMany({
      where: {
        adminApproved: false
      }
    });
    
    console.log(`Found ${webhooks.length} unapproved webhooks`);
    
    if (webhooks.length > 0) {
      // Update all webhooks to be approved
      const result = await prisma.webhook.updateMany({
        where: {
          adminApproved: false
        },
        data: {
          adminApproved: true
        }
      });
      
      console.log(`Successfully approved ${result.count} webhooks`);
    }
    
    // Double-check all webhooks are now approved
    const verifyWebhooks = await prisma.webhook.findMany({
      where: {
        adminApproved: false
      }
    });
    
    if (verifyWebhooks.length === 0) {
      console.log('All webhooks are now approved');
    } else {
      console.log(`Warning: ${verifyWebhooks.length} webhooks are still not approved`);
    }
    
  } catch (error) {
    console.error('Error approving webhooks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run this function if this script is executed directly
if (require.main === module) {
  approveAllWebhooks()
    .then(() => console.log('Webhook approval script completed'))
    .catch(e => console.error('Error running webhook approval script:', e));
} 
// Fix Webhook Status Script
// This script will update all webhook statuses where adminApproved is 'false'
// to be 'null' to indicate pending status instead of rejected

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting webhook status fix...');
  
  // Get all webhooks with adminApproved=false
  const webhooks = await prisma.webhook.findMany({
    where: {
      adminApproved: false
    },
    include: {
      createdBy: {
        select: {
          role: true
        }
      },
      form: {
        select: {
          id: true,
          clientId: true,
          client: {
            select: {
              role: true
            }
          }
        }
      }
    }
  });
  
  console.log(`Found ${webhooks.length} webhooks to check...`);
  
  let updatedCount = 0;
  
  // Update each webhook that was created by a client or belongs to a client's form
  for (const webhook of webhooks) {
    // Check if created by client OR belongs to a client's form
    const isClientWebhook = 
      (webhook.createdBy && webhook.createdBy.role === 'CLIENT') || 
      (webhook.form && webhook.form.client && webhook.form.client.role === 'CLIENT');
    
    // Only update if it's a client webhook
    if (isClientWebhook) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { adminApproved: null }
      });
      console.log(`Updated webhook ${webhook.id} to pending status`);
      updatedCount++;
    }
  }
  
  console.log(`Webhook status fix completed: ${updatedCount} webhooks updated`);
  
  // Also run a second query to update any webhooks with undefined/null createdBy but adminApproved=false
  const uncategorizedWebhooks = await prisma.webhook.findMany({
    where: {
      adminApproved: false,
      createdById: null
    }
  });
  
  console.log(`Found ${uncategorizedWebhooks.length} uncategorized webhooks...`);
  
  for (const webhook of uncategorizedWebhooks) {
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { adminApproved: null }
    });
    console.log(`Updated uncategorized webhook ${webhook.id} to pending status`);
    updatedCount++;
  }
  
  console.log(`Total webhooks updated: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error('Error in webhook status fix script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
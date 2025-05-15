// Fix Webhook Status Script
// This script will update all webhook statuses where adminApproved is 'false'
// to be 'null' to indicate pending status instead of rejected

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting webhook status fix...');
  
  // Get all webhooks with adminApproved=false that were created by clients
  const webhooks = await prisma.webhook.findMany({
    where: {
      adminApproved: false,
      createdBy: {
        role: 'CLIENT'
      }
    },
    include: {
      createdBy: {
        select: {
          role: true
        }
      }
    }
  });
  
  console.log(`Found ${webhooks.length} webhooks to update...`);
  
  // Update each webhook to have adminApproved=null (pending status)
  for (const webhook of webhooks) {
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { adminApproved: null }
    });
    console.log(`Updated webhook ${webhook.id} to pending status`);
  }
  
  console.log('Webhook status fix completed successfully');
}

main()
  .catch((e) => {
    console.error('Error in webhook status fix:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
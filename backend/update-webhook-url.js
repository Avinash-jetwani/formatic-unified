// Script to update webhook URL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The webhook ID from the previous output
const WEBHOOK_ID = 'cma5vaj9l00010sg679v39tp5';
// The correct PHP endpoint URL
const WEBHOOK_URL = 'https://test.glassshop.aeapp.uk/webhook-receiver.php';

async function main() {
  console.log(`Updating webhook ${WEBHOOK_ID} with URL ${WEBHOOK_URL}...`);
  
  // Update the webhook URL
  const updated = await prisma.webhook.update({
    where: { id: WEBHOOK_ID },
    data: {
      url: WEBHOOK_URL
    }
  });
  
  console.log('Updated webhook URL:', updated.url);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
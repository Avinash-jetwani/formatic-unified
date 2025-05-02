// Script to update webhook URL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration (replace with your actual values)
const config = {
  webhookId: process.env.WEBHOOK_ID || '', // Set via environment variable or command line arg
  webhookUrl: process.env.WEBHOOK_URL || '', // Set via environment variable or command line arg
};

// Get command line arguments
const args = process.argv.slice(2);
if (args.length >= 1) {
  config.webhookId = args[0];
}
if (args.length >= 2) {
  config.webhookUrl = args[1];
}

async function main() {
  // Validate config
  if (!config.webhookId) {
    console.error('Error: Webhook ID is required. Please provide it as an env var or command line argument.');
    process.exit(1);
  }
  
  if (!config.webhookUrl) {
    console.error('Error: Webhook URL is required. Please provide it as an env var or command line argument.');
    process.exit(1);
  }
  
  console.log(`Updating webhook ${config.webhookId} with URL ${config.webhookUrl}...`);
  
  // Update the webhook URL
  const updated = await prisma.webhook.update({
    where: { id: config.webhookId },
    data: {
      url: config.webhookUrl
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
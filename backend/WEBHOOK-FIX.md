# Webhook System Fix Guide

This guide provides solutions for fixing issues with the webhook system.

## Problem: Webhooks Not Triggering for Form Submissions

If your webhooks aren't triggering when new form submissions are created, it may be due to one of these issues:

1. The webhook isn't approved by an admin (`adminApproved: false`)
2. The webhook isn't active (`active: false`)
3. No webhook is configured for your specific form

## Solution: Run the Webhook Fix Script

We've created automated scripts to fix these issues:

### Option 1: Approve All Webhooks

If you have webhooks already configured but they're not firing:

```bash
# From the backend directory
node -e "require('./dist/webhooks/webhook-fix').approveAllWebhooks()"
```

### Option 2: Create a Test Webhook for a Form

If you need to create a webhook for a specific form:

```bash
# From the backend directory
node -e "require('./dist/webhooks/webhook-test-creator').createTestWebhook('YOUR_FORM_ID', 'YOUR_WEBHOOK_URL')"
```

Replace:
- `YOUR_FORM_ID` with the ID of your form
- `YOUR_WEBHOOK_URL` with your webhook endpoint URL (e.g., `https://webhook.site/your-unique-id`)

### Option 3: Fix Everything at Once

To approve all webhooks AND create a test webhook:

```bash
# From the backend directory
node -e "require('./dist/webhooks/fix-all').fixAll('YOUR_FORM_ID', 'YOUR_WEBHOOK_URL')"
```

## Verifying the Fix

After running the fix:

1. Create a new submission through your form
2. Check the backend logs - you should see:
   - `Triggering webhooks for form [formId]`
   - `Found [N] webhooks to trigger` (where N > 0)
   - `Queuing webhook [webhookId] to [url]`

3. Check your webhook endpoint to confirm it received the data

## Webhook Testing Tools

For testing, you can use:
- [Webhook.site](https://webhook.site/) - free webhook testing service
- [RequestBin](https://requestbin.com/) - another webhook testing tool

## Still Having Issues?

If you're still experiencing problems:

1. Check your database to confirm webhooks exist:
   ```sql
   SELECT * FROM "Webhook" WHERE "formId" = 'YOUR_FORM_ID';
   ```

2. Verify the webhook processor is running in logs:
   ```
   [WebhookProcessorTask] Processing webhook queue...
   ```

3. Check for webhook deliveries:
   ```sql
   SELECT * FROM "WebhookDelivery" ORDER BY "requestTimestamp" DESC LIMIT 10;
   ``` 
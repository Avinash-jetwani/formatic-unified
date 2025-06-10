#!/bin/bash

echo "🔍 Webhook Email Monitoring Script"
echo "================================="
echo ""

echo "📊 Checking if backend server is running..."
if pgrep -f "node.*main" > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running"
    exit 1
fi

echo ""
echo "📋 To monitor webhook email logs in real-time, run:"
echo "   pm2 logs backend --follow"
echo ""
echo "🔍 To search for webhook email related logs, run:"
echo "   pm2 logs backend --lines 100 | grep -i 'webhook.*email\\|sendWebhookSetupConfirmation\\|WEBHOOK EMAIL DEBUG'"
echo ""
echo "📧 Key log indicators to look for:"
echo "   - '🔍 WEBHOOK EMAIL SERVICE DEBUG - Starting sendWebhookSetupConfirmation'"
echo "   - '📊 Environment: NODE_ENV=production, isDev=false'"
echo "   - '📊 SMTP Config: MAIL_HOST=configured, MAIL_USER=configured'"
echo "   - '✅ Email sent via SMTP to [email] with template webhook-setup-confirmation'"
echo ""
echo "❌ Error indicators to watch for:"
echo "   - 'Failed to send email'"
echo "   - 'Development mode detected'"
echo "   - 'MAIL_HOST=not configured'"
echo ""

# Check recent logs for webhook email activity
echo "🔍 Checking recent logs for webhook email activity..."
if command -v pm2 &> /dev/null; then
    echo "Last 50 lines containing webhook email activity:"
    pm2 logs backend --lines 50 --raw | grep -i "webhook.*email\|sendWebhookSetupConfirmation\|WEBHOOK EMAIL DEBUG" | tail -10
else
    echo "PM2 not found. Please check logs manually using your process manager."
fi

echo ""
echo "🧪 To test webhook email functionality:"
echo "1. Go to your app dashboard"
echo "2. Create a new webhook for any form"
echo "3. Check the server logs for the debug messages above"
echo "4. Check your email inbox for the webhook confirmation email"
echo "" 
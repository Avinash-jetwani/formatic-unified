import { NextRequest, NextResponse } from 'next/server';

// Local mock data for debugging
const debugWebhooks: any[] = [
  {
    id: 'webhook_debug_01',
    formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
    name: 'Debug Webhook',
    url: 'http://localhost:3000/api/webhook-test',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminApproved: true,
    authType: 'NONE',
    allowedIpAddresses: [],
    eventTypes: ['SUBMISSION_CREATED'],
    includeFields: [],
    excludeFields: [],
    retryCount: 3,
    retryInterval: 60,
    dailyUsage: 0,
    isTemplate: false
  }
];

// Debug endpoint for webhook system
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  try {
    switch (action) {
      case 'list-webhooks':
        return NextResponse.json({
          status: 'success',
          webhooks: debugWebhooks
        });
        
      case 'create-webhook':
        const formId = searchParams.get('formId') || '65fef360-29a5-40ed-a79e-78fccdc4842c';
        const name = searchParams.get('name') || 'Debug Test Webhook';
        const url = searchParams.get('url') || 'http://localhost:3000/api/webhook-test';
        
        const newWebhook = {
          id: `webhook_debug_${Date.now().toString(36)}`,
          formId: formId,
          name: name,
          url: url,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminApproved: true,
          authType: 'NONE',
          allowedIpAddresses: [],
          eventTypes: ['SUBMISSION_CREATED'],
          includeFields: [],
          excludeFields: [],
          retryCount: 3,
          retryInterval: 60,
          dailyUsage: 0,
          isTemplate: false
        };
        
        debugWebhooks.push(newWebhook);
        
        return NextResponse.json({
          status: 'success',
          message: 'Debug webhook created',
          webhook: newWebhook
        });
        
      case 'test-webhook':
        const webhookId = searchParams.get('webhookId');
        const webhook = webhookId 
          ? debugWebhooks.find(w => w.id === webhookId)
          : debugWebhooks[0];
          
        if (!webhook) {
          return NextResponse.json({
            status: 'error',
            message: 'No webhook found'
          }, { status: 404 });
        }
        
        // Send a test webhook
        const testPayload = {
          event: 'SUBMISSION_CREATED',
          form: {
            id: webhook.formId,
            title: 'Debug Test Form'
          },
          submission: {
            id: `sub_debug_${Date.now().toString(36)}`,
            createdAt: new Date().toISOString(),
            data: {
              name: 'Test User',
              email: 'test@example.com',
              message: 'This is a test webhook payload'
            }
          },
          timestamp: new Date().toISOString()
        };
        
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Source': 'Formatic-Debug'
            },
            body: JSON.stringify(testPayload)
          });
          
          const responseData = await response.json();
          
          return NextResponse.json({
            status: 'success',
            message: 'Test webhook sent',
            webhook: webhook,
            testPayload,
            response: {
              status: response.status,
              data: responseData
            }
          });
        } catch (webhookError) {
          return NextResponse.json({
            status: 'error',
            message: 'Error sending test webhook',
            webhook: webhook,
            testPayload,
            error: webhookError instanceof Error ? webhookError.message : 'Unknown error'
          }, { status: 500 });
        }
        
      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action. Use one of: list-webhooks, create-webhook, test-webhook'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook debug API error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error in webhook debug API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
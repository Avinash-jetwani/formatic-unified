import { NextRequest, NextResponse } from 'next/server';
import { mockWebhooks } from '../../route';

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string, webhookId: string } }
) {
  try {
    // Log the request
    console.log('Mock webhook test API: Testing webhook:', params.webhookId);
    
    // Get the request body if provided
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // If there's no body or it's not valid JSON, use an empty object
    }
    
    // Find the webhook by ID
    const webhook = mockWebhooks.find(w => w.id === params.webhookId);
    
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found', message: `No webhook with ID ${params.webhookId}` },
        { status: 404 }
      );
    }
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a simulated test response
    const testResponse = {
      success: true,
      message: `Webhook test for ${webhook.name} completed successfully`,
      timestamp: new Date().toISOString(),
      requestDetails: {
        url: webhook.url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Formatic-Webhook-Service/1.0',
          ...(webhook.authType === 'BEARER' ? { 'Authorization': `Bearer ${webhook.authValue || 'token'}` } : {}),
          ...(webhook.authType === 'API_KEY' ? { 'X-API-Key': webhook.authValue || 'api_key' } : {}),
        },
        body: (body as any).payload || {
          event: 'SUBMISSION_CREATED',
          form: {
            id: params.formId,
            name: 'Sample Form'
          },
          submission: {
            id: `sub_${Date.now().toString(36)}`,
            createdAt: new Date().toISOString(),
            fields: {
              name: 'Test User',
              email: 'test@example.com',
              message: 'This is a test webhook payload'
            }
          }
        }
      },
      responseDetails: {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'server': 'Mock-Server/1.0'
        },
        body: {
          success: true,
          message: 'Webhook received',
          id: `rec_${Date.now().toString(36)}`
        }
      }
    };
    
    return NextResponse.json(testResponse);
  } catch (error) {
    console.error('Mock webhook test API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
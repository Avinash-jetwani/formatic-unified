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
    
    // Create a payload that matches PHP expectations
    const submissionId = `sub_${Date.now().toString(36)}`;
    const payload = {
      event: 'SUBMISSION_CREATED',
      form: {
        id: params.formId,
        title: 'Contact Form'
      },
      submission: {
        id: submissionId,
        createdAt: new Date().toISOString(),
        data: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test webhook payload',
          phone: '123-456-7890'
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Make an actual HTTP request to the webhook URL
    console.log(`Sending test webhook to ${webhook.url}`);
    let response;
    try {
      // Log the exact payload we're sending for debugging
      console.log('Test webhook payload:', JSON.stringify(payload, null, 2));
      
      response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Formatic-Webhook-Service/1.0',
          'X-Formatic-Event': 'SUBMISSION_CREATED',
          'X-Formatic-Delivery-ID': `test_${Date.now().toString(36)}`,
          ...(webhook.authType === 'BEARER' ? { 'Authorization': `Bearer ${webhook.authValue || 'token'}` } : {}),
          ...(webhook.authType === 'API_KEY' ? { 'X-API-Key': webhook.authValue || 'api_key' } : {})
        },
        body: JSON.stringify(payload)
      });
      
      // Log response status and handle different response types
      console.log(`Test webhook response status: ${response.status}`);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('Test webhook JSON response:', JSON.stringify(responseData, null, 2));
      } else {
        responseData = await response.text();
        console.log('Test webhook text response:', responseData);
      }
      
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
            'X-Formatic-Event': 'SUBMISSION_CREATED',
            'X-Formatic-Delivery-ID': `test_${Date.now().toString(36)}`,
            ...(webhook.authType === 'BEARER' ? { 'Authorization': `Bearer ${webhook.authValue || 'token'}` } : {}),
            ...(webhook.authType === 'API_KEY' ? { 'X-API-Key': webhook.authValue || 'api_key' } : {})
          },
          body: payload
        },
        responseDetails: {
          statusCode: response.status,
          headers: {
            'content-type': response.headers.get('content-type') || 'application/json'
          },
          body: responseData
        }
      };
      
      return NextResponse.json(testResponse);
    } catch (error) {
      console.error('Error sending test webhook:', error);
      
      return NextResponse.json({
        success: false,
        message: `Error sending webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        requestDetails: {
          url: webhook.url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Formatic-Webhook-Service/1.0'
          },
          body: payload
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  } catch (error) {
    console.error('Mock webhook test API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
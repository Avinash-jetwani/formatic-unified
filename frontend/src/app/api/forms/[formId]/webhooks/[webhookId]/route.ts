import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import the mock webhooks from parent route
// In a real app, you'd use proper state management or database
import { mockWebhooks } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string, webhookId: string } }
) {
  try {
    // Log the request
    console.log('Mock webhook API: GET single webhook:', params.webhookId);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Find the webhook by ID
    const webhook = mockWebhooks.find(w => w.id === params.webhookId);
    
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found', message: `No webhook with ID ${params.webhookId}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Mock webhook API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { formId: string, webhookId: string } }
) {
  try {
    const body = await request.json();
    console.log('Mock webhook API: PATCH request for webhook ID:', params.webhookId, 'with data:', body);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the webhook to update
    const webhookIndex = mockWebhooks.findIndex(w => w.id === params.webhookId);
    
    if (webhookIndex === -1) {
      return NextResponse.json(
        { error: 'Webhook not found', message: `No webhook with ID ${params.webhookId}` },
        { status: 404 }
      );
    }
    
    // Update the webhook
    const updatedWebhook = {
      ...mockWebhooks[webhookIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    mockWebhooks[webhookIndex] = updatedWebhook;
    
    return NextResponse.json(updatedWebhook);
  } catch (error) {
    console.error('Mock webhook API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string, webhookId: string } }
) {
  try {
    console.log('Mock webhook API: DELETE request for webhook ID:', params.webhookId);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Find the webhook index
    const webhookIndex = mockWebhooks.findIndex(w => w.id === params.webhookId);
    
    if (webhookIndex === -1) {
      return NextResponse.json(
        { error: 'Webhook not found', message: `No webhook with ID ${params.webhookId}` },
        { status: 404 }
      );
    }
    
    // Remove the webhook
    mockWebhooks.splice(webhookIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mock webhook API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
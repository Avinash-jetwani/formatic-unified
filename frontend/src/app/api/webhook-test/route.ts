import { NextRequest, NextResponse } from 'next/server';

// Store received webhooks for viewing
const receivedWebhooks: any[] = [];

export async function POST(request: NextRequest) {
  try {
    // Get request body and headers
    const body = await request.json();
    const headers = Object.fromEntries(request.headers);
    
    // Log the received webhook
    console.log('Webhook test received:', {
      timestamp: new Date().toISOString(),
      headers,
      body
    });
    
    // Store for viewing (limit to 10 most recent)
    receivedWebhooks.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      headers,
      body
    });
    
    if (receivedWebhooks.length > 10) {
      receivedWebhooks.pop();
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return all received webhooks
  return NextResponse.json({
    count: receivedWebhooks.length,
    webhooks: receivedWebhooks
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import { mockWebhooks } from '../../route';

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string, webhookId: string } }
) {
  try {
    console.log('Mock webhook test API: testing webhook ID:', params.webhookId);
    
    // Simulate a brief delay to mimic network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Find the webhook
    const webhook = mockWebhooks.find(w => w.id === params.webhookId);
    
    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found', message: `No webhook with ID ${params.webhookId}` },
        { status: 404 }
      );
    }

    // 80% chance of success
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      return NextResponse.json({
        success: true,
        statusCode: 200,
        responseTime: Math.floor(Math.random() * 500) + 100, // Random response time between 100-600ms
        message: 'Test webhook delivered successfully',
        deliveryId: `delivery_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Simulate random failure
      const errorCodes = [400, 401, 403, 404, 500, 502, 504];
      const statusCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
      const errorMessages = [
        'Invalid request',
        'Authentication failed',
        'Access denied',
        'Endpoint not found',
        'Internal server error',
        'Bad gateway',
        'Gateway timeout'
      ];
      const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      return NextResponse.json({
        success: false,
        statusCode,
        responseTime: Math.floor(Math.random() * 500) + 100,
        error: errorMessage,
        deliveryId: `delivery_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Mock webhook test API error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
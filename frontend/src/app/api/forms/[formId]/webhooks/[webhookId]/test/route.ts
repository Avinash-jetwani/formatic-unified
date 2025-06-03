import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string; webhookId: string } }
) {
  const formId = params.formId;
  const webhookId = params.webhookId;
  
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get request body if it exists
    let requestData = {};
    try {
      requestData = await request.json();
    } catch (e) {
      // Ignore if there's no body
    }
    
    console.log('Testing webhook with data:', requestData);
    
    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://127.0.0.1:3001'}/api/forms/${formId}/webhooks/${webhookId}/test`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to test webhook' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while testing webhook' },
      { status: 500 }
    );
  }
} 
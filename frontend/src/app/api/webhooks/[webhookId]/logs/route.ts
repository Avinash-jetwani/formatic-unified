import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    // Log the request
    console.log('Mock webhook logs API: GET logs for webhook ID:', params.webhookId);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Create mock log data
    const mockLogs = Array(3).fill(null).map((_, i) => ({
      id: `log_${Date.now().toString(36)}_${i}`,
      webhookId: params.webhookId,
      submissionId: `sub_${Date.now().toString(36)}_${i}`,
      eventType: 'SUBMISSION_CREATED',
      status: i === 0 ? 'SUCCESS' : i === 1 ? 'FAILED' : 'PENDING',
      requestTimestamp: new Date(Date.now() - i * 3600000).toISOString(),
      responseTimestamp: i !== 2 ? new Date(Date.now() - i * 3600000 + 500).toISOString() : null,
      requestBody: {
        event: 'SUBMISSION_CREATED',
        form: {
          id: '65fef360-29a5-40ed-a79e-78fccdc4842c',
          title: 'Contact Form'
        },
        submission: {
          id: `sub_${Date.now().toString(36)}_${i}`,
          data: {
            name: 'Test User',
            email: 'test@example.com',
            message: 'This is test submission ' + i
          }
        }
      },
      responseBody: i === 0 ? {
        success: true,
        message: 'Webhook received and processed'
      } : i === 1 ? {
        error: 'Internal server error',
        status: 500
      } : null,
      statusCode: i === 0 ? 200 : i === 1 ? 500 : null,
      errorMessage: i === 1 ? 'Server responded with 500 Internal Server Error' : null,
      attemptCount: i === 1 ? 3 : i === 2 ? 0 : 1,
      nextAttempt: i === 2 ? new Date(Date.now() + 300000).toISOString() : null
    }));
    
    // Return paginated response
    return NextResponse.json({
      data: mockLogs,
      meta: {
        total: 3,
        page: page,
        limit: limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
  } catch (error) {
    console.error('Mock webhook logs API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
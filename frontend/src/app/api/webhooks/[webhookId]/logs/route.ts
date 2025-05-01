import { NextRequest, NextResponse } from 'next/server';

// Mock webhook logs for development/testing
const generateMockLogs = (webhookId: string, count: number = 10) => {
  const logs = [];
  const statuses = ['SUCCESS', 'FAILED', 'PENDING'];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - i * 3600000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isSuccess = status === 'SUCCESS';
    
    logs.push({
      id: `log_${webhookId}_${i}`,
      webhookId,
      submissionId: `sub_${Date.now().toString(36)}_${i}`,
      eventType: 'SUBMISSION_CREATED',
      status,
      requestTimestamp: timestamp.toISOString(),
      responseTimestamp: isSuccess ? new Date(timestamp.getTime() + 500).toISOString() : null,
      requestBody: {
        event: 'SUBMISSION_CREATED',
        form: { id: 'form_id', title: 'Test Form' },
        submission: {
          id: `sub_id_${i}`,
          data: {
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      },
      responseBody: isSuccess ? { success: true } : null,
      statusCode: isSuccess ? 200 : null,
      errorMessage: !isSuccess && status === 'FAILED' ? 'Connection timeout' : null,
      attemptCount: status === 'FAILED' ? Math.floor(Math.random() * 3) + 1 : 1,
      nextAttempt: status === 'FAILED' ? new Date(Date.now() + 3600000).toISOString() : null
    });
  }
  
  return logs;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const { webhookId } = params;
  const { searchParams } = new URL(request.url);
  
  // Parse pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status');
  
  console.log(`[API] Getting webhook logs for webhookId: ${webhookId}, page: ${page}, limit: ${limit}`);
  
  // Generate mock logs
  let logs = generateMockLogs(webhookId, 25);
  
  // Apply status filter if provided
  if (status) {
    logs = logs.filter(log => log.status === status);
  }
  
  // Calculate pagination
  const total = logs.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = logs.slice(startIndex, endIndex);
  
  // Return paginated response
  return NextResponse.json({
    data: paginatedLogs,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  });
} 
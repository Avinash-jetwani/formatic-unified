import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string, logId: string } }
) {
  const { webhookId, logId } = params;
  
  console.log(`[API] Getting webhook log detail: webhookId=${webhookId}, logId=${logId}`);
  
  // For demo purposes, create a mock log
  const isSuccess = logId.includes('success');
  const status = isSuccess ? 'SUCCESS' : logId.includes('pending') ? 'PENDING' : 'FAILED';
  
  const mockLog = {
    id: logId,
    webhookId,
    submissionId: `sub_${Date.now().toString(36)}`,
    eventType: 'SUBMISSION_CREATED',
    status,
    requestTimestamp: new Date(Date.now() - 3600000).toISOString(),
    responseTimestamp: status !== 'PENDING' ? new Date(Date.now() - 3599500).toISOString() : null,
    requestBody: {
      event: 'SUBMISSION_CREATED',
      form: { id: 'form_id', title: 'Test Form' },
      submission: {
        id: `sub_id_123`,
        data: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message',
          phone: '123-456-7890'
        }
      }
    },
    responseBody: status === 'SUCCESS' ? { 
      success: true, 
      message: 'Webhook received and processed' 
    } : null,
    statusCode: status === 'SUCCESS' ? 200 : status === 'FAILED' ? 500 : null,
    errorMessage: status === 'FAILED' ? 'Connection timeout or server error' : null,
    attemptCount: status === 'FAILED' ? 2 : 1,
    nextAttempt: status === 'FAILED' ? new Date(Date.now() + 3600000).toISOString() : null
  };
  
  return NextResponse.json(mockLog);
} 
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock data to simulate webhooks - exported for use in other routes
export const mockWebhooks = [
  {
    id: 'webhook_01',
    formId: 'form_01',
    name: 'Zapier Integration',
    url: 'https://hooks.zapier.com/hooks/catch/12345/abcdef/',
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
  },
  {
    id: 'webhook_02',
    formId: 'form_02',
    name: 'Slack Notification',
    url: 'https://hooks.slack.com/services/T12345/B12345/abcdefghijklmn',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminApproved: true,
    authType: 'BEARER',
    authValue: 'xoxb-12345',
    allowedIpAddresses: [],
    eventTypes: ['SUBMISSION_CREATED', 'SUBMISSION_UPDATED'],
    includeFields: ['email', 'name'],
    excludeFields: [],
    retryCount: 3,
    retryInterval: 60,
    dailyUsage: 0,
    isTemplate: false
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    // Log the request
    console.log('Mock webhook API: GET request for form ID:', params.formId);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // If the form ID matches our mock data, return those webhooks
    // Otherwise return an empty array
    const webhooks = params.formId === 'form_01' || params.formId === 'form_02' 
      ? mockWebhooks.filter(w => w.formId === params.formId)
      : [];
    
    // If we have the special form ID that we're viewing, return all webhooks
    if (params.formId === '65fef360-29a5-40ed-a79e-78fccdc4842c') {
      return NextResponse.json(mockWebhooks);
    }
    
    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Mock webhook API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const body = await request.json();
    console.log('Mock webhook API: POST request for form ID:', params.formId, 'with data:', body);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a new webhook
    const newWebhook = {
      id: `webhook_${Date.now().toString(36)}`,
      formId: params.formId,
      name: body.name || 'New Webhook',
      url: body.url || 'https://example.com/webhook',
      active: body.active !== undefined ? body.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      secretKey: body.secretKey,
      createdById: 'user_01',
      adminApproved: true,
      adminNotes: body.adminNotes,
      authType: body.authType || 'NONE',
      authValue: body.authValue,
      allowedIpAddresses: body.allowedIpAddresses || [],
      verificationToken: body.verificationToken,
      eventTypes: body.eventTypes || ['SUBMISSION_CREATED'],
      headers: body.headers,
      includeFields: body.includeFields || [],
      excludeFields: body.excludeFields || [],
      retryCount: body.retryCount || 3,
      retryInterval: body.retryInterval || 60,
      dailyLimit: body.dailyLimit,
      dailyUsage: 0,
      dailyResetAt: null,
      filterConditions: body.filterConditions,
      isTemplate: body.isTemplate || false,
      templateId: body.templateId
    };
    
    // In a real implementation, you would save this to the database
    mockWebhooks.push(newWebhook);
    
    return NextResponse.json(newWebhook);
  } catch (error) {
    console.error('Mock webhook API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock data to simulate webhooks - local constant, not exported
const mockWebhooks = [
  {
    id: 'webhook_01',
    formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
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
    formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
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

// Add a debug log for when the route is loaded
console.log('Webhook API route module loaded');

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    // Log the request
    console.log('Mock webhook API: GET request for form ID:', params.formId);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter webhooks by formId
    const webhooks = mockWebhooks.filter(w => w.formId === params.formId);
    
    console.log(`Returning ${webhooks.length} webhooks for form ${params.formId}`);
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
    
    console.log('Created new webhook:', newWebhook.id);
    
    return NextResponse.json(newWebhook);
  } catch (error) {
    console.error('Mock webhook API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
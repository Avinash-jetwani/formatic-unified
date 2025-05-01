import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface Submission {
  id: string;
  formId: string;
  data: Record<string, any>;
  status: string;
  createdAt: string;
  ipAddress: string;
  userAgent: string | null;
  referrer: string | null;
}

// Mock database for storing submissions
const submissions: Submission[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Form submission received:', body);
    
    if (!body.formId || !body.data) {
      return NextResponse.json(
        { error: 'Invalid submission data. formId and data are required.' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID
    const id = `sub_${Date.now().toString(36)}`;
    
    // Create a submission record
    const submission: Submission = {
      id,
      formId: body.formId,
      data: body.data,
      status: 'new',
      createdAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
    };
    
    // Add to our mock database
    submissions.push(submission);
    
    // Find any webhooks configured for this form
    // For testing, we'll use a hardcoded webhook for the specific form IDs we're testing with
    const webhookUrl = 'https://test.glassshop.aeapp.uk/api/formatic-webhook';
    
    // Special case for form ID we're working with
    if (body.formId === '65fef360-29a5-40ed-a79e-78fccdc4842c') {
      try {
        console.log(`Triggering webhook to ${webhookUrl}`);
        
        // Format payload exactly as PHP expects
        const webhookPayload = {
          event: 'SUBMISSION_CREATED',
          form: {
            id: body.formId,
            title: 'Contact Form'
          },
          submission: {
            id,
            createdAt: submission.createdAt,
            data: submission.data
          },
          timestamp: new Date().toISOString()
        };
        
        // Send the webhook
        const response = await axios.post(webhookUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Formatic-Webhook-Service/1.0',
            'X-Formatic-Event': 'SUBMISSION_CREATED',
            'X-Formatic-Delivery-ID': `del_${Date.now().toString(36)}`
          }
        });
        
        console.log('Webhook delivery response:', response.status, response.data);
      } catch (error: any) {
        console.error('Error delivering webhook:', error.message);
      }
    }
    
    // Return success response with the new submission
    return NextResponse.json({
      id,
      message: 'Submission received successfully',
      formId: body.formId,
      submissionId: id
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your submission.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    // Filter submissions by formId if provided
    let result = submissions;
    if (formId) {
      result = submissions.filter(s => s.formId === formId);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching submissions.' },
      { status: 500 }
    );
  }
} 
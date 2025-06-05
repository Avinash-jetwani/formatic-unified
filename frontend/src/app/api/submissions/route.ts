import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface Submission {
  id: string;
  formId: string;
  form: {
    id: string;
    title: string;
    slug: string;
  };
  data: Record<string, any>;
  status: string;
  createdAt: string;
  ipAddress: string;
  userAgent: string | null;
  referrer: string | null;
}

// Mock database for storing submissions with some sample data
const submissions: Submission[] = [
  {
    id: 'sub_1',
    formId: '722060e7-f061-4865-925c-ed3f8034ffb6',
    form: {
      id: '722060e7-f061-4865-925c-ed3f8034ffb6',
      title: 'Contact Form',
      slug: 'contact-form'
    },
    data: {
      'name': 'John Doe',
      'email': 'john@example.com',
      'message': 'Hello, I would like to know more about your services.'
    },
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    referrer: null
  },
  {
    id: 'sub_2',
    formId: '722060e7-f061-4865-925c-ed3f8034ffb6',
    form: {
      id: '722060e7-f061-4865-925c-ed3f8034ffb6',
      title: 'Contact Form',
      slug: 'contact-form'
    },
    data: {
      'name': 'Jane Smith',
      'email': 'jane@example.com',
      'message': 'I have a question about pricing.'
    },
    status: 'viewed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    referrer: null
  },
  {
    id: 'sub_3',
    formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
    form: {
      id: '65fef360-29a5-40ed-a79e-78fccdc4842c',
      title: 'Newsletter Signup',
      slug: 'newsletter-signup'
    },
    data: {
      'field_1': 'Alice Johnson',
      'field_2': 'alice@example.com',
      'field_3': 'Please send me updates about new products.'
    },
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
    referrer: null
  },
  {
    id: 'sub_4',
    formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
    form: {
      id: '65fef360-29a5-40ed-a79e-78fccdc4842c',
      title: 'Newsletter Signup',
      slug: 'newsletter-signup'
    },
    data: {
      'field_1': 'Bob Wilson',
      'field_2': 'bob@example.com',
      'field_3': 'I am interested in your weekly newsletter.'
    },
    status: 'archived',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    ipAddress: '192.168.1.4',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    referrer: null
  }
];

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
      form: {
        id: body.formId,
        title: body.formTitle || 'Untitled Form',
        slug: body.formSlug || 'untitled-form'
      },
      data: body.data,
      status: 'new',
      createdAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
    };
    
    // Add to our mock database
    submissions.push(submission);
    
    // Send submission to backend API which will handle webhook delivery
    try {
      // Prepare API request with submission data
      const apiRequest = {
        formId: body.formId,
        data: body.data,
        ipAddress: submission.ipAddress,
        userAgent: submission.userAgent,
        referrer: submission.referrer,
        browser: body.browser || request.headers.get('user-agent')?.split(' ')[0] || '',
        device: body.device || (request.headers.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop'),
        location: body.location || null,
      };
      
      console.log('Sending to backend API:', apiRequest);
      
      // Make sure to use the correct backend API URL
      const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
      const response = await axios.post(`${backendUrl}/api/submissions`, apiRequest);
      
      console.log('Backend API response:', response.data);
    } catch (error: any) {
      console.error('Error sending submission to backend:', error.message);
      if (error.response) {
        console.error('Backend error details:', error.response.data);
      }
      // Continue anyway since we've already stored the submission locally
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
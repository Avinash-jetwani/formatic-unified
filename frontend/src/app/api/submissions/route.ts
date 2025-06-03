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
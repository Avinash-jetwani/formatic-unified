import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    // Build backend URL
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    let apiUrl = `${backendUrl}/api/submissions`;
    
    if (formId) {
      apiUrl = `${backendUrl}/api/submissions/form/${formId}`;
    }
    
    console.log('Fetching real submissions from:', apiUrl);
    
    // Call the real backend API with the same authorization header
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error details:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch submissions from backend', details: errorText },
        { status: response.status }
      );
    }
    
    const submissions = await response.json();
    console.log('Real submissions fetched:', Array.isArray(submissions) ? submissions.length : 'unknown count', 'submissions');
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching real submissions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching submissions.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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
    
    // Forward to the real backend API
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    const apiUrl = `${backendUrl}/api/submissions`;
    
    console.log('Forwarding submission to backend:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId: body.formId,
        data: body.data,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
        browser: body.browser || request.headers.get('user-agent')?.split(' ')[0] || '',
        device: body.device || (request.headers.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop'),
        location: body.location || null,
        timezone: body.timezone || null,
      }),
    });
    
    if (!response.ok) {
      console.error('Backend submission error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error details:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to submit to backend', details: errorText },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Backend submission response:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your submission.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
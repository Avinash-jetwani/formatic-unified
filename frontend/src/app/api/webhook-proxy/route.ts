import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

// Backend API URL - THIS SHOULD ALWAYS BE PORT 3001
const API_URL = 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or localStorage
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    // Parameters
    const url = request.nextUrl.searchParams.get('url') || '/api-status';
    const fullUrl = `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    
    console.log('Attempting to proxy request to:', fullUrl);
    
    // Make request to backend API
    const response = await axios.get(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000
    });
    
    // Return the response
    return NextResponse.json({
      status: 'success',
      url: fullUrl,
      api_url: API_URL,
      data: response.data,
      auth: !!token
    });
  } catch (error) {
    console.error('Webhook proxy error:', error);
    
    let errorDetails = {
      message: 'Unknown error',
      code: 'UNKNOWN',
      response: null
    };
    
    if (axios.isAxiosError(error)) {
      errorDetails = {
        message: error.message,
        code: error.code || 'AXIOS_ERROR',
        response: error.response?.data || null
      };
    } else if (error instanceof Error) {
      errorDetails.message = error.message;
    }
    
    return NextResponse.json({
      status: 'error',
      api_url: API_URL,
      error: errorDetails
    }, { status: 500 });
  }
} 
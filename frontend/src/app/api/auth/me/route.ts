import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Forward the request to the backend with the token
    const response = await fetch(`http://localhost:4000/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Authentication failed' },
        { status: response.status }
      );
    }
    
    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
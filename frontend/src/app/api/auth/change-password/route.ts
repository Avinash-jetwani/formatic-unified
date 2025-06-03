import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    console.log('Changing password with data:', requestData);
    
    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://127.0.0.1:3001'}/api/auth/change-password`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to change password' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while changing password' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // First try to call the backend logout endpoint
    try {
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass along the auth token if available
          ...(request.cookies.get('auth_token') && {
            'Authorization': `Bearer ${request.cookies.get('auth_token')?.value}`
          })
        },
      });
    } catch (error) {
      console.error('Backend logout failed, continuing with cookie cleanup:', error);
    }
    
    // Clear all auth-related cookies
    cookies().delete('auth_token');
    
    // Also clear any additional cookies that might be used for authentication
    cookies().delete('refresh_token');
    cookies().delete('session_id');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    // Forward the request to the backend
    const response = await fetch(`${getApiUrl()}/api/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 409) {
      // Email exists - backend returns 409 Conflict
      return NextResponse.json({ exists: true }, { status: 409 });
    }

    if (response.ok) {
      // Email doesn't exist
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    // Handle other errors
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    return NextResponse.json(
      { error: errorData.message || 'Failed to check email' }, 
      { status: response.status }
    );
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { error: 'An error occurred while checking email' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to get auth token from various sources
    const authToken = 
      request.cookies.get('token')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null;

    if (!authToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Call the backend profile endpoint to validate the token
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userData = await response.json();
    
    // Return session data in NextAuth format
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    });
  } catch (error) {
    console.error('Session endpoint error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
} 
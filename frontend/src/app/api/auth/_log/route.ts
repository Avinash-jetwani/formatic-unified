import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // NextAuth _log endpoint for debugging - we'll just return success
    // In a real implementation, you might want to log these to your backend
    const body = await request.json();
    
    // Log to console for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('NextAuth log:', body);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log endpoint error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
} 
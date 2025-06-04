import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Read the log payload from the request
    const logData = await request.json();
    
    // In production, you might want to store these logs in a database
    // For now, we'll just log them to the console
    console.log('[NextAuth Log]:', logData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NextAuth Log Error]:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
} 
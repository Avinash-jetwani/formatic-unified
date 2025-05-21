export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      authenticated: !!session,
      session: session,
    });
  } catch (error) {
    console.error('Session debug error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 
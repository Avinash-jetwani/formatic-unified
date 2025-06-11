import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'NextAuth API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      publicApiUrl: process.env.NEXT_PUBLIC_API_URL,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        'user-agent': request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug route error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 
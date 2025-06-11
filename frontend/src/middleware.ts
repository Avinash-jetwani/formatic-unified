import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle specific auth routes that should be processed by Next.js
  const authRoutesToHandle = [
    '/api/auth/session',
    '/api/auth/me', 
    '/api/auth/_log',
    '/api/auth/debug'
  ];

  if (authRoutesToHandle.some(route => request.nextUrl.pathname === route)) {
    // These routes should be handled by Next.js API routes
    return NextResponse.next()
  }

  // All other /api/auth/* routes should be forwarded to backend
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    // Forward to backend (this will be handled by Nginx or rewrites)
    return NextResponse.next()
  }

  // For all other routes, continue with normal processing
  return NextResponse.next()
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 
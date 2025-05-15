import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Try getting the user from the NextAuth session
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
      // Get user details from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          company: true,
          phone: true,
          website: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (user) {
        return NextResponse.json(user);
      }
    }
    
    // Fallback to token-based auth if no session
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Forward the request to the backend with the token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/profile`, {
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
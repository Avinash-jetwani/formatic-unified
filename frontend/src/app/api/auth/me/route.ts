export const dynamic = 'force-dynamic';
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
    
    if (authToken) {
      // Forward the request to the backend with the token
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          return NextResponse.json(userData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
    
    // For development/testing, return a mock user if no auth session is found
    // This helps prevent UI errors while developing
    if (process.env.NODE_ENV === 'development') {
      console.warn('No authentication found - returning test user');
      return NextResponse.json({
        id: '83221934-b1dd-4c76-a086-e021b6d83ca3',
        email: 'test@example.com',
        name: 'Test User',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // If no authentication found, return 401
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No authentication token provided' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An error occurred while retrieving user data' },
      { status: 500 }
    );
  }
} 
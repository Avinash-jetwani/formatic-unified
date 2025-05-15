import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

// Helper to add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check auth token in cookie or request header as a fallback
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];
    
    if (!session?.user?.email && !token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
    
    // If we have a token but no session, we should still proceed
    const userEmail = session?.user?.email;

    // Use JWT token or fetch from database
    let email = userEmail;
    
    // If using token auth instead of session
    if (!email && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email;
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
    }
    
    if (!email) {
      return new NextResponse(
        JSON.stringify({ error: 'User email not found' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
    
    // Check if user exists in the database
    const user = await prisma.user.findUnique({
      where: { email },
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
    }).catch(err => {
      console.error("Database error:", err);
      return null;
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    return new NextResponse(
      JSON.stringify(user),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check auth token in cookie or request header as a fallback
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];
    
    if (!session?.user?.email && !token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
    
    // If we have a token but no session, we should still proceed
    const userEmail = session?.user?.email;

    const data = await request.json().catch(e => null);
    
    if (!data) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
    
    const { name, company, phone, website } = data;

    // Add validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return new NextResponse(
        JSON.stringify({ error: 'Name is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // Use JWT token or fetch from database
    let email = userEmail;
    
    // If using token auth instead of session
    if (!email && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email;
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
    }
    
    if (!email) {
      return new NextResponse(
        JSON.stringify({ error: 'User email not found' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
    
    // Update user profile in the database
    try {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          name,
          company,
          phone,
          website,
          updatedAt: new Date(),
        },
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

      return new NextResponse(
        JSON.stringify(updatedUser),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update user profile' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  }
} 
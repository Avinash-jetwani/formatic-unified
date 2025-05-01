import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock user data
const mockUsers = [
  {
    id: 'user_01',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2023-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
    organization: 'Example Corp'
  },
  {
    id: 'user_02',
    email: 'client@example.com',
    firstName: 'Client',
    lastName: 'User',
    role: 'CLIENT',
    status: 'ACTIVE',
    createdAt: '2023-02-15T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
    organization: 'Client Co'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    // For development, return an admin user if no token or always return a user
    // In production, you would verify the token and return the appropriate user
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return success with mock admin user
    return NextResponse.json(mockUsers[0]);
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
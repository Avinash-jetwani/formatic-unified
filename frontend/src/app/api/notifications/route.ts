import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // TODO: Replace with actual notifications table/model
    // For now, return mock data
    const mockNotifications = [
      {
        id: '1',
        type: 'form_submission',
        title: 'New Form Submission',
        message: 'You have received a new submission for Form XYZ',
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        id: '2',
        type: 'webhook_failure',
        title: 'Webhook Delivery Failed',
        message: 'Failed to deliver webhook payload to https://api.example.com/webhook',
        status: 'read',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: '3',
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will be performed in 24 hours',
        status: 'read',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
      },
    ];

    return new NextResponse(JSON.stringify(mockNotifications));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 
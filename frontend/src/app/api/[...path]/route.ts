import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return handleRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return handleRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return handleRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return handleRequest(request, path);
}

async function handleRequest(
  request: NextRequest,
  path: string
) {
  const API_URL = process.env.BACKEND_URL || 'http://localhost:3000';
  const url = new URL(request.url);
  const targetUrl = `${API_URL}/${path}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.has('Authorization') && { 
          'Authorization': request.headers.get('Authorization') || '' 
        }),
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined,
    });

    const data = await response.json().catch(() => ({}));
    
    return NextResponse.json(
      data,
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error(`Error proxying request to ${targetUrl}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
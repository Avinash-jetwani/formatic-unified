import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'pdf';
  
  try {
    // Get auth token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      console.error('[ERROR] No authentication token found in cookies');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Build the backend URL with query parameters
    const url = new URL(`${process.env.BACKEND_URL || 'http://127.0.0.1:3001'}/api/submissions/${params.id}/export`);
    url.searchParams.set('format', format);
    
    const backendUrl = url.toString();
    console.log(`[DEBUG] Fetching from: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`
      },
    }).catch(err => {
      console.error(`[ERROR] Network error: ${err.message}`);
      throw new Error(`Cannot connect to backend server: ${err.message}`);
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(e => 'Could not read error response');
      console.error(`[ERROR] Backend error (${response.status}): ${errorText}`);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }
    
    console.log(`[DEBUG] Success: Backend responded with status ${response.status}`);
    
    // Get the appropriate content type based on format
    let contentType: string;
    if (format === 'pdf') {
      contentType = 'application/pdf';
    } else if (format === 'csv') {
      contentType = 'text/csv';
    } else if (format === 'json') {
      contentType = 'application/json';
    } else {
      contentType = 'application/octet-stream';
    }
    
    // Get the binary data from the response
    const blob = await response.blob().catch(err => {
      console.error(`[ERROR] Failed to read response as blob: ${err.message}`);
      throw new Error(`Failed to process backend response: ${err.message}`);
    });
    
    const buffer = await blob.arrayBuffer();
    console.log(`[DEBUG] Successfully processed response, size: ${buffer.byteLength} bytes`);
    
    // Return the response with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=submission-${params.id}.${format}`,
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Export failed:', error);
    return NextResponse.json({ 
      error: 'Failed to export submission',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
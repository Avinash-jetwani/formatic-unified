import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'csv';
  
  // Get filter parameters
  const searchTerm = searchParams.get('searchTerm') || '';
  const formFilter = searchParams.get('formFilter') || 'all';
  const dateFilter = searchParams.get('dateFilter') || 'all';
  const statusFilter = searchParams.get('statusFilter') || 'all';
  
  try {
    // Get auth token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      console.error('[ERROR] No authentication token found in cookies');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Build the backend URL with query parameters
    const url = new URL(`http://localhost:4000/api/submissions/export`);
    url.searchParams.set('format', format);
    url.searchParams.set('searchTerm', searchTerm);
    url.searchParams.set('formFilter', formFilter);
    url.searchParams.set('dateFilter', dateFilter);
    url.searchParams.set('statusFilter', statusFilter);
    
    const backendUrl = url.toString();
    console.log(`[DEBUG] Fetching from: ${backendUrl}`);
    
    // Forward the request to the backend
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
    if (format === 'csv') {
      contentType = 'text/csv';
    } else if (format === 'json') {
      contentType = 'application/json';
    } else if (format === 'pdf') {
      contentType = 'application/pdf';
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
    
    // Format the date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Return the response with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=submissions-${date}.${format}`,
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Export failed:', error);
    return NextResponse.json({ 
      error: 'Failed to export submissions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
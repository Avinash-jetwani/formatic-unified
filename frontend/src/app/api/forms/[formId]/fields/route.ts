import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    console.log('Fetching real form fields for form ID:', params.formId);
    
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }
    
    // Build backend URL
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    const apiUrl = `${backendUrl}/api/forms/${params.formId}`;
    
    console.log('Fetching form details from:', apiUrl);
    
    // Call the real backend API to get form details (which includes fields)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error details:', errorText);
      
      // Return empty array for 404 (form not found) to prevent dashboard crashes
      if (response.status === 404) {
        console.log('Form not found, returning empty fields array');
        return NextResponse.json([]);
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch form fields from backend', details: errorText },
        { status: response.status }
      );
    }
    
    const form = await response.json();
    console.log('Real form fetched:', form.title || 'Unknown form');
    
    // Extract fields from the form object
    const fields = form.fields || [];
    console.log('Form fields found:', fields.length, 'fields');
    
    // Transform fields to match the expected format
    const transformedFields = fields.map((field: any) => ({
      id: field.id || field.name || '',
      label: field.label || field.name || 'Unknown Field',
      type: field.type || 'text',
      placeholder: field.placeholder || '',
      required: field.required || false,
      order: field.order || 0,
      validations: field.validations || []
    }));
    
    return NextResponse.json(transformedFields);
  } catch (error) {
    console.error('Form fields API error:', error);
    
    // Return empty array instead of error to prevent dashboard crashes
    console.log('Returning empty fields array due to error');
    return NextResponse.json([]);
  }
} 
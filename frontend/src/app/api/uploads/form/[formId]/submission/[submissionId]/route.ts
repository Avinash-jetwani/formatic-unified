import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string; submissionId: string } }
) {
  try {
    const { formId, submissionId } = params;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!fieldId) {
      return NextResponse.json(
        { error: 'Missing fieldId parameter' },
        { status: 400 }
      );
    }
    
    // Use internal backend URL for server-side requests
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
    const uploadUrl = `${backendUrl}/api/uploads/form/${formId}/submission/${submissionId}`;
    
    // Prepare form data for the backend request
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('fieldId', fieldId);
    
    // Send the file to the backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: backendFormData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Upload failed', details: errorData },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading the file' },
      { status: 500 }
    );
  }
} 
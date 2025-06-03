import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const formId = formData.get('formId') as string;
    const submissionId = formData.get('submissionId') as string;
    const fieldId = formData.get('fieldId') as string;
    
    if (!file || !fieldId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, fieldId' },
        { status: 400 }
      );
    }
    
    // Generate a temp submission ID if none was provided
    const effectiveSubmissionId = submissionId || `temp-${nanoid(10)}`;
    
    // For the test page, use a special URL pattern
    let uploadUrl;
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
    
    if (formId === 'test-form-id' && submissionId === 'test-submission-id') {
      // This is a test upload, use the authenticated endpoint which doesn't require a valid form
      uploadUrl = `${backendUrl}/api/uploads/authenticated/test`;
    } else if (formId) {
      // Regular form submission upload
      uploadUrl = `${backendUrl}/api/uploads/form/${formId}/submission/${effectiveSubmissionId}`;
    } else {
      // No form ID provided, use authenticated test endpoint as fallback
      uploadUrl = `${backendUrl}/api/uploads/authenticated/test`;
    }
    
    console.log('Sending upload to backend at:', uploadUrl);
    
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
      console.error('Upload error:', errorData);
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
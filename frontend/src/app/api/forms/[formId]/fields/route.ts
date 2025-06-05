import { NextRequest, NextResponse } from 'next/server';

// Define field types
interface FormField {
  id: string;
  formId: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  order: number;
  validations: Array<{
    type: string;
    params: Record<string, any>;
    message: string;
  }>;
}

// Mock form fields with proper typing
const mockFields: Record<string, FormField[]> = {
  '65fef360-29a5-40ed-a79e-78fccdc4842c': [
    {
      id: 'field_1',
      formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
      type: 'TEXT',
      label: 'Name',
      placeholder: 'Enter your name',
      required: true,
      order: 1,
      validations: []
    },
    {
      id: 'field_2',
      formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
      type: 'EMAIL',
      label: 'Email',
      placeholder: 'Enter your email',
      required: true,
      order: 2,
      validations: [
        {
          type: 'email',
          params: {},
          message: 'Please enter a valid email address'
        }
      ]
    },
    {
      id: 'field_3',
      formId: '65fef360-29a5-40ed-a79e-78fccdc4842c',
      type: 'TEXTAREA',
      label: 'Message',
      placeholder: 'Enter your message',
      required: false,
      order: 3,
      validations: []
    }
  ],
  '722060e7-f061-4865-925c-ed3f8034ffb6': [
    {
      id: 'name',
      formId: '722060e7-f061-4865-925c-ed3f8034ffb6',
      type: 'TEXT',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
      order: 1,
      validations: []
    },
    {
      id: 'email',
      formId: '722060e7-f061-4865-925c-ed3f8034ffb6',
      type: 'EMAIL',
      label: 'Email Address',
      placeholder: 'Enter your email address',
      required: true,
      order: 2,
      validations: [
        {
          type: 'email',
          params: {},
          message: 'Please enter a valid email address'
        }
      ]
    },
    {
      id: 'message',
      formId: '722060e7-f061-4865-925c-ed3f8034ffb6',
      type: 'TEXTAREA',
      label: 'Message',
      placeholder: 'Enter your message',
      required: false,
      order: 3,
      validations: []
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    console.log('Mock fields API: GET request for form ID:', params.formId);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return mock fields for the form if they exist
    if (mockFields[params.formId]) {
      return NextResponse.json(mockFields[params.formId]);
    }
    
    // Return an empty array for forms without defined fields
    return NextResponse.json([]);
  } catch (error) {
    console.error('Form fields API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Form } from "@/components/Form";
import { fetchApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { safeRenderFile } from '@/lib/fileUtils';

interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  multiPageEnabled: boolean;
  fields: FormField[];
}

interface FormField {
  id: string;
  formId: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
  config: any;
  order: number;
  page: number;
}

export default function FormPage() {
  const params = useParams();
  const formId = params?.formId as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);
  
  const loadForm = async () => {
    setLoading(true);
    try {
      // Try to get form by ID first
      let formData = null;
      try {
        formData = await fetchApi<Form>(`/forms/public/${formId}`);
      } catch (err) {
        console.log('Form not found by ID, trying slug...');
      }
      
      // If not found by ID, try to get by slug
      if (!formData) {
        try {
          formData = await fetchApi<Form>(`/forms/public/${formId}`);
        } catch (err) {
          console.error('Form not found by slug either');
          setError('Form not found');
        }
      }
      
      if (formData) {
        if (!formData.published) {
          setError('This form is not currently published');
        } else {
          setForm(formData);
        }
      }
    } catch (error) {
      console.error(`Error loading form: ${error}`);
      setError('Error loading form');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {loading ? (
          <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-4 mt-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-1/3 mt-4 ml-auto" />
          </div>
        ) : form ? (
          <Form form={form} />
        ) : null}
      </div>
    </div>
  );
} 
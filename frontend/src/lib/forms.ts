import { fetchApi } from '@/services/api';

export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  config?: Record<string, any>;
  conditions?: Record<string, any>;
  order: number;
  page: number;
}

export async function getFormById(id: string): Promise<Form | null> {
  try {
    // Try to get form by ID first
    const response = await fetchApi<Form>(`/forms/public/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching form by ID:', error);
    return null;
  }
}

export async function getFormBySlug(slug: string): Promise<Form | null> {
  try {
    // Extract client ID from slug if it exists
    const slugParts = slug.split('-');
    let clientId = null;
    
    // Check if slug contains client ID (format: base-slug-clientId-timestamp)
    if (slugParts.length >= 3) {
      const potentialIdIndex = slugParts.length - 3;
      const potentialId = slugParts[potentialIdIndex];
      
      // If it looks like a client ID (8 chars, alphanumeric)
      if (potentialId && potentialId.length === 8 && /^[a-zA-Z0-9]+$/.test(potentialId)) {
        // Try to find the full client ID from the database
        try {
          const response = await fetchApi<{ id: string }>(`/clients/by-prefix/${potentialId}`);
          if (response && response.id) {
            clientId = response.id;
          }
        } catch (error) {
          console.error('Error fetching client ID:', error);
        }
      }
    }
    
    // If we have a client ID, try that route first
    if (clientId) {
      try {
        const response = await fetchApi<Form>(`/forms/public/${clientId}/${slug}`);
        return response;
      } catch (error) {
        console.error('Error fetching form by client ID and slug:', error);
      }
    }
    
    // If that fails or we don't have a client ID, try the slug-only route
    const response = await fetchApi<Form>(`/forms/public/${slug}`);
    return response;
  } catch (error) {
    console.error('Error fetching form by slug:', error);
    return null;
  }
} 
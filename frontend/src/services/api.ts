import axios, { AxiosRequestConfig } from 'axios';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' && 
    (localStorage.getItem('token') || sessionStorage.getItem('token'));
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Helper function for all API requests
export const fetchApi = async <T>(
  url: string, 
  options: AxiosRequestConfig = {}
): Promise<T> => {
  try {
    console.log('Making API request to:', url);
    
    // Add timestamp to bust cache if not already provided
    if (options.params) {
      if (!options.params.t && !options.params.timestamp && !options.params.cacheBreaker) {
        options.params.t = new Date().getTime();
      }
    } else {
      options.params = { t: new Date().getTime() };
    }
    
    // Ensure credentials are included
    options.withCredentials = true;
    
    // Handle URL routing to ensure we're calling the Next.js API routes
    let finalUrl = url;
    
    // Check if we're in a browser environment (client-side)
    if (typeof window !== 'undefined') {
      if (url.startsWith('/api')) {
        // Already has /api prefix, use as is for client-side requests
        finalUrl = url;
      } else {
        // Add /api prefix for client-side requests
        finalUrl = `/api${url.startsWith('/') ? '' : '/'}${url}`;
      }
    } else {
      // Server-side requests should go directly to the backend API
      if (!url.startsWith('http')) {
        finalUrl = `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }
    }

    // Handle query parameters if provided
    const queryParams = new URLSearchParams();
    if (options.params) {
      for (const key in options.params) {
        if (options.params[key] !== undefined && options.params[key] !== null) {
          queryParams.append(key, options.params[key].toString());
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${queryString}`;
      }
      delete options.params;
    }

    console.log('Final URL:', finalUrl);

    const response = await api(finalUrl, options);
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        // Clear token and redirect to login page if unauthorized
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      
      // Throw the error message from the API if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw error;
  }
};

export default api;
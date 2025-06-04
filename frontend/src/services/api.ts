import axios, { AxiosRequestConfig } from 'axios';

// Define the backend API URL - in production this might be different
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: '/', // Use relative URLs for browser requests
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
    
    // URL construction for browser requests (Next.js will handle rewrites)
    let finalUrl = url;
    
    if (typeof window !== 'undefined') {
      // Client-side: Always prefix with /api - Next.js rewrites will handle routing
      if (!url.startsWith('/api/')) {
        finalUrl = `/api${url.startsWith('/') ? '' : '/'}${url}`;
      }
    } else {
      // Server-side: Direct backend calls with full URL
      if (!url.startsWith('http')) {
        const backendUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        finalUrl = `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
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
        // Clear token and redirect to dashboard with error message instead of login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          // Redirect to dashboard instead of login to provide better UX
          window.location.href = '/dashboard?error=authentication';
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
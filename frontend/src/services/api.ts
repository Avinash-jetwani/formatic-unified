import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
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
    
    // Ensure URL starts with /api if it doesn't already
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
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
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
      delete options.params;
    }

    console.log('Final URL:', url);

    const response = await api(url, options);
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
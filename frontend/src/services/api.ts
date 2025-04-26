import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
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
    // Handle query parameters if provided
    if (options.params) {
      const params = new URLSearchParams();
      for (const key in options.params) {
        params.append(key, options.params[key]);
      }
      url = `${url}?${params.toString()}`;
      delete options.params;
    }

    const response = await api(url, options);
    return response.data;
  } catch (error) {
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
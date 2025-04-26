import { fetchApi } from './api';
import axios from 'axios';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
  website?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    lastLogin?: string;
  };
  access_token: string;
}

export const authService = {
  /**
   * Login a user
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    const response = await fetchApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      data: { email, password },
    });
    
    // Store token in localStorage or sessionStorage based on rememberMe
    if (response.access_token) {
      if (rememberMe) {
        localStorage.setItem('token', response.access_token);
      } else {
        sessionStorage.setItem('token', response.access_token);
      }
    }
    
    return response;
  },
  
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { firstName, lastName, email, password, company, phone, website } = data;
    
    // Format the name field from first and last name
    const name = `${firstName} ${lastName}`.trim();
    
    // Transform data to match backend DTO format
    const registerData = {
      email,
      password,
      name,
      company,
      phone,
      website,
    };
    
    const response = await fetchApi<AuthResponse>('/api/auth/register', {
      method: 'POST',
      data: registerData,
    });
    
    // Store token if present in response
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }
    
    return response;
  },
  
  /**
   * Logout the current user
   */
  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  },
  
  /**
   * Check if a user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  },
  
  /**
   * Check if an email is already registered
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      await fetchApi<{ exists: boolean }>('/api/auth/check-email', {
        method: 'GET',
        params: { email },
      });
      return false; // If no error is thrown, the email doesn't exist
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Email exists - 409 Conflict is returned
        return true;
      }
      // Any other error means the email check failed, not that the email exists
      throw error;
    }
  },
}; 
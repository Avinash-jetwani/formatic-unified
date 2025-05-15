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

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const authService = {
  /**
   * Login a user
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    console.log('Login attempt with URL path: /api/auth/login');
    
    // Use our new login API route that handles cookie setting
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const data = await response.json();
    
    // Still store token in localStorage/sessionStorage for client-side checking
    if (data.access_token) {
      if (rememberMe) {
        localStorage.setItem('token', data.access_token);
      } else {
        sessionStorage.setItem('token', data.access_token);
      }
    }
    
    return data;
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
  async logout(): Promise<void> {
    try {
      // Call the API endpoint to clear cookies properly
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Important for cookie operations
      });
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      // Always clean up client-side storage even if API call fails
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Clear any cache or application state
      if (typeof window !== 'undefined') {
        // Force reload to ensure a completely fresh state
        window.location.href = '/login';
      }
    }
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
  
  /**
   * Request a password reset
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process forgot password request');
    }
    
    return response.json();
  },
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reset password');
    }
    
    return response.json();
  },
}; 
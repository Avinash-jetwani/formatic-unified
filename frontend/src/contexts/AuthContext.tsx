'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

// Define the User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  checkAuth: async () => false,
});

// Auth Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get token from storage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
          try {
            // Decode token to get user data
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            setUser({
              id: payload.sub || payload.id,
              name: payload.name || 'User',
              email: payload.email || '',
              role: payload.role || 'CLIENT',
            });
          } catch (e) {
            console.error('Error parsing token:', e);
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      setLoading(true);
      await authService.login(email, password, rememberMe);
      
      // After successful login, get the token and decode it
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          setUser({
            id: payload.sub || payload.id,
            name: payload.name || 'User',
            email: payload.email || '',
            role: payload.role || 'CLIENT',
          });
          
          router.push('/dashboard');
        } catch (e) {
          console.error('Error parsing token after login:', e);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setLoading(true);
      await authService.register(userData);
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return false;
      
      // Verify token validity (optional - you can add API validation here)
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  // Calculate derived states
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 
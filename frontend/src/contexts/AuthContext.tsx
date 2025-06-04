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
  company?: string;
  phone?: string;
  website?: string;
  status?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User | null) => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  register: async () => ({}),
  logout: () => {},
  checkAuth: async () => false,
  setUser: () => {},
});

// Helper to save user to storage
const saveUserToStorage = (user: User, useLocalStorage: boolean = true) => {
  const storage = useLocalStorage ? localStorage : sessionStorage;
  storage.setItem('user', JSON.stringify(user));
};

// Helper to get user from storage
const getUserFromStorage = () => {
  let user = null;
  try {
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    
    if (localUser) {
      user = JSON.parse(localUser);
    } else if (sessionUser) {
      user = JSON.parse(sessionUser);
    }
  } catch (e) {
    console.error('Error getting user from storage:', e);
  }
  return user;
};

// Auth Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First try to get user directly from storage
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setLoading(false);
          return;
        }
        
        // If no stored user, try to get token from storage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
          try {
            // Decode token to get user data
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            const userData = {
              id: payload.sub || payload.id,
              name: payload.name || 'User',
              email: payload.email || '',
              role: payload.role || 'CLIENT',
            };
            
            setUser(userData);
            
            // Save user to storage for persistence
            const useLocalStorage = !!localStorage.getItem('token');
            saveUserToStorage(userData, useLocalStorage);
            
          } catch (e) {
            console.error('Error parsing token:', e);
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
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
          
          const userData = {
            id: payload.sub || payload.id,
            name: payload.name || 'User',
            email: payload.email || '',
            role: payload.role || 'CLIENT',
          };
          
          setUser(userData);
          
          // Save user to storage
          saveUserToStorage(userData, rememberMe);
          
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
      const response = await authService.register(userData);
      
      // If registration returns a token (auto-login), handle it
      if (response.access_token) {
        // Store the token
        localStorage.setItem('token', response.access_token);
        
        // Decode token to get user data
        try {
          const payload = JSON.parse(atob(response.access_token.split('.')[1]));
          const newUser = {
            id: payload.sub || payload.id,
            name: payload.name || `${userData.firstName} ${userData.lastName}`,
            email: payload.email || userData.email,
            role: payload.role || 'CLIENT',
          };
          
          setUser(newUser);
          saveUserToStorage(newUser, true);
          
          // Don't redirect here, let the calling component handle it
          return response;
        } catch (e) {
          console.error('Error parsing token after registration:', e);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      // First check if we have the user in state
      if (user) return true;
      
      // Then check storage
      const storedUser = getUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
        return true;
      }
      
      // Finally check token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      return !!token;
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
        setUser,
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
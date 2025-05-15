'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  // Only redirect on client-side after mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check admin status from context and local storage
    const checkAdminStatus = () => {
      // First check context
      if (isAdmin) {
        setIsAdminUser(true);
        return true;
      }
      
      // Then check local storage
      try {
        const localUser = localStorage.getItem('user');
        const sessionUser = sessionStorage.getItem('user');
        
        if (localUser) {
          const userData = JSON.parse(localUser);
          if (userData?.role === 'SUPER_ADMIN') {
            setIsAdminUser(true);
            return true;
          }
        }
        
        if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          if (userData?.role === 'SUPER_ADMIN') {
            setIsAdminUser(true);
            return true;
          }
        }
      } catch (e) {
        console.error('Error checking admin status:', e);
      }
      
      return false;
    };
    
    // If definitely not an admin after checking all sources, redirect
    if (!loading && !checkAdminStatus()) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);
  
  // Always render the children inside DashboardLayout
  // This ensures the sidebar is always visible
  return <DashboardLayout>{children}</DashboardLayout>;
} 
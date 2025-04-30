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
  
  // Only redirect on client-side after mount
  useEffect(() => {
    setIsMounted(true);
    
    // Only redirect if definitely not an admin (and not during loading)
    if (!loading && isAdmin === false) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);
  
  // Always render the children inside DashboardLayout
  // This ensures the sidebar is always visible
  return <DashboardLayout>{children}</DashboardLayout>;
} 
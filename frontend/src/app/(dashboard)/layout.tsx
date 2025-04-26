'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthProvider } from '@/contexts/AuthContext';

// In a real app, we would import an AuthProvider here too
// import { AuthProvider } from '@/contexts/AuthContext';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
} 
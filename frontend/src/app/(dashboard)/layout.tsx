'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
} 
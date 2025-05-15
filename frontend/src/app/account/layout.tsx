'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AuthProvider>
  );
} 
'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  onSidebarToggle?: (collapsed: boolean) => void;
}

const AppLayout = ({ children, onSidebarToggle }: AppLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    // Pass the state up to parent if callback provided
    if (onSidebarToggle) {
      onSidebarToggle(collapsed);
    }
  };

  return (
    <div className="min-h-screen max-h-screen flex bg-background overflow-hidden w-full">
      {/* Unified Sidebar - Single component for all screen sizes */}
      <Sidebar onToggle={handleSidebarToggle} />
      
      {/* Main Content Area - Full responsive width */}
      <main className="flex-1 overflow-auto w-full max-w-full min-w-0">
        <div className="w-full h-full min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout; 
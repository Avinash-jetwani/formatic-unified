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
    <div className="h-screen flex bg-background overflow-hidden">
      <div className="h-full flex-shrink-0">
        <Sidebar onToggle={handleSidebarToggle} />
      </div>
      
      <main 
        className={cn(
          "flex-1 overflow-auto"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout; 
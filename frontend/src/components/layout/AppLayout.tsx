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
      {/* Sidebar Container - Hidden on mobile, visible on sm+ */}
      <div className="h-full flex-shrink-0 hidden sm:block">
        <Sidebar onToggle={handleSidebarToggle} />
      </div>
      
      {/* Mobile Sidebar - Only visible on mobile */}
      <div className="sm:hidden">
        <Sidebar onToggle={handleSidebarToggle} />
      </div>
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          // Full width on mobile, adjusted on larger screens
          "w-full sm:w-auto",
          // Responsive content spacing
          "min-h-screen"
        )}
      >
        <div className="h-full w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout; 
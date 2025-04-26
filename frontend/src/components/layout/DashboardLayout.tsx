'use client';

import React, { useState } from 'react';
import AppLayout from './AppLayout';
import { Navbar } from './Navbar';
import Footer from './Footer';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: {
    label: string;
    href: string;
  }[];
  actions?: React.ReactNode;
}

const DashboardLayout = ({
  children,
  title,
  description,
  breadcrumbs,
  actions,
}: DashboardLayoutProps) => {
  // Get sidebar collapsed state from AppLayout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // This function will be passed to Sidebar component to sync the collapsed state
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };
  
  return (
    <AppLayout onSidebarToggle={handleSidebarToggle}>
      <div className="flex flex-col h-full">
        <Navbar 
          sidebarCollapsed={sidebarCollapsed} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <div className="flex-grow overflow-y-auto pb-16">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Page header with title and actions */}
            {(title || breadcrumbs || actions) && (
              <div className="mb-6">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav className="mb-2">
                    <ol className="flex items-center text-sm text-muted-foreground">
                      {breadcrumbs.map((item, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="mx-2">/</span>}
                          <li>
                            <a 
                              href={item.href} 
                              className={cn(
                                "hover:text-foreground transition-colors",
                                i === breadcrumbs.length - 1 && "text-foreground font-medium"
                              )}
                            >
                              {item.label}
                            </a>
                          </li>
                        </React.Fragment>
                      ))}
                    </ol>
                  </nav>
                )}
                
                {/* Title and actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {title && (
                      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  
                  {actions && (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div>
              {children}
            </div>
          </div>
        </div>
        
        <Footer className="shrink-0" />
      </div>
    </AppLayout>
  );
};

export default DashboardLayout; 
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  LogOut
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

const Sidebar = ({ onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, user } = useAuth();

  // Detect if we're on the server or client side
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Notify parent component when collapsed state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  // Common menu items for all authenticated users
  const menuItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Forms',
      href: '/forms',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: 'Submissions',
      href: '/submissions',
      icon: <ListChecks className="h-5 w-5" />,
    },
  ];

  // Admin-only menu items
  const adminMenuItems: SidebarItem[] = [
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Render nav items
  const NavItem = ({ item }: { item: SidebarItem }) => (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent",
        pathname.startsWith(item.href)
          ? "bg-primary/10 text-primary"
          : "text-foreground/70 hover:text-foreground"
      )}
    >
      <span className="mr-3 flex-shrink-0">{item.icon}</span>
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );

  // Main sidebar content
  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-4">
        <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "justify-start")}>
          <Link href="/dashboard" className="flex items-center">
            <div className="rounded-full bg-primary h-8 w-8 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            {!collapsed && <span className="ml-2 text-xl font-semibold">Formatic</span>}
          </Link>
        </div>
        <button 
          onClick={toggleSidebar}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button 
          onClick={toggleMobileSidebar}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-border pt-4">
                {!collapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </h3>
                )}
                {adminMenuItems.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto px-3 py-4">
        <div className={cn(
          "flex items-center gap-2 mb-4",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <ThemeToggle />
          {!collapsed && <span className="text-sm text-muted-foreground">Theme</span>}
        </div>
        
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>

      <div className="p-3 border-t border-border">
        <Link
          href="/forms/new"
          className={cn(
            'flex items-center rounded-md p-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Plus size={20} />
          {!collapsed && <span className="ml-2">New Form</span>}
        </Link>
      </div>
    </>
  );

  // Don't show sidebar toggle on client-side render (avoids hydration mismatch)
  if (!mounted) return null;

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <button
          onClick={toggleMobileSidebar}
          className="bg-background p-2 rounded-md shadow-md border border-border"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border bg-background",
          "transition-all duration-300 ease-in-out z-50",
          "md:relative md:flex", 
          "fixed inset-y-0 left-0",
          { "md:w-16": collapsed, "md:w-64": !collapsed },
          { "-translate-x-full md:translate-x-0": !mobileOpen, "translate-x-0": mobileOpen },
          "absolute"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar; 
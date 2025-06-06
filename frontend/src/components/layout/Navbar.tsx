'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import { 
  Bell, 
  Menu, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';

export interface NavbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Navbar({ sidebarCollapsed, onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Get user data from auth context
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sample notifications data
  const notifications = [
    { id: 1, message: 'New form submission received', time: '2m ago', read: false },
    { id: 2, message: 'System update completed', time: '1h ago', read: false },
    { id: 3, message: 'Weekly analytics report is ready', time: '1d ago', read: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback if the context logout fails
      window.location.href = '/login';
    }
  };

  if (!mounted) return <div className="h-16 w-full border-b border-border"></div>;

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile menu button - only visible on mobile */}
        <button
          onClick={onToggleSidebar}
          className="mr-4 md:hidden rounded-md p-1.5 hover:bg-accent"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Logo - only visible on mobile when sidebar is collapsed */}
        <div className="md:hidden flex items-center">
          <Link 
            href="/dashboard" 
            className="flex items-center"
          >
            <Logo size="sm" />
          </Link>
        </div>
        
        {/* Navbar right section */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <ThemeToggle />
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full p-1.5 hover:bg-accent"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-border ring-opacity-5 focus:outline-none z-50">
                <div className="py-1 border-b border-border px-3 flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <button className="text-xs text-primary hover:text-primary/90">
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="py-1">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={cn(
                            "px-4 py-2.5 hover:bg-accent cursor-pointer",
                            !notification.read && "bg-primary/5"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <p className={cn(
                              "text-sm",
                              !notification.read && "font-medium"
                            )}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  )}
                </div>
                <div className="py-1 border-t border-border">
                  <Link
                    href="/notifications"
                    className="block px-4 py-2 text-center text-sm text-primary hover:text-primary/90"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full hover:bg-accent p-1.5"
            >
              <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center text-primary">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-sm font-medium">{user?.name || 'User'}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            
            {/* User menu dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-border ring-opacity-5 focus:outline-none z-50">
                <div className="py-3 px-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center text-primary font-semibold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{user?.name || 'User'}</div>
                      <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <Link 
                    href="/account" 
                    className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 
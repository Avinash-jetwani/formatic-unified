'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
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
  LogOut,
  Link2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { isAdmin, user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showAdminSection, setShowAdminSection] = useState(false);

  // Detect if we're on the server or client side
  useEffect(() => {
    setMounted(true);

    // Check if user is admin from context or localStorage/sessionStorage
    const checkAdminStatus = () => {
      if (isAdmin) {
        setShowAdminSection(true);
        return;
      }
      
      // If not admin in context, check storage
      try {
        const localUser = localStorage.getItem('user');
        const sessionUser = sessionStorage.getItem('user');
        
        if (localUser) {
          const userData = JSON.parse(localUser);
          setShowAdminSection(userData?.role === 'SUPER_ADMIN');
        } else if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          setShowAdminSection(userData?.role === 'SUPER_ADMIN');
        }
      } catch (e) {
        console.error('Error checking admin status from storage:', e);
      }
    };
    
    checkAdminStatus();

    // Auto-collapse on small screens
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Mobile phones (< 640px) - always collapsed and hidden
      if (width < 640) {
        setCollapsed(true);
        setMobileOpen(false);
      }
      // Small tablets (640px - 768px) - collapsed but visible
      else if (width < 768) {
        setCollapsed(true);
      }
      // Medium tablets (768px - 1024px) - collapsed
      else if (width < 1024) {
        setCollapsed(true);
      }
      // Large screens (1024px - 1280px) - can be expanded
      else if (width < 1280) {
        // Keep current state, don't force change
      }
      // Extra large screens (>= 1280px) - expanded by default
      else {
        setCollapsed(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isAdmin]);

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
      name: 'Webhooks',
      href: '/admin/webhooks',
      icon: <Link2 className="h-5 w-5" />,
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
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback if the context logout fails
      window.location.href = '/login';
    }
  };

  // Render nav items with enhanced styling and animations
  const NavItem = ({ item }: { item: SidebarItem }) => {
    const isActive = pathname && pathname.startsWith(item.href);
    
    // Define color schemes for different menu items
    const getItemColors = (href: string) => {
      if (href === '/dashboard') {
        return {
          active: 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-l-4 border-purple-500',
          hover: 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 hover:text-purple-600 dark:hover:text-purple-400'
        };
      } else if (href === '/forms') {
        return {
          active: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500',
          hover: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:text-blue-600 dark:hover:text-blue-400'
        };
      } else if (href === '/submissions') {
        return {
          active: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-l-4 border-green-500',
          hover: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 hover:text-green-600 dark:hover:text-green-400'
        };
      } else if (href === '/admin/users') {
        return {
          active: 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400 border-l-4 border-orange-500',
          hover: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 hover:text-orange-600 dark:hover:text-orange-400'
        };
      } else if (href === '/admin/webhooks') {
        return {
          active: 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-600 dark:text-teal-400 border-l-4 border-teal-500',
          hover: 'hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20 hover:text-teal-600 dark:hover:text-teal-400'
        };
      } else {
        return {
          active: 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-600 dark:text-gray-400 border-l-4 border-gray-500',
          hover: 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-900/20 dark:hover:to-slate-900/20 hover:text-gray-600 dark:hover:text-gray-400'
        };
      }
    };

    const colors = getItemColors(item.href);

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        className="relative group"
      >
        <Link
          href={item.href}
          className={cn(
            "group flex items-center rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden",
            isActive 
              ? colors.active
              : `text-foreground/70 ${colors.hover}`,
            collapsed ? "justify-center p-2.5" : "justify-start px-3 py-2.5"
          )}
        >
          {/* Animated background for active state */}
          {isActive && (
            <motion.div
              layoutId="activeBackground"
              className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent dark:from-white/10 dark:to-transparent rounded-lg"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          
          {/* Icon with enhanced animations */}
          <motion.span 
            className={cn(
              "relative flex-shrink-0",
              collapsed ? "mr-0" : "mr-3"
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {item.icon}
          </motion.span>
          
          {/* Text with slide animation */}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="relative whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        </Link>
        
        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {item.name}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Main sidebar content with enhanced styling
  const SidebarContent = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Header Section */}
      <motion.div 
        className="flex items-center justify-between px-4 py-4 border-b border-border/50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "justify-start")}>
          <Link href="/dashboard" className="flex items-center">
            <Logo size={collapsed ? "sm" : "md"} showText={!collapsed} />
          </Link>
        </div>
        {mounted && (
          <motion.button 
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </motion.button>
        )}
        {mounted && (
          <motion.button 
            onClick={toggleMobileSidebar}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Close sidebar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Navigation Section */}
      <motion.div 
        className={cn(
          "flex-1 py-4 space-y-1",
          collapsed ? "px-2" : "px-3"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <NavItem item={item} />
            </motion.div>
          ))}

          {/* Admin Section */}
          <AnimatePresence>
            {showAdminSection && (
              <motion.div 
                className={cn(
                  "my-4 border-t border-border/50 pt-4",
                  collapsed ? "mx-1" : "mx-0"
                )}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!collapsed && (
                  <motion.h3 
                    className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Admin Panel
                  </motion.h3>
                )}
                <div className="space-y-1">
                  {adminMenuItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <NavItem item={item} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.div>

      {/* Bottom Section - Theme and Logout */}
      <motion.div 
        className={cn(
          "mt-auto py-4 border-t border-border/50 space-y-2",
          collapsed ? "px-2" : "px-3"
        )}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {mounted && (
          <motion.div 
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-300 cursor-pointer group relative overflow-hidden",
              collapsed ? "justify-center p-2" : "justify-start px-3 py-2.5"
            )}
            whileHover={{ x: collapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            <motion.div
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <ThemeToggle />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span 
                  className="ml-3 text-sm text-muted-foreground relative"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Theme
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
        {mounted && (
          <motion.button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-medium text-foreground/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 group relative overflow-hidden",
              collapsed ? "justify-center p-2" : "justify-start px-3 py-2.5"
            )}
            whileHover={{ x: collapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ duration: 0.2 }}
            >
              <LogOut className="h-5 w-5 relative" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span 
                  className="ml-3 relative"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </motion.div>

      {/* Create Form Button */}
      <motion.div 
        className={cn(
          "border-t border-border/50",
          collapsed ? "p-2" : "p-3"
        )}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: collapsed ? 1.05 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/forms/create"
            className={cn(
              'flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden',
              collapsed ? 'justify-center p-2.5' : 'justify-start p-3'
            )}
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Plus size={collapsed ? 18 : 20} />
            </motion.div>
            
            <AnimatePresence>
              {!collapsed && (
                <motion.span 
                  className="ml-2 relative"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  New Form
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // Return the enhanced sidebar structure
  return (
    <>
      {/* Mobile menu button - responsive positioning */}
      {mounted && (
        <motion.div 
          className="fixed top-4 left-4 z-50 sm:hidden"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={toggleMobileSidebar}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg p-2.5 rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            aria-label="Open sidebar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </motion.div>
      )}

      {/* Mobile sidebar overlay - only appears when mounted and open */}
      <AnimatePresence>
        {mounted && mobileOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={toggleMobileSidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Responsive Sidebar */}
      <motion.aside
        className={cn(
          "flex h-screen flex-col border-r border-border/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
          "transition-all duration-300 ease-in-out shadow-xl",
          // Mobile: fixed positioning, overlay when open
          "fixed inset-y-0 left-0 z-40",
          // Small screens and up: relative positioning (part of flex layout)
          "sm:relative sm:z-auto",
          // Mobile visibility - hidden by default, shown when mobileOpen
          {
            "-translate-x-full": !mobileOpen,
            "translate-x-0": mobileOpen,
          },
          // Always visible and positioned correctly on larger screens
          "sm:translate-x-0",
          // Responsive widths
          "w-64 sm:w-14 md:w-14 lg:w-16 xl:w-16 2xl:w-16",
          {
            "sm:w-56": !collapsed,
            "md:w-60": !collapsed,
            "lg:w-64": !collapsed,
            "xl:w-64": !collapsed,
            "2xl:w-68": !collapsed
          }
        )}
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut"
        }}
      >
        {/* Glassmorphism background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/80" />
        
        {/* Animated border gradient */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 h-full">
          <SidebarContent />
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar; 
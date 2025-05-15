'use client';

import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

// Initialize the Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

// Client-side refresh component to force periodic refresh in development
function DevModeRefresher() {
  useEffect(() => {
    // Only in development mode
    if (process.env.NODE_ENV === 'development') {
      // Set timestamp to detect stale data
      localStorage.setItem('lastRefreshTimestamp', Date.now().toString());
      
      // Check for page refresh every 30 seconds
      const interval = setInterval(() => {
        const lastRefresh = parseInt(localStorage.getItem('lastRefreshTimestamp') || '0');
        const now = Date.now();
        
        // If it's been more than 5 minutes since last full refresh, reload the page
        if (now - lastRefresh > 5 * 60 * 1000) {
          console.log('Enforcing development refresh');
          localStorage.setItem('lastRefreshTimestamp', now.toString());
          window.location.reload();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Formatic - Form Management System</title>
        <meta name="description" content="Create, manage, and analyze forms with ease" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {process.env.NODE_ENV === 'development' && <DevModeRefresher />}
          </ThemeProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
} 
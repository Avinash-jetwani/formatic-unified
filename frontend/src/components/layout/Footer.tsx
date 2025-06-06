'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn(
      "border-t border-border py-2 bg-background/80 w-full",
      className
    )}>
      <div className="w-full flex flex-col items-center justify-between md:flex-row px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Datizmo. All rights reserved.
        </p>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-xs">
            <Link 
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              href="/help"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Help
            </Link>
          </nav>
          
          {/* Removed GitHub link */}
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
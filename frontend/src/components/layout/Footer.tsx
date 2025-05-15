'use client';

import React from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn(
      "border-t border-border py-2 bg-background/80",
      className
    )}>
      <div className="container flex flex-col items-center justify-between md:flex-row">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Formatic. All rights reserved.
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
          
          <Link
            href="https://github.com/formatic"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
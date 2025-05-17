import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = 'md', showText = true, className }: LogoProps) => {
  // Size mappings
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "relative flex-shrink-0", 
        sizeClasses[size]
      )}>
        {/* Base circular gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full shadow-md"></div>
        
        {/* Overlapping shape 1 - top right */}
        <div className="absolute top-0 right-0 h-2/3 w-2/3 bg-gradient-to-br from-violet-400 to-blue-500 rounded-full opacity-90 transform translate-x-1/4 -translate-y-1/4"></div>
        
        {/* Overlapping shape 2 - bottom left */}
        <div className="absolute bottom-0 left-0 h-2/3 w-2/3 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full opacity-90 transform -translate-x-1/4 translate-y-1/4"></div>
        
        {/* Center accent */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1/3 w-1/3 bg-white rounded-full"></div>
        </div>
      </div>
      
      {showText && (
        <span className={cn("ml-4 font-semibold", textSizes[size])}>
          Datizmo
        </span>
      )}
    </div>
  );
};

export default Logo; 
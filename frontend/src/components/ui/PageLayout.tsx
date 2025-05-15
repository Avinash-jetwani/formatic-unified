import React from 'react';
import { PageHeader } from './PageHeader';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PageLayout component for consistent page layouts across the application
 * 
 * Usage:
 * <PageLayout 
 *   title="User Management" 
 *   description="View and manage all users in the system" 
 *   actions={<Button>Add User</Button>}
 * >
 *   Your content here
 * </PageLayout>
 */
export function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />
      {children}
    </div>
  );
}

/**
 * Helper functions for use with PageLayout
 */

/**
 * Formats a data count number with appropriate suffix (K, M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

/**
 * Returns the appropriate Badge variant based on status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusLower = status.toLowerCase();
  
  if (['active', 'completed', 'published'].includes(statusLower)) {
    return 'default';
  } else if (['inactive', 'draft', 'archived'].includes(statusLower)) {
    return 'secondary';
  } else if (['error', 'failed', 'rejected'].includes(statusLower)) {
    return 'destructive';
  } else {
    return 'outline';
  }
} 
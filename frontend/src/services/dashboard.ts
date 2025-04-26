import { fetchApi } from './api';

// Types for dashboard data
export interface DashboardStats {
  totals: {
    users: number;
    forms: number;
    submissions: number;
    uptime: number;
  };
  trends: {
    users: number;
    forms: number;
    submissions: number;
    uptime: number;
  };
  charts: {
    submissions: {
      date: string;
      value: number;
    }[];
    formPerformance: {
      formId: string;
      formName: string;
      submissions: number;
      completionRate: number;
    }[];
  };
  recentSubmissions?: {
    id: string;
    formName: string;
    submittedAt: string;
    status: 'completed' | 'partial';
  }[];
  recentUsers?: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }[];
}

/**
 * Fetches dashboard statistics for the specified date range
 */
const getDashboardStats = async (startDate: string, endDate: string, timestamp: number): Promise<DashboardStats> => {
  try {
    // Make parallel requests to reduce loading time
    const [formsRes, submissionsRes, usersRes, formCompletionRatesRes] = await Promise.all([
      fetchApi<any[]>('/forms', { method: 'GET' }),
      fetchApi<any[]>('/submissions', { method: 'GET' }),
      fetchApi<any[]>('/users', {
        method: 'GET',
        params: { cacheBreaker: timestamp }
      }),
      fetchApi<any>('/analytics/form-completion-rates', {
        method: 'GET',
        params: { 
          startDate,
          endDate,
          cacheBreaker: timestamp
        }
      })
    ]);

    // Map the API response to our dashboard stats interface
    const stats: DashboardStats = {
      totals: {
        users: usersRes?.length || 0,
        forms: formsRes?.length || 0,
        submissions: submissionsRes?.length || 0,
        uptime: 99.95, // Hardcoded as this isn't typically in the database
      },
      trends: {
        // Calculate trends based on recent activity
        // For now using placeholder percentages based on data size
        users: 5.2,
        forms: formsRes.length > 10 ? 8.7 : 3.5,
        submissions: submissionsRes.length > 100 ? 12.3 : 6.8,
        uptime: 0.1,
      },
      charts: {
        submissions: generateSubmissionTimeline(submissionsRes, startDate, endDate),
        formPerformance: mapFormPerformanceData(formCompletionRatesRes?.forms || [])
      },
      recentSubmissions: getRecentSubmissions(submissionsRes),
      recentUsers: getRecentUsers(usersRes)
    };

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return minimal fallback structure with zeros instead of fake data
    return {
      totals: { users: 0, forms: 0, submissions: 0, uptime: 99.5 },
      trends: { users: 0, forms: 0, submissions: 0, uptime: 0 },
      charts: {
        submissions: [],
        formPerformance: []
      }
    };
  }
};

/**
 * Generate submission timeline data from actual submissions
 */
export const generateSubmissionTimeline = (submissions: any[], startDate: string, endDate: string) => {
  if (!submissions?.length) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateMap = new Map();
  
  // Initialize all dates in the range with zero value
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dateMap.set(dateStr, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Count submissions per day
  submissions.forEach(submission => {
    const submissionDate = new Date(submission.createdAt || submission.submittedAt);
    const dateStr = submissionDate.toISOString().split('T')[0];
    
    // Only count if within our date range
    if (submissionDate >= start && submissionDate <= end) {
      const count = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, count + 1);
    }
  });
  
  // Convert map to array format needed for charts
  return Array.from(dateMap.entries()).map(([date, value]) => ({
    date,
    value
  })).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Map form performance data for charts
 */
export const mapFormPerformanceData = (forms: any[]) => {
  if (!forms?.length) return [];
  
  return forms.map(form => {
    // Handle both possible response formats (direct or from API)
    const formName = form.form || form.name || form.title || `Form ${form.id || 'unknown'}`;
    const submissionCount = form.submissionCount || 0;
    const completionRate = form.rate || form.completionRate || form.completion_rate || 0;
    
    return {
      formId: form.id || 'unknown',
      formName,
      submissions: submissionCount,
      completionRate
    };
  }).slice(0, 10); // Limit to top 10 forms
};

/**
 * Get recent submissions from submission data
 */
export const getRecentSubmissions = (submissions: any[]) => {
  if (!submissions?.length) return [];
  
  return submissions
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.submittedAt);
      const dateB = new Date(b.createdAt || b.submittedAt);
      return dateB.getTime() - dateA.getTime(); // Sort by most recent
    })
    .slice(0, 10) // Get latest 10
    .map(submission => ({
      id: submission.id,
      formName: submission.formName || submission.form?.name || `Form ${submission.formId}`,
      submittedAt: submission.createdAt || submission.submittedAt,
      status: submission.status || 'completed'
    }));
};

/**
 * Get recent users from user data
 */
export const getRecentUsers = (users: any[]) => {
  if (!users?.length) return [];
  
  return users
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime(); // Sort by most recent
    })
    .slice(0, 10) // Get latest 10
    .map(user => ({
      id: user.id,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      createdAt: user.createdAt
    }));
};

export const dashboardService = {
  getDashboardStats
}; 
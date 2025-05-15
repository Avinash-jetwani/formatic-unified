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
 * Calculates the trend percentage between current and previous periods
 */
export const calculateTrend = (data: any[], dateField: string = 'createdAt'): number => {
  if (!data || data.length === 0) return 0;
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  // Count items in the last 30 days
  const recentItems = data.filter(item => {
    const date = new Date(item[dateField] || item.submittedAt || item.createdAt);
    return date >= thirtyDaysAgo && date <= now;
  }).length;
  
  // Count items in the 30 days before that
  const olderItems = data.filter(item => {
    const date = new Date(item[dateField] || item.submittedAt || item.createdAt);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  }).length;
  
  // Calculate percentage change
  if (olderItems === 0) return recentItems > 0 ? 100 : 0;
  
  return Math.round(((recentItems - olderItems) / olderItems) * 100 * 10) / 10;
};

/**
 * Fetches dashboard statistics for the specified date range
 */
const getDashboardStats = async (startDate: string, endDate: string, timestamp: number): Promise<DashboardStats> => {
  try {
    // Make parallel requests to reduce loading time
    const [formsRes, submissionsRes, usersRes, formCompletionRatesRes, conversionTrendsRes] = await Promise.all([
      fetchApi<any[]>('/forms', { method: 'GET', params: { startDate, endDate } }),
      fetchApi<any[]>('/submissions', { method: 'GET', params: { startDate, endDate } }),
      fetchApi<any[]>('/users', {
        method: 'GET',
        params: { startDate, endDate, cacheBreaker: timestamp }
      }),
      fetchApi<any>('/analytics/form-completion-rates', {
        method: 'GET',
        params: { 
          startDate,
          endDate,
          cacheBreaker: timestamp
        }
      }),
      fetchApi<any[]>('/analytics/conversion-trends', {
        method: 'GET',
        params: { 
          start: startDate, 
          end: endDate,
          cacheBreaker: timestamp
        }
      }).catch(() => [])
    ]);

    // Calculate actual trend values based on real data
    const usersTrend = calculateTrend(usersRes, 'createdAt');
    const formsTrend = calculateTrend(formsRes, 'createdAt');
    const submissionsTrend = calculateTrend(submissionsRes, 'createdAt');

    // Map the API response to our dashboard stats interface
    const stats: DashboardStats = {
      totals: {
        users: usersRes?.length || 0,
        forms: formsRes?.length || 0,
        submissions: submissionsRes?.length || 0,
        uptime: 99.95, // Hardcoded as this isn't typically in the database
      },
      trends: {
        // Use calculated trends based on real data
        users: usersTrend,
        forms: formsTrend,
        submissions: submissionsTrend,
        uptime: 0.1,
      },
      charts: {
        submissions: conversionTrendsRes?.length > 0 
          ? conversionTrendsRes 
          : generateSubmissionTimeline(submissionsRes, startDate, endDate),
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
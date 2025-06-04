'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  FileText,
  ListChecks,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  CalendarRange,
  Filter,
  Download,
  ChevronDown,
  Calendar,
  X,
  User
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { dashboardService, DashboardStats } from '@/services/dashboard';
import { userService, UserProfile, UserStats } from '@/services/user';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { fetchApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Import these directly from the dashboard service file
import { 
  generateSubmissionTimeline, 
  getRecentSubmissions, 
  getRecentUsers,
  mapFormPerformanceData
} from '@/services/dashboard';

// Types for component props
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  loading?: boolean;
}

interface ChartPlaceholderProps {
  title: string;
  height?: number;
}

interface TablePlaceholderProps {
  title: string;
  rows?: number;
}

interface AlertProps {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success';
}

// Dashboard Components
const StatCard = ({ title, value, icon, trend, trendValue, loading = false }: StatCardProps) => {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {loading ? (
            <div className="h-7 w-24 bg-muted animate-pulse rounded"></div>
          ) : (
            <h3 className="text-2xl font-bold truncate">{value}</h3>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary flex-shrink-0 ml-2">
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center">
          <div className={cn(
            "mr-1 rounded-full p-1",
            trend === 'up' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3 transform rotate-180" />
            )}
          </div>
          <span className={cn(
            "text-xs font-medium",
            trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {trendValue}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
};

const ChartPlaceholder = ({ title, height = 300 }: ChartPlaceholderProps) => (
  <div className="rounded-lg border bg-card shadow-sm p-5">
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-medium">{title}</h3>
    </div>
    <div className={`w-full bg-muted/50 rounded-md flex items-center justify-center`} style={{ height }}>
      <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
    </div>
  </div>
);

const TablePlaceholder = ({ title, rows = 5 }: TablePlaceholderProps) => (
  <div className="rounded-lg border bg-card shadow-sm p-5">
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-medium">{title}</h3>
    </div>
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
      
      {Array(rows).fill(null).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-3">
          {Array(4).fill(null).map((_, j) => (
            <div key={j} className="h-8 bg-muted/50 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Alert = ({ title, message, type = 'info' }: AlertProps) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  return (
    <div className={cn(
      "rounded-lg p-4 flex gap-3 text-sm",
      type === 'warning' && "bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50",
      type === 'success' && "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50",
      type === 'info' && "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50",
    )}>
      <div className="mt-0.5">{getIcon()}</div>
      <div>
        <div className="font-semibold mb-1">{title}</div>
        <p>{message}</p>
      </div>
    </div>
  );
};

// In the dashboard page, use the direct API calls with custom trend calculation
const calculateTrend = (data: any[]): number => {
  if (!data || data.length === 0) return 0;
  
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  // Count items in the last 30 days
  const recentItems = data.filter(item => {
    const date = new Date(item.createdAt || item.submittedAt);
    return date >= thirtyDaysAgo && date <= now;
  }).length;
  
  // Count items in the 30 days before that
  const olderItems = data.filter(item => {
    const date = new Date(item.createdAt || item.submittedAt);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  }).length;
  
  // Calculate percentage change
  if (olderItems === 0) return recentItems > 0 ? 100 : 0;
  
  return Math.round(((recentItems - olderItems) / olderItems) * 100 * 10) / 10;
};

// Fetch dashboard data directly from API
const getDashboardStats = async (startDate: string, endDate: string, timestamp: number): Promise<DashboardStats> => {
  try {
    // Get user ID from token for client-specific data
    let userId = '';
    let userRole = 'CLIENT';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || '';
        userRole = payload.role || 'CLIENT';
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
    }
    
    // Convert string dates to Date objects for filtering
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    // Set end date to end of day to include the entire day
    endDateObj.setHours(23, 59, 59, 999);
    
    console.log(`Fetching data from ${startDate} to ${endDate} for user ${userId} with role ${userRole}`);
    
    // Fetch data from multiple API endpoints in parallel with explicit date parameters
    // Include timestamp to bust cache
    const [
      formsData, 
      submissionsData, 
      usersData, 
      formCompletionRatesData,
      conversionTrendsData
    ] = await Promise.all([
      fetchApi<any[]>('/api/forms', { 
        method: 'GET',
        params: { startDate, endDate, t: timestamp } 
      }),
      fetchApi<any[]>('/api/submissions', { 
        method: 'GET',
        params: { startDate, endDate, t: timestamp } 
      }),
      fetchApi<any[]>('/api/users', { 
        method: 'GET',
        params: { startDate, endDate, t: timestamp }
      }).catch(() => []),
      fetchApi<any[]>('/api/analytics/form-completion-rates', { 
        method: 'GET',
        params: { startDate, endDate, t: timestamp }
      }).catch(() => []),
      fetchApi<any[]>('/api/analytics/conversion-trends', { 
        method: 'GET',
        params: { 
          clientId: userId,
          start: startDate, 
          end: endDate,
          t: timestamp
        }
      }).catch(() => [])
    ]);

    console.log('Data fetched:', { 
      forms: formsData.length, 
      submissions: submissionsData.length, 
      users: usersData.length,
      formCompletionRates: formCompletionRatesData?.length || 0,
      conversionTrends: conversionTrendsData?.length || 0
    });

    // Filter submissions by date range if backend doesn't support query params
    const filteredSubmissions = submissionsData.filter(submission => {
      const submissionDate = new Date(submission.createdAt || submission.submittedAt);
      return submissionDate >= startDateObj && submissionDate <= endDateObj;
    });
    
    // Process form completion rates properly
    const formPerformance = formCompletionRatesData?.length > 0 
      ? formCompletionRatesData.map(item => ({
          formId: item.id || 'unknown',
          formName: item.form || 'Unnamed Form',
          submissions: item.submissionCount || 0,
          completionRate: item.rate || 0
        }))
      : [];
        
    // Use conversion trends data for submissions chart if available
    const submissionsTimeline = conversionTrendsData?.length > 0
      ? conversionTrendsData.map(item => ({
          date: item.date,
          value: item.submissions
        }))
      : generateSubmissionTimeline(filteredSubmissions, startDate, endDate);

    // Calculate trends based on filtered data
    const trends = {
      users: calculateTrend(usersData),
      forms: calculateTrend(formsData),
      submissions: calculateTrend(filteredSubmissions),
      uptime: 0.1,
    };

    // Map the API response to our dashboard stats interface
    const stats: DashboardStats = {
      totals: {
        users: usersData?.length || 0,
        forms: formsData?.length || 0,
        submissions: filteredSubmissions?.length || 0,
        uptime: 99.95, // Hardcoded as this isn't typically in the database
      },
      trends,
      charts: {
        submissions: submissionsTimeline,
        formPerformance: formPerformance.length > 0 
          ? formPerformance 
          : mapFormPerformanceData(formCompletionRatesData || [])
      },
      recentSubmissions: getRecentSubmissions(filteredSubmissions),
      recentUsers: getRecentUsers(usersData)
    };

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Component that uses useSearchParams
function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showAuthError, setShowAuthError] = useState(false);
  
  // Custom date range
  const [startDate, setStartDate] = useState<Date>(() => subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Check for authentication error in URL params
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam === 'session-expired') {
      // If session expired, redirect to login
      window.location.href = '/login?message=session-expired';
      return;
    }
    if (errorParam === 'authentication') {
      setShowAuthError(true);
      // Remove the error parameter from URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Load user data and initial dashboard data on mount
  useEffect(() => {
    loadUserData();
    
    // Fetch initial data with 30d range (default)
    const initialStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const initialEnd = format(new Date(), 'yyyy-MM-dd');
    loadDashboardData(initialStart, initialEnd);
  }, []);
  
  // Load user data function
  const loadUserData = async () => {
    try {
      // Get user stats
      try {
        const stats = await userService.getUserStats();
        setUserStats(stats);
      } catch (statsError) {
        console.error('Failed to load user stats:', statsError);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };
  
  // Refresh data handler - public function for refresh button
  const handleRefresh = () => {
    loadDashboardDataForCurrentRange();
  };
  
  // Load dashboard data for the current date range
  const loadDashboardDataForCurrentRange = () => {
    setLoading(true);
    
    let start: string;
    let end: string;
    
    // Calculate date range based on selected option
    if (dateRange === '7d') {
      start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      end = format(new Date(), 'yyyy-MM-dd');
    } else if (dateRange === '30d') {
      start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      end = format(new Date(), 'yyyy-MM-dd');
    } else if (dateRange === '90d') {
      start = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      end = format(new Date(), 'yyyy-MM-dd');
    } else {
      // Custom date range
      start = format(startDate, 'yyyy-MM-dd');
      end = format(endDate, 'yyyy-MM-dd');
    }
    
    loadDashboardData(start, end);
  };
  
  // Load dashboard data with specific date range
  const loadDashboardData = async (start: string, end: string) => {
    try {
      setLoading(true);
      console.log(`Loading dashboard data: ${start} to ${end}`);
      
      // Add cache buster
      const timestamp = new Date().getTime();
      
      // Fetch dashboard data
      const dashboardStats = await getDashboardStats(start, end, timestamp);
      
      // Format the data to ensure it's displayed correctly
      const formattedStats = {
        ...dashboardStats,
        totals: {
          ...dashboardStats.totals,
          users: Math.min(dashboardStats.totals.users, 9999),
          forms: Math.min(dashboardStats.totals.forms, 9999),
          submissions: Math.min(dashboardStats.totals.submissions, 9999),
          uptime: Math.min(dashboardStats.totals.uptime, 100)
        },
        trends: {
          ...dashboardStats.trends,
          users: Math.min(Math.round(dashboardStats.trends.users * 10) / 10, 99.9),
          forms: Math.min(Math.round(dashboardStats.trends.forms * 10) / 10, 99.9),
          submissions: Math.min(Math.round(dashboardStats.trends.submissions * 10) / 10, 99.9),
          uptime: Math.min(Math.round(dashboardStats.trends.uptime * 10) / 10, 9.9)
        }
      };
      
      setStats(formattedStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle date range button clicks (7d, 30d, 90d, custom)
  const handleDateRangeChange = (range: '7d' | '30d' | '90d' | 'custom') => {
    // Only do work if range actually changed
    if (range !== dateRange) {
      setDateRange(range);
      
      if (range !== 'custom') {
        setShowDatePicker(false);
        
        // Set appropriate dates based on range
        if (range === '7d') {
          setStartDate(subDays(new Date(), 7));
          setEndDate(new Date());
        } else if (range === '30d') {
          setStartDate(subDays(new Date(), 30));
          setEndDate(new Date());
        } else if (range === '90d') {
          setStartDate(subDays(new Date(), 90));
          setEndDate(new Date());
        }
        
        // Load data right away for the selected range
        let start: string;
        let end = format(new Date(), 'yyyy-MM-dd');
        
        if (range === '7d') {
          start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        } else if (range === '30d') {
          start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        } else { // 90d
          start = format(subDays(new Date(), 90), 'yyyy-MM-dd');
        }
        
        // Fetch data immediately
        loadDashboardData(start, end);
      } else {
        // Just show the picker for custom range
        setShowDatePicker(true);
      }
    } else if (range === 'custom') {
      // If already on custom but clicked again, just show the picker
      setShowDatePicker(true);
    }
  };
  
  // Handle custom date preset selection (This Month, Last Month, This Year)
  const handleDatePresetSelect = (preset: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    
    if (preset === 'thisMonth') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
    } else if (preset === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setStartDate(startOfMonth(lastMonth));
      setEndDate(endOfMonth(lastMonth));
    } else if (preset === 'thisYear') {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
    }
    
    // Don't close the date picker - let user see the selected range
  };
  
  // Apply custom date range
  const applyCustomDateRange = () => {
    setShowDatePicker(false);
    loadDashboardData(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));
  };
  
  // Helper to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Authentication Error Alert */}
      {showAuthError && (
        <Alert
          type="warning"
          title="Authentication Issue"
          message="There was an authentication problem, but you're back on track now! You can continue using the dashboard safely."
        />
      )}

      {/* Welcome & date range selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your {isAdmin ? 'platform' : 'forms'} today.
          </p>
        </div>
        
        {/* Date range selector */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex">
            <button
              onClick={() => handleDateRangeChange('7d')}
              className={cn(
                "px-3 py-2 text-sm border rounded-l-md",
                dateRange === '7d' 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-border hover:bg-accent"
              )}
            >
              7D
            </button>
            <button
              onClick={() => handleDateRangeChange('30d')}
              className={cn(
                "px-3 py-2 text-sm border-y border-r",
                dateRange === '30d' 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-border hover:bg-accent"
              )}
            >
              30D
            </button>
            <button
              onClick={() => handleDateRangeChange('90d')}
              className={cn(
                "px-3 py-2 text-sm border-y border-r",
                dateRange === '90d' 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-border hover:bg-accent"
              )}
            >
              90D
            </button>
            <button
              onClick={() => handleDateRangeChange('custom')}
              className={cn(
                "px-3 py-2 text-sm border-y border-r rounded-r-md",
                dateRange === 'custom' 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-border hover:bg-accent"
              )}
            >
              Custom
            </button>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
      
      {/* Custom date range picker */}
      {showDatePicker && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Select Date Range</h2>
              <button onClick={() => setShowDatePicker(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={e => setStartDate(new Date(e.target.value))}
                    max={format(endDate, 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={e => setEndDate(new Date(e.target.value))}
                    min={format(startDate, 'yyyy-MM-dd')}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePresetSelect('thisMonth')}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePresetSelect('lastMonth')}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePresetSelect('thisYear')}
                >
                  This Year
                </Button>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                <span>Selected range: </span>
                <span className="font-medium">
                  {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
                </span>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={applyCustomDateRange}
                >
                  Apply & Update Dashboard
                </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Forms"
          value={loading ? "—" : formatNumber(stats?.totals.forms || 0)}
          icon={<FileText className="h-5 w-5" />}
          trend="up"
          trendValue={`${stats?.trends.forms || 0}%`}
          loading={loading}
        />
        <StatCard
          title="Total Submissions"
          value={loading ? "—" : formatNumber(stats?.totals.submissions || 0)}
          icon={<ListChecks className="h-5 w-5" />}
          trend="up"
          trendValue={`${stats?.trends.submissions || 0}%`}
          loading={loading}
        />
        {isAdmin && (
        <StatCard
          title="Total Users"
            value={loading ? "—" : formatNumber(stats?.totals.users || 0)}
          icon={<Users className="h-5 w-5" />}
          trend="up"
            trendValue={`${stats?.trends.users || 0}%`}
          loading={loading}
        />
        )}
        <StatCard
          title="System Uptime"
          value={loading ? "—" : `${stats?.totals.uptime || 0}%`}
          icon={<Clock className="h-5 w-5" />}
          trend="up"
          trendValue={`${stats?.trends.uptime || 0}%`}
          loading={loading}
        />
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-medium">Submission Activity</h3>
              
              <Button
                variant="ghost"
                size="icon"
                title="Download data"
              >
                <Download className="h-4 w-4" />
              </Button>
          </div>
            
            <div className="p-5">
          {loading ? (
                <div className="h-[300px] w-full bg-muted/50 rounded-md flex items-center justify-center animate-pulse">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          ) : stats?.charts.submissions && stats.charts.submissions.length > 0 ? (
                <div className="h-[300px] w-full">
                  {/* Render actual chart with submission data */}
                  <div className="h-full w-full">
                    <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                      {/* Create X axis */}
                      <line 
                        x1="40" y1="270" 
                        x2="780" y2="270" 
                        stroke="currentColor" 
                        strokeOpacity="0.2" 
                        strokeWidth="1"
                      />
                      
                      {/* Create Y axis */}
                      <line 
                        x1="40" y1="30" 
                        x2="40" y2="270" 
                        stroke="currentColor" 
                        strokeOpacity="0.2" 
                        strokeWidth="1"
                      />
                      
                      {/* Plot the data */}
                      {(() => {
                        const data = stats.charts.submissions;
                        if (!data.length) return null;
                        
                        // Find max value for scaling
                        const maxValue = Math.max(...data.map(d => d.value || 0), 1);
                        
                        // Calculate points for the path
                        const points = data.map((item, index) => {
                          const x = 40 + (740 * index / (data.length - 1 || 1));
                          const y = 270 - ((item.value || 0) / maxValue * 220);
                          return `${x},${y}`;
                        }).join(' ');
                        
                        // Create the area path
                        const areaPath = `
                          M ${40},${270} 
                          L ${data.map((item, index) => {
                            const x = 40 + (740 * index / (data.length - 1 || 1));
                            const y = 270 - ((item.value || 0) / maxValue * 220);
                            return `${x},${y}`;
                          }).join(' L ')} 
                          L ${40 + 740},${270} 
                          Z
                        `;
                        
                        // Display dates along x-axis (show first, middle and last)
                        const dateLabels = [];
                        if (data.length >= 1) {
                          // First date
                          dateLabels.push(
                            <text 
                              key="first" 
                              x="40" 
                              y="290" 
                              fontSize="10" 
                              textAnchor="start" 
                              fill="currentColor"
                              fillOpacity="0.6"
                            >
                              {new Date(data[0].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </text>
                          );
                          
                          // Middle date
                          if (data.length > 2) {
                            const midIndex = Math.floor(data.length / 2);
                            dateLabels.push(
                              <text 
                                key="middle" 
                                x={40 + (740 * midIndex / (data.length - 1))} 
                                y="290" 
                                fontSize="10" 
                                textAnchor="middle" 
                                fill="currentColor"
                                fillOpacity="0.6"
                              >
                                {new Date(data[midIndex].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </text>
                            );
                          }
                          
                          // Last date
                          dateLabels.push(
                            <text 
                              key="last" 
                              x="780" 
                              y="290" 
                              fontSize="10" 
                              textAnchor="end" 
                              fill="currentColor"
                              fillOpacity="0.6"
                            >
                              {new Date(data[data.length - 1].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </text>
                          );
                        }
                        
                        // Display values along y-axis
                        const valueLabels: React.ReactNode[] = [];
                        [0, 0.25, 0.5, 0.75, 1].forEach((ratio, i) => {
                          const value = Math.round(maxValue * ratio);
                          valueLabels.push(
                            <text 
                              key={i} 
                              x="35" 
                              y={270 - ratio * 220} 
                              fontSize="10" 
                              textAnchor="end" 
                              dominantBaseline="middle" 
                              fill="currentColor"
                              fillOpacity="0.6"
                            >
                              {value}
                            </text>
                          );
                        });
                        
                        return (
                          <>
                            {/* Area under the line */}
                            <path 
                              d={areaPath} 
                              fill="currentColor" 
                              fillOpacity="0.1" 
                              stroke="none" 
                            />
                            
                            {/* Line connecting data points */}
                            <polyline 
                              points={points} 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2"
                              className="text-primary"
                            />
                            
                            {/* Data points */}
                            {data.map((item, index) => {
                              const x = 40 + (740 * index / (data.length - 1 || 1));
                              const y = 270 - ((item.value || 0) / maxValue * 220);
                              return (
                                <circle 
                                  key={index} 
                                  cx={x} 
                                  cy={y} 
                                  r="4" 
                                  fill="currentColor" 
                                  className="text-primary"
                                >
                                  <title>{new Date(item.date).toLocaleDateString()} - {item.value} submissions</title>
                                </circle>
                              );
                            })}
                            
                            {/* Axis labels */}
                            {dateLabels}
                            {valueLabels}
                          </>
                        );
                      })()}
                    </svg>
              </div>
            </div>
          ) : (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No submission data available for the selected period.</p>
                  </div>
            </div>
          )}
            </div>
        </div>

          {isAdmin && (
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-medium">Recent Users</h3>
                <Link href="/admin/users" className="text-xs text-primary hover:underline">View all</Link>
          </div>
              
              <div className="divide-y divide-border">
          {loading ? (
                  // Loading skeleton
                  Array(5).fill(null).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
            </div>
                    </div>
                  ))
                ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                      <div className="flex-shrink-0 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                      <div className="ml-auto text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                  </div>
              </div>
                  ))
          ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No users found.</p>
            </div>
          )}
        </div>
            </div>
          )}
      </div>
      
        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-medium">Form Performance</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Filter"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
                </div>
            </div>
            
            <div className="divide-y divide-border">
              {loading ? (
                // Loading skeleton
                Array(5).fill(null).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
              </div>
                    <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                ))
              ) : stats?.charts.formPerformance && stats.charts.formPerformance.length > 0 ? (
                stats.charts.formPerformance.map((form) => (
                  <div key={form.formId} className="p-4 hover:bg-muted/50">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">{form.formName}</p>
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                        {form.completionRate}%
                    </span>
                  </div>
                    <div className="flex items-center mt-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${form.completionRate}%` }}
                        />
                </div>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {form.submissions} submissions
                      </span>
            </div>
                  </div>
                ))
          ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No form performance data available.</p>
            </div>
          )}
            </div>
        </div>

          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-medium">Recent Submissions</h3>
              <Link href="/submissions" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            
            <div className="divide-y divide-border">
          {loading ? (
                // Loading skeleton
                Array(5).fill(null).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
                </div>
            </div>
                ))
              ) : stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
                stats.recentSubmissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                    <div className="flex-shrink-0 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
              </div>
                    <div>
                      <p className="text-sm font-medium">{submission.formName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                  </div>
                    <div className="ml-auto">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        submission.status === 'completed'
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {submission.status}
                      </span>
                </div>
            </div>
                ))
          ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No submissions found.</p>
            </div>
          )}
        </div>
      </div>
                </div>
                </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchApi } from '@/services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowDownToLine, 
  ArrowUpDown, 
  BarChart, 
  Calendar, 
  ChevronDown, 
  Download, 
  Eye, 
  Filter, 
  Mail, 
  MoreHorizontal, 
  RefreshCcw, 
  Search, 
  Trash, 
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Activity,
  Zap,
  Users,
  BarChart3,
  Star,
  Grid3X3,
  List,
  ChevronUp,
  X
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Submission {
  id: string;
  formId: string;
  form: {
    id: string;
    title: string;
    slug: string;
    fields?: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
    clientId?: string;
  };
  data: Record<string, any>;
  createdAt: string;
  status?: 'new' | 'viewed' | 'archived';
}

// Helper function to format submission data using real form fields
const formatSubmissionData = (submission: Submission) => {
  const formattedData: Array<{label: string, value: any, type: string}> = [];
  
  if (!submission.data || typeof submission.data !== 'object') {
    return formattedData;
  }

  // Use the form fields from the submission if available (real backend data)
  const formFields = submission.form?.fields || [];

  // Helper function to safely convert any value to a readable string
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'No response';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      // Handle common object structures
      if (value.type && value.value !== undefined) {
        // Rating or structured field
        if (value.type === 'rating' && value.scale) {
          return `${value.value}/${value.scale} stars${value.comment ? ` - ${value.comment}` : ''}`;
        }
        return String(value.value);
      }
      
      if (value.label && value.value !== undefined) {
        return `${value.label}: ${value.value}`;
      }
      
      // For other objects, try to extract meaningful data
      const keys = Object.keys(value);
      if (keys.length === 1) {
        return String(value[keys[0]]);
      }
      
      // If object has multiple keys, format as key-value pairs
      return keys.map(key => `${key}: ${value[key]}`).join(', ');
    }
    
    // Fallback for any other type
    return String(value);
  };

  Object.entries(submission.data).forEach(([key, value]) => {
    // Try to find the field definition from the real form fields
    const field = formFields.find(f => f.id === key);
    
    let label: string;
    if (field?.label) {
      // Use the real field label from the form definition
      label = field.label;
    } else {
      // Fallback to formatting the key if no field definition found
      if (key.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // For UUID keys, try to infer meaning from the value or use a generic label
        if (typeof value === 'string' && ['good', 'bad', 'excellent', 'poor', 'one', 'two', 'three'].includes(value.toLowerCase())) {
          label = 'Rating/Choice';
        } else if (typeof value === 'object' && value.type) {
          label = value.type.charAt(0).toUpperCase() + value.type.slice(1);
        } else {
          label = 'Response';
        }
      } else {
        // For regular keys, format them nicely
        label = key
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
          .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
          .trim();
      }
    }
    
    const type = field?.type || 'text';
    const formattedValue = formatValue(value);
    
    formattedData.push({
      label,
      value: formattedValue,
      type
    });
  });
  
  return formattedData;
};

// Helper function to render submission data in a readable format
const renderSubmissionDataPreview = (
  submission: Submission, 
  maxFields: number = 3
) => {
  const formattedData = formatSubmissionData(submission);
  const previewData = formattedData.slice(0, maxFields);
  const remainingCount = Math.max(0, formattedData.length - maxFields);
  
  return (
    <div className="space-y-2.5">
      {previewData.map((item, index) => (
        <div key={index} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {item.label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
              {typeof item.value === 'string' && item.value.length > 120 
                ? `${item.value.substring(0, 120)}...` 
                : String(item.value || 'No response')}
            </div>
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-500 text-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <FileText className="h-4 w-4 inline mr-1.5" />
          +{remainingCount} more field{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default function SubmissionsDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formFilter, setFormFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentTab, setCurrentTab] = useState('all');
  const [savedStatusMap, setSavedStatusMap] = useState<Record<string, 'new' | 'viewed' | 'archived'>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byForm: [] as {formId: string, formTitle: string, count: number}[]
  });

  // Pagination state
  const [submissionsPerForm, setSubmissionsPerForm] = useState(10);
  const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>({});

  // Detect screen sizes for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
        setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // First load saved statuses from localStorage
    const savedStatuses = localStorage.getItem('submissionStatuses');
    if (savedStatuses) {
      try {
        const parsedStatuses = JSON.parse(savedStatuses);
        setSavedStatusMap(parsedStatuses);
        // Then load submissions with the parsed statuses
        loadSubmissions(parsedStatuses);
      } catch (error) {
        console.error('Failed to parse saved statuses', error);
        loadSubmissions({});
      }
    } else {
      loadSubmissions({});
    }
  }, []);

  const loadSubmissions = async (statusMap = savedStatusMap) => {
    try {
      setLoading(true);
      const data = await fetchApi('/submissions') as Submission[];
      
      // Enhance submissions with a status field
      const enhancedData = data.map((submission: Submission) => {
        // First check if we have a manually saved status for this submission
        if (statusMap[submission.id]) {
          return {
            ...submission,
            status: statusMap[submission.id]
          };
        }
        
        // If submission already has a status, keep it
        if (submission.status) {
          return submission;
        }
        
        // Get timestamp for submission
        const submissionDate = new Date(submission.createdAt);
        const now = new Date();
        const minutesAgo = Math.floor((now.getTime() - submissionDate.getTime()) / (1000 * 60));
        
        // Assign status based on age:
        // New: less than 30 minutes old
        // Viewed: between 30 minutes and 24 hours
        // Archived: older than 24 hours
        let status: 'new' | 'viewed' | 'archived';
        if (minutesAgo < 30) {
          status = 'new';
        } else if (minutesAgo < 24 * 60) {
          status = 'viewed';
        } else {
          status = 'archived';
        }
        
        return {
          ...submission,
          status
        };
      });
      
      setSubmissions(enhancedData);
      calculateStats(enhancedData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Submission[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate counts by form
    const formCounts = data.reduce((acc, submission) => {
      const formId = submission.formId;
      const formTitle = submission.form.title;
      
      const existingForm = acc.find(item => item.formId === formId);
      if (existingForm) {
        existingForm.count += 1;
      } else {
        acc.push({ formId, formTitle, count: 1 });
      }
      
      return acc;
    }, [] as {formId: string, formTitle: string, count: number}[]);

    // Sort by count (highest first)
    formCounts.sort((a, b) => b.count - a.count);

    setStats({
      total: data.length,
      today: data.filter(s => new Date(s.createdAt) >= today).length,
      thisWeek: data.filter(s => new Date(s.createdAt) >= thisWeek).length,
      thisMonth: data.filter(s => new Date(s.createdAt) >= thisMonth).length,
      byForm: formCounts
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      await fetchApi(`/submissions/${id}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'Submission deleted successfully',
      });
      loadSubmissions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    try {
      const data = await fetchApi('/submissions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          format,
          filters: {
            searchTerm,
            formFilter,
            dateFilter,
            statusFilter
          }
        })
      }) as string;
      
      // Create and download file
      const contentType = format === 'csv' ? 'text/csv' : 
                             format === 'json' ? 'application/json' : 
                             'application/pdf';
      
      const blob = new Blob([data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Submissions exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export submissions',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>;
      case 'viewed':
        return <Badge variant="outline" className="border-green-500 text-green-600">Viewed</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Search filter - search in form title, submission data, and field labels
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(submission => {
        // Search in form title
        const formTitleMatch = submission.form.title.toLowerCase().includes(searchLower);
        
        // Search in submission data values
        const dataMatch = Object.values(submission.data).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).toLowerCase().includes(searchLower);
          }
          return false;
        });
        
        // Search in field labels if available
        const fieldLabelMatch = submission.form.fields?.some(field => 
          field.label.toLowerCase().includes(searchLower)
        ) || false;
        
        return formTitleMatch || dataMatch || fieldLabelMatch;
      });
    }

    // Form filter
    if (formFilter !== 'all') {
      filtered = filtered.filter(submission => submission.form.id === formFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(submission => {
        const submissionDate = new Date(submission.createdAt);
        switch (dateFilter) {
          case 'today':
            return submissionDate >= today;
          case 'week':
            return submissionDate >= weekAgo;
          case 'month':
            return submissionDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'form':
          aValue = a.form.title;
          bValue = b.form.title;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredSubmissions = filterSubmissions();

  const uniqueForms = Array.from(new Set(submissions.map(s => s.formId)))
    .map(formId => {
      const submission = submissions.find(s => s.formId === formId);
      return {
        id: formId,
        title: submission?.form.title || 'Unknown Form'
      };
    });

  const updateSubmissionStatus = async (id: string, newStatus: 'new' | 'viewed' | 'archived') => {
    try {
      // Call the API to update the status
      await fetchApi(`/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ status: newStatus })
      });
      
      // Update in local state
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => 
          submission.id === id 
            ? { ...submission, status: newStatus } 
            : submission
        )
      );
      
      // Save to localStorage for persistence
      const updatedStatusMap = { ...savedStatusMap, [id]: newStatus };
      setSavedStatusMap(updatedStatusMap);
      localStorage.setItem('submissionStatusMap', JSON.stringify(updatedStatusMap));
      
      toast({
        title: "Status Updated",
        description: `Submission marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section - Matching Forms Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-green-100 dark:border-gray-600"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
                >
                  Submissions Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1"
                >
                  {isMobile ? "Manage form submissions" : "Manage, analyze, and track all your form submissions with powerful insights"}
                </motion.p>
              </div>
            </div>
            
            {/* Quick Stats - Responsive */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{stats.total} Total</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{stats.today} Today</span>
              </div>
              {!isMobile && (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{stats.thisWeek} This Week</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{stats.thisMonth} This Month</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={() => loadSubmissions(savedStatusMap)}
                className="relative overflow-hidden bg-gradient-to-r from-green-50 to-teal-50 border-green-200 text-green-700 hover:from-green-100 hover:to-teal-100 dark:from-green-950 dark:to-teal-950 dark:border-green-800 dark:text-green-300 transition-all duration-300 hover:shadow-lg h-9 sm:h-10 text-xs sm:text-sm"
              >
                <RefreshCcw className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Refresh
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 h-9 sm:h-10 text-xs sm:text-sm">
                    <Download className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Export
                    <ChevronDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards Section - Responsive */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-600 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 dark:bg-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                  Total Submissions
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{stats.total}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">All time submissions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-600 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 dark:bg-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                  Today
                </CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-700 dark:text-green-200">{stats.today}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 flex items-center">
                {stats.today > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    Active today
                  </>
                ) : (
                  "No submissions today"
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-600 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 dark:bg-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                  This Week
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-600 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 dark:bg-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                  This Month
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-200">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Since {format(new Date(new Date().setDate(1)), 'MMM d')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Revolutionary Form-Grouped Submissions View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-6"
      >
        {/* Enhanced Search and Filter Section */}
        <Card className="border-gray-200 dark:border-gray-600 shadow-lg dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar - Full width on mobile */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search forms and submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* Filters Row - Responsive layout */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                {/* Status Tabs */}
                <div className="flex-shrink-0">
                  <Tabs defaultValue="all" onValueChange={setCurrentTab}>
                    <TabsList className="h-10 bg-gray-100 dark:bg-gray-800 w-full sm:w-auto">
                      <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">All</TabsTrigger>
                      <TabsTrigger value="new" className="text-xs sm:text-sm px-2 sm:px-3 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">New</TabsTrigger>
                      <TabsTrigger value="viewed" className="text-xs sm:text-sm px-2 sm:px-3 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Viewed</TabsTrigger>
                      <TabsTrigger value="archived" className="text-xs sm:text-sm px-2 sm:px-3 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Archived</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Filter Dropdowns - Stack on mobile, row on larger screens */}
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  {/* Form Filter */}
                  <Select value={formFilter} onValueChange={setFormFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Filter by form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Forms</SelectItem>
                      {stats.byForm.map((form) => (
                        <SelectItem key={form.formId} value={form.formId}>
                          {form.formTitle} ({form.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Date filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Per Page Filter */}
                  <Select value={submissionsPerForm.toString()} onValueChange={(value) => setSubmissionsPerForm(parseInt(value))}>
                    <SelectTrigger className="w-full sm:w-[110px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Show 5</SelectItem>
                      <SelectItem value="10">Show 10</SelectItem>
                      <SelectItem value="20">Show 20</SelectItem>
                      <SelectItem value="50">Show 50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form-Grouped Submissions */}
        {renderFormGroupedSubmissions()}
      </motion.div>
    </div>
  );
  
  // Revolutionary Form-Grouped Submissions Renderer
  function renderFormGroupedSubmissions() {
    if (loading) {
      return (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="grid gap-4">
                  {[1, 2].map((j) => (
                    <div key={j} className="border rounded-lg p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Group submissions by form
    const submissionsByForm = filteredSubmissions.reduce((acc, submission) => {
      const formId = submission.form.id;
      if (!acc[formId]) {
        acc[formId] = {
          form: submission.form,
          submissions: []
        };
      }
      acc[formId].submissions.push(submission);
      return acc;
    }, {} as Record<string, { form: { id: string; title: string; slug: string }; submissions: Submission[] }>);

    // Filter submissions based on current tab
    const getFilteredSubmissionsForTab = (submissions: Submission[]) => {
      if (currentTab === 'all') return submissions;
      return submissions.filter(s => s.status === currentTab);
    };

    const formGroups = Object.values(submissionsByForm)
      .map(group => ({
        ...group,
        submissions: getFilteredSubmissionsForTab(group.submissions)
      }))
      .filter(group => group.submissions.length > 0)
      .sort((a, b) => b.submissions.length - a.submissions.length);

    if (formGroups.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-50" />
            <FileText className="relative h-20 w-20 mx-auto mb-6 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-3">No submissions found</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm ? `No submissions match "${searchTerm}"` : 
             currentTab !== 'all' ? `No ${currentTab} submissions found` : 
             'No submissions have been received yet. Create a form and start collecting responses!'}
          </p>
          {(searchTerm || currentTab !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCurrentTab('all');
                setDateFilter('all');
              }}
              className="bg-white dark:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Clear all filters
            </Button>
          )}
        </motion.div>
      );
    }

    // Generate unique colors for each form
    const formColors = [
      { from: 'from-blue-500', to: 'to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      { from: 'from-green-500', to: 'to-emerald-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      { from: 'from-purple-500', to: 'to-violet-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      { from: 'from-orange-500', to: 'to-red-600', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      { from: 'from-teal-500', to: 'to-cyan-600', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
      { from: 'from-pink-500', to: 'to-rose-600', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
    ];

    return (
      <div className="space-y-8">
        <AnimatePresence>
          {formGroups.map((group, groupIndex) => {
            const formSubmissions = group.submissions;
            const newCount = formSubmissions.filter(s => s.status === 'new').length;
            const viewedCount = formSubmissions.filter(s => s.status === 'viewed').length;
            const archivedCount = formSubmissions.filter(s => s.status === 'archived').length;
            const colorScheme = formColors[groupIndex % formColors.length];

            return (
              <motion.div
                key={group.form.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
              >
                <Card className="border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                  {/* Distinctive Form Header with Brand Colors */}
                  <div className={`h-1.5 bg-gradient-to-r ${colorScheme.from} ${colorScheme.to}`} />
                  
                  <CardHeader className={`
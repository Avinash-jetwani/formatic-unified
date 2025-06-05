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
  List
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
  };
  data: Record<string, any>;
  createdAt: string;
  status?: 'new' | 'viewed' | 'archived';
}

// Helper function to format submission data
const formatSubmissionData = (submission: Submission, formFields: Array<{id: string, label: string, type: string}>) => {
  const formattedData: Array<{label: string, value: any, type: string}> = [];
  
  if (!submission.data || typeof submission.data !== 'object') {
    return formattedData;
  }

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
    // Try to find the field definition to get a proper label
    const field = formFields.find(f => f.id === key || f.label === key);
    
    let label: string;
    if (field?.label) {
      label = field.label;
    } else {
      // If no field found, try to make the key more readable
      // Handle UUID-like keys by checking if they look like UUIDs
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

// Helper function to render submission data in a beautiful format
const renderSubmissionDataPreview = (
  submission: Submission, 
  formFields: Array<{id: string, label: string, type: string}>, 
  maxFields: number = 3
) => {
  const formattedData = formatSubmissionData(submission, formFields);
  const previewData = formattedData.slice(0, maxFields);
  const remainingCount = Math.max(0, formattedData.length - maxFields);
  
  return (
    <div className="space-y-2">
      {previewData.map((item, index) => (
        <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {item.label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
              {typeof item.value === 'string' && item.value.length > 150 
                ? `${item.value.substring(0, 150)}...` 
                : String(item.value || 'No response')}
            </div>
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-500 text-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <FileText className="h-3 w-3 inline mr-1" />
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
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byForm: [] as {formId: string, formTitle: string, count: number}[]
  });

  // Form fields mapping for better data display
  const [formFields, setFormFields] = useState<Record<string, Array<{id: string, label: string, type: string}>>>({});
  
  // Pagination state
  const [submissionsPerForm, setSubmissionsPerForm] = useState(10);
  const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>({});

  // Detect mobile screens on client side
  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
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

  // Load form fields for better data display
  const loadFormFields = async (formIds: string[]) => {
    try {
      const fieldsPromises = formIds.map(async (formId) => {
        try {
          const fields = await fetchApi(`/forms/${formId}/fields`);
          return { formId, fields: Array.isArray(fields) ? fields : [] };
        } catch (error) {
          console.error(`Failed to load fields for form ${formId}:`, error);
          // Return empty fields array if API fails
          return { formId, fields: [] };
        }
      });
      
      const fieldsResults = await Promise.all(fieldsPromises);
      const fieldsMap: Record<string, Array<{id: string, label: string, type: string}>> = {};
      
      fieldsResults.forEach(({ formId, fields }) => {
        fieldsMap[formId] = fields.map((field: any) => ({
          id: field.id || field.name || '',
          label: field.label || field.name || 'Unknown Field',
          type: field.type || 'text'
        }));
      });
      
      setFormFields(fieldsMap);
    } catch (error) {
      console.error('Failed to load form fields:', error);
      // Continue without form fields if there's an error
    }
  };

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
      
      // Load form fields for better data display
      const uniqueFormIds = Array.from(new Set(enhancedData.map(s => s.formId)));
      if (uniqueFormIds.length > 0) {
        await loadFormFields(uniqueFormIds);
      }
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
    return submissions
      .filter(submission => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            submission.form.title.toLowerCase().includes(searchLower) ||
            JSON.stringify(submission.data).toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .filter(submission => {
        if (formFilter === 'all') return true;
        return submission.formId === formFilter;
      })
      .filter(submission => {
        if (statusFilter === 'all') return true;
        return submission.status === statusFilter;
      })
      .filter(submission => {
        if (currentTab !== 'all' && currentTab !== statusFilter) {
          return submission.status === currentTab;
        }
        return true;
      })
      .filter(submission => {
        const date = new Date(submission.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return date >= startOfDay;
          case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - 7);
            return date >= startOfWeek;
          case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return date >= startOfMonth;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (sortField === 'createdAt') {
          return sortDirection === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortField === 'form') {
          return sortDirection === 'asc'
            ? a.form.title.localeCompare(b.form.title)
            : b.form.title.localeCompare(a.form.title);
        }
        return 0;
      });
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
        className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 rounded-2xl p-8 border border-green-100 dark:border-green-800"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg"
              >
                <FileText className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
                >
                  Submissions Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-lg text-muted-foreground mt-1"
                >
                  Manage, analyze, and track all your form submissions with powerful insights
                </motion.p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap gap-4 mt-4"
            >
              <div className="flex items-center gap-2 bg-white/70 dark:bg-black/20 rounded-full px-4 py-2 backdrop-blur-sm">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{stats.total} Total</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-black/20 rounded-full px-4 py-2 backdrop-blur-sm">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{stats.today} Today</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-black/20 rounded-full px-4 py-2 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">{stats.thisWeek} This Week</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-black/20 rounded-full px-4 py-2 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">{stats.thisMonth} This Month</span>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={() => loadSubmissions(savedStatusMap)}
                className="relative overflow-hidden bg-gradient-to-r from-green-50 to-teal-50 border-green-200 text-green-700 hover:from-green-100 hover:to-teal-100 dark:from-green-950 dark:to-teal-950 dark:border-green-800 dark:text-green-300 transition-all duration-300 hover:shadow-lg"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
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

      {/* Enhanced Stats Cards Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Submissions
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today
                </CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.today}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
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
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Since {format(new Date(new Date().setDate(1)), 'MMM d')}</p>
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
        <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search forms and submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Tabs defaultValue="all" onValueChange={setCurrentTab}>
                  <TabsList className="h-10 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="all" className="text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">All</TabsTrigger>
                    <TabsTrigger value="new" className="text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">New</TabsTrigger>
                    <TabsTrigger value="viewed" className="text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Viewed</TabsTrigger>
                    <TabsTrigger value="archived" className="text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Archived</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[150px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Date filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={submissionsPerForm.toString()} onValueChange={(value) => setSubmissionsPerForm(parseInt(value))}>
                  <SelectTrigger className="w-[120px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <Skeleton key={j} className="h-16 w-full" />
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No submissions found</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            {searchTerm ? `No submissions match "${searchTerm}"` : 
             currentTab !== 'all' ? `No ${currentTab} submissions found` : 
             'No submissions have been received yet'}
          </p>
          {(searchTerm || currentTab !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCurrentTab('all');
                setDateFilter('all');
              }}
            >
              Clear all filters
            </Button>
          )}
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <AnimatePresence>
          {formGroups.map((group, groupIndex) => {
            const formSubmissions = group.submissions;
            const newCount = formSubmissions.filter(s => s.status === 'new').length;
            const viewedCount = formSubmissions.filter(s => s.status === 'viewed').length;
            const archivedCount = formSubmissions.filter(s => s.status === 'archived').length;

            return (
              <motion.div
                key={group.form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
              >
                <Card className="border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {/* Form Header with Metrics */}
                  <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {group.form.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {formSubmissions.length} submission{formSubmissions.length !== 1 ? 's' : ''} 
                            {currentTab !== 'all' && ` (${currentTab})`}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {newCount > 0 && (
                          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                            {newCount} New
                          </Badge>
                        )}
                        {viewedCount > 0 && (
                          <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                            {viewedCount} Viewed
                          </Badge>
                        )}
                        {archivedCount > 0 && (
                          <Badge variant="secondary">
                            {archivedCount} Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                                     {/* Submissions List */}
                   <CardContent className="p-0">
                     <div className="divide-y divide-gray-200 dark:divide-gray-700">
                       <AnimatePresence>
                         {formSubmissions
                           .slice(0, expandedForms[group.form.id] ? formSubmissions.length : submissionsPerForm)
                           .map((submission, submissionIndex) => (
                          <motion.div
                            key={submission.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: submissionIndex * 0.05 }}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/submissions/${submission.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  {getStatusBadge(submission.status || 'viewed')}
                                </div>
                                
                                                                 {/* Beautiful Submission Data Preview */}
                                 {renderSubmissionDataPreview(submission, formFields[group.form.id] || [], 2)}
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/submissions/${submission.id}`);
                                  }}
                                  className="h-8 px-3"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSubmissionStatus(submission.id, 'new');
                                      }}
                                      disabled={submission.status === 'new'}
                                    >
                                      <Badge className="bg-blue-500 h-3 w-3 mr-2 p-0" />
                                      Mark as New
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSubmissionStatus(submission.id, 'viewed');
                                      }}
                                      disabled={submission.status === 'viewed'}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                                      Mark as Viewed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSubmissionStatus(submission.id, 'archived');
                                      }}
                                      disabled={submission.status === 'archived'}
                                    >
                                      <Archive className="h-3 w-3 mr-2 text-gray-500" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(submission.id);
                                      }}
                                    >
                                      <Trash className="h-3 w-3 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </motion.div>
                                                 ))}
                       </AnimatePresence>
                       
                       {/* Show More/Less Button */}
                       {formSubmissions.length > submissionsPerForm && (
                         <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700"
                         >
                           <Button
                             variant="outline"
                             onClick={() => {
                               setExpandedForms(prev => ({
                                 ...prev,
                                 [group.form.id]: !prev[group.form.id]
                               }));
                             }}
                             className="w-full h-10 text-sm"
                           >
                             {expandedForms[group.form.id] ? (
                               <>
                                 <ChevronDown className="h-4 w-4 mr-2 rotate-180" />
                                 Show Less ({formSubmissions.length - submissionsPerForm} hidden)
                               </>
                             ) : (
                               <>
                                 <ChevronDown className="h-4 w-4 mr-2" />
                                 Show {formSubmissions.length - submissionsPerForm} More Submissions
                               </>
                             )}
                           </Button>
                         </motion.div>
                       )}
                     </div>
                   </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  function renderSubmissionsTable(submissions: Submission[]) {
    if (loading) {
      return (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-2 sm:space-x-4">
              <Skeleton className="h-8 w-8 sm:h-12 sm:w-12" />
              <div className="space-y-1 sm:space-y-2">
                <Skeleton className="h-3 w-[150px] sm:h-4 sm:w-[250px]" />
                <Skeleton className="h-3 w-[120px] sm:h-4 sm:w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (submissions.length === 0) {
      return (
        <div className="text-center py-4 sm:py-8">
          <p className="text-xs sm:text-sm text-muted-foreground">No submissions match your filters</p>
          <Button variant="outline" size="sm" className="mt-3 sm:mt-4 text-xs sm:text-sm" onClick={() => {
            setSearchTerm('');
            setFormFilter('all');
            setDateFilter('all');
            setStatusFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      );
    }
    
    // For mobile screens, use a card layout instead of a table
    if (isMobile) {
      return (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Card 
              key={submission.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/submissions/${submission.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium text-xs truncate max-w-[150px]">
                      {submission.form.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusBadge(submission.status || 'viewed')}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/submissions/${submission.id}`);
                          }}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: "Email Feature",
                              description: "Email functionality will be implemented soon",
                            });
                          }}
                          className="text-xs"
                        >
                          <Mail className="h-3 w-3 mr-2" />
                          Email Response
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSubmissionStatus(submission.id, 'new');
                          }} 
                          disabled={submission.status === 'new'}
                          className="text-xs"
                        >
                          <Badge className="bg-blue-500 h-3 w-3 mr-2 p-0" />
                          Mark as New
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSubmissionStatus(submission.id, 'viewed');
                          }} 
                          disabled={submission.status === 'viewed'}
                          className="text-xs"
                        >
                          <Badge variant="outline" className="border-green-500 h-3 w-3 mr-2 p-0" />
                          Mark as Viewed
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSubmissionStatus(submission.id, 'archived');
                          }} 
                          disabled={submission.status === 'archived'}
                          className="text-xs"
                        >
                          <Badge variant="secondary" className="h-3 w-3 sm:h-4 sm:w-4 mr-2 p-0" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(submission.id);
                          }}
                        >
                          <Trash className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    // For larger screens, use the table layout
    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer text-xs sm:text-sm" onClick={() => handleSort('form')}>
                Form
                {sortField === 'form' && (
                  <ArrowUpDown className={`ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 inline ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </TableHead>
              <TableHead className="cursor-pointer text-xs sm:text-sm" onClick={() => handleSort('createdAt')}>
                Submitted
                {sortField === 'createdAt' && (
                  <ArrowUpDown className={`ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 inline ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </TableHead>
              <TableHead className="text-xs sm:text-sm">Status</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/submissions/${submission.id}`)}>
                <TableCell className="font-medium py-2 sm:py-4 text-xs sm:text-sm">
                  {submission.form.title}
                </TableCell>
                <TableCell className="py-2 sm:py-4 text-xs sm:text-sm">
                  <div className="flex flex-col">
                    <span>{formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  {getStatusBadge(submission.status || 'viewed')}
                </TableCell>
                <TableCell className="text-right py-2 sm:py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/submissions/${submission.id}`);
                        }}
                        className="text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // Would implement email functionality here
                        toast({
                          title: "Email Feature",
                          description: "Email functionality will be implemented soon",
                        });
                      }} className="text-xs sm:text-sm">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Email Response
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateSubmissionStatus(submission.id, 'new');
                      }} disabled={submission.status === 'new'} className="text-xs sm:text-sm">
                        <Badge className="bg-blue-500 h-3 w-3 sm:h-4 sm:w-4 mr-2 p-0" />
                        Mark as New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateSubmissionStatus(submission.id, 'viewed');
                      }} disabled={submission.status === 'viewed'} className="text-xs sm:text-sm">
                        <Badge variant="outline" className="border-green-500 h-3 w-3 sm:h-4 sm:w-4 mr-2 p-0" />
                        Mark as Viewed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateSubmissionStatus(submission.id, 'archived');
                      }} disabled={submission.status === 'archived'} className="text-xs sm:text-sm">
                        <Badge variant="secondary" className="h-3 w-3 sm:h-4 sm:w-4 mr-2 p-0" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(submission.id);
                        }}
                      >
                        <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
} 
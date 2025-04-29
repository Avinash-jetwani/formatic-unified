'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  TrendingUp 
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
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byForm: [] as {formId: string, formTitle: string, count: number}[]
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/submissions') as Submission[];
      // Enhance submissions with a status field
      const enhancedData = data.map((submission: Submission) => {
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
      // In a real app, this would call the API to update the status
      // await fetchApi(`/submissions/${id}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   data: JSON.stringify({ status: newStatus })
      // });
      
      // For now, just update it locally
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => 
          submission.id === id 
            ? { ...submission, status: newStatus } 
            : submission
        )
      );
      
      toast({
        title: 'Status Updated',
        description: `Submission marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update submission status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Submissions</h1>
          <p className="text-muted-foreground">Manage and analyze form submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadSubmissions()}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.today > 0 ? 
                <span className="text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> Active today</span> : 
                "No submissions today"}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Since {format(new Date(new Date().setDate(1)), 'MMM d')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submissions Overview</CardTitle>
            <CardDescription>View and manage all form submissions</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="mb-6" onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="viewed">Viewed</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions by form title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-4 flex-wrap">
                  <Select value={formFilter} onValueChange={setFormFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Forms</SelectItem>
                      {uniqueForms.map(form => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="all" className="m-0">
                {renderSubmissionsTable(filteredSubmissions)}
              </TabsContent>
              <TabsContent value="new" className="m-0">
                {renderSubmissionsTable(filteredSubmissions.filter(s => s.status === 'new'))}
              </TabsContent>
              <TabsContent value="viewed" className="m-0">
                {renderSubmissionsTable(filteredSubmissions.filter(s => s.status === 'viewed'))}
              </TabsContent>
              <TabsContent value="archived" className="m-0">
                {renderSubmissionsTable(filteredSubmissions.filter(s => s.status === 'archived'))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Form</CardTitle>
            <CardDescription>Distribution of submissions across your forms</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {stats.byForm.map((formStat, index) => (
                  <div key={formStat.formId} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium truncate max-w-[200px]" title={formStat.formTitle}>
                        {formStat.formTitle}
                      </span>
                      <span className="text-sm text-muted-foreground">{formStat.count}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(formStat.count / stats.total) * 100}%` }} 
                      />
                    </div>
                    {index < stats.byForm.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
                
                {stats.byForm.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No submissions data available
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  function renderSubmissionsTable(submissions: Submission[]) {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (submissions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No submissions match your filters</p>
          <Button variant="outline" className="mt-4" onClick={() => {
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
    
    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('form')}>
                Form
                {sortField === 'form' && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                Submitted
                {sortField === 'createdAt' && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/submissions/${submission.id}`)}>
                <TableCell className="font-medium">
                  {submission.form.title}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(submission.status || 'viewed')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/submissions/${submission.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // Would implement email functionality here
                        toast({
                          title: "Email Feature",
                          description: "Email functionality will be implemented soon",
                        });
                      }}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email Response
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateSubmissionStatus(submission.id, 'new');
                      }} disabled={submission.status === 'new'}>
                        <Badge className="bg-blue-500 h-4 w-4 mr-2 p-0" />
                        Mark as New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateSubmissionStatus(submission.id, 'viewed');
                      }} disabled={submission.status === 'viewed'}>
                        <Badge variant="outline" className="border-green-500 h-4 w-4 mr-2 p-0" />
                        Mark as Viewed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateSubmissionStatus(submission.id, 'archived');
                      }} disabled={submission.status === 'archived'}>
                        <Badge variant="secondary" className="h-4 w-4 mr-2 p-0" />
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
                        <Trash className="h-4 w-4 mr-2" />
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
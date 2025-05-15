'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebhookDelivery, webhookService, Webhook, WebhookDeliveryStatus, WebhookStats } from '@/services/webhook';
import { Loader2, ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Filter, BarChart } from 'lucide-react';
import { format } from 'date-fns';

interface WebhookLogsFilters {
  status?: keyof WebhookDeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export default function WebhookLogsPage() {
  const params = useParams();
  const router = useRouter();
  
  const [formId, setFormId] = useState<string>('');
  const [webhookId, setWebhookId] = useState<string>('');
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<WebhookDelivery[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState<WebhookLogsFilters>({
    page: 1,
    limit: 10,
  });
  
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookDelivery | null>(null);
  const [showLogDetailsDialog, setShowLogDetailsDialog] = useState(false);
  
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Initialize IDs from URL params
  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      setFormId(params.id);
    }
    if (params.webhookId && typeof params.webhookId === 'string') {
      setWebhookId(params.webhookId);
    }
  }, [params]);

  // Load webhook and logs when IDs are available
  useEffect(() => {
    if (formId && webhookId) {
      loadWebhook();
      loadLogs();
    }
  }, [formId, webhookId, filters]);

  // Load webhook details
  const loadWebhook = async () => {
    try {
      const data = await webhookService.getWebhook(formId, webhookId);
      setWebhook(data);
    } catch (err) {
      console.error('Error loading webhook:', err);
      setError('Failed to load webhook details. Please try again.');
    }
  };

  // Load webhook delivery logs
  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await webhookService.getWebhookLogs(webhookId, {
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: filters.page,
        limit: filters.limit,
      });
      
      setLogs(response.data);
      setTotalLogs(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Error loading webhook logs:', err);
      setError('Failed to load webhook logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load webhook statistics
  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await webhookService.getWebhookStats(webhookId);
      setStats(data);
    } catch (err) {
      console.error('Error loading webhook stats:', err);
      toast({
        title: 'Error',
        description: 'Failed to load webhook statistics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // View log details
  const viewLogDetails = async (logId: string) => {
    try {
      const log = await webhookService.getWebhookLog(webhookId, logId);
      setSelectedLog(log);
      setShowLogDetailsDialog(true);
    } catch (err) {
      console.error('Error loading log details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load log details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Retry failed delivery
  const retryDelivery = async (logId: string) => {
    try {
      await webhookService.retryWebhookDelivery(webhookId, logId);
      await loadLogs();
      toast({
        title: 'Delivery retried',
        description: 'The webhook delivery has been queued for retry.',
      });
    } catch (err) {
      console.error('Error retrying delivery:', err);
      toast({
        title: 'Error',
        description: 'Failed to retry delivery. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Apply filters
  const applyFilters = (newFilters: Partial<WebhookLogsFilters>) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    });
    setShowFiltersDialog(false);
  };

  // Change page
  const changePage = (page: number) => {
    setFilters({
      ...filters,
      page,
    });
  };

  // View statistics
  const viewStats = () => {
    setShowStatsDialog(true);
    if (!stats) {
      loadStats();
    }
  };

  // Navigate back to webhooks list
  const goBack = () => {
    router.push(`/forms/${formId}/webhooks`);
  };

  if (isLoading && !logs.length) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhook Logs</h1>
            {webhook && (
              <p className="text-muted-foreground">
                Delivery history for <span className="font-medium">{webhook.name}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFiltersDialog(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" onClick={viewStats}>
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </Button>
          <Button onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Logs</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-md">
              {error}
            </p>
            <Button className="mt-4" onClick={loadLogs}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Logs Found</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-md">
              There are no delivery logs matching your filters. This could mean the webhook hasn't been triggered yet or all logs have been filtered out.
            </p>
            {Object.keys(filters).length > 2 && (
              <Button variant="outline" className="mt-4" onClick={() => setFilters({ page: 1, limit: 10 })}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>
                Showing {logs.length} of {totalLogs} logs
                {filters.status && ` • Filtered by status: ${filters.status}`}
                {filters.startDate && ` • From: ${format(filters.startDate, 'MMM d, yyyy')}`}
                {filters.endDate && ` • To: ${format(filters.endDate, 'MMM d, yyyy')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.eventType.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {log.submissionId ? `Submission: ${log.submissionId}` : 'No submission'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'SUCCESS' ? "default" :
                            log.status === 'FAILED' ? "destructive" :
                            log.status === 'PENDING' ? "default" : "outline"
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>{format(new Date(log.requestTimestamp), 'MMM d, h:mm a')}</div>
                        {log.responseTimestamp && (
                          <div className="text-xs text-muted-foreground">
                            Response: {format(new Date(log.responseTimestamp), 'h:mm:ss a')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.statusCode ? (
                          <Badge
                            variant={log.statusCode >= 200 && log.statusCode < 300 ? "default" : "destructive"}
                          >
                            {log.statusCode}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{log.attemptCount} / {webhook?.retryCount || 3}</div>
                        {log.nextAttempt && (
                          <div className="text-xs text-muted-foreground">
                            Next: {format(new Date(log.nextAttempt), 'h:mm a')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewLogDetails(log.id)}
                          >
                            Details
                          </Button>
                          {log.status === 'FAILED' && log.attemptCount < (webhook?.retryCount || 3) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => retryDelivery(log.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    onPageChange={changePage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Filters Dialog */}
      <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Logs</DialogTitle>
            <DialogDescription>
              Filter webhook delivery logs by status and date range.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => 
                  setFilters({...filters, status: value as keyof WebhookDeliveryStatus || undefined})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <DatePicker
                  date={filters.startDate}
                  setDate={(date: Date | undefined) => setFilters({...filters, startDate: date})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>To Date</Label>
                <DatePicker
                  date={filters.endDate}
                  setDate={(date: Date | undefined) => setFilters({...filters, endDate: date})}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setFilters({ page: 1, limit: 10 })}
            >
              Reset Filters
            </Button>
            <Button onClick={() => applyFilters(filters)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Log Details Dialog */}
      {selectedLog && (
        <Dialog open={showLogDetailsDialog} onOpenChange={setShowLogDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
              <DialogDescription>
                Details of webhook delivery attempt on {format(new Date(selectedLog.requestTimestamp), 'MMM d, yyyy h:mm:ss a')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <Badge
                    variant={
                      selectedLog.status === 'SUCCESS' ? "default" :
                      selectedLog.status === 'FAILED' ? "destructive" :
                      selectedLog.status === 'PENDING' ? "default" : "outline"
                    }
                  >
                    {selectedLog.status}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Event Type</h4>
                  <p>{selectedLog.eventType.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Request Time</h4>
                  <p>{format(new Date(selectedLog.requestTimestamp), 'MMM d, yyyy h:mm:ss a')}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Response Time</h4>
                  <p>
                    {selectedLog.responseTimestamp
                      ? format(new Date(selectedLog.responseTimestamp), 'MMM d, yyyy h:mm:ss a')
                      : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Status Code</h4>
                  <p>{selectedLog.statusCode || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Attempts</h4>
                  <p>{selectedLog.attemptCount} / {webhook?.retryCount || 3}</p>
                </div>
              </div>
              
              {selectedLog.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Error Message</h4>
                  <div className="bg-muted p-3 rounded text-sm">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Request Payload</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
              
              {selectedLog.responseBody && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Response Body</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.status === 'FAILED' && selectedLog.attemptCount < (webhook?.retryCount || 3) && (
                <div className="flex justify-end">
                  <Button onClick={() => {
                    retryDelivery(selectedLog.id);
                    setShowLogDetailsDialog(false);
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Delivery
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Statistics Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Webhook Statistics</DialogTitle>
            <DialogDescription>
              Performance metrics for this webhook over the last 7 days.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingStats ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          ) : !stats ? (
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Failed to Load Statistics</h3>
              <Button className="mt-4" onClick={loadStats}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.metrics.totalDeliveries}</div>
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{(stats.metrics.successRate * 100).toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.metrics.averageResponseMs}ms</div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.overallStats.map((stat) => (
                      <div key={stat.status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge
                            variant={
                              stat.status === 'SUCCESS' ? 'success' :
                              stat.status === 'FAILED' ? 'destructive' :
                              stat.status === 'PENDING' ? 'default' : 'outline'
                            }
                            className="mr-2"
                          >
                            {stat.status}
                          </Badge>
                          <span>{stat.count} deliveries</span>
                        </div>
                        <div className="w-1/2 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              stat.status === 'SUCCESS' ? 'bg-green-500' :
                              stat.status === 'FAILED' ? 'bg-destructive' :
                              stat.status === 'PENDING' ? 'bg-blue-500' : 'bg-muted-foreground'
                            }`}
                            style={{
                              width: `${(stat.count / stats.metrics.totalDeliveries) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Webhook, webhookService } from '@/services/webhook';
import { Loader2, Search, Filter, CheckCircle, XCircle, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminWebhooksPage() {
  const router = useRouter();
  
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  
  // Load all webhooks
  useEffect(() => {
    loadWebhooks();
  }, []);
  
  const loadWebhooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await webhookService.getAllWebhooks();
      setWebhooks(data);
    } catch (err) {
      console.error('Error loading webhooks:', err);
      setError('Failed to load webhooks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Approve a webhook
  const approveWebhook = async () => {
    if (!selectedWebhook) return;
    
    setIsApproving(true);
    try {
      await webhookService.approveWebhook(selectedWebhook.id);
      await loadWebhooks();
      setShowApproveDialog(false);
      toast({
        title: 'Webhook approved',
        description: 'The webhook has been approved successfully.',
      });
    } catch (err) {
      console.error('Error approving webhook:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve webhook. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  // View webhook details
  const viewWebhookDetails = (formId: string, webhookId: string) => {
    router.push(`/forms/${formId}/webhooks/${webhookId}/logs`);
  };
  
  // Filter webhooks
  const filteredWebhooks = webhooks.filter(webhook => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webhook.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = webhook.active && webhook.adminApproved;
    } else if (filterStatus === 'inactive') {
      matchesStatus = !webhook.active && webhook.adminApproved;
    } else if (filterStatus === 'pending') {
      matchesStatus = !webhook.adminApproved;
    }
    
    return matchesSearch && matchesStatus;
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks Administration</h1>
        <p className="text-muted-foreground">
          Manage and monitor all webhooks across the platform
        </p>
      </div>
      
      <Separator />
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search webhooks..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as any)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All webhooks</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending approval</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={loadWebhooks}>
          Refresh
        </Button>
      </div>
      
      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Webhooks</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-md">
              {error}
            </p>
            <Button className="mt-4" onClick={loadWebhooks}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Webhooks Found</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-md">
              There are no webhooks configured in the system.
            </p>
          </CardContent>
        </Card>
      ) : filteredWebhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Matching Webhooks</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-md">
              No webhooks match your current search or filter criteria.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Webhooks</CardTitle>
            <CardDescription>
              Showing {filteredWebhooks.length} of {webhooks.length} webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="font-medium">{webhook.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {webhook.url}
                      </div>
                    </TableCell>
                    <TableCell>{webhook.formId}</TableCell>
                    <TableCell>{webhook.createdById || 'System'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!webhook.adminApproved ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            Pending Approval
                          </Badge>
                        ) : webhook.active ? (
                          <Badge variant="default">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Inactive
                          </Badge>
                        )}
                        {webhook.isTemplate && (
                          <Badge variant="secondary">
                            Template
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(webhook.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {!webhook.adminApproved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setShowApproveDialog(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewWebhookDetails(webhook.formId, webhook.id)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Approve Webhook Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this webhook? Once approved, it will be able to receive data from form submissions.
            </DialogDescription>
          </DialogHeader>
          
          {selectedWebhook && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Name</h4>
                <p>{selectedWebhook.name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">URL</h4>
                <p className="break-all">{selectedWebhook.url}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Created By</h4>
                <p>{selectedWebhook.createdById || 'System'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Event Types</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWebhook.eventTypes.map(eventType => (
                    <Badge key={eventType} variant="outline">
                      {eventType.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={approveWebhook}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Webhook
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
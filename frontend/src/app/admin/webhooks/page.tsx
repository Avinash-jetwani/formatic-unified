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
import { Loader2, Search, Filter, CheckCircle, XCircle, AlertTriangle, ExternalLink, CheckCircle2, AlertCircle, Edit, Trash2, Lock, Unlock, Eye, PowerOff, Power } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function AdminWebhooksPage() {
  const router = useRouter();
  
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      console.log('📊 Fetching all webhooks...');
      const data = await webhookService.getAllWebhooks();
      console.log(`✅ Loaded ${data.length} webhooks successfully`);
      setWebhooks(data);
    } catch (err) {
      console.error('❌ Error loading webhooks:', err);
      setError('Failed to load webhooks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Approve a webhook
  const approveWebhook = async (webhookId: string) => {
    console.log(`🔄 Approving webhook ${webhookId}...`);
    try {
      const result = await webhookService.approveWebhook(webhookId);
      console.log(`✅ Webhook ${webhookId} approved successfully:`, result);
      await loadWebhooks();
      return true;
    } catch (err) {
      console.error(`❌ Error approving webhook ${webhookId}:`, err);
      throw err;
    }
  };
  
  // Reject a webhook
  const rejectWebhook = async (webhookId: string) => {
    console.log(`🔄 Rejecting webhook ${webhookId}...`);
    try {
      const result = await webhookService.rejectWebhook(webhookId);
      console.log(`✅ Webhook ${webhookId} rejected successfully:`, result);
      await loadWebhooks();
      return true;
    } catch (err) {
      console.error(`❌ Error rejecting webhook ${webhookId}:`, err);
      throw err;
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
      matchesStatus = webhook.active && webhook.adminApproved === true;
    } else if (filterStatus === 'inactive') {
      matchesStatus = !webhook.active || webhook.adminApproved === false;
    } else if (filterStatus === 'pending') {
      matchesStatus = webhook.adminApproved === null;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Sort webhooks to show pending at the top
  const sortedWebhooks = [...filteredWebhooks].sort((a, b) => {
    // Pending webhooks come first
    if (a.adminApproved === null && b.adminApproved !== null) return -1;
    if (a.adminApproved !== null && b.adminApproved === null) return 1;
    // Then sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Add lock/unlock webhook function
  const toggleLockWebhook = async (webhookId: string, currentLocked: boolean) => {
    try {
      await webhookService.updateWebhook(
        webhooks.find(w => w.id === webhookId)?.formId || '', 
        webhookId, 
        { adminLocked: !currentLocked }
      );
      await loadWebhooks();
      toast({
        title: currentLocked ? 'Webhook unlocked' : 'Webhook locked',
        description: currentLocked 
          ? 'The webhook can now be modified by the client.'
          : 'The webhook has been locked and cannot be modified by the client.',
      });
      return true;
    } catch (err) {
      console.error('Error locking/unlocking webhook:', err);
      toast({
        title: 'Error',
        description: 'Failed to update webhook lock status.',
        variant: 'destructive',
      });
      throw err;
    }
  };
  
  // Add a function to toggle webhook active status
  const toggleWebhookActive = async (webhookId: string, currentActive: boolean) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) return false;
      
      // If activating a webhook, clear the deactivatedById field
      // If deactivating, set the deactivatedById field to the current user's ID
      await webhookService.updateWebhook(
        webhook.formId, 
        webhookId, 
        { 
          active: !currentActive,
          // When deactivating we need to set deactivatedById, but we don't have the user ID here
          // The backend will handle this using the authenticated user's ID
        }
      );
      
      await loadWebhooks();
      
      toast({
        title: currentActive ? 'Webhook deactivated' : 'Webhook activated',
        description: currentActive 
          ? 'The webhook has been deactivated and will not process submissions.'
          : 'The webhook has been activated and can now process submissions.',
      });
      return true;
    } catch (err) {
      console.error('Error toggling webhook active status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update webhook status.',
        variant: 'destructive',
      });
      throw err;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Count pending webhooks
  const pendingWebhooks = webhooks.filter(w => w.adminApproved === null || w.adminApproved === undefined).length;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks Administration</h1>
        <p className="text-muted-foreground">
          Manage and monitor all webhooks across the platform
        </p>
      </div>
      
      <Separator />
      
      {pendingWebhooks > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Webhooks Waiting for Approval</h3>
            <p className="text-sm text-amber-700">
              There {pendingWebhooks === 1 ? 'is' : 'are'} {pendingWebhooks} webhook{pendingWebhooks !== 1 ? 's' : ''} waiting for your approval. 
              Webhooks won't receive any data until approved.
            </p>
          </div>
        </div>
      )}
      
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
              {filterStatus === 'pending' && pendingWebhooks > 0 && (
                <span className="ml-1 text-amber-600 font-medium">
                  ({pendingWebhooks} pending approval)
                </span>
              )}
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
                {sortedWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="font-medium">{webhook.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {webhook.url}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{webhook.formTitle || "Unknown Form"}</div>
                      <div className="text-xs text-muted-foreground">{webhook.formId}</div>
                    </TableCell>
                    <TableCell>
                      {webhook.clientName ? (
                        <div>
                          <div className="font-medium">{webhook.clientName}</div>
                          <div className="text-xs text-muted-foreground">{webhook.clientEmail}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{webhook.createdById || 'System'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {webhook.adminApproved === null ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            Pending Approval
                          </Badge>
                        ) : webhook.adminApproved ? (
                          webhook.active ? (
                            <Badge variant="default">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Inactive
                            </Badge>
                          )
                        ) : (
                          <Badge variant="destructive">
                            Rejected
                          </Badge>
                        )}
                        {webhook.adminLocked && (
                          <Badge variant="outline" className="border-gray-500 text-gray-500">
                            Locked
                          </Badge>
                        )}
                        {webhook.isTemplate && (
                          <Badge variant="secondary">
                            Template
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(webhook.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => viewWebhookDetails(webhook.formId, webhook.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleLockWebhook(webhook.id, webhook.adminLocked === true)}
                              >
                                {webhook.adminLocked 
                                  ? <Unlock className="h-4 w-4" /> 
                                  : <Lock className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {webhook.adminLocked ? 'Unlock this webhook' : 'Lock this webhook'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => toggleWebhookActive(webhook.id, webhook.active)}
                              >
                                {webhook.active 
                                  ? <PowerOff className="h-4 w-4 text-red-500" /> 
                                  : <Power className="h-4 w-4 text-green-500" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {webhook.active ? 'Deactivate this webhook' : 'Activate this webhook'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {webhook.adminApproved === null && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={async () => {
                                      console.log('⏱️ Starting webhook approval process...');
                                      const startTime = Date.now();
                                      
                                      try {
                                        // Show toast as immediate feedback that action is being processed
                                        toast({
                                          title: 'Processing',
                                          description: 'Approving webhook...',
                                        });
                                        
                                        await approveWebhook(webhook.id);
                                        
                                        const endTime = Date.now();
                                        console.log(`⏱️ Webhook approval process completed in ${endTime - startTime}ms`);
                                        
                                        toast({
                                          title: 'Webhook approved',
                                          description: 'The webhook has been approved and can now receive data.',
                                        });
                                        
                                        // Reload the data
                                        await loadWebhooks();
                                      } catch (err) {
                                        const endTime = Date.now();
                                        console.error(`⏱️ Webhook approval process failed after ${endTime - startTime}ms:`, err);
                                        
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to approve webhook',
                                          variant: 'destructive'
                                        });
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Approve this webhook</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={async () => {
                                      if (confirm('Are you sure you want to reject this webhook?')) {
                                        console.log('⏱️ Starting webhook rejection process...');
                                        const startTime = Date.now();
                                        
                                        try {
                                          toast({
                                            title: 'Processing',
                                            description: 'Rejecting webhook...',
                                          });
                                          
                                          await rejectWebhook(webhook.id);
                                          
                                          const endTime = Date.now();
                                          console.log(`⏱️ Webhook rejection process completed in ${endTime - startTime}ms`);
                                          
                                          toast({
                                            title: 'Webhook rejected',
                                            description: 'The webhook has been rejected and will not receive any data.'
                                          });
                                          
                                          await loadWebhooks();
                                        } catch (err) {
                                          const endTime = Date.now();
                                          console.error(`⏱️ Webhook rejection process failed after ${endTime - startTime}ms:`, err);
                                          
                                          toast({
                                            title: 'Error',
                                            description: 'Failed to reject webhook',
                                            variant: 'destructive'
                                          });
                                        }
                                      }
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reject this webhook</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WebhookForm } from '@/components/webhook/WebhookForm';
import { toast } from '@/components/ui/use-toast';
import { Webhook, webhookService, CreateWebhookDto, UpdateWebhookDto } from '@/services/webhook';
import { useUser } from '@/hooks/useUser';
import { Loader2, PlusCircle, Edit, Trash2, PlayCircle, AlertCircle, CheckCircle, Clock, RefreshCw, LinkIcon, Plus, XCircle, Lock, BookOpen } from 'lucide-react';
import WebhooksFallback from './fallback';
import { EmptyState } from '@/components/ui/empty-state';

export default function WebhooksPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  
  const [formId, setFormId] = useState<string>('');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  
  const [formFields, setFormFields] = useState<Array<{ id: string; label: string }>>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Helper function to map user roles to WebhookForm accepted roles
  const mapUserRole = (role?: string): 'SUPER_ADMIN' | 'CLIENT' | undefined => {
    if (role === 'ADMIN') return 'SUPER_ADMIN';
    if (role === 'CLIENT') return 'CLIENT';
    return undefined;
  };

  // Initialize form ID from URL params
  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      setFormId(params.id);
    }
  }, [params]);

  // Load webhooks when form ID is available
  useEffect(() => {
    if (formId) {
      loadWebhooks();
      loadFormFields();
    }
  }, [formId]);

  // Debug webhook approval status
  useEffect(() => {
    if (webhooks.length > 0) {
      console.log('Webhook status debugging:');
      webhooks.forEach(webhook => {
        console.log(`- ${webhook.name}: adminApproved=${webhook.adminApproved}, type=${typeof webhook.adminApproved}, active=${webhook.active}`);
      });
    }
  }, [webhooks]);

  // Load webhooks for the current form
  const loadWebhooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Add timestamp for cache-busting in URL (handled in service layer)
      const data = await webhookService.getWebhooks(formId);
      
      console.log('Loaded webhooks:', data);
      
      // Ensure all webhooks have a defined adminApproved value for display logic
      setWebhooks(data);
      
      // Reset fallback state if successful
      setShowFallback(false);
    } catch (err) {
      console.error('Error loading webhooks:', err);
      setError('Failed to load webhooks. Please try again.');
      
      // If we already tried multiple times, show the fallback
      if (retryCount >= 2) {
        setShowFallback(true);
      } else {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load form fields for filtering
  const loadFormFields = async () => {
    try {
      // Try to get fields from the actual API
      const fields = await fetch(`/api/forms/${formId}/fields`).then(res => {
        if (!res.ok) {
          throw new Error('Failed to load form fields');
        }
        return res.json();
      }).catch(() => {
        // Fallback to placeholder data if API fails
        return [
          { id: 'email', label: 'Email' },
          { id: 'name', label: 'Name' },
          { id: 'phone', label: 'Phone' },
        ];
      });
      
      setFormFields(fields);
    } catch (err) {
      console.error('Error loading form fields:', err);
      // Use placeholder data as fallback
      setFormFields([
        { id: 'email', label: 'Email' },
        { id: 'name', label: 'Name' },
        { id: 'phone', label: 'Phone' },
      ]);
    }
  };

  // Handle retry loading
  const handleRetry = () => {
    loadWebhooks();
  };

  // Create a new webhook
  const handleCreateWebhook = async (data: CreateWebhookDto) => {
    setIsSubmitting(true);
    try {
      await webhookService.createWebhook(formId, data);
      await loadWebhooks();
      setShowCreateModal(false);
      toast({
        title: 'Webhook created',
        description: 'Your webhook has been successfully created.',
      });
    } catch (err) {
      console.error('Error creating webhook:', err);
      toast({
        title: 'Error',
        description: 'Failed to create webhook. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an existing webhook
  const handleUpdateWebhook = async (data: UpdateWebhookDto) => {
    console.log("🔍 handleUpdateWebhook called with data:", data);
    
    if (!editingWebhook) {
      console.error("❌ No editingWebhook found - can't update!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log(`📤 Calling updateWebhook service: formId=${formId}, webhookId=${editingWebhook.id}`);
      await webhookService.updateWebhook(formId, editingWebhook.id, data);
      console.log("✅ Webhook updated successfully!");
      await loadWebhooks();
      setEditingWebhook(null);
      toast({
        title: 'Webhook updated',
        description: 'Your webhook has been successfully updated.',
      });
    } catch (err) {
      console.error('Error updating webhook:', err);
      toast({
        title: 'Error',
        description: 'Failed to update webhook. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a webhook
  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return;
    
    try {
      await webhookService.deleteWebhook(formId, webhookToDelete);
      await loadWebhooks();
      setWebhookToDelete(null);
      toast({
        title: 'Webhook deleted',
        description: 'The webhook has been successfully deleted.',
      });
    } catch (err) {
      console.error('Error deleting webhook:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Test a webhook
  const handleTestWebhook = async () => {
    if (!testingWebhookId) return;
    
    // Get the webhook to check its status
    const webhook = webhooks.find(w => w.id === testingWebhookId);
    if (!webhook) return;
    
    // Check if webhook is active
    if (!webhook.active) {
      setTestResult({
        success: false,
        error: {
          message: 'Cannot test inactive webhook. Please activate the webhook before testing.',
          status: 400
        }
      });
      return;
    }
    
    // Check if webhook is admin approved (for client users)
    if (!webhook.adminApproved && user?.role === 'CLIENT') {
      setTestResult({
        success: false,
        error: {
          message: 'This webhook is waiting for administrator approval and cannot be tested yet.',
          status: 400
        }
      });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await webhookService.testWebhook(formId, testingWebhookId);
      setTestResult(result);
      toast({
        title: 'Webhook tested',
        description: result.success 
          ? 'Test was successful!' 
          : 'Test failed. See details for more information.',
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (err) {
      console.error('Error testing webhook:', err);
      setTestResult({
        success: false,
        error: 'An unexpected error occurred while testing the webhook.',
      });
      toast({
        title: 'Error',
        description: 'Failed to test webhook. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // View webhook logs
  const viewWebhookLogs = (webhookId: string) => {
    router.push(`/forms/${formId}/webhooks/${webhookId}/logs`);
  };

  if (showFallback) {
    return <WebhooksFallback />;
  }

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Error Loading Webhooks</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={handleRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Manage webhooks to receive form data in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWebhooks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push(`/forms/${formId}/webhooks/help`)}
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create Webhook
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Information box for clients about webhook approval */}
      {user?.role === 'CLIENT' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Administrator Approval Required</h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Important:</strong> All webhooks require administrator approval before they can receive any data. 
                Even if a webhook is marked as "Active", it will not function until approved by an administrator.
                When a webhook is "Pending Approval", it cannot be tested or used for receiving submissions.
                You will see the status update once an administrator reviews your webhook.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {webhooks.length === 0 ? (
        <EmptyState
          title="No Webhooks Yet"
          description="Create your first webhook to automatically send form submissions to external services."
          icon={<LinkIcon className="h-10 w-10" />}
        >
          <div className="flex flex-col gap-2 items-center">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Having issues? Try our{' '}
              <a 
                href="/webhook-debug" 
                target="_blank" 
                className="text-primary hover:underline"
              >
                webhook debugging tool
              </a>
            </p>
          </div>
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      {webhook.name}
                      {!webhook.active && (
                        <span className="ml-2 text-sm font-normal text-red-500 px-2 py-0.5 rounded-md bg-red-50">(Inactive)</span>
                      )}
                      {webhook.active && webhook.adminApproved === null && (
                        <span className="ml-2 text-sm font-normal text-amber-500 px-2 py-0.5 rounded-md bg-amber-50">(Pending Approval)</span>
                      )}
                      {webhook.active && webhook.adminApproved === false && (
                        <span className="ml-2 text-sm font-normal text-red-500 px-2 py-0.5 rounded-md bg-red-50">(Rejected)</span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 break-all">{webhook.url}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={webhook.active ? "default" : "outline"} className={!webhook.active ? "border-red-200 text-red-700" : ""}>
                            {webhook.active ? "Active" : "Inactive"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {webhook.active 
                            ? "This webhook is active and will receive data according to the trigger events."
                            : "This webhook is currently inactive and will not receive any data."}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {webhook.adminLocked && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="border-gray-700 text-gray-700">Locked</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This webhook has been locked by an administrator and cannot be modified.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* Show approval status badge - FIXED logic */}
                    {webhook.adminApproved === false && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="destructive">Rejected</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This webhook has been rejected by an administrator.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {webhook.adminApproved === null && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="border-amber-200 text-amber-700">Pending Approval</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This webhook is waiting for administrator approval before it can receive data.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Event Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {webhook.eventTypes.map((eventType) => (
                        <Badge key={eventType} variant="secondary" className="text-xs">
                          {eventType.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      {webhook.authType === 'NONE' 
                        ? 'None' 
                        : webhook.authType === 'BASIC' 
                          ? 'Basic Auth'
                          : webhook.authType === 'BEARER'
                            ? 'Bearer Token'
                            : 'API Key'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Retry Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      {webhook.retryCount} attempts, {webhook.retryInterval}s interval
                    </p>
                  </div>
                </div>
                
                {!webhook.active && (
                  <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline-block mr-1" />
                    {webhook.deactivatedById ? (
                      <>This webhook has been <strong>deactivated by an administrator</strong> and cannot be reactivated.</>
                    ) : (
                      <>This webhook is inactive and will not receive any data. Enable it in the webhook settings to start receiving data.</>
                    )}
                  </div>
                )}
                
                {webhook.active && webhook.adminApproved === null && (
                  <div className="mt-4 p-2 bg-amber-50 border border-amber-100 rounded text-sm text-amber-700">
                    <Clock className="h-4 w-4 inline-block mr-1" />
                    Waiting for admin approval. This webhook won't receive data until approved.
                  </div>
                )}

                {webhook.active && webhook.adminApproved === false && (
                  <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    <XCircle className="h-4 w-4 inline-block mr-1" />
                    This webhook has been rejected by an administrator and will not receive any data.
                  </div>
                )}

                {webhook.adminLocked && (
                  <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                    <Lock className="h-4 w-4 inline-block mr-1" />
                    This webhook has been locked by an administrator and cannot be modified. Please contact an administrator for any changes.
                  </div>
                )}
              </CardContent>
              <div className="px-6 py-4 bg-muted/50 flex justify-between items-center rounded-b-lg">
                <Button variant="secondary" size="sm" onClick={() => viewWebhookLogs(webhook.id)}>
                  View Logs
                </Button>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setTestingWebhookId(webhook.id);
                              setShowTestDialog(true);
                            }}
                            disabled={!webhook.active || 
                              (!webhook.adminApproved && user?.role === 'CLIENT') || 
                              webhook.adminLocked === true || 
                              webhook.deactivatedById !== null && webhook.deactivatedById !== undefined}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Test
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!webhook.active && (
                        <TooltipContent>
                          <p>Cannot test inactive webhook. Please activate it first.</p>
                        </TooltipContent>
                      )}
                      {webhook.deactivatedById && (
                        <TooltipContent>
                          <p>This webhook has been deactivated by an administrator and cannot be tested.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingWebhook(webhook)}
                    disabled={webhook.adminLocked === true || 
                      webhook.deactivatedById !== null && webhook.deactivatedById !== undefined}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setWebhookToDelete(webhook.id)}
                    disabled={webhook.adminLocked}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Webhook Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive form data in real-time.
            </DialogDescription>
          </DialogHeader>
          <WebhookForm
            formId={formId}
            fields={formFields}
            userRole={mapUserRole(user?.role)}
            onSave={(data) => handleCreateWebhook(data as CreateWebhookDto)}
            onCancel={() => setShowCreateModal(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Webhook Dialog */}
      <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Modify your webhook configuration.
            </DialogDescription>
          </DialogHeader>
          {editingWebhook && (
            <>
              <WebhookForm
                formId={formId}
                webhook={editingWebhook}
                fields={formFields}
                userRole={mapUserRole(user?.role)}
                onSave={handleUpdateWebhook}
                onCancel={() => setEditingWebhook(null)}
                isSubmitting={isSubmitting}
              />
              {editingWebhook.adminLocked && (
                <div className="mt-4 w-full bg-red-50 border border-red-200 rounded-md p-4 text-left">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Administrator Locked</h3>
                      <div className="mt-1 text-sm text-red-700">
                        <p>This webhook has been locked by an administrator and cannot be modified. Please contact an administrator for assistance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Webhook Confirmation */}
      <AlertDialog open={!!webhookToDelete} onOpenChange={(open) => !open && setWebhookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWebhook}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Test Webhook Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test payload to your webhook endpoint.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isTesting ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Testing webhook...</p>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-destructive mr-2" />
                  )}
                  <h3 className="text-lg font-medium">
                    {testResult.success ? 'Test Successful' : 'Test Failed'}
                  </h3>
                </div>
                
                {testResult.statusCode && (
                  <div>
                    <h4 className="text-sm font-medium">Status Code</h4>
                    <p className={`text-sm ${testResult.success ? 'text-green-500' : 'text-destructive'}`}>
                      {testResult.statusCode}
                    </p>
                  </div>
                )}
                
                {testResult.responseTime && (
                  <div>
                    <h4 className="text-sm font-medium">Response Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {testResult.responseTime} ms
                    </p>
                  </div>
                )}
                
                {testResult.message && (
                  <div>
                    <h4 className="text-sm font-medium">Message</h4>
                    <p className="text-sm text-muted-foreground">
                      {testResult.message}
                    </p>
                  </div>
                )}
                
                {testResult.error && (
                  <div>
                    <h4 className="text-sm font-medium">Error</h4>
                    <p className="text-sm text-destructive">
                      {typeof testResult.error === 'object' ? testResult.error.message : testResult.error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {testingWebhookId && (() => {
                  const webhook = webhooks.find(w => w.id === testingWebhookId);
                  if (!webhook) return null;
                  
                  // Show status warnings
                  if (!webhook.active) {
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                        <AlertCircle className="h-5 w-5 inline-block mr-2" />
                        <span className="font-medium">Webhook Inactive</span>
                        <p className="mt-1">This webhook is currently inactive and cannot be tested. Please activate it first.</p>
                      </div>
                    );
                  } else if (webhook.adminLocked) {
                    return (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                        <Lock className="h-5 w-5 inline-block mr-2" />
                        <span className="font-medium">Webhook Locked</span>
                        <p className="mt-1">This webhook has been locked by an administrator and cannot be tested. Please contact an administrator for assistance.</p>
                      </div>
                    );
                  } else if (!webhook.adminApproved && user?.role === 'CLIENT') {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                        <Clock className="h-5 w-5 inline-block mr-2" />
                        <span className="font-medium">Pending Approval</span>
                        <p className="mt-1">This webhook is waiting for administrator approval and cannot be tested yet.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <p>
                      This will send a test payload to your webhook endpoint. The test payload will contain sample data similar to what would be sent when a form is submitted.
                    </p>
                  );
                })()}
                
                {testingWebhookId && (() => {
                  const webhook = webhooks.find(w => w.id === testingWebhookId);
                  if (!webhook) return null;
                  
                  return (
                    <Button 
                      onClick={handleTestWebhook} 
                      className="w-full"
                      disabled={!webhook.active || 
                        (!webhook.adminApproved && user?.role === 'CLIENT') || 
                        webhook.adminLocked === true || 
                        webhook.deactivatedById !== null && webhook.deactivatedById !== undefined}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Send Test Payload
                    </Button>
                  );
                })()}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => {
              setShowTestDialog(false);
              setTestingWebhookId(null);
              setTestResult(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
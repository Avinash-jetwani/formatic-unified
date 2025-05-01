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
import { WebhookForm } from '@/components/webhook/WebhookForm';
import { toast } from '@/components/ui/use-toast';
import { Webhook, webhookService, CreateWebhookDto, UpdateWebhookDto } from '@/services/webhook';
import { useUser } from '@/hooks/useUser';
import { Loader2, PlusCircle, Edit, Trash2, PlayCircle, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import WebhooksFallback from './fallback';

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

  // Load webhooks for the current form
  const loadWebhooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await webhookService.getWebhooks(formId);
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
    if (!editingWebhook) return;
    
    setIsSubmitting(true);
    try {
      await webhookService.updateWebhook(formId, editingWebhook.id, data);
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
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>
      
      <Separator />
      
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <PlusCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Webhooks Found</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-md">
              You haven't created any webhooks for this form yet. Webhooks allow you to receive form submissions in real-time.
            </p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{webhook.name}</CardTitle>
                    <CardDescription className="mt-1 break-all">{webhook.url}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.active ? "default" : "outline"}>
                      {webhook.active ? "Active" : "Inactive"}
                    </Badge>
                    {!webhook.adminApproved && user?.role === 'CLIENT' && (
                      <Badge variant="secondary">Pending Approval</Badge>
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
              </CardContent>
              <div className="px-6 py-4 bg-muted/50 flex justify-between items-center rounded-b-lg">
                <Button variant="secondary" size="sm" onClick={() => viewWebhookLogs(webhook.id)}>
                  View Logs
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTestingWebhookId(webhook.id);
                      setShowTestDialog(true);
                    }}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingWebhook(webhook)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setWebhookToDelete(webhook.id)}
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
            userRole={user?.role}
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
            <WebhookForm
              formId={formId}
              webhook={editingWebhook}
              fields={formFields}
              userRole={user?.role}
              onSave={handleUpdateWebhook}
              onCancel={() => setEditingWebhook(null)}
              isSubmitting={isSubmitting}
            />
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
                      {testResult.error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  This will send a test payload to your webhook endpoint. The test payload will contain sample data similar to what would be sent when a form is submitted.
                </p>
                <Button onClick={handleTestWebhook} className="w-full">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Send Test Payload
                </Button>
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
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { CreateWebhookDto, UpdateWebhookDto, Webhook } from '@/services/webhook';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Role } from '@/types/user';

// Define the form validation schema using Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  active: z.boolean().default(true),
  secretKey: z.string().optional(),
  authType: z.enum(['NONE', 'BASIC', 'BEARER', 'API_KEY']).default('NONE'),
  authValue: z.string().optional(),
  allowedIpAddresses: z.array(z.string()).default([]),
  verificationToken: z.string().optional(),
  eventTypes: z.array(z.enum(['SUBMISSION_CREATED', 'SUBMISSION_UPDATED', 'FORM_PUBLISHED', 'FORM_UNPUBLISHED'])).default(['SUBMISSION_CREATED']),
  includeFields: z.array(z.string()).default([]),
  excludeFields: z.array(z.string()).default([]),
  retryCount: z.number().int().min(0).default(3),
  retryInterval: z.number().int().min(1).default(60),
  dailyLimit: z.number().int().min(0).optional(),
  isTemplate: z.boolean().default(false),
  templateId: z.string().optional(),
  // Admin-only fields
  adminApproved: z.boolean().optional(),
  adminNotes: z.string().optional(),
});

interface WebhookFormProps {
  formId: string;
  webhook?: Webhook;
  fields?: Array<{ id: string; label: string; }>;
  userRole?: Role;
  onSave: (data: CreateWebhookDto | UpdateWebhookDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WebhookForm({
  formId,
  webhook,
  fields = [],
  userRole = 'CLIENT',
  onSave,
  onCancel,
  isSubmitting = false,
}: WebhookFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedAuthType, setSelectedAuthType] = useState(webhook?.authType || 'NONE');
  const [allowedIpInput, setAllowedIpInput] = useState('');
  const [isAdmin] = useState(userRole === 'SUPER_ADMIN');
  const router = useRouter();

  // Initialize form with either existing webhook data or defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: webhook ? {
      ...webhook,
      // Convert any JSON strings back to objects if needed
      headers: webhook.headers ? webhook.headers : undefined,
      filterConditions: webhook.filterConditions ? webhook.filterConditions : undefined,
    } : {
      name: '',
      url: '',
      active: true,
      authType: 'NONE',
      eventTypes: ['SUBMISSION_CREATED'],
      retryCount: 3,
      retryInterval: 60,
      includeFields: [],
      excludeFields: [],
      allowedIpAddresses: [],
      isTemplate: false,
    },
  });
  
  // Watch for auth type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'authType') {
        setSelectedAuthType(value.authType as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Make sure URL is trimmed before submitting
      const trimmedData = {
        ...data,
        url: data.url.trim()
      };
      
      // Submit the form with trimmed data
      await onSave(trimmedData);
      
      // Only show success toast if we don't catch an error
      toast({
        title: webhook ? 'Webhook updated' : 'Webhook created',
        description: `The webhook was successfully ${webhook ? 'updated' : 'created'}.`,
      });
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast({
        title: 'Error',
        description: `Failed to ${webhook ? 'update' : 'create'} webhook. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  };

  // Function to add an IP address to the allowed list
  const addIpAddress = () => {
    if (!allowedIpInput) return;
    
    const currentIps = form.getValues('allowedIpAddresses') || [];
    if (!currentIps.includes(allowedIpInput)) {
      form.setValue('allowedIpAddresses', [...currentIps, allowedIpInput]);
      setAllowedIpInput('');
    }
  };

  // Function to remove an IP address from the allowed list
  const removeIpAddress = (ip: string) => {
    const currentIps = form.getValues('allowedIpAddresses') || [];
    form.setValue('allowedIpAddresses', currentIps.filter(i => i !== ip));
  };

  // Prepare event type options
  const eventTypeOptions = [
    { value: 'SUBMISSION_CREATED', label: 'Submission Created' },
    { value: 'SUBMISSION_UPDATED', label: 'Submission Updated' },
    { value: 'FORM_PUBLISHED', label: 'Form Published' },
    { value: 'FORM_UNPUBLISHED', label: 'Form Unpublished' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{webhook ? 'Edit Webhook' : 'Create Webhook'}</CardTitle>
            <CardDescription>
              Configure a webhook to receive form data in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="authentication">Authentication</TabsTrigger>
                <TabsTrigger value="filters">Filters & Fields</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              {/* Basic tab */}
              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Webhook" {...field} />
                      </FormControl>
                      <FormDescription>A descriptive name for your webhook.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/api/webhook" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.trim())}
                        />
                      </FormControl>
                      <FormDescription>The URL where webhook data will be sent.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable or disable this webhook.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Event Types</FormLabel>
                  <FormDescription>Select which events will trigger this webhook.</FormDescription>
                  
                  {eventTypeOptions.map((option) => (
                    <FormField
                      key={option.value}
                      control={form.control}
                      name="eventTypes"
                      render={({ field }) => (
                        <FormItem
                          key={option.value}
                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option.value as any)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked
                                  ? field.onChange([...currentValues, option.value])
                                  : field.onChange(
                                      currentValues.filter(
                                        (value) => value !== option.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {option.label}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </TabsContent>
              
              {/* Authentication tab */}
              <TabsContent value="authentication" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="authType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authentication Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select authentication type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          <SelectItem value="BASIC">Basic Auth</SelectItem>
                          <SelectItem value="BEARER">Bearer Token</SelectItem>
                          <SelectItem value="API_KEY">API Key</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how to authenticate with the webhook endpoint.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedAuthType !== 'NONE' && (
                  <FormField
                    control={form.control}
                    name="authValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedAuthType === 'BASIC' ? 'Username:Password' :
                           selectedAuthType === 'BEARER' ? 'Token' :
                           'API Key'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={
                              selectedAuthType === 'BASIC' ? 'username:password' :
                              selectedAuthType === 'BEARER' ? 'your-token' :
                              'your-api-key'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {selectedAuthType === 'BASIC' ? 'Enter in format username:password' :
                           selectedAuthType === 'BEARER' ? 'Your Bearer token' :
                           'Your API key'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Optional shared secret for signature verification"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Used to generate signatures to verify webhook authenticity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="verificationToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Token</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Optional token sent with each webhook"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        An additional token sent with each webhook request.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Allowed IP Addresses</FormLabel>
                  <FormDescription>
                    Restrict webhook delivery to specific IP addresses (optional).
                  </FormDescription>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="192.168.1.1 or 10.0.0.0/24"
                      value={allowedIpInput}
                      onChange={(e) => setAllowedIpInput(e.target.value)}
                    />
                    <Button type="button" onClick={addIpAddress}>Add</Button>
                  </div>
                  
                  <div className="mt-2">
                    {form.getValues('allowedIpAddresses')?.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md border px-3 py-2 mt-1">
                        <span>{ip}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIpAddress(ip)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {(!form.getValues('allowedIpAddresses') || form.getValues('allowedIpAddresses').length === 0) && (
                      <p className="text-sm text-muted-foreground italic">No IP restrictions (all IPs allowed)</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Filters tab */}
              <TabsContent value="filters" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <FormLabel>Data Filtering</FormLabel>
                  <FormDescription>
                    Choose which fields to include or exclude in webhook payloads.
                  </FormDescription>
                  
                  <div className="flex space-x-2">
                    <div className="w-1/2 space-y-2">
                      <h4 className="text-sm font-medium">Include Fields</h4>
                      <p className="text-sm text-muted-foreground">If selected, only these fields will be sent.</p>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                        {fields.map((field) => (
                          <FormField
                            key={`include-${field.id}`}
                            control={form.control}
                            name="includeFields"
                            render={({ field: formField }) => (
                              <FormItem
                                key={field.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={formField.value?.includes(field.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = formField.value || [];
                                      return checked
                                        ? formField.onChange([...currentValues, field.id])
                                        : formField.onChange(
                                            currentValues.filter(
                                              (value) => value !== field.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    {field.label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                        {fields.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No fields available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-1/2 space-y-2">
                      <h4 className="text-sm font-medium">Exclude Fields</h4>
                      <p className="text-sm text-muted-foreground">These fields will be omitted from payloads.</p>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                        {fields.map((field) => (
                          <FormField
                            key={`exclude-${field.id}`}
                            control={form.control}
                            name="excludeFields"
                            render={({ field: formField }) => (
                              <FormItem
                                key={field.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={formField.value?.includes(field.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = formField.value || [];
                                      return checked
                                        ? formField.onChange([...currentValues, field.id])
                                        : formField.onChange(
                                            currentValues.filter(
                                              (value) => value !== field.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    {field.label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                        {fields.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No fields available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: If both include and exclude fields are selected, include takes precedence.
                  </p>
                </div>
                
                {/* TODO: Add condition builder component similar to FormField conditions builder */}
                <div className="space-y-2">
                  <FormLabel>Conditional Triggers</FormLabel>
                  <FormDescription>
                    Set conditions for when this webhook should be triggered. This feature will be available in a future update.
                  </FormDescription>
                </div>
              </TabsContent>
              
              {/* Advanced tab */}
              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="retryCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retry Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of retry attempts for failed deliveries.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="retryInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retry Interval (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Time between retry attempts (in seconds).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="dailyLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Optional"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of webhook triggers per day (leave empty for unlimited).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isAdmin && (
                  <>
                    <Separator />
                    <h3 className="text-lg font-medium">Admin Settings</h3>
                    
                    <FormField
                      control={form.control}
                      name="adminApproved"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Approved</FormLabel>
                            <FormDescription>
                              Approve this webhook for use.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="adminNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add notes about this webhook (only visible to administrators)"
                              className="resize-y"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Private notes for administrators.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isTemplate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Template</FormLabel>
                            <FormDescription>
                              Make this webhook available as a template for clients.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* Client webhook approval message */}
            {!isAdmin && !webhook?.adminApproved && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-md p-4 text-left">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-amber-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Approval Required</h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>Webhooks created by clients require admin approval before they become active. You'll be notified when your webhook is approved or rejected.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : webhook ? 'Update Webhook' : 'Create Webhook'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
} 
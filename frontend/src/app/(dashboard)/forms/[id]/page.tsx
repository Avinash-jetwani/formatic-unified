'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Eye,
  Edit,
  Plus,
  Check,
  X,
  Globe,
  EyeOff,
  FileText,
  Copy,
  BookOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { fetchApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { utcToLocalInputFormat, localInputToUTC, createFutureDateForInput, utcToLocalDateTimeFormat, localDateTimeToUTC, createFutureDateTimeForInput } from '@/lib/date-utils';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';

// Form and field interfaces
interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  fields: FormField[];
  submissionMessage?: string;
  tags?: string[];
  category?: string;
  isTemplate?: boolean;
  successRedirectUrl?: string;
  multiPageEnabled?: boolean;
  clientId: string;
  client?: {
    id: string;
    name?: string;
    email: string;
    company?: string;
  }
  expirationDate?: string;
  maxSubmissions?: number | null;
  requireConsent?: boolean;
  consentText?: string;
  accessRestriction?: 'none' | 'email' | 'password';
  accessPassword?: string;
  allowedEmails?: string[];
  emailNotifications?: boolean;
  notificationEmails?: string[];
  notificationType?: 'all' | 'digest';
}

interface FormField {
  id: string;
  formId: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
  config: any;
  order: number;
}

const FormEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const formId = params?.id as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [baseUrl, setBaseUrl] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isTemplate, setIsTemplate] = useState(false);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string | undefined>(undefined);
  const [hasRedirectUrl, setHasRedirectUrl] = useState(false);
  const [multiPageEnabled, setMultiPageEnabled] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | undefined>(undefined);
  const [maxSubmissions, setMaxSubmissions] = useState<number | null>(null);
  const [requireConsent, setRequireConsent] = useState(false);
  const [consentText, setConsentText] = useState('I consent to having this website store my submitted information.');
  const [accessRestriction, setAccessRestriction] = useState<'none' | 'email' | 'password'>('none');
  const [accessPassword, setAccessPassword] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<'all' | 'digest'>('all');
  const [showPassword, setShowPassword] = useState(false);
  
  // Set baseUrl only on client side to avoid hydration mismatch
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);
  
  // Load form data on component mount
  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);
  

  
  // Function to load form data
  const loadForm = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Form>(`/forms/${formId}`);
      setForm(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setPublished(data.published);
      setSubmissionMessage(data.submissionMessage || '');
      setCategory(data.category || '');
      setTags(data.tags || []);
      setIsTemplate(data.isTemplate || false);
      // When loading form data, check if successRedirectUrl exists and is not null
      const hasUrl = data.successRedirectUrl !== undefined && data.successRedirectUrl !== null;
      setSuccessRedirectUrl(hasUrl ? data.successRedirectUrl : undefined);
      setHasRedirectUrl(hasUrl);
      setMultiPageEnabled(data.multiPageEnabled || false);
      
      // Set new settings if they exist
      if (data.expirationDate) {
        setExpirationDate(utcToLocalDateTimeFormat(data.expirationDate));
      }
      setMaxSubmissions(data.maxSubmissions !== undefined ? data.maxSubmissions : null);
      setRequireConsent(data.requireConsent || false);
      setConsentText(data.consentText || 'I consent to having this website store my submitted information.');
      setAccessRestriction(data.accessRestriction || 'none');
      setAccessPassword(data.accessPassword || '');
      setAllowedEmails(data.allowedEmails || []);
      setEmailNotifications(data.emailNotifications || false);
      setNotificationEmails(data.notificationEmails || []);
      setNotificationType(data.notificationType || 'all');
    } catch (error) {
      console.error('Failed to load form:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to save form changes
  const handleSaveForm = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form title",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      await fetchApi(`/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          title,
          description,
          published
        }
      });
      
      toast({
        title: "Success",
        description: "Form updated successfully",
      });
      
      // Reload the form to get the latest data
      loadForm();
    } catch (error) {
      console.error('Failed to update form:', error);
      toast({
        title: "Error",
        description: "Failed to update form",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Function to toggle publish status
  const handleTogglePublish = async () => {
    setSaving(true);
    try {
      await fetchApi(`/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          published: !published
        }
      });
      
      setPublished(!published);
      
      toast({
        title: "Success",
        description: `Form ${!published ? 'published' : 'unpublished'} successfully`,
      });
    } catch (error) {
      console.error('Failed to update publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Function to navigate to form builder
  const handleEditFields = () => {
    router.push(`/forms/${formId}/builder`);
  };
  
  // Function to preview form
  const handlePreviewForm = () => {
    router.push(`/forms/${formId}/preview`);
  };
  
  // Function to copy form link
  const handleCopyLink = () => {
    if (!form) return;
    
    // Construct the public form URL
    const publicUrl = `${baseUrl}/forms/public/${form.slug}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast({
        title: "Success",
        description: "Form link copied to clipboard",
      });
    }).catch(err => {
      console.error('Failed to copy form link:', err);
      toast({
        title: "Error",
        description: "Failed to copy form link",
        variant: "destructive"
      });
    });
  };
  
  // Function to delete the form
  const handleDeleteForm = async () => {
    try {
      await fetchApi(`/forms/${formId}`, { 
        method: 'DELETE' 
      });
      
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
      
      // Redirect to forms listing page
      router.push('/forms');
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive"
      });
    }
  };
  
  // Function to save form settings
  const saveFormSettings = async () => {
    setSaving(true);
    try {
      // Validate redirect URL if provided
      if (successRedirectUrl && successRedirectUrl !== 'https://') {
        try {
          // Simple validation to check if URL is valid
          const url = new URL(successRedirectUrl);
          if (!url.protocol.startsWith('http')) {
            throw new Error('URL must start with http:// or https://');
          }
        } catch (error) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL starting with http:// or https://",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }
      } else if (successRedirectUrl === 'https://') {
        // Don't save an empty https:// URL
        setSuccessRedirectUrl(undefined);
      }

      // Validate emails if access restriction is by email
      if (accessRestriction === 'email' && allowedEmails.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please add at least one allowed email address",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Validate password if access restriction is by password
      if (accessRestriction === 'password' && !accessPassword) {
        toast({
          title: "Missing Information",
          description: "Please set a password for form access",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Validate notification emails
      if (emailNotifications && notificationEmails.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please add at least one notification email address",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Convert local expirationDate to UTC for storing on the server
      const expirationDateUTC = localDateTimeToUTC(expirationDate);
      
      // If hasRedirectUrl is false, explicitly set to null to clear existing value in database
      const finalSuccessRedirectUrl = hasRedirectUrl ? successRedirectUrl : null;
      
      console.log("Saving form settings:", {
        isTemplate,
        hasRedirectUrl,
        successRedirectUrl: finalSuccessRedirectUrl,
        successRedirectUrlType: typeof finalSuccessRedirectUrl,
        multiPageEnabled
      });
      
      // Make sure we're actually clearing the URL when toggled off
      if (!hasRedirectUrl && form?.successRedirectUrl) {
        console.log("Clearing existing redirect URL:", form.successRedirectUrl);
      }

      const updatedForm = await fetchApi(`/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          submissionMessage,
          category,
          tags,
          isTemplate,
          successRedirectUrl: finalSuccessRedirectUrl,
          multiPageEnabled,
          expirationDate: expirationDateUTC,
          maxSubmissions,
          requireConsent,
          consentText,
          accessRestriction,
          accessPassword,
          allowedEmails,
          emailNotifications,
          notificationEmails,
          notificationType
        }
      });
      
      // Update local form state with new values
      setForm(prev => {
        if (!prev) return null;
        return {
          ...prev,
          submissionMessage,
          category,
          tags,
          isTemplate,
          successRedirectUrl: hasRedirectUrl ? successRedirectUrl : undefined,
          multiPageEnabled,
          expirationDate,
          maxSubmissions,
          requireConsent,
          consentText,
          accessRestriction,
          accessPassword,
          allowedEmails,
          emailNotifications,
          notificationEmails,
          notificationType
        };
      });
      
      toast({
        title: "Success",
        description: "Form settings saved successfully",
      });
    } catch (error) {
      console.error('Failed to update form settings:', error);
      toast({
        title: "Error",
        description: "Failed to update form settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/forms')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {loading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <>
                  {title || 'Untitled Form'}
                  <Badge variant={published ? "default" : "outline"} className="ml-2">
                    {published ? "Published" : "Draft"}
                  </Badge>
                </>
              )}
            </h1>
            <div className="text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-64 mt-1" />
              ) : (
                <>
                  {"Edit your form details and manage fields"}
                  {/* Show badge if super admin and form belongs to a client */}
                  {isAdmin && form?.clientId !== user?.id && (
                    <Badge variant="outline" className="ml-2">
                      Client Form
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePreviewForm}
            disabled={loading}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button 
            variant={published ? "outline" : "default"}
            onClick={handleTogglePublish}
            disabled={loading || saving}
          >
            {published ? (
              <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
            ) : (
              <><Globe className="mr-2 h-4 w-4" />Publish</>
            )}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button 
            onClick={handleSaveForm}
            disabled={loading || saving || !title.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      {loading ? (
        // Loading skeletons
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4 md:col-span-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Form title and description */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                placeholder="Enter form title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter form description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1 h-[38px]"
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Tabs for different form sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="edit">General</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={published}
                  onCheckedChange={handleTogglePublish}
                  id="published"
                />
                <Label htmlFor="published">
                  {published ? 'Published' : 'Draft'} - {published ? 'Your form is live and accepting submissions' : 'Your form is not accepting submissions'}
                </Label>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-md">
                <h3 className="font-medium mb-1">Form Information</h3>
                <div className="grid gap-2 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="col-span-2">{new Date(form?.createdAt || '').toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="col-span-2">{new Date(form?.updatedAt || '').toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Form ID:</span>
                    <span className="col-span-2 font-mono text-xs">{form?.id}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="col-span-2 font-mono text-xs">{form?.slug}</span>
                  </div>
                  
                  {/* Show client information for super admin users */}
                  {isAdmin && (
                    <>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Owner Type:</span>
                        <span className="col-span-2">
                          <Badge variant="outline">
                            {form?.clientId === user?.id ? 'Admin' : 'Client'}
                          </Badge>
                        </span>
                      </div>
                      {form?.clientId !== user?.id && form?.client && (
                        <>
                          <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Client Name:</span>
                            <span className="col-span-2">{form?.client?.name || 'Not specified'}</span>
                          </div>
                          <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Client Email:</span>
                            <span className="col-span-2">{form?.client?.email}</span>
                          </div>
                          {form?.client?.company && (
                            <div className="grid grid-cols-3">
                              <span className="text-muted-foreground">Company:</span>
                              <span className="col-span-2">{form?.client?.company}</span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="fields" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium">Form Fields</h3>
                    <p className="text-sm text-muted-foreground">
                      {form?.fields?.length === 0 
                        ? "No fields added yet" 
                        : `${form?.fields.length} field${form?.fields.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <Button onClick={handleEditFields}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Form Builder
                  </Button>
                </div>
                
                {form?.fields?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center border rounded-lg">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">No fields added yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Use the Form Builder to add fields to your form
                    </p>
                    <Button onClick={handleEditFields}>
                      Open Form Builder
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="border-b p-3 bg-muted/30 hidden sm:grid sm:grid-cols-12 text-sm font-medium">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-3">Label</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Required</div>
                      <div className="col-span-4">Options/Config</div>
                    </div>
                    <div className="divide-y">
                      {form?.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field, index) => (
                          <div key={field.id} className="p-3">
                            {/* Mobile view (card style) */}
                            <div className="sm:hidden space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">{field.label}</div>
                                <Badge variant={field.required ? "default" : "outline"}>
                                  {field.required ? "Required" : "Optional"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Type: {field.type.replace('_', ' ')}
                              </div>
                              {(field.options?.length > 0 || Object.keys(field.config || {}).length > 0) && (
                                <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                                  {field.options?.length > 0 
                                    ? field.options.join(', ') 
                                    : Object.entries(field.config || {})
                                        .map(([key, value]) => `${key}: ${value}`)
                                        .join(', ')}
                                </div>
                              )}
                            </div>
                            {/* Desktop view (table row) */}
                            <div className="hidden sm:grid sm:grid-cols-12 sm:items-center text-sm">
                              <div className="col-span-1 text-center text-muted-foreground">{index + 1}</div>
                              <div className="col-span-3 font-medium truncate" title={field.label}>{field.label}</div>
                              <div className="col-span-2">{field.type.replace('_', ' ')}</div>
                              <div className="col-span-2">
                                {field.required ? (
                                  <span className="inline-flex items-center text-green-600">
                                    <Check className="h-4 w-4 mr-1" /> Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-muted-foreground">
                                    <X className="h-4 w-4 mr-1" /> No
                                  </span>
                                )}
                              </div>
                              <div className="col-span-4 text-muted-foreground truncate">
                                {field.options?.length > 0 
                                  ? field.options.join(', ') 
                                  : Object.entries(field.config || {})
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(', ') || 'None'}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="share" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Share Your Form</h3>
                  <p className="text-sm text-muted-foreground">
                    {published 
                      ? "Your form is published and can be shared with others" 
                      : "Publish your form to share it with others"}
                  </p>
                </div>
                
                {!published ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
                    <div className="rounded-full bg-yellow-100 p-3 mb-3">
                      <Eye className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="font-medium">Form Not Published</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Publish your form to generate a shareable link
                    </p>
                    <Button onClick={handleTogglePublish}>
                      Publish Form
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <Label htmlFor="form-link" className="text-sm font-medium mb-1 block">
                        Full Form Link
                      </Label>
                      <div className="flex">
                        <Input
                          id="form-link"
                          value={baseUrl ? `${baseUrl}/forms/public/${form?.slug}` : ''}
                          readOnly
                          className="rounded-r-none"
                        />
                        <Button
                          onClick={handleCopyLink}
                          className="rounded-l-none"
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this link with others to allow them to fill out your form. The URL contains a unique identifier for your company and form.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <Label htmlFor="form-short-link" className="text-sm font-medium mb-1 block">
                        Short Form Link
                      </Label>
                      <div className="flex">
                        <Input
                          id="form-short-link"
                          value={baseUrl ? `${baseUrl}/f/${form?.slug}` : ''}
                          readOnly
                          className="rounded-r-none"
                        />
                        <Button
                          onClick={() => {
                            if (!form) return;
                            const shortUrl = `${baseUrl}/f/${form.slug}`;
                            navigator.clipboard.writeText(shortUrl).then(() => {
                              toast({
                                title: "Success",
                                description: "Short link copied to clipboard",
                              });
                            }).catch(err => {
                              console.error('Failed to copy short link:', err);
                              toast({
                                title: "Error",
                                description: "Failed to copy short link",
                                variant: "destructive"
                              });
                            });
                          }}
                          className="rounded-l-none"
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        A shorter URL that redirects to your form.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Embed Code</h4>
                      <div className="bg-muted p-3 rounded-md overflow-x-auto">
                        <code className="text-xs font-mono whitespace-pre-wrap break-all">
                          {baseUrl ? `<iframe src="${baseUrl}/forms/embed/${form?.slug}" width="100%" height="600" frameborder="0"></iframe>` : ''}
                        </code>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={() => {
                          if (!form || !baseUrl) return;
                          const embedCode = `<iframe src="${baseUrl}/forms/embed/${form.slug}" width="100%" height="600" frameborder="0"></iframe>`;
                          navigator.clipboard.writeText(embedCode).then(() => {
                            toast({
                              title: "Success",
                              description: "Embed code copied to clipboard",
                            });
                          }).catch(err => {
                            console.error('Failed to copy embed code:', err);
                            toast({
                              title: "Error",
                              description: "Failed to copy embed code",
                              variant: "destructive"
                            });
                          });
                        }}
                      >
                        Copy Embed Code
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this code to embed the form on your website
                      </p>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">About Your Form URL</h4>
                      <p className="text-sm text-muted-foreground">
                        Your form's URL contains a unique identifier based on:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                        <li>Your form title ({form?.title})</li>
                        <li>Your company's unique ID</li>
                        <li>A timestamp to ensure uniqueness</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-2">
                        This ensures your form URL will not conflict with forms from other companies, even if they have the same title.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Form Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure additional settings for your form
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="formCategory" className="text-sm sm:text-base">Category</Label>
                    <Input
                      id="formCategory"
                      placeholder="Enter category (e.g., Contact, Survey)"
                      className="mt-1"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Categorize your form for easier organization.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="formTags" className="text-sm sm:text-base">Tags</Label>
                    <Input
                      id="formTags"
                      placeholder="Enter tags separated by commas"
                      className="mt-1"
                      value={tags.join(', ')}
                      onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Add tags to help with searching and filtering forms.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="formSubmissionMsg" className="text-sm sm:text-base">Submission Message</Label>
                    <Textarea
                      id="formSubmissionMsg"
                      placeholder="Thank you for your submission!"
                      className="mt-1"
                      value={submissionMessage}
                      onChange={(e) => setSubmissionMessage(e.target.value)}
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      This message will be shown to users after they submit the form.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
  <Switch 
    id="formRedirect" 
    checked={hasRedirectUrl}
    onCheckedChange={(checked) => {
      console.log("Toggle redirect URL:", checked);
      setHasRedirectUrl(checked);
      if (!checked) {
        // Explicitly set to undefined when toggled off
        setSuccessRedirectUrl(undefined);
      } else {
        // Set a placeholder URL when toggled on
        setSuccessRedirectUrl('https://');
      }
    }}
  />
  <Label htmlFor="formRedirect" className="text-sm sm:text-base">Custom success redirect</Label>
</div>

{hasRedirectUrl && (
  <div className="pl-2 sm:pl-6">
    <Input
      id="formSuccessUrl"
      placeholder="https://example.com/thank-you"
      value={successRedirectUrl || 'https://'}
      onChange={(e) => setSuccessRedirectUrl(e.target.value)}
    />
    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
      Redirect users to a custom URL after form submission.
    </p>
  </div>
)}
                  </div>
                  
                  <div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Switch 
      id="formIsTemplate" 
      checked={isTemplate}
      onCheckedChange={(checked) => {
        setIsTemplate(checked);
        console.log("Template toggle changed to:", checked);
      }}
    />
    <Label htmlFor="formIsTemplate" className="text-sm sm:text-base">Save as template</Label>
  </div>
  <p className="text-xs sm:text-sm text-muted-foreground ml-6">
    Make this form available as a template for future forms.
  </p>
</div>

<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Switch 
      id="multiPageEnabled" 
      checked={multiPageEnabled}
      onCheckedChange={(checked) => {
        setMultiPageEnabled(checked);
        console.log("Multi-page toggle changed to:", checked);
      }}
    />
    <Label htmlFor="multiPageEnabled" className="text-sm sm:text-base">Enable multi-page form</Label>
  </div>
  <p className="text-xs sm:text-sm text-muted-foreground ml-6">
    Split your form into multiple pages for a better user experience with longer forms.
    <span className="block mt-1">You can set the page number for each field in the form builder.</span>
  </p>
</div>

                  <Separator className="my-6" />
                  
                  <h3 className="text-lg font-medium">Form Limits & Availability</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="formExpiration" 
                        checked={!!expirationDate}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setExpirationDate(undefined);
                          } else {
                            // Set default expiration to 30 days from now
                            setExpirationDate(createFutureDateTimeForInput(30));
                          }
                        }}
                      />
                      <Label htmlFor="formExpiration" className="text-sm sm:text-base">Form expiration</Label>
                    </div>
                    
                    {expirationDate && (
                      <div className="pl-2 sm:pl-6">
                        <Input
                          id="formExpirationDate"
                          type="datetime-local"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                        />
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Automatically close the form after this date and time.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="maxSubmissionsLimit" 
                        checked={maxSubmissions !== undefined && maxSubmissions !== null}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setMaxSubmissions(null);
                          } else {
                            setMaxSubmissions(100);
                          }
                        }}
                      />
                      <Label htmlFor="maxSubmissionsLimit" className="text-sm sm:text-base">Limit submissions</Label>
                    </div>
                    
                    {maxSubmissions !== undefined && maxSubmissions !== null && (
                      <div className="pl-2 sm:pl-6">
                        <Input
                          id="maxSubmissionsValue"
                          type="number"
                          min="1"
                          value={maxSubmissions}
                          onChange={(e) => setMaxSubmissions(parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Close the form after receiving this many submissions.
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />
                  
                  <h3 className="text-lg font-medium">Privacy & Security</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="requireConsent" 
                        checked={requireConsent}
                        onCheckedChange={setRequireConsent}
                      />
                      <Label htmlFor="requireConsent" className="text-sm sm:text-base">Require GDPR consent</Label>
                    </div>
                    
                    {requireConsent && (
                      <div className="pl-2 sm:pl-6">
                        <Textarea
                          id="consentText"
                          placeholder="I consent to having this website store my submitted information."
                          value={consentText}
                          onChange={(e) => setConsentText(e.target.value)}
                        />
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Add a required consent checkbox to the form for GDPR compliance.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accessRestriction" className="text-sm sm:text-base">Form Access Restriction</Label>
                    <Select
                      value={accessRestriction}
                      onValueChange={(value: 'none' | 'email' | 'password') => setAccessRestriction(value)}
                    >
                      <SelectTrigger id="accessRestriction">
                        <SelectValue placeholder="Select access restriction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None - Open to everyone</SelectItem>
                        <SelectItem value="email">Restricted to specific emails</SelectItem>
                        <SelectItem value="password">Password protected</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {accessRestriction === 'email' && (
                      <div className="pt-2">
                        <Label htmlFor="allowedEmails" className="text-sm">Allowed Email Addresses</Label>
                        <Textarea
                          id="allowedEmails"
                          placeholder="Enter email addresses separated by commas"
                          className="mt-1"
                          value={allowedEmails.join(', ')}
                          onChange={(e) => setAllowedEmails(e.target.value.split(',').map(email => email.trim()).filter(Boolean))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Only these email addresses will be able to access the form.
                        </p>
                      </div>
                    )}
                    
                    {accessRestriction === 'password' && (
                      <div className="pt-2">
                        <Label htmlFor="accessPassword" className="text-sm">Form Password</Label>
                        <div className="relative">
                          <Input
                            id="accessPassword"
                            type={showPassword ? "text" : "password"}
                            className="mt-1 pr-10"
                            value={accessPassword}
                            onChange={(e) => setAccessPassword(e.target.value)}
                            placeholder="Enter a password for form access"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <PasswordStrengthIndicator password={accessPassword} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Users will need to enter this password to access the form.
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />
                  
                  <h3 className="text-lg font-medium">Notifications</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="emailNotifications" 
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                      <Label htmlFor="emailNotifications" className="text-sm sm:text-base">Email notifications</Label>
                    </div>
                    
                    {emailNotifications && (
                      <div className="pl-2 sm:pl-6 space-y-4">
                        <div>
                          <Label htmlFor="notificationEmails" className="text-sm">Notification Recipients</Label>
                          <Textarea
                            id="notificationEmails"
                            placeholder="Enter email addresses separated by commas"
                            className="mt-1"
                            value={notificationEmails.join(', ')}
                            onChange={(e) => setNotificationEmails(e.target.value.split(',').map(email => email.trim()).filter(Boolean))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            These email addresses will receive notifications when the form is submitted.
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="notificationType" className="text-sm">Notification Frequency</Label>
                          <Select
                            value={notificationType}
                            onValueChange={(value: 'all' | 'digest') => setNotificationType(value)}
                          >
                            <SelectTrigger id="notificationType">
                              <SelectValue placeholder="Select notification type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Immediate - Send for every submission</SelectItem>
                              <SelectItem value="digest">Daily Digest - One email per day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={saveFormSettings}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="webhooks" className="mt-4 space-y-4">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium">Webhooks</h3>
                <Button onClick={() => router.push(`/forms/${formId}/webhooks`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Webhooks
                </Button>
              </div>
              <p className="text-muted-foreground">
                Webhooks allow you to receive form submission data in real-time in your own systems.
                Configure and manage webhooks to integrate your form with other applications.
              </p>
              <div className="p-4 bg-muted/30 rounded-md">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Receive real-time form submissions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Authenticate with various methods (API key, Bearer token, etc.)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Filter and customize the data you receive</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Monitor webhook deliveries and test endpoints</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? This action cannot be undone and will also delete all submissions associated with this form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteForm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormEditPage; 
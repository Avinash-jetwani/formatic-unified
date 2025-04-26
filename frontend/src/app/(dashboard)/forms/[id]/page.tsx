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
  EyeOff
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
                "Edit your form details and manage fields"
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
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="fields" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                  <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
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
                    <div className="border-b p-3 bg-muted/30 grid grid-cols-12 text-sm font-medium">
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
                          <div key={field.id} className="p-3 grid grid-cols-12 items-center text-sm">
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
                      <div className="bg-muted p-3 rounded-md">
                        <code className="text-xs font-mono">
                          {baseUrl ? `<iframe src="${baseUrl}/forms/embed/${form?.slug}" width="100%" height="600" frameborder="0"></iframe>` : ''}
                        </code>
                      </div>
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
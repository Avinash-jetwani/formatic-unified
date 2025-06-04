'use client';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Trash2, 
  Move, 
  EyeIcon,
  Grip,
  PencilIcon,
  X 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import slugify from 'slugify';
import clsx from 'clsx';
import { utcToLocalInputFormat, localInputToUTC, createFutureDateForInput, utcToLocalDateTimeFormat, localDateTimeToUTC, createFutureDateTimeForInput } from '@/lib/date-utils';

// Drag and drop libraries
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { fieldTypes } from '@/lib/fieldTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';

// Form interface for API responses
interface FormResponse {
  id: string;
  title: string;
  description?: string;
  slug: string;
  published: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

// Form field types from the Prisma schema
enum FieldType {
  TEXT = "TEXT",
  LONG_TEXT = "LONG_TEXT",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  URL = "URL",
  NUMBER = "NUMBER",
  DATE = "DATE",
  TIME = "TIME",
  DATETIME = "DATETIME",
  RATING = "RATING",
  SLIDER = "SLIDER",
  SCALE = "SCALE",
  DROPDOWN = "DROPDOWN",
  CHECKBOX = "CHECKBOX",
  RADIO = "RADIO",
  FILE = "FILE"
}

// Form field interface
interface FormField {
  id: string; // Local ID for drag and drop
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[]; // For dropdown, radio, checkbox
  config: any; // For rating, slider, scale, etc.
  order: number;
  page?: number; // Page number for multi-page forms
}

// Field type definition for the sidebar
interface FieldTypeDefinition {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}



// Form create page component
const FormCreatePage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);


  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState('build');
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  
  // Form settings
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submissionMessage, setSubmissionMessage] = useState('Thank you for your submission!');
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string | undefined>(undefined);
  const [multiPageEnabled, setMultiPageEnabled] = useState(false);
  
  // New form settings
  const [expirationDate, setExpirationDate] = useState<string | undefined>(undefined);
  const [maxSubmissions, setMaxSubmissions] = useState<number | undefined>(undefined);
  const [requireConsent, setRequireConsent] = useState(false);
  const [consentText, setConsentText] = useState('I consent to having this website store my submitted information.');
  const [accessRestriction, setAccessRestriction] = useState<'none' | 'email' | 'password'>('none');
  const [accessPassword, setAccessPassword] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<'all' | 'digest'>('all');
  const [showPassword, setShowPassword] = useState(false);

  // Handler for adding a field
  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type.toLowerCase().replace('_', ' ')} field`,
      placeholder: `Enter ${type.toLowerCase().replace('_', ' ')}`,
      required: false,
      options: type === FieldType.DROPDOWN || type === FieldType.CHECKBOX || type === FieldType.RADIO 
        ? ['Option 1', 'Option 2', 'Option 3'] 
        : [],
      config: getDefaultConfig(type),
      order: fields.length
    };
    
    setEditingField(newField);
    setFieldDialogOpen(true);
  };

  // Get default configuration based on field type
  const getDefaultConfig = (type: FieldType) => {
    switch (type) {
      case FieldType.RATING:
        return { max: 5 };
      case FieldType.SLIDER:
        return { min: 0, max: 100, step: 1 };
      case FieldType.SCALE:
        return { min: 1, max: 10 };
      case FieldType.NUMBER:
        return { min: null, max: null, step: 1 };
      default:
        return {};
    }
  };

  // Handler for updating a field
  const handleUpdateField = (updatedField: FormField) => {
    // Check if the field is new (not in the fields array yet)
    const fieldExists = fields.some(field => field.id === updatedField.id);
    
    if (fieldExists) {
      // Update existing field
      setFields(fields.map(field => field.id === updatedField.id ? updatedField : field));
    } else {
      // Add new field
      setFields([...fields, updatedField]);
    }
    
    setFieldDialogOpen(false);
    setEditingField(null);
  };

  // Handler for removing a field
  const handleRemoveField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    if (editingField?.id === id) {
      setEditingField(null);
    }
  };

  // Handler for drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  // Handler for drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (over && active.id !== over.id) {
      setFields(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order values to match new positions
        return newItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Handler for saving the form
  const handleSaveForm = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form title",
        variant: "destructive"
      });
      return;
    }

    // Check authentication status (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create forms. Please log in and try again.",
          variant: "destructive"
        });
        router.push('/login');
        return;
      }
    }

    // Validate URL if provided
    if (successRedirectUrl) {
      try {
        const url = new URL(successRedirectUrl);
        if (!url.protocol.startsWith('http')) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL starting with http:// or https://",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Validate emails if access restriction is by email
    if (accessRestriction === 'email' && allowedEmails.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one allowed email address",
        variant: "destructive"
      });
      return;
    }

    // Validate password if access restriction is by password
    if (accessRestriction === 'password' && !accessPassword) {
      toast({
        title: "Missing Information",
        description: "Please set a password for form access",
        variant: "destructive"
      });
      return;
    }

    // Validate notification emails
    if (emailNotifications && notificationEmails.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one notification email address",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Convert local expirationDate to UTC for storing on the server
      const expirationDateUTC = localDateTimeToUTC(expirationDate);

      console.log('Creating form with data:', {
        title,
        description,
        slug: slugify(title, { lower: true, strict: true }) || `form-${Date.now()}`,
        published: false,
        submissionMessage,
        category,
        tags,
        isTemplate: false,
        successRedirectUrl,
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
      });

      const response = await fetchApi<{id: string}>('/forms', {
        method: 'POST',
        data: {
          title,
          description,
          slug: slugify(title, { lower: true, strict: true }) || `form-${Date.now()}`,
          published: false,
          submissionMessage,
          category,
          tags,
          isTemplate: false,
          successRedirectUrl,
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

      console.log('Form creation response:', response);
      
      if (!response) {
        throw new Error('Failed to create form');
      }
      
      // Then, add fields to the form
      if (fields.length > 0) {
        const formattedFields = fields.map(field => ({
          ...field,
          // Convert options from array to array of objects if needed
          options: field.options,
          // Handle any specific field config conversions if needed
          config: field.config,
          page: multiPageEnabled ? (field.page || 1) : 1 // Default to page 1 if multi-page is not enabled
        }));
        
        await fetchApi(`/forms/${response.id}/fields`, {
          method: 'PUT',
          data: {
            fields: formattedFields
          }
        });
      }
      
      toast({
        title: "Success",
        description: "Form created successfully!",
      });
      
      // Redirect to the form builder
      router.push(`/forms/${response.id}/builder`);
    } catch (error) {
      console.error('Error creating form:', error);
      
      // Provide more specific error messaging
      let errorMessage = "Failed to create form. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = "Authentication failed. Please log in again.";
          router.push('/login');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = "You don't have permission to create forms.";
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = "Invalid form data. Please check your inputs and try again.";
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading form builder...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/forms')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create New Form</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/forms')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveForm}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <Label htmlFor="title">Form Title</Label>
          <Input
            id="title"
            placeholder="Enter form title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter form description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      
      <Separator />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="build">Build Form</TabsTrigger>
          <TabsTrigger value="settings">Form Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="build" className="space-y-6">
          {/* Existing build tab content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Field Types</CardTitle>
                <CardDescription>
                  Drag and drop fields to build your form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    {Object.entries(fieldTypes).filter(([key]) => key === key.toUpperCase()).map(([fieldTypeKey, fieldTypeInfo]) => (
                      <div
                        key={fieldTypeKey}
                        onClick={() => handleAddField(fieldTypeKey as FieldType)}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      >
                        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-muted">
                          <span className="text-sm">{fieldTypeInfo.icon || "+"}</span>
                        </div>
                        <div>
                          <div className="font-medium">{fieldTypeInfo.label}</div>
                          <div className="text-xs text-muted-foreground">{fieldTypeInfo.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>{fields.length > 0 ? 'Form Preview' : 'Add fields to your form'}</CardTitle>
                <CardDescription>
                  {fields.length > 0 
                    ? 'Drag to reorder, click to edit fields' 
                    : 'Select field types from the left panel'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[300px] border rounded-md border-dashed p-4">
                  {fields.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">No fields added</h3>
                      <p className="mb-4 mt-2 text-sm">Add fields from the left panel to get started</p>
                    </div>
                  ) : (
                    <DndContext 
                      sensors={[]} 
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {fields.map((field) => (
                            <SortableField
                              key={field.id}
                              field={field}
                              isActive={activeDragId === field.id}
                              isEditing={editingField?.id === field.id}
                              onEdit={() => {
                                setEditingField(field);
                                setFieldDialogOpen(true);
                              }}
                              onDelete={() => handleRemoveField(field.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>
                Configure additional settings for your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="formCategory">Category</Label>
                <Input
                  id="formCategory"
                  placeholder="Enter category (e.g., Contact, Survey)"
                  className="mt-1"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Categorize your form for easier organization.
                </p>
              </div>
              
              <div>
                <Label htmlFor="formTags">Tags</Label>
                <Input
                  id="formTags"
                  placeholder="Enter tags separated by commas"
                  className="mt-1"
                  value={tags.join(', ')}
                  onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add tags to help with searching and filtering forms.
                </p>
              </div>
              
              <div>
                <Label htmlFor="formSubmissionMsg">Submission Message</Label>
                <Textarea
                  id="formSubmissionMsg"
                  placeholder="Thank you for your submission!"
                  className="mt-1"
                  value={submissionMessage}
                  onChange={(e) => setSubmissionMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This message will be shown to users after they submit the form.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="formRedirect" 
                    checked={!!successRedirectUrl}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setSuccessRedirectUrl(undefined);
                      } else {
                        setSuccessRedirectUrl('https://');
                      }
                    }}
                  />
                  <Label htmlFor="formRedirect">Custom success redirect</Label>
                </div>
                
                {successRedirectUrl && (
                  <div className="pl-6">
                    <Input
                      id="formSuccessUrl"
                      placeholder="https://example.com/thank-you"
                      value={successRedirectUrl}
                      onChange={(e) => setSuccessRedirectUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Redirect users to a custom URL after form submission.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="multiPageEnabled" 
                    checked={multiPageEnabled}
                    onCheckedChange={setMultiPageEnabled}
                  />
                  <Label htmlFor="multiPageEnabled">Enable multi-page form</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Split your form into multiple pages for a better user experience with longer forms.
                </p>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-2">Form Limits & Availability</h3>
              
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
                  <Label htmlFor="formExpiration">Form expiration</Label>
                </div>
                
                {expirationDate && (
                  <div className="pl-6">
                    <Input
                      id="formExpirationDate"
                      type="datetime-local"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatically close the form after this date and time.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="maxSubmissionsLimit" 
                    checked={maxSubmissions !== undefined}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setMaxSubmissions(undefined);
                      } else {
                        setMaxSubmissions(100);
                      }
                    }}
                  />
                  <Label htmlFor="maxSubmissionsLimit">Limit submissions</Label>
                </div>
                
                {maxSubmissions !== undefined && (
                  <div className="pl-6">
                    <Input
                      id="maxSubmissionsValue"
                      type="number"
                      min="1"
                      value={maxSubmissions}
                      onChange={(e) => setMaxSubmissions(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Close the form after receiving this many submissions.
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-2">Privacy & Security</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="requireConsent" 
                    checked={requireConsent}
                    onCheckedChange={setRequireConsent}
                  />
                  <Label htmlFor="requireConsent">Require GDPR consent</Label>
                </div>
                
                {requireConsent && (
                  <div className="pl-6">
                    <Textarea
                      id="consentText"
                      placeholder="I consent to having this website store my submitted information."
                      value={consentText}
                      onChange={(e) => setConsentText(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a required consent checkbox to the form for GDPR compliance.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessRestriction">Form Access Restriction</Label>
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

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-2">Notifications</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="emailNotifications" 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                </div>
                
                {emailNotifications && (
                  <div className="pl-6 space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <FieldEditorDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        field={editingField}
        onSave={handleUpdateField}
        availableFields={fields}
        multiPageEnabled={multiPageEnabled}
      />
    </div>
  );
};

// Sortable field component for drag and drop
interface SortableFieldProps {
  field: FormField;
  isActive: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableField: React.FC<SortableFieldProps> = ({ field, isActive, isEditing, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`border rounded-md p-4 bg-card ${isActive ? 'ring-2 ring-primary' : ''} ${isEditing ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab touch-none p-1 rounded hover:bg-muted"
          >
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{field.label}</p>
              {field.required && <span className="text-destructive text-sm">*</span>}
            </div>
            <p className="text-sm text-muted-foreground">{getFieldTypeLabel(field.type)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onEdit}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Field preview */}
      <div className="mt-3 pl-9">
        {renderFieldPreview(field)}
      </div>
    </div>
  );
};

// Function to get field type label
const getFieldTypeLabel = (type: FieldType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Function to render field preview
const renderFieldPreview = (field: FormField) => {
  switch (field.type) {
    case FieldType.TEXT:
      return <Input placeholder={field.placeholder || ''} disabled />;
      
    case FieldType.LONG_TEXT:
      return <Textarea placeholder={field.placeholder || ''} disabled />;
      
    case FieldType.EMAIL:
      return <Input type="email" placeholder={field.placeholder || 'email@example.com'} disabled />;
      
    case FieldType.PHONE:
      return <Input type="tel" placeholder={field.placeholder || '(123) 456-7890'} disabled />;
      
    case FieldType.URL:
      return <Input type="url" placeholder={field.placeholder || 'https://example.com'} disabled />;
      
    case FieldType.NUMBER:
      return <Input type="number" placeholder={field.placeholder || '0'} disabled />;
      
    case FieldType.DATE:
      return <Input type="date" disabled />;
      
    case FieldType.TIME:
      return <Input type="time" disabled />;
      
    case FieldType.DATETIME:
      return <Input type="datetime-local" disabled />;
      
    case FieldType.RATING:
      const maxRating = field.config?.max || 5;
      return (
        <div className="flex gap-1">
          {maxRating <= 5 ? (
            <>
              {[1,2,3,4,5].slice(0, maxRating).map((i) => (
                <div key={i} className="text-primary">★</div>
              ))}
            </>
          ) : (
            <>
              {[1,2,3,4,5,6,7,8,9,10].slice(0, maxRating).map((i) => (
                <div key={i} className="text-primary">★</div>
              ))}
            </>
          )}
        </div>
      );
      
    case FieldType.SLIDER:
      return (
        <div className="py-4">
          <div className="h-2 bg-muted rounded-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary" />
          </div>
        </div>
      );
      
    case FieldType.SCALE:
      const scaleMin = field.config?.min || 1;
      const scaleMax = field.config?.max || 10;
      const scaleNumbers = [];
      for (let i = scaleMin; i <= scaleMax; i++) {
        scaleNumbers.push(i);
      }
      return (
        <div className="flex justify-between py-2">
          {scaleNumbers.map((num) => (
            <Button
              key={num}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled
            >
              {num}
            </Button>
          ))}
        </div>
      );
      
    case FieldType.DROPDOWN:
      return (
        <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled>
          <option value="" disabled selected>{field.placeholder || 'Select an option'}</option>
          {field.options.map((option, i) => (
            <option key={i} value={option}>{option}</option>
          ))}
        </select>
      );
      
    case FieldType.CHECKBOX:
      return (
        <div className="space-y-2">
          {field.options.map((option, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox id={`preview-${field.id}-${i}`} disabled />
              <Label htmlFor={`preview-${field.id}-${i}`}>{option}</Label>
            </div>
          ))}
        </div>
      );
      
    case FieldType.RADIO:
      return (
        <RadioGroup defaultValue="" className="space-y-2">
          {field.options.map((option, i) => (
            <div key={i} className="flex items-center space-x-2">
              <RadioGroupItem value={`option-${i}`} id={`preview-${field.id}-${i}`} disabled />
              <Label htmlFor={`preview-${field.id}-${i}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      );
      
    case FieldType.FILE:
      return (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
            </div>
            <input type="file" className="hidden" disabled />
          </label>
        </div>
      );
      
    default:
      return <p className="text-muted-foreground">Unsupported field type</p>;
  }
};

// Field Editor Dialog Component
const FieldEditorDialog = ({ 
  open, 
  onOpenChange, 
  field, 
  onSave,
  availableFields,
  multiPageEnabled
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
  availableFields: FormField[];
  multiPageEnabled: boolean;
}) => {
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [type, setType] = useState<FieldType>(FieldType.TEXT);
  const [config, setConfig] = useState<any>({});
  const [page, setPage] = useState<number>(1);
  const [newOptionValue, setNewOptionValue] = useState('');
  const { toast } = useToast();

  // Reset state when field changes
  useEffect(() => {
    if (field) {
      setLabel(field.label || '');
      setPlaceholder(field.placeholder || '');
      setRequired(field.required || false);
      setOptions(field.options || []);
      setType(field.type);
      setConfig(field.config || {});
      setPage(field.page || 1);
    }
  }, [field]);

  // Ensure default config values when the field `type` changes (avoids infinite update loop)
  useEffect(() => {
    if (type === FieldType.SLIDER || type === FieldType.SCALE) {
      setConfig((prev: any) => ({
        min: prev?.min !== undefined ? prev.min : 1,
        max: prev?.max !== undefined ? prev.max : 10,
        step: prev?.step !== undefined ? prev.step : 1,
      }));
    }
  }, [type]);
  
  if (!field) return null;
  
  const fieldTypeInfo = fieldTypes[type] || {
    label: 'Unknown',
    hasOptions: false,
    hasPlaceholder: false,
  };
  
  // Add option to the field
  const handleAddOption = () => {
    if (newOptionValue.trim() && !options.includes(newOptionValue.trim())) {
      setOptions([...options, newOptionValue.trim()]);
      setNewOptionValue('');
    }
  };
  
  // Remove option from the field
  const handleRemoveOption = (option: string) => {
    setOptions(options.filter(o => o !== option));
  };
  
  // Update field type
  const handleTypeChange = (type: string) => {
    setType(type as FieldType);
    setConfig(getDefaultConfig(type as FieldType));
    // Set default options for option-based fields
    if (fieldTypes[type]?.hasOptions) {
      setOptions(options.length > 0 ? options : ['Option 1', 'Option 2', 'Option 3']);
    } else {
      setOptions([]);
    }
  };
  
  // Reuse the getDefaultConfig function for field type changes
  function getDefaultConfig(type: FieldType) {
    switch (type) {
      case FieldType.RATING:
        return { max: 5 };
      case FieldType.SLIDER:
        return { min: 0, max: 100, step: 1 };
      case FieldType.SCALE:
        return { min: 1, max: 10 };
      case FieldType.NUMBER:
        return { min: null, max: null, step: 1 };
      default:
        return {};
    }
  }
  
  // Function to update configuration values
  const updateConfig = (key: string, value: any) => {
    setConfig({
      ...config,
      [key]: value
    });
  };
  
  const handleSave = () => {
    if (!label.trim()) {
      toast({
        title: "Error",
        description: "Please enter a field label",
        variant: "destructive"
      });
      return;
    }
    
    onSave({
      id: field?.id || `field-${Date.now()}`,
      type,
      label,
      placeholder,
      required,
      options,
      config,
      order: field?.order !== undefined ? field.order : availableFields.length,
      page
    });
    onOpenChange(false);
  };
  
  // Render field configuration based on type
  const renderFieldConfig = () => {
    if (!type) return null;

    switch (type) {
      case FieldType.TEXT:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Text Field Settings</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="minLength" className="sm:text-right">
                Min Length
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="minLength"
                  type="number"
                  min="0"
                  value={config?.minLength || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('minLength', value);
                  }}
                  placeholder="Minimum character length"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="maxLength" className="sm:text-right">
                Max Length
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="maxLength"
                  type="number"
                  min="0"
                  value={config?.maxLength || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('maxLength', value);
                  }}
                  placeholder="Maximum character length"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.LONG_TEXT:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Long Text Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minLength" className="text-right">
                Min Length
              </Label>
              <div className="col-span-3">
                <Input
                  id="minLength"
                  type="number"
                  min="0"
                  value={config?.minLength || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('minLength', value);
                  }}
                  placeholder="Minimum character length"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxLength" className="text-right">
                Max Length
              </Label>
              <div className="col-span-3">
                <Input
                  id="maxLength"
                  type="number"
                  min="0"
                  value={config?.maxLength || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('maxLength', value);
                  }}
                  placeholder="Maximum character length"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rows" className="text-right">
                Rows
              </Label>
              <div className="col-span-3">
                <Input
                  id="rows"
                  type="number"
                  min="2"
                  max="20"
                  value={config?.rows || '4'}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 4 : Number(e.target.value);
                    updateConfig('rows', value);
                  }}
                  placeholder="Number of visible rows"
                />
              </div>
            </div>
          </div>
        );
        
      case FieldType.NUMBER:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Number Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">
                Min Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="min"
                  type="number"
                  value={config?.min ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    updateConfig('min', value);
                  }}
                  placeholder="Minimum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type="number"
                  value={config?.max ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    updateConfig('max', value);
                  }}
                  placeholder="Maximum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="step" className="text-right">
                Step
              </Label>
              <div className="col-span-3">
                <Input
                  id="step"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={config?.step || '1'}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : Number(e.target.value);
                    updateConfig('step', value);
                  }}
                  placeholder="Step size"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.RATING:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Rating Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max Rating
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type="number"
                  min="1"
                  max="10"
                  value={config?.max || '5'}
                  onChange={(e) => {
                    const max = Number(e.target.value) || 5;
                    updateConfig('max', Math.min(Math.max(max, 1), 10));
                  }}
                  placeholder="Maximum rating value"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.SCALE:
      case FieldType.SLIDER:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{type === FieldType.SCALE ? 'Scale' : 'Slider'} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">
                Min Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="min"
                  type="number"
                  value={config?.min ?? '1'}
                  onChange={(e) => {
                    const min = e.target.value === '' ? 1 : Number(e.target.value);
                    updateConfig('min', min);
                  }}
                  placeholder="Minimum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type="number"
                  value={config?.max ?? '10'}
                  onChange={(e) => {
                    const max = e.target.value === '' ? 10 : Number(e.target.value);
                    updateConfig('max', max);
                  }}
                  placeholder="Maximum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="step" className="text-right">
                Step
              </Label>
              <div className="col-span-3">
                <Input
                  id="step"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={config?.step || '1'}
                  onChange={(e) => {
                    const step = e.target.value === '' ? 1 : Number(e.target.value);
                    updateConfig('step', step);
                  }}
                  placeholder="Step size"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.CHECKBOX:
      case FieldType.RADIO:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{type === FieldType.CHECKBOX ? 'Checkbox' : 'Radio'} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layout" className="text-right">
                Layout
              </Label>
              <div className="col-span-3">
                <Select 
                  value={config?.layout || 'vertical'}
                  onValueChange={(value) => {
                    updateConfig('layout', value);
                  }}
                >
                  <SelectTrigger id="layout">
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case FieldType.DROPDOWN:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Dropdown Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allowSearch" className="text-right">
                Searchable
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="allowSearch"
                  checked={config?.allowSearch === true}
                  onCheckedChange={(checked) => {
                    updateConfig('allowSearch', checked);
                  }}
                />
                <span className="ml-2 text-sm">Allow searching in dropdown</span>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>
            Configure your form field properties
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldType" className="text-right">
              Field Type
            </Label>
            <Select
              value={type}
              onValueChange={(value) => handleTypeChange(value)}
            >
              <SelectTrigger id="fieldType" className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FieldType).map((fieldType) => (
                  <SelectItem key={fieldType} value={fieldType}>
                    {getFieldTypeLabel(fieldType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldLabel" className="text-right">
              Label
            </Label>
            <Input
              id="fieldLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldPlaceholder" className="text-right">
              Placeholder
            </Label>
            <Input
              id="fieldPlaceholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label htmlFor="fieldRequired">Required</Label>
            </div>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="fieldRequired"
                checked={required}
                onCheckedChange={setRequired}
              />
              <Label htmlFor="fieldRequired">This field is required</Label>
            </div>
          </div>
          
          {/* Page selection for multi-page forms */}
          {multiPageEnabled && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fieldPage" className="text-right">
                Page
              </Label>
              <Select 
                value={page.toString()} 
                onValueChange={(value) => setPage(parseInt(value))}
              >
                <SelectTrigger id="fieldPage" className="col-span-3">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Page 1</SelectItem>
                  <SelectItem value="2">Page 2</SelectItem>
                  <SelectItem value="3">Page 3</SelectItem>
                  <SelectItem value="4">Page 4</SelectItem>
                  <SelectItem value="5">Page 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Options for dropdown, checkbox, and radio fields */}
          {fieldTypeInfo.hasOptions && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h4 className="font-medium">Options</h4>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveOption(option)}
                      disabled={options.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    placeholder="New option"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={!newOptionValue.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Field-specific configuration */}
          {renderFieldConfig()}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormCreatePage; 
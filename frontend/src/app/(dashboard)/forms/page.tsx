'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  MoreHorizontal,
  RefreshCw,
  Filter,
  ChevronDown,
  Check,
  ListFilter,
  CheckCircle2,
  Ban,
  Pencil,
  AlertTriangle,
  Globe
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Badge 
} from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Form data interface
interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  submissionMessage?: string;
  tags: string[];
  category?: string;
  isTemplate: boolean;
  successRedirectUrl?: string;
  multiPageEnabled: boolean;
  submissionCount?: number;
  _count?: {
    submissions: number;
    fields: number;
  }
}

// Fix TypeScript errors
interface FormTemplate {
  title: string;
  description: string;
  fields: {
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    config?: any;
    order: number;
  }[];
}

const FormsPage = () => {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'templates'>('all');
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Pre-defined form templates
  const formTemplates: FormTemplate[] = [
    {
      title: "Customer Feedback",
      description: "Collect customer feedback about your product or service",
      fields: [
        {
          type: "TEXT",
          label: "Name",
          placeholder: "Your name",
          required: true,
          order: 0
        },
        {
          type: "EMAIL",
          label: "Email",
          placeholder: "your.email@example.com",
          required: true,
          order: 1
        },
        {
          type: "DROPDOWN",
          label: "How did you hear about us?",
          options: ["Search Engine", "Social Media", "Friend", "Advertisement", "Other"],
          required: false,
          order: 2
        },
        {
          type: "RADIO",
          label: "How would you rate our service?",
          options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
          required: true,
          order: 3
        },
        {
          type: "LONG_TEXT",
          label: "Additional comments",
          placeholder: "Please share any additional feedback...",
          required: false,
          order: 4
        }
      ]
    },
    {
      title: "Event Registration",
      description: "Simple event registration form with essential fields",
      fields: [
        {
          type: "TEXT",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
          order: 0
        },
        {
          type: "EMAIL",
          label: "Email Address",
          placeholder: "your.email@example.com",
          required: true,
          order: 1
        },
        {
          type: "PHONE",
          label: "Phone Number",
          placeholder: "+1 (555) 123-4567",
          required: false,
          order: 2
        },
        {
          type: "DROPDOWN",
          label: "Number of Guests",
          options: ["1", "2", "3", "4", "5+"],
          required: true,
          order: 3
        },
        {
          type: "CHECKBOX",
          label: "Dietary Restrictions",
          options: ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "None"],
          required: false,
          order: 4
        },
        {
          type: "LONG_TEXT",
          label: "Special Requests",
          placeholder: "Enter any special requests or accommodations...",
          required: false,
          order: 5
        }
      ]
    },
    {
      title: "Contact Form",
      description: "Simple contact form for your website",
      fields: [
        {
          type: "TEXT",
          label: "Name",
          placeholder: "Your name",
          required: true,
          order: 0
        },
        {
          type: "EMAIL",
          label: "Email",
          placeholder: "your.email@example.com",
          required: true,
          order: 1
        },
        {
          type: "TEXT",
          label: "Subject",
          placeholder: "What is this regarding?",
          required: true,
          order: 2
        },
        {
          type: "LONG_TEXT",
          label: "Message",
          placeholder: "Type your message here...",
          required: true,
          order: 3
        }
      ]
    }
  ];

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  // Fetch forms from API
  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Form[]>('/forms');
      setForms(data);
      
      // Show templates if user has no forms
      if (data.length === 0) {
        setShowTemplates(true);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form deletion
  const handleDeleteForm = async () => {
    if (!formToDelete) return;
    
    console.log('Attempting to delete form:', formToDelete);
    
    try {
      // First attempt to delete the form
      try {
        await fetchApi(`/forms/${formToDelete}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (initialError) {
        console.error('First delete attempt failed:', initialError);
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Second attempt
        await fetchApi(`/forms/${formToDelete}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Successfully deleted form on server');
      setForms(forms.filter(form => form.id !== formToDelete));
      setFormToDelete(null);
      setIsDeleteOpen(false);
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again or delete from the form detail page.",
        variant: "destructive"
      });
    }
  };

  // Handle form publish/unpublish toggle
  const handleTogglePublish = async (formId: string, isCurrentlyPublished: boolean) => {
    try {
      await fetchApi(`/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { published: !isCurrentlyPublished }
      });
      
      // Update local state to reflect the change
      setForms(forms.map(form => 
        form.id === formId 
          ? { ...form, published: !isCurrentlyPublished } 
          : form
      ));
    } catch (error) {
      console.error('Failed to update form publish status:', error);
    }
  };

  // Create form from template
  const createFromTemplate = async (template: FormTemplate) => {
    try {
      setLoading(true);
      
      // Step 1: Create the form first
      const newForm = await fetchApi<Form>('/forms', {
        method: 'POST',
        data: {
          title: template.title,
          description: template.description
        }
      });
      
      // Step 2: Add fields to the form
      if (template.fields && template.fields.length > 0) {
        await fetchApi(`/forms/${newForm.id}/fields`, {
          method: 'PUT',
          data: { fields: template.fields }
        });
      }
      
      toast({
        title: "Success",
        description: "Form created successfully from template",
      });
      
      router.push(`/forms/${newForm.id}/builder`);
    } catch (error) {
      console.error('Failed to create form from template:', error);
      toast({
        title: "Error",
        description: "Failed to create form from template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form duplication
  const handleDuplicateForm = async (formId: string) => {
    try {
      setLoading(true);
      const newForm = await fetchApi<Form>(`/forms/${formId}/duplicate`, {
        method: 'POST'
      });
      
      toast({
        title: "Success",
        description: "Form has been duplicated successfully",
      });
      
      // Reload forms list to show the new form
      await loadForms();
    } catch (error) {
      console.error('Failed to duplicate form:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate form",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter forms based on search term and published status
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    switch (filter) {
      case 'published':
        return matchesSearch && form.published;
      case 'draft':
        return matchesSearch && !form.published;
      case 'templates':
        return form.isTemplate;
      default: // 'all'
        return matchesSearch;
    }
  });
  
  // Function to get submissions count
  const getSubmissionCount = (form: Form) => {
    return form.submissionCount || form._count?.submissions || 0;
  };

  // Function to get fields count
  const getFieldCount = (form: Form) => {
    return form._count?.fields || 0;
  };
  
  // Function to navigate to create form page
  const navigateToCreateForm = () => {
    router.push('/forms/create');
  };

  // Extract unique categories
  const uniqueCategories = Array.from(new Set(forms.filter(form => form.category).map(form => form.category || '')));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">Create, manage, and track your forms and submissions.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="whitespace-nowrap"
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={navigateToCreateForm} className="whitespace-nowrap">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap">
              <Filter className="mr-2 h-4 w-4" />
              {filter === 'all' ? 'All Forms' : filter === 'published' ? 'Published' : filter === 'draft' ? 'Drafts' : 'Templates'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter('all')}>
              {filter === 'all' && <Check className="mr-2 h-4 w-4" />}
              All Forms
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('published')}>
              {filter === 'published' && <Check className="mr-2 h-4 w-4" />}
              Published
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('draft')}>
              {filter === 'draft' && <Check className="mr-2 h-4 w-4" />}
              Drafts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('templates')}>
              {filter === 'templates' && <Check className="mr-2 h-4 w-4" />}
              Templates
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Templates section for new users */}
      {showTemplates && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Form Templates</h2>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Hide Templates
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formTemplates.map((template, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{template.title}</CardTitle>
                  <CardDescription className="truncate">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span>{template.fields.length} fields</span>
                      <span>Template</span>
                    </div>
                    <ul className="list-disc list-inside text-xs">
                      {template.fields.slice(0, 3).map((field, i) => (
                        <li key={i} className="truncate">{field.label} ({field.type})</li>
                      ))}
                      {template.fields.length > 3 && (
                        <li className="text-xs italic">+ {template.fields.length - 3} more fields</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-3 border-t">
                  <Button 
                    onClick={() => createFromTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Forms grid for mobile and tablet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {loading ? (
          // Loading skeletons for cards
          Array(4).fill(null).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between pt-3 border-t">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
              </CardFooter>
            </Card>
          ))
        ) : filteredForms.length === 0 ? (
          <div className="col-span-full p-6 text-center border rounded-lg">
            <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-medium">No forms found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm 
                ? `No forms match "${searchTerm}". Try a different search term.` 
                : filter !== 'all' 
                  ? `You don't have any ${filter} forms.` 
                  : "You haven't created any forms yet."}
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={navigateToCreateForm}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Form
              </Button>
              {!showTemplates && !searchTerm && (
                <Button variant="outline" onClick={() => setShowTemplates(true)}>
                  Use Templates
                </Button>
              )}
            </div>
          </div>
        ) : (
          filteredForms.map(form => (
            <Card key={form.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="mr-2 truncate text-lg">{form.title}</CardTitle>
                  <Badge variant={form.published ? "default" : "outline"}>
                    {form.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardDescription className="truncate">{form.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                  <span>{getFieldCount(form)} fields</span>
                  <span>{getSubmissionCount(form)} submissions</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Created {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true })}</p>
                  <p>Updated {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/forms/${form.id}`)}
                >
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => router.push(`/forms/${form.id}/preview`)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDuplicateForm(form.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleTogglePublish(form.id, form.published)}
                    >
                      {form.published ? (
                        <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
                      ) : (
                        <><Globe className="mr-2 h-4 w-4" /> Publish</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setFormToDelete(form.id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Forms table for desktop */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Form</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeletons for table rows
              Array(5).fill(null).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium">No forms found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm 
                      ? `No forms match "${searchTerm}". Try a different search term.` 
                      : filter !== 'all' 
                        ? `You don't have any ${filter} forms.` 
                        : "You haven't created any forms yet."}
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button onClick={navigateToCreateForm}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Form
                    </Button>
                    {!showTemplates && !searchTerm && (
                      <Button variant="outline" onClick={() => setShowTemplates(true)}>
                        Use Templates
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredForms.map(form => (
                <TableRow key={form.id}>
                  <TableCell>
                    <div className="font-medium">{form.title}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {form.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.published ? "default" : "outline"}>
                      {form.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getFieldCount(form)}</TableCell>
                  <TableCell>{getSubmissionCount(form)}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/forms/${form.id}`)}
                        title="Edit form"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/forms/${form.id}/preview`)}
                        title="Preview form"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDuplicateForm(form.id)}
                        title="Duplicate form"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleTogglePublish(form.id, form.published)}
                        title={form.published ? "Unpublish" : "Publish"}
                      >
                        {form.published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setFormToDelete(form.id);
                          setIsDeleteOpen(true);
                        }}
                        title="Delete form"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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

export default FormsPage; 
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Globe,
  MoreVertical,
  PencilRuler,
  CalendarIcon,
  User,
  AlignLeftIcon,
  ClipboardList,
  Tag,
  FolderIcon,
  Layers,
  Sparkles,
  BarChart3,
  Zap
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
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { SimpleFormWizard } from '@/components/form/SimpleFormWizard';

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
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
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

// Pre-defined form templates - moved outside component to prevent re-creation
const FORM_TEMPLATES: FormTemplate[] = [
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

const FormsPage = () => {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'templates'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'mine' | 'clients'>('all');
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showSimpleWizard, setShowSimpleWizard] = useState(false);
  
  // Responsive state management
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Detect screen sizes for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
        setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      
      // Don't redirect new users - let them see the onboarding guide instead
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
    const formIdToDelete = formToDelete;
    
    try {
      // First attempt to delete the form
      try {
        await fetchApi(`/forms/${formIdToDelete}`, { 
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
        await fetchApi(`/forms/${formIdToDelete}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Successfully deleted form on server');
      
      // Update state in a more stable way to prevent React key issues
      setForms(prevForms => {
        const newForms = prevForms.filter(form => form.id !== formIdToDelete);
        console.log('Updated forms list, remaining forms:', newForms.length);
        return newForms;
      });
      
      // Clean up state
      setFormToDelete(null);
      setIsDeleteOpen(false);
      
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete form:', error);
      
      // Clean up state even on error
      setFormToDelete(null);
      setIsDeleteOpen(false);
      
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
    // Show simplified wizard for new users (0 forms), complex create page for experienced users
    if (forms.length === 0) {
      setShowSimpleWizard(true);
    } else {
      router.push('/forms/create');
    }
  };

  // Memoized filter forms based on search term, published status, client filter, category and tags
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      // Title, description, or tags match search term
      const matchesSearch = !searchTerm || 
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (form.tags && form.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Filter by status (published/draft/template)
      const matchesStatus = filter === 'all' ? true :
                           filter === 'published' ? form.published :
                           filter === 'draft' ? !form.published :
                           filter === 'templates' ? form.isTemplate : true;
      
      // Filter by client (for super admin only)
      const matchesClient = !isAdmin ? true :
                           clientFilter === 'all' ? true :
                           clientFilter === 'mine' ? form.clientId === user?.id :
                           clientFilter === 'clients' ? form.clientId !== user?.id : true;
      
      // Filter by category
      const matchesCategory = !categoryFilter ? true :
                             form.category === categoryFilter;
      
      // Filter by tag
      const matchesTag = !tagFilter ? true :
                        form.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));
      
      return matchesSearch && matchesStatus && matchesClient && matchesCategory && matchesTag;
    });
  }, [forms, searchTerm, filter, clientFilter, categoryFilter, tagFilter, isAdmin, user?.id]);

  // Memoized extract unique categories
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(forms.filter(form => form.category).map(form => form.category || '')));
  }, [forms]);

  // Memoized extract unique tags across all forms
  const uniqueTags = useMemo(() => {
    return Array.from(new Set(forms.flatMap(form => form.tags || [])));
  }, [forms]);

  // Memoized extract unique client names for filtering
  const uniqueClients = useMemo(() => {
    return isAdmin ? Array.from(
      new Set(forms.filter(form => form.client?.name).map(form => form.client?.name || ''))
    ) : [];
  }, [forms, isAdmin]);

  // Handle wizard completion
  const handleWizardComplete = (formId: string) => {
    setShowSimpleWizard(false);
    // Reload forms to show the new form
    loadForms();
    // Navigate to the form builder
    router.push(`/forms/${formId}/builder`);
  };

  // Handle wizard cancellation
  const handleWizardCancel = () => {
    setShowSimpleWizard(false);
  };

  return (
    <ErrorBoundary>
      {/* Simple Form Wizard for New Users */}
      {showSimpleWizard && (
        <SimpleFormWizard
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}
      
      <div className="space-y-8">
      {/* Enhanced Header Section - Matching Submissions Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-100 dark:border-gray-600"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Forms Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1"
                >
                  {isMobile ? "Create and manage forms" : "Create, manage, and track your forms with powerful analytics"}
                </motion.p>
              </div>
            </div>
            
            {/* Quick Stats - Responsive */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{filteredForms.length} Forms</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{filteredForms.filter(f => f.published).length} Published</span>
              </div>
              {!isMobile && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-gray-700/80 rounded-full px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  <span className="text-xs sm:text-sm font-medium dark:text-gray-200">{filteredForms.filter(f => !f.published).length} Drafts</span>
                </div>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => router.push('/templates')}
                className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800 dark:text-blue-300 transition-all duration-300 hover:shadow-lg h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Sparkles className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {isMobile ? "Templates" : "Browse Templates"}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={navigateToCreateForm} 
                className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <PlusCircle className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Create Form
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Search and Filter Section - Matching Submissions Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isMobile ? "Search forms..." : "Search forms by title, description, or tags..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 h-10 sm:h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
        
        {/* Status filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap h-10 text-xs sm:text-sm">
              <Filter className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {isMobile ? (
                filter === 'all' ? 'All' : filter === 'published' ? 'Pub' : filter === 'draft' ? 'Draft' : 'Temp'
              ) : (
                filter === 'all' ? 'All Forms' : filter === 'published' ? 'Published' : filter === 'draft' ? 'Drafts' : 'Templates'
              )}
              <ChevronDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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
        
        {/* Category filter dropdown */}
        {uniqueCategories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap h-10 text-xs sm:text-sm">
                <FolderIcon className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {isMobile ? (categoryFilter || 'Cat') : (categoryFilter || 'All Categories')}
                <ChevronDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCategoryFilter('')}>
                {!categoryFilter && <Check className="mr-2 h-4 w-4" />}
                All Categories
              </DropdownMenuItem>
              {uniqueCategories.map((category) => (
                <DropdownMenuItem key={category} onClick={() => setCategoryFilter(category)}>
                  {categoryFilter === category && <Check className="mr-2 h-4 w-4" />}
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Tag filter dropdown */}
        {uniqueTags.length > 0 && !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap h-10 text-xs sm:text-sm">
                <Tag className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {tagFilter || 'All Tags'}
                <ChevronDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTagFilter('')}>
                {!tagFilter && <Check className="mr-2 h-4 w-4" />}
                All Tags
              </DropdownMenuItem>
              {uniqueTags.map((tag) => (
                <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                  {tagFilter === tag && <Check className="mr-2 h-4 w-4" />}
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Client filter dropdown - only for super admin */}
        {isAdmin && !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap h-10 text-xs sm:text-sm">
                <Layers className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {clientFilter === 'all' ? 'All Owners' : clientFilter === 'mine' ? 'My Forms' : 'Client Forms'}
                <ChevronDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setClientFilter('all')}>
                {clientFilter === 'all' && <Check className="mr-2 h-4 w-4" />}
                All Owners
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setClientFilter('mine')}>
                {clientFilter === 'mine' && <Check className="mr-2 h-4 w-4" />}
                My Forms
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setClientFilter('clients')}>
                {clientFilter === 'clients' && <Check className="mr-2 h-4 w-4" />}
                Client Forms
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
          </div>
        </div>
      </motion.div>
      
      {/* Forms grid - Responsive for all screen sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 xl:hidden">
        {loading ? (
          // Loading skeletons for cards
          Array(6).fill(null).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-4 sm:h-5 w-1/3" />
                  <Skeleton className="h-4 sm:h-5 w-1/4" />
                </div>
                <Skeleton className="h-3 sm:h-4 w-full mb-2" />
                <Skeleton className="h-3 sm:h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between pt-3 border-t">
                <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" />
                <Skeleton className="h-8 sm:h-9 w-8 sm:w-9" />
              </CardFooter>
            </Card>
          ))
        ) : filteredForms.length === 0 ? (
          // Enhanced onboarding guide for new users
          forms.length === 0 && !searchTerm && filter === 'all' ? (
            <div className="col-span-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-blue-100 dark:border-gray-600"
              >
                <div className="text-center mb-8">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
                  >
                    <Sparkles className="h-8 w-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Welcome to Datizmo Forms!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                    Create powerful, customizable forms in minutes. Collect data, engage users, and grow your business.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create from Scratch</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Build a custom form tailored to your exact needs with our intuitive drag-and-drop builder.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Drag & drop form fields
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Custom styling options
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Advanced field types
                      </li>
                    </ul>
                    <Button onClick={navigateToCreateForm} className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Form
                    </Button>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Use Templates</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Get started quickly with professionally designed templates for common use cases.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Pre-built form structures
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Industry best practices
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Fully customizable
                      </li>
                    </ul>
                    <Button variant="outline" onClick={() => router.push('/templates')} className="w-full">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Browse Templates
                    </Button>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                    What you can do with Datizmo Forms
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg inline-flex mb-2">
                        <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">Collect Data</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gather information from customers, leads, and users</p>
                    </div>
                    <div className="text-center">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg inline-flex mb-2">
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">Share Anywhere</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Embed on websites or share via direct links</p>
                    </div>
                    <div className="text-center">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg inline-flex mb-2">
                        <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">Track Analytics</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Monitor submissions and form performance</p>
                    </div>
                    <div className="text-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg inline-flex mb-2">
                        <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">Automate</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Set up webhooks and integrations</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          ) : (
            // Regular empty state for filtered results
            <div className="col-span-full p-6 sm:p-8 text-center border rounded-lg">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium text-sm sm:text-base">No forms found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? `No forms match "${searchTerm}". Try a different search term.` 
                  : filter !== 'all' 
                    ? `You don't have any ${filter} forms.` 
                    : "You haven't created any forms yet."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
                <Button onClick={navigateToCreateForm} size={isMobile ? "sm" : "default"}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Form
                </Button>
                <Button variant="outline" onClick={() => router.push('/templates')} size={isMobile ? "sm" : "default"}>
                  Browse Templates
                </Button>
              </div>
            </div>
          )
        ) : (
          <AnimatePresence>
            {filteredForms.map((form, index) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-600 h-full">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex justify-between items-start">
                  <div 
                    className="space-y-1 cursor-pointer flex-1 hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/forms/${form.id}`)}
                    title="Click to edit form"
                  >
                    <CardTitle className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm sm:text-base lg:text-lg">
                      {form.title}
                      {form.isTemplate && (
                        <Badge variant="outline" className="ml-2 text-xs">Template</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xs sm:text-sm">
                      {isMobile 
                        ? (form.description?.substring(0, 60) || 'No description') + (form.description && form.description.length > 60 ? '...' : '')
                        : (form.description?.substring(0, 120) || 'No description') + (form.description && form.description.length > 120 ? '...' : '')
                      }
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                        <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/builder`)}>
                        <PencilRuler className="mr-2 h-4 w-4" />
                        Form Builder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/preview`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateForm(form.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleTogglePublish(form.id, form.published)}>
                        {form.published ? (
                          <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
                        ) : (
                          <><Globe className="mr-2 h-4 w-4" />Publish</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setFormToDelete(form.id);
                          setIsDeleteOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Category and Tags - Responsive */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.category && (
                    <Badge variant="secondary" className="text-xs">
                      {form.category}
                    </Badge>
                  )}
                  {Array.isArray(form.tags) && form.tags.slice(0, isMobile ? 2 : 3).map((tag, index) => (
                    <Badge key={`${form.id}-tag-${index}-${tag}`} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {Array.isArray(form.tags) && form.tags.length > (isMobile ? 2 : 3) && (
                    <Badge variant="outline" className="text-xs">
                      +{form.tags.length - (isMobile ? 2 : 3)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-4">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}
                  </div>
                  {isAdmin && form.client && form.clientId !== user?.id && !isMobile && (
                    <div className="flex items-center">
                      <User className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                      {form.client.name || form.client.email}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-2">
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <Badge variant={form.published ? "default" : "outline"} className="text-xs">
                    {form.published ? "Published" : "Draft"}
                  </Badge>
                  <div className="flex items-center text-muted-foreground">
                    <AlignLeftIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    {getFieldCount(form)} fields
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <ClipboardList className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    {getSubmissionCount(form)} submissions
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full sm:w-auto text-xs sm:text-sm" 
                  onClick={() => router.push(`/forms/${form.id}`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> 
                  Edit
                </Button>
              </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {/* Forms table for desktop - Enhanced responsive design */}
      <div className="hidden xl:block border rounded-lg dark:border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-600">
              <TableHead className="w-[300px] text-xs sm:text-sm">Form</TableHead>
              <TableHead className="text-xs sm:text-sm">Status</TableHead>
              {isAdmin && <TableHead className="text-xs sm:text-sm">Owner</TableHead>}
              <TableHead className="text-xs sm:text-sm">Fields</TableHead>
              <TableHead className="text-xs sm:text-sm">Submissions</TableHead>
              <TableHead className="text-xs sm:text-sm">Last Updated</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeletons for table rows
              Array(5).fill(null).map((_, i) => (
                <TableRow key={i} className="dark:border-gray-600">
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  {isAdmin && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="p-0">
                  {forms.length === 0 && !searchTerm && filter === 'all' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-2xl p-8 m-4 border border-blue-100 dark:border-gray-600"
                    >
                      <div className="text-center mb-8">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
                        >
                          <Sparkles className="h-8 w-8 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          Welcome to Datizmo Forms!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                          Create powerful, customizable forms in minutes. Collect data, engage users, and grow your business.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create from Scratch</h3>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Build a custom form tailored to your exact needs with our intuitive drag-and-drop builder.
                          </p>
                          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              Drag & drop form fields
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              Custom styling options
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              Advanced field types
                            </li>
                          </ul>
                          <Button onClick={navigateToCreateForm} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Form
                          </Button>
                        </motion.div>

                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Use Templates</h3>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Get started quickly with professionally designed templates for common use cases.
                          </p>
                          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              Pre-built form structures
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              Industry best practices
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              Fully customizable
                            </li>
                          </ul>
                          <Button variant="outline" onClick={() => router.push('/templates')} className="w-full">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Browse Templates
                          </Button>
                        </motion.div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                          What you can do with Datizmo Forms
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg inline-flex mb-2">
                              <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">Collect Data</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Gather information from customers, leads, and users</p>
                          </div>
                          <div className="text-center">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg inline-flex mb-2">
                              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">Share Anywhere</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Embed on websites or share via direct links</p>
                          </div>
                          <div className="text-center">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg inline-flex mb-2">
                              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">Track Analytics</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Monitor submissions and form performance</p>
                          </div>
                          <div className="text-center">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg inline-flex mb-2">
                              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">Automate</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Set up webhooks and integrations</p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div>
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
                        <Button variant="outline" onClick={() => router.push('/templates')}>
                          Browse Templates
                        </Button>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredForms.map(form => (
                <TableRow key={form.id} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell 
                    className="cursor-pointer transition-colors"
                    onClick={() => router.push(`/forms/${form.id}`)}
                    title="Click to edit form"
                  >
                    <div className="font-medium hover:text-blue-600 transition-colors text-sm">{form.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[300px] hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      {form.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.published ? "default" : "outline"} className="text-xs">
                      {form.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  {/* Client information column (for super admin only) */}
                  {isAdmin && (
                    <TableCell>
                      {form.clientId === user?.id ? (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      ) : form.client ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">{form.client.name || 'Client'}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{form.client.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm">{getFieldCount(form)}</TableCell>
                  <TableCell className="text-sm">{getSubmissionCount(form)}</TableCell>
                  <TableCell className="text-sm">{formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/forms/${form.id}`)}
                        title="Edit form"
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/forms/${form.id}/preview`)}
                        title="Preview form"
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDuplicateForm(form.id)}
                        title="Duplicate form"
                        className="h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleTogglePublish(form.id, form.published)}
                        title={form.published ? "Unpublish" : "Publish"}
                        className="h-8 w-8"
                      >
                        {form.published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
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
    </ErrorBoundary>
  );
};

export default FormsPage; 
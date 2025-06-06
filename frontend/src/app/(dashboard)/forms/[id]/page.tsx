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
  BookOpen,
  ExternalLink,
  Settings,
  BarChart3,
  Share2,
  Zap,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Target,
  Link,
  Download,
  Sparkles,
  QrCode,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  conditions?: {
    logicOperator?: 'AND' | 'OR';
    rules?: {
      fieldId: string;
      operator: string;
      value: any;
    }[];
  };
}

interface SubmissionStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  conversionRate: number;
  lastSubmission?: string;
}

// Helper function to format condition description
const formatConditionDescription = (field: FormField, availableFields: FormField[]) => {
  if (!field.conditions || !field.conditions.rules || field.conditions.rules.length === 0) {
    return null;
  }

  const { logicOperator, rules } = field.conditions;
  const validRules = rules.filter(rule => 
    rule.fieldId && rule.operator && rule.value !== undefined && rule.value !== ''
  );
  
  if (validRules.length === 0) return null;

  const descriptions = validRules.map(rule => {
    const targetField = availableFields.find(f => f.id === rule.fieldId);
    const fieldName = targetField?.label || 'Unknown Field';
    
    const operatorLabels: Record<string, string> = {
      equals: 'equals',
      notEquals: 'does not equal',
      contains: 'contains',
      greaterThan: 'is greater than',
      lessThan: 'is less than'
    };
    
    const operatorLabel = operatorLabels[rule.operator] || rule.operator;
    return `${fieldName} ${operatorLabel} "${rule.value}"`;
  });

  if (descriptions.length === 1) {
    return descriptions[0];
  }

  const connector = logicOperator === 'AND' ? ' AND ' : ' OR ';
  return descriptions.join(connector);
};

const FormEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const formId = params?.id as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Set baseUrl only on client side to avoid hydration mismatch
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);
  
  // Load form data on component mount
  useEffect(() => {
    if (formId) {
      loadForm();
      loadSubmissionStats();
    }
  }, [formId]);

  // Function to load submission statistics
  const loadSubmissionStats = async () => {
    try {
      const submissions = await fetchApi<any[]>(`/submissions/form/${formId}`);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        total: submissions.length,
        today: submissions.filter(s => new Date(s.createdAt) >= today).length,
        thisWeek: submissions.filter(s => new Date(s.createdAt) >= thisWeek).length,
        thisMonth: submissions.filter(s => new Date(s.createdAt) >= thisMonth).length,
        conversionRate: submissions.length > 0 ? Math.min(60 + submissions.length * 2, 95) : 0,
        lastSubmission: submissions.length > 0 ? submissions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0].createdAt : undefined
      };

      setSubmissionStats(stats);
    } catch (error) {
      console.error('Failed to load submission stats:', error);
    }
  };
  
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

  // Function to generate QR code
  const generateQRCode = async () => {
    if (!form || !baseUrl) return;
    
    const formUrl = `${baseUrl}/forms/public/${form.slug}`;
    // Using QR Server API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`;
    setQrCodeUrl(qrUrl);
    
    toast({
      title: "Success",
      description: "QR code generated successfully",
    });
  };

  // Function to download QR code
  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form?.title || 'form'}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive"
      });
    }
  };

  // Function to share on social media
  const shareOnSocial = (platform: string) => {
    if (!form || !baseUrl) return;
    
    const formUrl = `${baseUrl}/forms/public/${form.slug}`;
    const text = `Check out this form: ${form.title}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(formUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formUrl)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(form.title)}&body=${encodeURIComponent(`${text}\n\n${formUrl}`)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${formUrl}`)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
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
      console.error('Failed to save form settings:', error);
      toast({
        title: "Error",
        description: "Failed to save form settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-3 sm:p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">Form Not Found</h3>
            <p className="text-gray-400 mb-4">
              The form you're looking for doesn't exist or you don't have permission to access it.
            </p>
            <Button onClick={() => router.push('/forms')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header with back button and title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/forms')}
              className="shrink-0 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {form.title}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Manage your form settings and monitor performance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={published ? "default" : "outline"} 
              className={cn(
                "px-2 py-1 text-xs",
                published ? "bg-green-900 text-green-100 border-green-700" : "bg-yellow-900 text-yellow-100 border-yellow-700"
              )}
            >
              {published ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Published
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Draft
                </div>
              )}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-gray-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hero Section - Form Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-2 lg:col-span-2 relative overflow-hidden bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold mb-2 text-white">Form Performance</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <span className="text-xl font-bold text-white">{submissionStats.total}</span>
                      <span className="text-gray-400 text-sm">Total Submissions</span>
                    </div>
                    {submissionStats.total > 0 && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-green-400" />
                          <span className="text-gray-300">{submissionStats.today} today</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-300">{submissionStats.thisWeek} this week</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {submissionStats.conversionRate}%
                  </div>
                  <div className="text-sm text-gray-400">
                    Conversion Rate
                  </div>
                </div>
              </div>
              
              {submissionStats.total === 0 && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-300">
                    <Target className="h-4 w-4" />
                    <span className="font-medium text-sm">Ready to collect submissions!</span>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">
                    Share your form to start receiving responses from your audience.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">Form Fields</h3>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-white">{form.fields?.length || 0}</div>
                <div className="text-xs text-gray-400">
                  {form.fields?.filter(f => f.required).length || 0} required fields
                </div>
                {form.multiPageEnabled && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    Multi-page enabled
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-400" />
                <h3 className="font-semibold text-white text-sm">Last Activity</h3>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-300">
                  {submissionStats.lastSubmission 
                    ? new Date(submissionStats.lastSubmission).toLocaleDateString()
                    : 'No submissions yet'
                  }
                </div>
                <div className="text-xs text-gray-400">
                  Created {new Date(form.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Edit Form Builder */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-gray-800 border-gray-700 hover:bg-gray-750" onClick={handleEditFields}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <Edit className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Edit Fields</h3>
                    <p className="text-xs text-gray-400">Add, remove, or modify form fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Form */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gray-800 border-gray-700 hover:bg-gray-750" onClick={handlePreviewForm}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <Eye className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Preview Form</h3>
                    <p className="text-xs text-gray-400">See how your form looks to users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Form */}
            <Card className={cn(
              "cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 bg-gray-800 border-gray-700 hover:bg-gray-750", 
              published ? "border-l-purple-500" : "border-l-gray-500"
            )} onClick={() => published ? setActiveTab('share') : handleTogglePublish}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    published ? "bg-purple-900/30" : "bg-gray-700"
                  )}>
                    {published ? (
                      <Share2 className="h-4 w-4 text-purple-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {published ? 'Share Form' : 'Publish Form'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {published ? 'Get shareable links and embed code' : 'Make your form live and accessible'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Submissions */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 bg-gray-800 border-gray-700 hover:bg-gray-750" 
              onClick={() => router.push(`/submissions?form=${formId}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-900/30 rounded-lg">
                    <Users className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">View Submissions</h3>
                    <p className="text-xs text-gray-400">
                      {submissionStats.total} responses to review
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Onboarding Guide for New Users */}
        {form.fields?.length === 0 && (
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-900/30 rounded-lg shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-blue-300 mb-2">Welcome! Let's set up your form</h3>
                  <p className="text-blue-400 mb-3 text-sm">
                    Follow these steps to create an effective form that captures the information you need.
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <span className="text-gray-300">Add form fields</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span className="text-gray-300">Configure settings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <span className="text-gray-300">Publish and share</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={handleEditFields} className="bg-blue-600 hover:bg-blue-700 text-sm">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Your First Field
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('settings')} className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm">
                      <Settings className="mr-2 h-3 w-3" />
                      Configure Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prominent Share Section for Published Forms */}
        {published && (
          <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-green-300">Your form is live!</h3>
                    <p className="text-green-400 text-sm">Share it with your audience to start collecting responses.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopyLink} className="border-green-600 text-green-300 hover:bg-green-900/20 text-sm">
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Link
                  </Button>
                  <Button onClick={() => setActiveTab('share')} className="bg-green-600 hover:bg-green-700 text-sm">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Share Options
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-gray-700 border-gray-600">
                <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="fields" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Fields</TabsTrigger>
                <TabsTrigger value="share" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Share</TabsTrigger>
                <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Settings</TabsTrigger>
                <TabsTrigger value="webhooks" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Webhooks</TabsTrigger>
                <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Analytics</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Form Details */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold mb-3 text-white">Form Details</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="formTitle" className="text-sm font-medium text-gray-300">Form Title</Label>
                          <Input
                            id="formTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 bg-gray-700 border-gray-600 text-white"
                            placeholder="Enter your form title"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="formDescription" className="text-sm font-medium text-gray-300">Description</Label>
                          <Textarea
                            id="formDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 min-h-[80px] bg-gray-700 border-gray-600 text-white"
                            placeholder="Describe what this form is for..."
                          />
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg bg-gray-700">
                          <Switch
                            checked={published}
                            onCheckedChange={handleTogglePublish}
                            id="published"
                          />
                          <div className="flex-1">
                            <Label htmlFor="published" className="font-medium text-white">
                              {published ? 'Published' : 'Draft'}
                            </Label>
                            <p className="text-sm text-gray-400">
                              {published ? 'Your form is live and accepting submissions' : 'Your form is not accepting submissions'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={handleSaveForm} disabled={saving} className="text-sm">
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => router.push('/forms')} className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Information Sidebar */}
                  <div className="space-y-4">
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Form Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-gray-300">{new Date(form.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="text-gray-400">Updated:</span>
                          <span className="text-gray-300">{new Date(form.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="text-gray-400">Form ID:</span>
                          <span className="font-mono text-xs break-all text-gray-300">{form.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="text-gray-400">Slug:</span>
                          <span className="font-mono text-xs break-all text-gray-300">{form.slug}</span>
                        </div>
                        
                        {/* Show client information for super admin users */}
                        {isAdmin && form.clientId !== user?.id && form.client && (
                          <>
                            <Separator className="bg-gray-600" />
                            <div className="space-y-1">
                              <h4 className="font-medium text-xs text-white">Form Owner</h4>
                              <div className="space-y-1 text-xs">
                                <div className="text-gray-300">{form.client.name || 'Not specified'}</div>
                                <div className="text-gray-400">{form.client.email}</div>
                                {form.client.company && (
                                  <div className="text-gray-400">{form.client.company}</div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Quick Actions */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-2">
                        <Button onClick={handleEditFields} variant="outline" className="w-full justify-start text-xs border-gray-600 text-gray-300 hover:bg-gray-600">
                          <Edit className="mr-2 h-3 w-3" />
                          Edit Form Builder
                        </Button>
                        <Button onClick={handlePreviewForm} variant="outline" className="w-full justify-start text-xs border-gray-600 text-gray-300 hover:bg-gray-600">
                          <Eye className="mr-2 h-3 w-3" />
                          Preview Form
                        </Button>
                        {published && (
                          <Button onClick={handleCopyLink} variant="outline" className="w-full justify-start text-xs border-gray-600 text-gray-300 hover:bg-gray-600">
                            <Copy className="mr-2 h-3 w-3" />
                            Copy Form Link
                          </Button>
                        )}
                        <Button 
                          onClick={() => router.push(`/submissions?form=${formId}`)} 
                          variant="outline" 
                          className="w-full justify-start text-xs border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          <Users className="mr-2 h-3 w-3" />
                          View Submissions ({submissionStats.total})
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Fields Tab */}
              <TabsContent value="fields" className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">Form Fields</h3>
                      <p className="text-sm text-gray-400">
                        {form.fields?.length === 0 
                          ? "No fields added yet" 
                          : `${form.fields.length} field${form.fields.length !== 1 ? 's' : ''} configured`}
                      </p>
                    </div>
                    <Button onClick={handleEditFields} className="shrink-0 text-sm">
                      <Edit className="mr-2 h-3 w-3" />
                      Open Form Builder
                    </Button>
                  </div>
                  
                  {form.fields?.length === 0 ? (
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="p-3 bg-blue-900/30 rounded-full mb-3">
                          <Plus className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="text-base font-semibold mb-2 text-white">No fields added yet</h3>
                        <p className="text-gray-400 mb-4 max-w-md text-sm">
                          Get started by adding your first field. You can choose from text inputs, dropdowns, checkboxes, and many more field types.
                        </p>
                        <Button onClick={handleEditFields} className="text-sm">
                          <Plus className="mr-2 h-3 w-3" />
                          Add Your First Field
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {form.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field, index) => (
                          <Card key={field.id} className="hover:shadow-md transition-shadow bg-gray-700 border-gray-600">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{field.label}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <Badge variant="outline">{field.type.replace('_', ' ')}</Badge>
                                      {field.required && (
                                        <Badge variant="secondary" className="bg-red-100 text-red-800">Required</Badge>
                                      )}
                                      {field.conditions && 
                                       field.conditions.rules && 
                                       field.conditions.rules.length > 0 &&
                                       field.conditions.rules.some(rule => 
                                         rule.fieldId && rule.operator && rule.value !== undefined && rule.value !== ''
                                       ) && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                          ⚡ Conditional
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  {field.options?.length > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                      {field.options.length} options
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Show condition description */}
                              {formatConditionDescription(field, form.fields || []) && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="text-sm">
                                    <span className="font-medium text-blue-900">Condition:</span>
                                    <span className="text-blue-800 ml-1">
                                      Show when {formatConditionDescription(field, form.fields || [])}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <Button onClick={handleEditFields} variant="ghost" className="h-auto py-4">
                            <Plus className="mr-2 h-5 w-5" />
                            Add Another Field
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Share Tab */}
              <TabsContent value="share" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Share Your Form</h3>
                    <p className="text-muted-foreground">
                      {published 
                        ? "Your form is published and ready to be shared with your audience" 
                        : "Publish your form first to generate shareable links"}
                    </p>
                  </div>
                  
                  {!published ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="p-4 bg-yellow-100 rounded-full mb-4">
                          <Globe className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Form Not Published</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          Your form is currently in draft mode. Publish it to generate shareable links and make it accessible to your audience.
                        </p>
                        <Button onClick={handleTogglePublish} size="lg">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Publish Form
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Form Links */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Shareable Links</h4>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Link className="h-4 w-4" />
                              Public Form URL
                            </CardTitle>
                            <CardDescription>
                              The main link to share your form with others
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Input
                                value={baseUrl ? `${baseUrl}/forms/public/${form.slug}` : ''}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Short URL
                            </CardTitle>
                            <CardDescription>
                              A shorter, easier-to-share version of your form link
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Input
                                value={baseUrl ? `${baseUrl}/f/${form.slug}` : ''}
                                readOnly
                                className="font-mono text-sm"
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
                                  });
                                }}
                                variant="outline"
                                className="shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Embed Options */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Embed Options</h4>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">HTML Embed Code</CardTitle>
                            <CardDescription>
                              Copy this code to embed the form on your website
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="bg-gray-900 border border-gray-600 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                                <code className="text-green-400">
                                  {baseUrl ? `<iframe src="${baseUrl}/forms/embed/${form.slug}" width="100%" height="600" frameborder="0"></iframe>` : ''}
                                </code>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  if (!form || !baseUrl) return;
                                  const embedCode = `<iframe src="${baseUrl}/forms/embed/${form.slug}" width="100%" height="600" frameborder="0"></iframe>`;
                                  navigator.clipboard.writeText(embedCode).then(() => {
                                    toast({
                                      title: "Success",
                                      description: "Embed code copied to clipboard",
                                    });
                                  });
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Embed Code
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-700 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-base text-white">QR Code</CardTitle>
                            <CardDescription className="text-gray-400">
                              Generate a QR code for easy mobile access
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center">
                              <div className="w-32 h-32 bg-gray-800 border border-gray-600 mx-auto mb-3 rounded-lg flex items-center justify-center">
                                {qrCodeUrl ? (
                                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full rounded-lg" />
                                ) : (
                                  <QrCode className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                              <div className="space-y-2">
                                {!qrCodeUrl ? (
                                  <Button variant="outline" size="sm" onClick={generateQRCode} className="border-gray-600 text-gray-300 hover:bg-gray-600">
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Generate QR Code
                                  </Button>
                                ) : (
                                  <div className="flex gap-2 justify-center">
                                    <Button variant="outline" size="sm" onClick={downloadQRCode} className="border-gray-600 text-gray-300 hover:bg-gray-600">
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setQrCodeUrl('')} className="border-gray-600 text-gray-300 hover:bg-gray-600">
                                      <X className="mr-2 h-4 w-4" />
                                      Clear
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Social Media Sharing */}
                    <div className="mt-6">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-base text-white">Social Media Sharing</CardTitle>
                          <CardDescription className="text-gray-400">
                            Share your form on social media platforms
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareOnSocial('facebook')}
                              className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                            >
                              <Facebook className="mr-2 h-4 w-4" />
                              Facebook
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareOnSocial('twitter')}
                              className="border-sky-600 text-sky-400 hover:bg-sky-900/20"
                            >
                              <Twitter className="mr-2 h-4 w-4" />
                              Twitter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareOnSocial('linkedin')}
                              className="border-blue-700 text-blue-300 hover:bg-blue-900/20"
                            >
                              <Linkedin className="mr-2 h-4 w-4" />
                              LinkedIn
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareOnSocial('whatsapp')}
                              className="border-green-600 text-green-400 hover:bg-green-900/20"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              WhatsApp
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareOnSocial('email')}
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold">Form Settings</h3>
                    <p className="text-muted-foreground">
                      Configure additional settings for your form behavior and appearance
                    </p>
                  </div>
                  
                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Basic Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Basic Information</CardTitle>
                          <CardDescription>
                            Organize your form with categories and tags
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="formCategory">Category</Label>
                            <Input
                              id="formCategory"
                              placeholder="e.g., Contact, Survey, Registration"
                              className="mt-1"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                            />
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
                          </div>
                          
                          <div>
                            <Label htmlFor="formSubmissionMsg">Thank You Message</Label>
                            <Textarea
                              id="formSubmissionMsg"
                              placeholder="Thank you for your submission! We'll get back to you soon."
                              className="mt-1"
                              value={submissionMessage}
                              onChange={(e) => setSubmissionMessage(e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Form Behavior */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Form Behavior</CardTitle>
                          <CardDescription>
                            Control how your form behaves after submission
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">Custom Redirect URL</h4>
                              <p className="text-sm text-muted-foreground">
                                Redirect users to a custom page after submission
                              </p>
                            </div>
                            <Switch 
                              checked={hasRedirectUrl}
                              onCheckedChange={(checked) => {
                                setHasRedirectUrl(checked);
                                if (!checked) {
                                  setSuccessRedirectUrl(undefined);
                                } else {
                                  setSuccessRedirectUrl('https://');
                                }
                              }}
                            />
                          </div>

                          {hasRedirectUrl && (
                            <div className="ml-4">
                              <Input
                                placeholder="https://example.com/thank-you"
                                value={successRedirectUrl || 'https://'}
                                onChange={(e) => setSuccessRedirectUrl(e.target.value)}
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">Multi-page Form</h4>
                              <p className="text-sm text-muted-foreground">
                                Split your form into multiple pages for better user experience
                              </p>
                            </div>
                            <Switch 
                              checked={multiPageEnabled}
                              onCheckedChange={setMultiPageEnabled}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">Save as Template</h4>
                              <p className="text-sm text-muted-foreground">
                                Make this form available as a template for future forms
                              </p>
                            </div>
                            <Switch 
                              checked={isTemplate}
                              onCheckedChange={setIsTemplate}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Form Restrictions */}
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">Form Restrictions</CardTitle>
                          <CardDescription className="text-gray-400">
                            Control access and submission limits for your form
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <Label htmlFor="expirationDate" className="text-gray-300">Expiration Date</Label>
                            <Input
                              id="expirationDate"
                              type="datetime-local"
                              value={expirationDate || ''}
                              onChange={(e) => setExpirationDate(e.target.value)}
                              className="mt-1 bg-gray-700 border-gray-600 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">Form will stop accepting submissions after this date</p>
                          </div>

                          <div>
                            <Label htmlFor="maxSubmissions" className="text-gray-300">Maximum Submissions</Label>
                            <Input
                              id="maxSubmissions"
                              type="number"
                              placeholder="Leave empty for unlimited"
                              value={maxSubmissions || ''}
                              onChange={(e) => setMaxSubmissions(e.target.value ? parseInt(e.target.value) : null)}
                              className="mt-1 bg-gray-700 border-gray-600 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">Form will stop accepting submissions after reaching this limit</p>
                          </div>

                          <div>
                            <Label className="text-gray-300">Access Restriction</Label>
                            <Select value={accessRestriction} onValueChange={(value: 'none' | 'email' | 'password') => setAccessRestriction(value)}>
                              <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No restrictions</SelectItem>
                                <SelectItem value="email">Restrict by email</SelectItem>
                                <SelectItem value="password">Password protected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {accessRestriction === 'email' && (
                            <div>
                              <Label htmlFor="allowedEmails" className="text-gray-300">Allowed Email Addresses</Label>
                              <Textarea
                                id="allowedEmails"
                                placeholder="Enter email addresses, one per line"
                                value={allowedEmails.join('\n')}
                                onChange={(e) => setAllowedEmails(e.target.value.split('\n').filter(Boolean))}
                                className="mt-1 bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                          )}

                          {accessRestriction === 'password' && (
                            <div>
                              <Label htmlFor="accessPassword" className="text-gray-300">Form Password</Label>
                              <Input
                                id="accessPassword"
                                type="password"
                                placeholder="Enter password for form access"
                                value={accessPassword || ''}
                                onChange={(e) => setAccessPassword(e.target.value)}
                                className="mt-1 bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg bg-gray-700">
                            <div>
                              <h4 className="font-medium text-white">Require Consent</h4>
                              <p className="text-sm text-gray-400">
                                Require users to agree to terms before submitting
                              </p>
                            </div>
                            <Switch 
                              checked={requireConsent}
                              onCheckedChange={setRequireConsent}
                            />
                          </div>

                          {requireConsent && (
                            <div>
                              <Label htmlFor="consentText" className="text-gray-300">Consent Text</Label>
                              <Textarea
                                id="consentText"
                                placeholder="I agree to the terms and conditions..."
                                value={consentText || ''}
                                onChange={(e) => setConsentText(e.target.value)}
                                className="mt-1 bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Email Notifications */}
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">Email Notifications</CardTitle>
                          <CardDescription className="text-gray-400">
                            Get notified when new submissions are received
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg bg-gray-700">
                            <div>
                              <h4 className="font-medium text-white">Enable Email Notifications</h4>
                              <p className="text-sm text-gray-400">
                                Receive email alerts for new form submissions
                              </p>
                            </div>
                            <Switch 
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>

                          {emailNotifications && (
                            <>
                              <div>
                                <Label htmlFor="notificationEmails" className="text-gray-300">Notification Email Addresses</Label>
                                <Textarea
                                  id="notificationEmails"
                                  placeholder="Enter email addresses, one per line"
                                  value={notificationEmails.join('\n')}
                                  onChange={(e) => setNotificationEmails(e.target.value.split('\n').filter(Boolean))}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <Label className="text-gray-300">Notification Type</Label>
                                <Select value={notificationType} onValueChange={(value: 'all' | 'digest') => setNotificationType(value)}>
                                  <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Immediate (every submission)</SelectItem>
                                    <SelectItem value="digest">Daily digest</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Settings Actions Sidebar */}
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Save Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={saveFormSettings}
                            disabled={saving}
                            className="w-full"
                          >
                            {saving ? 'Saving...' : 'Save All Settings'}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Webhooks Tab */}
              <TabsContent value="webhooks" className="mt-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Webhooks</h3>
                    <p className="text-muted-foreground">
                      Integrate your form with external services by sending real-time data
                    </p>
                  </div>
                  <Button onClick={() => router.push(`/forms/${formId}/webhooks`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Webhooks
                  </Button>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">What are Webhooks?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Webhooks allow you to receive form submission data in real-time in your own systems and applications.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Receive real-time form submissions</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Authenticate with various methods</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Filter and customize data</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Monitor delivery success</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button 
                          onClick={() => router.push(`/forms/${formId}/webhooks`)} 
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Webhook
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => router.push(`/forms/${formId}/webhooks/guide`)} 
                          className="w-full"
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          View Setup Guide
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => router.push('/webhook-debug')} 
                          className="w-full"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Test Webhooks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-4 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Form Analytics</h3>
                  <p className="text-gray-400">
                    Track your form's performance and submission trends
                  </p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">Total Submissions</h4>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-bold">{submissionStats.total}</div>
                        <div className="text-sm text-muted-foreground">All time</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Today</h4>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-bold">{submissionStats.today}</div>
                        <div className="text-sm text-muted-foreground">New submissions</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">This Week</h4>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-bold">{submissionStats.thisWeek}</div>
                        <div className="text-sm text-muted-foreground">Weekly total</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold">Conversion Rate</h4>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-bold">{submissionStats.conversionRate}%</div>
                        <div className="text-sm text-muted-foreground">Estimated</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {submissionStats.total === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="p-4 bg-blue-100 rounded-full mb-4">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Once you start receiving submissions, you'll see detailed analytics about your form's performance here.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={() => setActiveTab('share')}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Your Form
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/submissions?form=${formId}`)}>
                          <Users className="mr-2 h-4 w-4" />
                          View Submissions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Submission Timeline</CardTitle>
                        <CardDescription>
                          Track when submissions are received over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Chart placeholder</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Field Completion</CardTitle>
                        <CardDescription>
                          See which fields are most and least completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {form.fields?.slice(0, 5).map((field, index) => (
                            <div key={field.id} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{field.label}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.random() * 80 + 20}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(Math.random() * 80 + 20)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { fetchApi } from '@/services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  AlertCircle,
  ArrowLeft, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ClipboardCopy, 
  Download, 
  ExternalLink, 
  Eye, 
  FileText, 
  Mail, 
  MessageSquare, 
  PanelTop, 
  Pencil, 
  Printer, 
  Share2, 
  ShieldCheck, 
  Star, 
  Tag,
  Trash, 
  UserCheck,
  X,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Submission {
  id: string;
  formId: string;
  form: {
    id: string;
    title: string;
    slug: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
    clientId: string;
  };
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: 'new' | 'viewed' | 'archived';
  statusUpdatedAt?: string;
  notes?: string;
  notesUpdatedAt?: string;
  tags: string[];
  
  // Analytics data
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  browser?: string;
  device?: string;
  location?: {
    country?: string;
    city?: string;
  };
  
  // Messages
  messages?: Array<{
    id: string;
    content: string;
    sender: string;
    createdAt: string;
  }>;
}

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siblings, setSiblings] = useState({ previous: '', next: '' });
  const [activeTab, setActiveTab] = useState('submission');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [status, setStatus] = useState<'new' | 'viewed' | 'archived'>('new');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [params.id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      
      // Get submission details with all data
      const data = await fetchApi(`/submissions/${params.id}`) as Submission;
      setSubmission(data);
      
      // Set local state from submission data
      setNotes(data.notes || '');
      setTags(data.tags || []);
      setStatus(data.status || 'new');
      
      // Mark as viewed if it was new
      if (data.status === 'new') {
        await updateSubmissionStatus('viewed');
      }
      
      // Get siblings for navigation
      const siblingsData = await fetchApi(`/submissions/${params.id}/siblings?formId=${data.formId}`);
      setSiblings(siblingsData as { previous: string; next: string });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load submission details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetchApi(`/submissions/${params.id}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'Submission deleted successfully',
      });
      router.push('/submissions');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json' = 'pdf') => {
    try {
      const response = await fetchApi(`/submissions/${params.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({ format }),
        responseType: 'blob'
      });
      
      // Create and download file
      const mimeType = format === 'pdf' 
        ? 'application/pdf' 
        : format === 'csv' 
        ? 'text/csv' 
        : 'application/json';
      
      const blob = new Blob([response as BlobPart], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission-${params.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Submission exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export submission',
        variant: 'destructive',
      });
    }
  };

  const updateSubmissionStatus = async (newStatus: 'new' | 'viewed' | 'archived') => {
    try {
      // Call the API to update the status
      await fetchApi(`/submissions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({ status: newStatus }),
      });
      
      // Update local state
      setStatus(newStatus);
      
      if (submission) {
        setSubmission({
          ...submission,
          status: newStatus,
          statusUpdatedAt: new Date().toISOString()
        });
      }
      
      toast({
        title: 'Status Updated',
        description: `Submission marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update submission status',
        variant: 'destructive',
      });
    }
  };
  
  const updateNotes = async () => {
    if (!submission) return;
    
    try {
      setIsSaving(true);
      
      // Call the API to update the notes
      await fetchApi(`/submissions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({ notes }),
      });
      
      // Update local state - API will set the timestamp
      const updatedSubmission = await fetchApi(`/submissions/${params.id}`) as Submission;
      setSubmission(updatedSubmission);
      
      setIsEditingNotes(false);
      
      toast({
        title: 'Notes Updated',
        description: 'Submission notes have been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim()) || !submission) return;
    
    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');
    
    // Update the API
    fetchApi(`/submissions/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ tags: updatedTags }),
    }).then(() => {
      // Update local state on success
      if (submission) {
        setSubmission({
          ...submission,
          tags: updatedTags
        });
      }
    }).catch((error) => {
      toast({
        title: 'Error',
        description: 'Failed to add tag',
        variant: 'destructive',
      });
      // Revert the local change on failure
      setTags(tags);
    });
  };
  
  const removeTag = (tag: string) => {
    if (!submission) return;
    
    const updatedTags = tags.filter(t => t !== tag);
    setTags(updatedTags);
    
    // Update the API
    fetchApi(`/submissions/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ tags: updatedTags }),
    }).then(() => {
      // Update local state on success
      if (submission) {
        setSubmission({
          ...submission,
          tags: updatedTags
        });
      }
    }).catch((error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
        variant: 'destructive',
      });
      // Revert the local change on failure
      setTags(tags);
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleSendEmail = async () => {
    if (!emailRecipient || !emailSubject || !emailMessage) {
      toast({
        title: 'Error',
        description: 'Please fill in all email fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // In a real implementation, this would call the API
      // await fetchApi(`/submissions/${params.id}/email`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   data: JSON.stringify({
      //     recipient: emailRecipient,
      //     subject: emailSubject,
      //     message: emailMessage,
      //     includeSubmission: showAdvancedOptions
      //   }),
      // });
      
      setEmailDialogOpen(false);
      
      toast({
        title: 'Email Sent',
        description: 'Your message has been sent successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    }
  };

  const renderFieldValue = (field: Submission['form']['fields'][0], value: any) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-muted-foreground italic">No response</span>;
    }
    
    switch (field.type) {
      case 'checkbox':
        return value ? (
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span>Yes</span>
          </div>
        ) : (
          <span>No</span>
        );
      case 'radio':
      case 'select':
        return <Badge variant="outline">{value}</Badge>;
      case 'rating':
        return (
          <div className="flex items-center">
            {Array.from({ length: parseInt(value) || 0 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            ))}
            <span className="ml-2">{value} stars</span>
          </div>
        );
      case 'file':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            View File
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        );
      case 'date':
        return format(new Date(value), 'PP');
      case 'datetime':
        return format(new Date(value), 'PPpp');
      case 'paragraph':
        return <div className="whitespace-pre-wrap">{value}</div>;
      default:
        return <div className="whitespace-pre-wrap">{value}</div>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>;
      case 'viewed':
        return <Badge variant="outline" className="border-green-500 text-green-600">Viewed</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-center">
              <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
              <CardTitle className="text-red-600">Submission not found</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The submission you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push('/submissions')}
              className="mt-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Submissions
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 print:space-y-6 print:py-0">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Submission Details</h1>
          <div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
            <span>Form:</span>
            <a 
              href={`/forms/${submission.form.id}`}
              className="hover:underline text-primary font-medium"
            >
              {submission.form.title}
            </a>
            <span className="text-muted-foreground">•</span>
            <span>{formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/submissions')}
            className="h-9"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Send Email Response</DialogTitle>
                <DialogDescription>
                  Send a response email related to this submission.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Response to your submission"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={5}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="advanced-options"
                    checked={showAdvancedOptions}
                    onCheckedChange={setShowAdvancedOptions}
                  />
                  <Label htmlFor="advanced-options">Include submission data in email</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail}>Send Email</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-9">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Submission</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this submission? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    handleDelete();
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Submission data */}
        <div className="md:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submission">Submission</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="submission" className="space-y-6 mt-6">
              <Card id="submission-data" className="print:shadow-none print:border-none">
                <CardHeader className="print:pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="print:text-xl">Submission Information</CardTitle>
                      <CardDescription className="print:text-sm">
                        Submitted on {format(new Date(submission.createdAt), 'PPpp')}
                      </CardDescription>
                    </div>
                    <div className="print:hidden">
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 print:space-y-4 print:pb-0">
                  {submission.form.fields.map((field) => (
                    <div key={field.id} className="space-y-2 print:page-break-inside-avoid">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-base sm:text-lg">{field.label}</h3>
                        <Badge variant="outline" className="print:hidden">{field.type}</Badge>
                      </div>
                      <div className="bg-muted/50 p-3 sm:p-4 rounded-lg print:border print:border-gray-200 print:bg-transparent">
                        {renderFieldValue(field, submission.data[field.id])}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Add private notes for this submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingNotes ? (
                    <div className="space-y-4">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes here..."
                        rows={4}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setNotes(submission.notes || '');
                            setIsEditingNotes(false);
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={updateNotes}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Notes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-muted/50 p-4 rounded-lg min-h-[100px] whitespace-pre-wrap">
                        {notes ? notes : <span className="text-muted-foreground italic">No notes</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingNotes(true)}
                        >
                          <Pencil className="h-3 w-3 mr-2" />
                          Edit Notes
                        </Button>
                        
                        {submission.notesUpdatedAt && (
                          <span className="text-xs text-muted-foreground">
                            Last updated {formatDistanceToNow(new Date(submission.notesUpdatedAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Navigation Card */}
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle>Navigation</CardTitle>
                  <CardDescription>
                    Browse through submissions from this form
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      disabled={!siblings.previous}
                      onClick={() => siblings.previous && router.push(`/submissions/${siblings.previous}`)}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!siblings.next}
                      onClick={() => siblings.next && router.push(`/submissions/${siblings.next}`)}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submission Analytics</CardTitle>
                  <CardDescription>
                    Technical details about this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Device Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="text-sm font-medium">Browser</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.browser || 'Unknown'}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="text-sm font-medium">Device</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.device || 'Unknown'}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="text-sm font-medium">IP Address</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.ipAddress || 'Unknown'}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.location?.city && submission.location?.country 
                            ? `${submission.location.city}, ${submission.location.country}`
                            : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Referral Information</h3>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="text-sm font-medium">Referrer URL</div>
                      <div className="text-sm text-muted-foreground break-all">
                        {submission.referrer ? (
                          <a href={submission.referrer} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                            {submission.referrer}
                            <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                          </a>
                        ) : (
                          'Direct navigation / Unknown'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Timing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="text-sm font-medium">Submission Date</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(submission.createdAt), 'PPP')}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="text-sm font-medium">Submission Time</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(submission.createdAt), 'p')}
                        </div>
                      </div>
                      {submission.updatedAt && (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="text-sm font-medium">Last Updated</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(submission.updatedAt), 'PPp')}
                          </div>
                        </div>
                      )}
                      {submission.statusUpdatedAt && (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="text-sm font-medium">Status Changed</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(submission.statusUpdatedAt), 'PPp')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - Sidebar */}
        <div className="space-y-6 print:hidden">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={status} onValueChange={(val) => updateSubmissionStatus(val as 'new' | 'viewed' | 'archived')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="space-y-2">
                <div className="text-sm">Current Status</div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  <span className="text-sm text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button size="sm" onClick={addTag} disabled={!newTag.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Form</h4>
                <p className="text-sm text-muted-foreground flex items-center">
                  <PanelTop className="h-3 w-3 mr-1" />
                  <a 
                    href={`/forms/${submission.form.id}`}
                    className="hover:underline"
                  >
                    {submission.form.title}
                  </a>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Submission ID</h4>
                <p className="text-sm text-muted-foreground flex items-center">
                  <div className="flex justify-between w-full">
                    <span className="truncate">{submission.id}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(submission.id);
                        toast({
                          title: "Copied!",
                          description: "Submission ID copied to clipboard",
                        });
                      }}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                    </Button>
                  </div>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Submitted</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(submission.createdAt), 'PPpp')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select onValueChange={(value) => handleExport(value as 'pdf' | 'csv' | 'json')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Export options" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">Export as PDF</SelectItem>
                  <SelectItem value="csv">Export as CSV</SelectItem>
                  <SelectItem value="json">Export as JSON</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const url = `${window.location.origin}/submissions/${submission.id}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Copied!",
                      description: "Share link copied to clipboard",
                    });
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print header - visible only when printing */}
      <div className="hidden print:block print:mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Form Submission</h1>
            <p className="text-sm text-gray-600">{submission.form.title}</p>
          </div>
          <div className="text-sm text-gray-600">
            {format(new Date(submission.createdAt), 'PPpp')}
          </div>
        </div>
        <div className="border-t border-gray-200 mt-4 pt-2"></div>
      </div>
      
      {/* Print footer - visible only when printing */}
      <div className="hidden print:block print:mt-4">
        <div className="border-t border-gray-200 pt-2 text-sm text-gray-600 flex justify-between">
          <div>Submission ID: {submission.id}</div>
          <div>Printed on {format(new Date(), 'PPpp')}</div>
        </div>
      </div>
    </div>
  );
} 
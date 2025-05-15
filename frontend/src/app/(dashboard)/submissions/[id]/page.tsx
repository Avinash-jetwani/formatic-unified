'use client';

import { useEffect, useState, useRef } from 'react';
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
  Plus,
  Image,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { safeRenderFile, getFileUrl, normalizeFileObject, normalizeFileArray, isImageFile } from '@/lib/fileUtils';

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

// Image Gallery Modal Component
const ImageGallery = ({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex = 0 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  images: Array<{ url: string; name?: string; type?: string; size?: number }>; 
  initialIndex?: number 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  
  // Reset position when image changes or zoom resets
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);
  
  // Reset zoom when exiting fullscreen
  useEffect(() => {
    if (!isFullScreen && zoom !== 100) {
      setZoom(100);
      setPosition({ x: 0, y: 0 });
    }
  }, [isFullScreen]);
  
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);
  
  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  if (!isOpen || images.length === 0) return null;
  
  const currentImage = images[currentIndex];
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 20, 300));
  };
  
  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 20, 40);
      // If zooming back to 100%, reset position
      if (newZoom === 100) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };
  
  const resetZoom = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  
  // Mouse drag handlers for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      isDragging.current = true;
      lastPosition.current = { x: e.clientX, y: e.clientY };
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && zoom > 100) {
      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  const handleMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = zoom > 100 ? 'grab' : 'auto';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()} modal>
      <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-6xl sm:w-[90vw] h-[90vh] p-0 overflow-hidden bg-black/90 border-gray-800">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-3 flex justify-between items-center border-b border-gray-800 bg-gray-900/90">
            <div className="text-white flex items-center">
              <Image className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium truncate max-w-[150px] sm:max-w-md">
                {currentImage.name || `Image ${currentIndex + 1} of ${images.length}`}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800"
                onClick={resetZoom}
                aria-label="Reset zoom"
              >
                <div className="flex items-center text-white text-sm min-w-[40px] justify-center">
                  {zoom}%
                </div>
              </button>
              <button 
                className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800"
                onClick={handleZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800"
                onClick={toggleFullScreen}
                aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <a 
                className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800"
                href={currentImage.url}
                download={currentImage.name}
                aria-label="Download image"
              >
                <Download className="h-4 w-4" />
              </a>
              <DialogPrimitive.Close className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800" asChild>
                <button aria-label="Close gallery">
                  <X className="h-4 w-4" />
                </button>
              </DialogPrimitive.Close>
            </div>
          </div>
          
          {/* Image area */}
          <div 
            ref={containerRef}
            className="flex-1 flex justify-center items-center relative overflow-auto"
            style={{ cursor: zoom > 100 ? 'grab' : 'auto' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={currentImage.url} 
                alt={currentImage.name || `Image ${currentIndex + 1}`} 
                className="max-h-full max-w-full object-contain"
                style={{ 
                  transform: `scale(${zoom / 100}) translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging.current ? 'none' : 'transform 0.2s ease',
                  transformOrigin: 'center'
                }} 
                draggable={false}
              />
            </div>
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 p-3 bg-black/60 text-white rounded-full hover:bg-black/80"
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  className="absolute right-4 p-3 bg-black/60 text-white rounded-full hover:bg-black/80"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-800 bg-gray-900/90 flex justify-between items-center">
            <div className="text-white text-sm">
              {currentIndex + 1} of {images.length}
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={currentImage.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
              >
                Open in new tab
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Update the SafeFileDisplay component
const SafeFileDisplay = ({ 
  value, 
  openGallery 
}: { 
  value: any; 
  openGallery?: (images: Array<{ url: string; name?: string; type?: string; size?: number }>, startIndex?: number) => void;
}) => {
  console.log(`SafeFileDisplay - Initial received value - typeof value: ${typeof value}, isArray: ${Array.isArray(value)}`);
  const [normalizedFiles, setNormalizedFiles] = useState<Array<{
    url: string;
    key?: string;
    name?: string;
    type?: string;
    size?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Process files when component mounts or value changes
  useEffect(() => {
    const processFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Handle null/undefined
        if (value === undefined || value === null) {
          setNormalizedFiles([]);
          return;
        }
        
        // Use our utility functions to process the file data
        if (Array.isArray(value)) {
          // Use normalizeFileArray to ensure all file objects have the right format
          const files = await normalizeFileArray(value);
          setNormalizedFiles(files);
        } else {
          // Single file handling
          const fileObj = await normalizeFileObject(value);
          if (fileObj) {
            setNormalizedFiles([fileObj]);
          } else {
            setNormalizedFiles([]);
          }
        }
      } catch (err) {
        console.error("Error processing files:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    processFiles();
  }, [value]);
  
  try {
    // Handle loading state
    if (loading) {
      return <div className="py-4 text-center text-muted-foreground">Loading files...</div>;
    }
    
    // Handle error state
    if (error) {
      return (
        <div className="p-2 bg-red-50 rounded border border-red-200">
          <span className="text-red-600">Error processing files: {error.message}</span>
        </div>
      );
    }
    
    // Handle empty state
    if (normalizedFiles.length === 0) {
      return <span className="text-muted-foreground italic">No files</span>;
    }
    
    // We have successfully normalized files, now render them
    // Single file case
    if (normalizedFiles.length === 1 && !Array.isArray(value)) {
      const file = normalizedFiles[0];
      const { url, name, type, size } = file;
      const isImage = isImageFile(type || '') || isImageFile(name || '');
      
      if (isImage && openGallery) {
        return (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={url} 
                alt={name} 
                className="w-full max-h-[300px] object-contain rounded-lg border bg-white p-2 cursor-pointer"
                onClick={() => openGallery([file])}
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm font-medium truncate max-w-[70%]" title={name}>
                  {name}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openGallery([file])}
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Enlarge
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={url} download={name}>
                      <Download className="h-4 w-4 mr-1" />
                      Save
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // Non-image file or no gallery function
      return (
        <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">
                {type} • {size ? (size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-1" />
                View
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={url} download={name}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
      );
    }
    
    // Multiple files (array)
    // Filter image files and other files
    const imageFiles = normalizedFiles.filter(file => 
      isImageFile(file.type || '') || isImageFile(file.name || '')
    );
    const otherFiles = normalizedFiles.filter(file => 
      !isImageFile(file.type || '') && !isImageFile(file.name || '')
    );
    
    return (
      <div className="space-y-4">
        {/* Images grid */}
        {imageFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Images ({imageFiles.length})</h4>
              {imageFiles.length > 1 && openGallery && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openGallery(imageFiles)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Images
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {imageFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="relative group bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer"
                  onClick={() => openGallery && openGallery(imageFiles, index)}
                >
                  <div className="relative aspect-square">
                    <img 
                      src={file.url} 
                      alt={file.name || 'Uploaded image'} 
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <button
                          className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
                          title="View larger"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery && openGallery(imageFiles, index);
                          }}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <a 
                          href={file.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
                          title="Open in new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a
                          href={file.url}
                          download={file.name}
                          className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 text-sm">
                    <div className="font-medium truncate" title={file.name}>
                      {file.name || 'Image file'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown size')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Other files list */}
        {otherFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Other Files ({otherFiles.length})</h4>
            <div className="space-y-2">
              {otherFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-blue-500 mr-3" />
                    <div>
                      <div className="font-medium">{file.name || 'File'}</div>
                      <div className="text-xs text-muted-foreground">
                        {file.type || 'Unknown type'} • {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.url} download={file.name}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Summary and actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {normalizedFiles.length} {normalizedFiles.length === 1 ? 'file' : 'files'} uploaded
          </div>
          <div className="flex gap-2">
            {imageFiles.length > 0 && openGallery && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openGallery(imageFiles)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Download all files
                normalizedFiles.forEach(file => {
                  const link = document.createElement('a');
                  link.href = file.url;
                  link.download = file.name || 'download';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // Ultimate fallback for any errors
    console.error("Error in SafeFileDisplay:", error);
    return (
      <div className="p-2 bg-red-50 rounded border border-red-200">
        <span className="text-red-600">Error displaying file: {String(error)}</span>
      </div>
    );
  }
};

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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{ url: string; name?: string; type?: string; size?: number }>>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  const handleExport = async (format: 'pdf' | 'csv' | 'json' = 'csv') => {
    try {
      // Skip PDF exports for now since there's a backend issue
      if (format === 'pdf') {
        toast({
          title: 'PDF Export Unavailable',
          description: 'PDF export is currently unavailable. Please use CSV or JSON format instead.',
          variant: 'destructive',
        });
        return;
      }
      
      // Use window.open to directly download the file
      window.open(`/api/submissions/${params.id}/export?format=${format}`, '_blank');
      
      toast({
        title: 'Success',
        description: `Exporting submission as ${format.toUpperCase()}`,
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
      
      // Update local state
      setSubmission({
        ...submission,
        notes,
        notesUpdatedAt: new Date().toISOString()
      });
      
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

  // Function to open gallery with specified images and starting index
  const openGallery = (images: Array<{ url: string; name?: string; type?: string; size?: number }>, startIndex = 0) => {
    setGalleryImages(images);
    setGalleryIndex(startIndex);
    setGalleryOpen(true);
  };

  const renderFieldValue = (field: Submission['form']['fields'][0], value: any) => {
    console.log(`renderFieldValue - Processing Field ID: ${field.id}, Label: ${field.label}, Type: ${field.type}`); // DEBUG LOG 1
    console.log(`renderFieldValue - Initial Value for ${field.label}:`, JSON.stringify(value, null, 2)); // DEBUG LOG 2
    try {
      if (value === undefined || value === null || value === '') {
        console.log(`renderFieldValue - ${field.label} - Value is undefined, null, or empty. Returning 'No response'.`); // DEBUG LOG 3
        return <span className="text-muted-foreground italic">No response</span>;
      }
      
      // Add safety check for object rendering
      if (typeof value === 'object' && value !== null && !(Array.isArray(value)) && !(value instanceof Date)) {
        // If the object has a url property, use that for rendering
        if ('url' in value && typeof value.url === 'string') {
          // Continue with existing file handling below
        } else {
          console.warn('renderFieldValue - Object without URL for field:', field.label, value); // DEBUG LOG 4
          return <span className="text-muted-foreground italic">Invalid image format: {JSON.stringify(value)}</span>;
        }
      }
      
      console.log(`renderFieldValue - Just before switch for ${field.label} - field.type: '${field.type}'`); // DEBUG LOG PRE-SWITCH
      switch (field.type) {
        case 'CHECKBOX':
          return value ? (
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span>Yes</span>
            </div>
          ) : (
            <span>No</span>
          );
        case 'RADIO':
        case 'SELECT':
          return <Badge variant="outline">{String(value)}</Badge>;
        case 'RATING':
          return (
            <div className="flex items-center">
              {Array.from({ length: parseInt(value) || 0 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="ml-2">{value} stars</span>
            </div>
          );
        case 'FILE':
          // Use our SafeFileDisplay component for all file types
          console.log(`renderFieldValue - FILE type - typeof value before SafeFileDisplay: ${typeof value}, isArray: ${Array.isArray(value)}`); // DEBUG LOG 5 MODIFIED
          return <SafeFileDisplay value={value} openGallery={openGallery} />;
        case 'DATE':
          return format(new Date(value), 'PP');
        case 'DATETIME':
          return format(new Date(value), 'PPpp');
        case 'PARAGRAPH':
          return <div className="whitespace-pre-wrap">{String(value)}</div>;
        default:
          console.log(`renderFieldValue - ${field.label} - Fell into DEFAULT case. field.type: '${field.type}', value:`, value); // DEBUG LOG DEFAULT-CASE
          return <div className="whitespace-pre-wrap">{String(value)}</div>;
      }
    } catch (error) {
      console.error('Error rendering field:', { field, value, error });
      return (
        <div>
          <span className="text-red-500 italic">Error displaying this field</span>
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto">
            Field type: {field.type}, Error: {String(error)}
          </div>
        </div>
      );
    }
  };

  // Safe wrapper to render form fields
  const renderField = (field: Submission['form']['fields'][0], submission: Submission) => {
    try {
      return (
        <div key={field.id} className="space-y-2 print:page-break-inside-avoid">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base sm:text-lg">{field.label}</h3>
            <Badge variant="outline" className="print:hidden">{field.type}</Badge>
          </div>
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg print:border print:border-gray-200 print:bg-transparent">
            {renderFieldValue(field, submission.data[field.id])}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering field container:', { field, error });
      return (
        <div key={field.id} className="space-y-2 print:page-break-inside-avoid">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base sm:text-lg">{field.label}</h3>
            <Badge variant="outline" className="print:hidden">{field.type}</Badge>
          </div>
          <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
            <span className="text-red-500">Error displaying this field</span>
          </div>
        </div>
      );
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
          <Select onValueChange={(value) => handleExport(value as 'pdf' | 'csv' | 'json')}>
            <SelectTrigger className="w-[140px]">
              <Download className="mr-2 h-4 w-4" />
              Export As
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV File</SelectItem>
              <SelectItem value="json">JSON Data</SelectItem>
            </SelectContent>
          </Select>
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
                  {submission.form.fields.map((field) => renderField(field, submission))}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
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

      {/* Image gallery modal */}
      <ImageGallery 
        isOpen={galleryOpen} 
        onClose={() => setGalleryOpen(false)} 
        images={galleryImages} 
        initialIndex={galleryIndex} 
      />
    </div>
  );
} 
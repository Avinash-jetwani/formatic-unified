'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/services/api';

// Form and field interfaces
interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  multiPageEnabled: boolean;
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
  page: number;
}

const FormPreviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const formId = params?.id as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  
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
      
      // Initialize form values
      const initialValues: Record<string, any> = {};
      data.fields.forEach(field => {
        if (field.type === 'CHECKBOX') {
          initialValues[field.id] = [];
        } else {
          initialValues[field.id] = '';
        }
      });
      setFormValues(initialValues);
      
      // Set max page
      if (data.fields && data.fields.length > 0) {
        const maxPageNum = Math.max(...data.fields.map(f => f.page || 1));
        setMaxPage(maxPageNum);
      }
      
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
  
  // Function to handle input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Function to handle checkbox changes
  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setFormValues(prev => {
      const currentValues = [...(prev[fieldId] || [])];
      if (checked) {
        if (!currentValues.includes(option)) {
          currentValues.push(option);
        }
      } else {
        const index = currentValues.indexOf(option);
        if (index !== -1) {
          currentValues.splice(index, 1);
        }
      }
      return {
        ...prev,
        [fieldId]: currentValues
      };
    });
  };
  
  // Handle next page
  const handleNextPage = () => {
    if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  // Handle previous page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Function to render field based on type
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'TEXT':
        return (
          <Input
            id={field.id}
            placeholder={field.placeholder}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'LONG_TEXT':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'EMAIL':
        return (
          <Input
            type="email"
            id={field.id}
            placeholder={field.placeholder || 'email@example.com'}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'PHONE':
        return (
          <Input
            type="tel"
            id={field.id}
            placeholder={field.placeholder || '(123) 456-7890'}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'URL':
        return (
          <Input
            type="url"
            id={field.id}
            placeholder={field.placeholder || 'https://example.com'}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'NUMBER':
        return (
          <Input
            type="number"
            id={field.id}
            placeholder={field.placeholder || '0'}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            min={field.config?.min}
            max={field.config?.max}
            step={field.config?.step || 1}
          />
        );
        
      case 'DATE':
        return (
          <Input
            type="date"
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'TIME':
        return (
          <Input
            type="time"
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
        
      case 'DROPDOWN':
        return (
          <select
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="" disabled>{field.placeholder || 'Select an option'}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={(formValues[field.id] || []).includes(option)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(field.id, option, checked as boolean)
                  }
                />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
        
      case 'RADIO':
        return (
          <RadioGroup
            value={formValues[field.id] || ''}
            onValueChange={(value) => handleInputChange(field.id, value)}
          >
            {field.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'RATING':
        return (
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange(field.id, rating)}
                className={`text-2xl focus:outline-none ${
                  Number(formValues[field.id]) >= rating 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        );
        
      case 'SCALE':
      case 'SLIDER':
        const min = field.config?.min || 1;
        const max = field.config?.max || 10;
        const step = field.config?.step || 1;
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={field.id}
              min={min}
              max={max}
              step={step}
              value={formValues[field.id] || min}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}</span>
              <span>{Math.floor((min + max) / 2)}</span>
              <span>{max}</span>
            </div>
          </div>
        );
        
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };
  
  // Function to validate current page fields
  const validateCurrentPage = () => {
    if (!form?.fields) return true;
    
    const currentPageFields = getCurrentPageFields();
    
    for (const field of currentPageFields) {
      if (field.required) {
        const value = formValues[field.id];
        
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          toast({
            title: "Validation Error",
            description: `Please fill in the required field: ${field.label}`,
            variant: "destructive"
          });
          return false;
        }
        
        if (field.type === 'CHECKBOX' && Array.isArray(value) && value.length === 0) {
          toast({
            title: "Validation Error",
            description: `Please select at least one option for: ${field.label}`,
            variant: "destructive"
          });
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If multi-page form and not on last page, validate and go to next page
    if (form?.multiPageEnabled && currentPage < maxPage) {
      if (validateCurrentPage()) {
        handleNextPage();
      }
      return;
    }
    
    // Final validation before "submission"
    if (!validateCurrentPage()) {
      return;
    }
    
    toast({
      title: "Preview Only",
      description: "This is a preview mode. Form submissions are not processed in preview mode.",
    });
  };
  
  // Get fields for current page
  const getCurrentPageFields = () => {
    if (!form?.fields) return [];
    return form.fields
      .filter(field => (field.page || 1) === currentPage)
      .sort((a, b) => a.order - b.order);
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/forms/${formId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {loading ? <Skeleton className="h-8 w-48" /> : `Preview: ${form?.title || 'Untitled Form'}`}
            </h1>
            <div className="text-muted-foreground">
              {loading ? <Skeleton className="h-4 w-64 mt-1" /> : 'This is how your form will appear to users'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${formId}/builder`)}
          >
            Edit Fields
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${formId}`)}
          >
            Back to Form
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {loading ? (
        // Loading skeletons
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-3/4" />
          
          <div className="space-y-4">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
      ) : (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{form?.title || 'Untitled Form'}</CardTitle>
            {form?.description && <CardDescription>{form.description}</CardDescription>}
            
            {/* Page indicator for multi-page forms */}
            {form?.multiPageEnabled && maxPage > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span>Page {currentPage} of {maxPage}</span>
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: maxPage }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${
                        currentPage === i + 1 
                          ? "bg-primary" 
                          : "bg-muted"
                      }`} 
                    />
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {getCurrentPageFields().map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            {/* Previous page button (for multi-page forms) */}
            {form?.multiPageEnabled && currentPage > 1 && (
              <Button 
                type="button" 
                variant="outline"
                onClick={handlePrevPage}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
            
            {/* Next/Submit button */}
            <Button 
              type="submit" 
              onClick={handleSubmit}
              className={form?.multiPageEnabled && currentPage > 1 ? "" : "ml-auto"}
            >
              {form?.multiPageEnabled && currentPage < maxPage ? (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Submit (Preview Only)"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="max-w-3xl mx-auto bg-muted/30 p-4 rounded-md text-center text-sm text-muted-foreground">
        This is a preview of your form. Submissions in preview mode are not saved.
      </div>
    </div>
  );
};

export default FormPreviewPage; 
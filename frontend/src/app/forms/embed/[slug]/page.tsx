'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { FaStar } from 'react-icons/fa';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchApi } from '@/services/api';

// Form and field interfaces
interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  submissionMessage?: string;
  tags: string[];
  category?: string;
  isTemplate: boolean;
  successRedirectUrl?: string;
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
  conditions?: {
    logicOperator?: 'AND' | 'OR';
    rules?: {
      fieldId: string;
      operator: string;
      value: any;
    }[];
  };
}

// Simple toast component for embed to avoid dependencies
const Toast = ({ message, variant = 'default', onClose }: { message: string, variant?: 'default' | 'destructive', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md ${
      variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
    }`}>
      {message}
    </div>
  );
};

const FormEmbedPage = () => {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string, variant: 'default' | 'destructive' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldsVisible, setFieldsVisible] = useState<Record<string, boolean>>({});
  
  // Show toast message
  const showToast = (message: string, variant: 'default' | 'destructive' = 'default') => {
    setToast({ message, variant });
  };
  
  // Load form data on component mount - client-side only
  useEffect(() => {
    if (slug && typeof window !== 'undefined') {
      loadForm();
    }
  }, [slug]);
  
  // Function to load form data
  const loadForm = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Form>(`/forms/public/${slug}`);
      
      if (!data.published) {
        showToast("This form is not currently accepting submissions", "destructive");
        return;
      }
      
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
      
    } catch (error) {
      console.error('Failed to load form:', error);
      showToast("Failed to load form data", "destructive");
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
    
    // Clear error if value is provided
    if (value) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
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
      
      // Clear error if at least one option is selected
      if (currentValues.length > 0) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldId];
          return newErrors;
        });
      }
      
      return {
        ...prev,
        [fieldId]: currentValues
      };
    });
  };
  
  // Function to validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    form?.fields.forEach(field => {
      if (field.required) {
        const value = formValues[field.id];
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = 'This field is required';
          isValid = false;
        }
      }
      
      // Type-specific validation
      if (field.type === 'EMAIL' && formValues[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formValues[field.id])) {
          newErrors[field.id] = 'Please enter a valid email address';
          isValid = false;
        }
      }
      
      if (field.type === 'URL' && formValues[field.id]) {
        try {
          new URL(formValues[field.id]);
        } catch (e) {
          newErrors[field.id] = 'Please enter a valid URL';
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
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
            className={errors[field.id] ? 'border-destructive' : ''}
          />
        );
        
      case 'LONG_TEXT':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={errors[field.id] ? 'border-destructive' : ''}
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
            className={errors[field.id] ? 'border-destructive' : ''}
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
            className={errors[field.id] ? 'border-destructive' : ''}
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
            className={errors[field.id] ? 'border-destructive' : ''}
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
            className={errors[field.id] ? 'border-destructive' : ''}
          />
        );
        
      case 'DATE':
        return (
          <Input
            type="date"
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={errors[field.id] ? 'border-destructive' : ''}
          />
        );
        
      case 'TIME':
        return (
          <Input
            type="time"
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={errors[field.id] ? 'border-destructive' : ''}
          />
        );
        
      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            id={field.id}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={errors[field.id] ? 'border-destructive' : ''}
          />
        );
        
      case 'DROPDOWN':
        return (
          <div className="relative">
            <select
              id={field.id}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200 appearance-none pl-3 pr-10 py-2 cursor-pointer text-gray-900 dark:text-gray-100 dark:bg-gray-800"
              style={{ minHeight: 48 }}
            >
              <option value="" disabled style={{ color: '#888' }}>{field.placeholder || 'Select an option'}</option>
              {field.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
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
          <div className="flex space-x-2 items-center">
            {Array.from({ length: field.config?.max || 5 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleInputChange(field.id, index + 1)}
                className={
                  formValues[field.id] === index + 1
                    ? 'text-yellow-400 text-2xl scale-110'
                    : 'text-gray-400 text-2xl hover:text-yellow-300 hover:scale-105'
                }
                aria-label={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
              >
                <FaStar />
              </button>
            ))}
          </div>
        );
        
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };
  
  // Function to evaluate conditional logic for field visibility
  const evaluateCondition = (field: FormField): boolean => {
    // If no conditions, field is always visible
    if (!field.conditions || !field.conditions.rules || field.conditions.rules.length === 0) {
      return true;
    }

    const { logicOperator, rules } = field.conditions;
    
    // Evaluate each rule
    const results = rules.map(rule => {
      const { fieldId, operator, value } = rule;
      const fieldValue = formValues[fieldId];
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'contains':
          return fieldValue && typeof fieldValue === 'string' 
            ? fieldValue.includes(value) 
            : Array.isArray(fieldValue) 
              ? fieldValue.includes(value) 
              : false;
        case 'greaterThan':
          return parseFloat(fieldValue) > parseFloat(value);
        case 'lessThan':
          return parseFloat(fieldValue) < parseFloat(value);
        default:
          return false;
      }
    });
    
    // Apply logic operator
    return logicOperator === 'AND' 
      ? results.every(result => result) 
      : results.some(result => result);
  };
  
  // Update field visibility whenever form values change
  useEffect(() => {
    if (!form) return;
    
    const newVisibility: Record<string, boolean> = {};
    
    form.fields.forEach(field => {
      newVisibility[field.id] = evaluateCondition(field);
    });
    
    setFieldsVisible(newVisibility);
  }, [form, formValues]);
  
  // Handle next page button click
  const handleNextPage = () => {
    // Validate current page fields
    const currentPageFields = form?.fields.filter(f => f.page === currentPage && fieldsVisible[f.id]);
    const isCurrentPageValid = currentPageFields?.every(field => {
      if (field.required) {
        const value = formValues[field.id];
        return value && (typeof value !== 'string' || value.trim() !== '');
      }
      return true;
    });
    
    if (!isCurrentPageValid) {
      showToast("Please fill in all required fields before proceeding", "destructive");
      return;
    }
    
    // Get the max page number
    const maxPage = form ? Math.max(...form.fields.map(f => f.page)) : 1;
    
    // Move to next page if not on last page
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of form
      window.scrollTo(0, 0);
    }
  };
  
  // Handle previous page button click
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of form
      window.scrollTo(0, 0);
    }
  };
  
  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast("Please fill in all required fields correctly", "destructive");
      return;
    }
    
    setSubmitting(true);
    try {
      await fetchApi(`/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          formId: form?.id,
          data: formValues
        }
      });
      
      // If there's a success redirect URL, navigate to it
      if (form?.successRedirectUrl) {
        window.location.href = form.successRedirectUrl;
        return;
      }
      
      // Show success and reset form
      setSubmitted(true);
      showToast("Your form has been submitted successfully");
    } catch (error) {
      console.error('Failed to submit form:', error);
      showToast("Failed to submit form", "destructive");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to reset form
  const handleReset = () => {
    setSubmitted(false);
    // Initialize form values
    const initialValues: Record<string, any> = {};
    form?.fields.forEach(field => {
      if (field.type === 'CHECKBOX') {
        initialValues[field.id] = [];
      } else {
        initialValues[field.id] = '';
      }
    });
    setFormValues(initialValues);
    setErrors({});
  };
  
  // Show loading state until hydration is complete
  if (typeof window === 'undefined') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32 ml-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!form && !loading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              The form you are looking for is not available or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-3 sm:p-6 md:p-8">
      {loading ? (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardFooter>
          </Card>
        </div>
      ) : submitted ? (
        <div className="max-w-md mx-auto">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-center text-xl sm:text-2xl">Thank You!</CardTitle>
              <CardDescription className="text-center">
                {form?.submissionMessage || "Your response has been recorded."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              {form?.successRedirectUrl ? (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = form.successRedirectUrl || '/'}
                  className="mx-auto"
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="mx-auto"
                >
                  Submit another response
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">{form?.title}</CardTitle>
              {form?.description && (
                <CardDescription className="text-sm sm:text-base">{form.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {form?.fields
                  .filter(field => field.page === currentPage)
                  .filter(field => evaluateCondition(field))
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <Label 
                          htmlFor={field.id} 
                          className="text-sm sm:text-base font-medium"
                        >
                          {field.label} 
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {errors[field.id] && (
                          <p className="text-xs sm:text-sm text-red-500">{errors[field.id]}</p>
                        )}
                      </div>
                      
                      {renderField(field)}
                    </div>
                  ))}
               
                <div className="flex justify-between pt-4">
                  {form?.multiPageEnabled && currentPage > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handlePrevPage}
                      className="flex items-center space-x-1"
                    >
                      <span>Previous</span>
                    </Button>
                  )}
                  
                  <div className="ml-auto">
                    {form?.multiPageEnabled && 
                     currentPage < Math.max(...form.fields.map(f => f.page || 1)) ? (
                      <Button 
                        type="button" 
                        onClick={handleNextPage}
                        className="flex items-center space-x-1"
                      >
                        <span>Next</span>
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={submitting}
                        className="flex items-center space-x-1"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit</span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default FormEmbedPage; 
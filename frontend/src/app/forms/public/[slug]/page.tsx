'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, RefreshCw } from 'lucide-react';

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
import { useToast } from '@/components/ui/use-toast';
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

const PublicFormPage = () => {
  const params = useParams();
  const { toast } = useToast();
  const slug = params?.slug as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userChecked, setUserChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldsVisible, setFieldsVisible] = useState<Record<string, boolean>>({});
  
  // Load form data on component mount - client-side only
  useEffect(() => {
    if (slug) {
      loadForm();
    }
  }, [slug]);

  // Effect to evaluate field visibility when form values change
  useEffect(() => {
    if (form?.fields) {
      const newVisibility: Record<string, boolean> = {};
      form.fields.forEach(field => {
        newVisibility[field.id] = evaluateCondition(field);
      });
      setFieldsVisible(newVisibility);
    }
  }, [form?.fields, formValues]);
  
  // Function to load form data
  const loadForm = async () => {
    setLoading(true);
    try {
      // Only try to get the current user on the client side to prevent hydration mismatch
      let clientId = null;
      
      if (!userChecked && typeof window !== 'undefined') {
        try {
          const userInfo = await fetchApi<{id: string}>('/auth/me');
          clientId = userInfo?.id;
        } catch (e) {
          // Silently ignore auth errors, just means user isn't logged in
        } finally {
          setUserChecked(true);
        }
      }

      // Use the appropriate endpoint based on whether we have a clientId
      const data = await fetchApi<Form>(
        clientId 
          ? `/forms/public/${clientId}/${slug}` 
          : `/forms/public/${slug}`
      );
      
      if (!data.published) {
        toast({
          title: "Form Unavailable",
          description: "This form is not currently accepting submissions",
          variant: "destructive"
        });
        return;
      }
      
      setForm(data);
      
      // Initialize form values and visibility
      const initialValues: Record<string, any> = {};
      const initialVisibility: Record<string, boolean> = {};
      data.fields.forEach(field => {
        if (field.type === 'CHECKBOX') {
          initialValues[field.id] = [];
        } else {
          initialValues[field.id] = '';
        }
        initialVisibility[field.id] = true;
      });
      setFormValues(initialValues);
      setFieldsVisible(initialVisibility);
      
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
  const validateForm = (pageNumber?: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    const fieldsToValidate = form?.fields.filter(field => 
      (!pageNumber || field.page === pageNumber) && 
      fieldsVisible[field.id]
    ) || [];
    
    fieldsToValidate.forEach(field => {
      const value = formValues[field.id];
      if (field.required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = 'This field is required';
          isValid = false;
        }
      }
      
      // Additional validation based on field type
      if (value !== undefined && value !== '') {
        switch (field.type) {
          case 'EMAIL':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.id] = 'Please enter a valid email address';
              isValid = false;
            }
            break;
          case 'URL':
            try {
              new URL(value);
            } catch {
              newErrors[field.id] = 'Please enter a valid URL';
              isValid = false;
            }
            break;
          case 'PHONE':
            if (!/^\+?[\d\s-()]+$/.test(value)) {
              newErrors[field.id] = 'Please enter a valid phone number';
              isValid = false;
            }
            break;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Function to evaluate field visibility conditions
  const evaluateCondition = (field: FormField): boolean => {
    if (!field.conditions || !field.conditions.rules || field.conditions.rules.length === 0) {
      return true;
    }
    
    const { logicOperator = 'AND', rules } = field.conditions;
    
    return rules.reduce((result: boolean, rule) => {
      const fieldValue = formValues[rule.fieldId];
      let ruleResult = false;
      
      switch (rule.operator) {
        case 'equals':
          ruleResult = fieldValue === rule.value;
          break;
        case 'notEquals':
          ruleResult = fieldValue !== rule.value;
          break;
        case 'contains':
          ruleResult = Array.isArray(fieldValue) 
            ? fieldValue.includes(rule.value)
            : String(fieldValue).includes(String(rule.value));
          break;
        case 'notContains':
          ruleResult = Array.isArray(fieldValue) 
            ? !fieldValue.includes(rule.value)
            : !String(fieldValue).includes(String(rule.value));
          break;
        case 'greaterThan':
          ruleResult = Number(fieldValue) > Number(rule.value);
          break;
        case 'lessThan':
          ruleResult = Number(fieldValue) < Number(rule.value);
          break;
        default:
          ruleResult = true;
      }
      
      return logicOperator === 'AND' 
        ? result && ruleResult 
        : result || ruleResult;
    }, logicOperator === 'AND');
  };
  
  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For multi-page forms, validate only the current page
    // For single-page forms, validate all fields
    const isValid = form?.multiPageEnabled 
      ? validateForm(currentPage)
      : validateForm();
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive"
      });
      return;
    }
    
    // For multi-page forms, if not on the last page, go to next page
    if (form?.multiPageEnabled && currentPage < getMaxPage()) {
      handleNextPage();
      return;
    }
    
    setSubmitting(true);
    try {
      await fetchApi(`/forms/${form?.id}/submissions`, {
        method: 'POST',
        data: { values: formValues }
      });
      
      setSubmitted(true);
      
      // Handle success redirect if configured
      if (form?.successRedirectUrl) {
        window.location.href = form.successRedirectUrl;
      }
      
    } catch (error) {
      console.error('Failed to submit form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to handle form reset
  const handleReset = () => {
    setSubmitted(false);
    setFormValues({});
    setErrors({});
    setCurrentPage(1);
    
    // Re-initialize form values
    if (form?.fields) {
      const initialValues: Record<string, any> = {};
      form.fields.forEach(field => {
        if (field.type === 'CHECKBOX') {
          initialValues[field.id] = [];
        } else {
          initialValues[field.id] = '';
        }
      });
      setFormValues(initialValues);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  // Function to get maximum page number
  const getMaxPage = () => {
    if (!form?.fields || !form.multiPageEnabled) return 1;
    return Math.max(...form.fields.map(field => field.page || 1));
  };
  
  // Function to handle next page
  const handleNextPage = () => {
    if (!validateForm(currentPage)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields on this page",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentPage(prev => Math.min(prev + 1, getMaxPage()));
    window.scrollTo(0, 0);
  };
  
  // Function to handle previous page
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };
  
  // Function to render form fields
  const renderField = (field: FormField) => {
    if (!fieldsVisible[field.id]) return null;
    
    const error = errors[field.id];
    
    switch (field.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'URL':
      case 'PHONE':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === 'EMAIL' ? 'email' : 'text'}
              placeholder={field.placeholder}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      
      case 'LONG_TEXT':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      
      case 'RADIO':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Show loading state during initial load and hydration
  if (loading || !userChecked) {
    return (
      <div className="container max-w-2xl mx-auto p-4 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error if form not found or not published
  if (!form) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              This form may have been removed or is not currently available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show success state after submission
  if (submitted && !form.successRedirectUrl) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Form Submitted Successfully
            </CardTitle>
            <CardDescription>
              {form.submissionMessage || "Thank you for your submission!"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleReset}>
              Submit Another Response
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render form
  return (
    <div className="container max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Show progress for multi-page forms */}
            {form.multiPageEnabled && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Page {currentPage} of {getMaxPage()}</span>
                <div className="w-1/2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(currentPage / getMaxPage()) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Render fields for current page */}
            {form.fields
              .filter(field => !form.multiPageEnabled || field.page === currentPage)
              .sort((a, b) => a.order - b.order)
              .map(field => (
                <div key={field.id}>
                  {renderField(field)}
                </div>
              ))
            }
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {form.multiPageEnabled ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  type={currentPage === getMaxPage() ? 'submit' : 'button'}
                  disabled={submitting}
                >
                  {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {currentPage === getMaxPage() ? 'Submit' : 'Next'}
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default PublicFormPage; 
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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

const FormPreviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const formId = params?.id as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
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
        
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };
  
  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Preview Only",
      description: "This is a preview mode. Form submissions are not processed in preview mode.",
    });
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form?.fields
                ?.sort((a, b) => a.order - b.order)
                .map((field) => (
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
          <CardFooter>
            <Button type="submit" className="ml-auto">
              Submit (Preview Only)
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
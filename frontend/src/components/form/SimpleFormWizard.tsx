'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Type,
  Mail,
  Phone,
  MessageSquare,
  Star,
  ChevronDown,
  CheckSquare,
  Calendar,
  Hash,
  Upload,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import slugify from 'slugify';

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  fields: {
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
  }[];
}

const QUICK_TEMPLATES: FormTemplate[] = [
  {
    id: 'contact',
    title: 'Contact Form',
    description: 'Simple contact form with name, email, and message',
    icon: Mail,
    color: 'blue',
    fields: [
      { type: 'TEXT', label: 'Name', placeholder: 'Your name', required: true },
      { type: 'EMAIL', label: 'Email', placeholder: 'your@email.com', required: true },
      { type: 'LONG_TEXT', label: 'Message', placeholder: 'Your message...', required: true }
    ]
  },
  {
    id: 'feedback',
    title: 'Feedback Form',
    description: 'Collect customer feedback with rating and comments',
    icon: Star,
    color: 'purple',
    fields: [
      { type: 'TEXT', label: 'Name', placeholder: 'Your name', required: false },
      { type: 'EMAIL', label: 'Email', placeholder: 'your@email.com', required: false },
      { type: 'RATING', label: 'How would you rate us?', required: true },
      { type: 'LONG_TEXT', label: 'Comments', placeholder: 'Additional feedback...', required: false }
    ]
  },
  {
    id: 'survey',
    title: 'Quick Survey',
    description: 'Simple survey with multiple choice questions',
    icon: CheckSquare,
    color: 'green',
    fields: [
      { type: 'TEXT', label: 'Name', placeholder: 'Your name', required: false },
      { type: 'DROPDOWN', label: 'How did you hear about us?', options: ['Google', 'Social Media', 'Friend', 'Advertisement'], required: true },
      { type: 'RADIO', label: 'Would you recommend us?', options: ['Yes', 'No', 'Maybe'], required: true },
      { type: 'LONG_TEXT', label: 'Any suggestions?', placeholder: 'Your suggestions...', required: false }
    ]
  },
  {
    id: 'custom',
    title: 'Start from Scratch',
    description: 'Create a completely custom form',
    icon: Zap,
    color: 'orange',
    fields: []
  }
];

interface SimpleFormWizardProps {
  onComplete: (formId: string) => void;
  onCancel: () => void;
}

export const SimpleFormWizard: React.FC<SimpleFormWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const totalSteps = selectedTemplate?.id === 'custom' ? 3 : 2;

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template);
    if (template.id !== 'custom') {
      setFormTitle(template.title);
      setFormDescription(template.description);
    }
    setStep(2);
  };

  const handleCreateForm = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a form title",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Create the form
      const response = await fetchApi<{id: string}>('/forms', {
        method: 'POST',
        data: {
          title: formTitle,
          description: formDescription,
          slug: slugify(formTitle, { lower: true, strict: true }) || `form-${Date.now()}`,
          published: false,
          submissionMessage: 'Thank you for your submission!',
          isTemplate: false,
        }
      });

      // If template has fields, add them
      if (selectedTemplate && selectedTemplate.fields.length > 0) {
        const formattedFields = selectedTemplate.fields.map((field, index) => ({
          ...field,
          id: `field-${Date.now()}-${index}`,
          order: index,
          config: field.type === 'RATING' ? { max: 5 } : {},
          page: 1
        }));
        
        await fetchApi(`/forms/${response.id}/fields`, {
          method: 'PUT',
          data: { fields: formattedFields }
        });
      }
      
      toast({
        title: "Success!",
        description: "Your form has been created successfully!",
      });
      
      onComplete(response.id);
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: "Failed to create form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCreateForm();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900',
      green: 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:hover:bg-orange-900'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      green: 'text-green-600 dark:text-green-400',
      orange: 'text-orange-600 dark:text-orange-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Your First Form</CardTitle>
          <CardDescription className="text-base">
            Let's get you started with a simple, step-by-step process
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <React.Fragment key={i}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i + 1 <= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {i + 1 <= step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`w-8 h-0.5 transition-colors ${
                      i + 1 < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Choose how to start</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Pick a template to get started quickly, or create from scratch
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {QUICK_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-200 border-2 ${getColorClasses(template.color)}`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getIconColorClasses(template.color)}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {template.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                  {template.description}
                                </p>
                                {template.fields.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {template.fields.slice(0, 3).map((field, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {field.label}
                                      </Badge>
                                    ))}
                                    {template.fields.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{template.fields.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Give your form a name</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Choose a title and description for your form
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Form Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Contact Us, Customer Feedback, Event Registration"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="A brief description of what this form is for..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {selectedTemplate && selectedTemplate.fields.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        This form will include:
                      </h4>
                      <div className="space-y-1">
                        {selectedTemplate.fields.map((field, index) => (
                          <div key={index} className="flex items-center text-sm text-blue-800 dark:text-blue-200">
                            <Check className="h-3 w-3 mr-2" />
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isCreating}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isCreating || (step === 2 && !formTitle.trim())}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : step === totalSteps ? (
                <>
                  Create Form
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
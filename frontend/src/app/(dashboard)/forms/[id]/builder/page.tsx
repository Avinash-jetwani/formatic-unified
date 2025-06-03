'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Copy, Trash2, GripVertical, PlusCircle, Eye } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/services/api';
import { fieldTypes, FieldTypeInfo } from '@/lib/fieldTypes';

// Interfaces
interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  submissionMessage: string;
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
  createdAt?: string;
  updatedAt?: string;
  conditions?: {
    logicOperator?: 'AND' | 'OR';
    rules?: {
      fieldId: string;
      operator: string;
      value: any;
    }[];
  };
}

// Sortable Field Component
const SortableField = ({ field, onEdit, onDelete, onDuplicate }: { 
  field: FormField;
  onEdit: (field: FormField) => void;
  onDelete: (field: FormField) => void;
  onDuplicate: (field: FormField) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeInfo = fieldTypes[field.type] || {
    label: 'Unknown',
    description: 'Unknown field type',
    icon: <span>?</span>,
    hasOptions: false,
    hasPlaceholder: false,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-3"
    >
      <Card className="relative group">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-3 top-1/2 -translate-y-1/2 cursor-move opacity-50 group-hover:opacity-100"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <CardHeader className="py-3 pl-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                {fieldTypeInfo.label}
              </Badge>
              <CardTitle className="text-base">
                {field.label || 'Untitled Field'}
              </CardTitle>
              {field.required && (
                <Badge variant="destructive" className="text-xs font-normal">
                  Required
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs font-normal ml-2">
                Page {field.page || 1}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(field)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(field)}
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(field)}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-2">
          {field.type === 'TEXT' || field.type === 'LONG_TEXT' || field.type === 'EMAIL' || 
           field.type === 'PHONE' || field.type === 'NUMBER' ? (
            <Input 
              disabled 
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} 
              className="bg-muted/40" 
            />
          ) : field.type === 'DROPDOWN' ? (
            <Select disabled>
              <SelectTrigger className="bg-muted/40">
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
            </Select>
          ) : field.type === 'CHECKBOX' || field.type === 'RADIO' ? (
            <div className="space-y-1">
              {field.options.length > 0 ? (
                field.options.slice(0, 3).map((option, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-4 w-4 mr-2 rounded border border-muted-foreground/30"></div>
                    <span className="text-sm text-muted-foreground">{option}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic">No options defined</div>
              )}
              {field.options.length > 3 && (
                <div className="text-xs text-muted-foreground mt-1">+ {field.options.length - 3} more options</div>
              )}
            </div>
          ) : field.type === 'DATE' ? (
            <Input type="date" disabled className="bg-muted/40" />
          ) : field.type === 'RATING' ? (
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <span key={rating} className="text-lg text-muted-foreground">★</span>
              ))}
            </div>
          ) : field.type === 'SCALE' || field.type === 'SLIDER' ? (
            <input
              type="range"
              disabled
              min={field.config?.min || 1}
              max={field.config?.max || 10}
              step={field.config?.step || 1}
              className="w-full bg-muted/40"
            />
          ) : (
            <div className="text-sm text-muted-foreground italic">
              {fieldTypeInfo.description}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Field Editor Dialog Component
const FieldEditorDialog = ({ 
  open, 
  onOpenChange, 
  field, 
  onSave,
  availableFields
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
  availableFields: FormField[];
}) => {
  const [editedField, setEditedField] = useState<FormField | null>(null);
  const [newOption, setNewOption] = useState('');
  const [showConditions, setShowConditions] = useState(false);
  
  // Update edited field when the input field changes
  useEffect(() => {
    if (field) {
      // Convert config to an object if it's a string
      let parsedConfig = field.config;
      if (typeof field.config === 'string') {
        try {
          parsedConfig = JSON.parse(field.config);
        } catch (e) {
          console.error('Error parsing field config:', e);
          // If parsing fails, use an empty object
          parsedConfig = {};
        }
      }
      
      setEditedField({ 
        ...field,
        config: parsedConfig 
      });
      // Check if field has valid conditions
      const hasValidConditions = field.conditions && 
                                 field.conditions.rules && 
                                 field.conditions.rules.length > 0 &&
                                 field.conditions.rules.some(rule => 
                                   rule.fieldId && rule.operator && rule.value !== undefined && rule.value !== ''
                                 );
      setShowConditions(!!hasValidConditions);
    } else {
      setEditedField(null);
      setShowConditions(false);
    }
  }, [field]);
  
  // Initialize config if needed when changing field types
  useEffect(() => {
    if (editedField && !editedField.config) {
      setEditedField({
        ...editedField,
        config: {}
      });
    }
  }, [editedField?.type]);
  
  if (!editedField) return null;
  
  // Initialize conditions if they don't exist
  if (!editedField.conditions) {
    editedField.conditions = { logicOperator: 'AND', rules: [] };
  }
  
  const fieldTypeInfo = fieldTypes[editedField.type] || {
    label: 'Unknown',
    hasOptions: false,
    hasPlaceholder: false,
  };
  
  // Add option to the field
  const handleAddOption = () => {
    if (newOption.trim() && !editedField.options.includes(newOption.trim())) {
      setEditedField({
        ...editedField,
        options: [...editedField.options, newOption.trim()],
      });
      setNewOption('');
    }
  };
  
  // Remove option from the field
  const handleRemoveOption = (option: string) => {
    setEditedField({
      ...editedField,
      options: editedField.options.filter(o => o !== option),
    });
  };
  
  // Update field type
  const handleTypeChange = (type: string) => {
    setEditedField({
      ...editedField,
      type,
      // Reset options if new type doesn't have options
      options: fieldTypes[type].hasOptions ? editedField.options : [],
    });
  };
  
  // Add condition rule
  const addConditionRule = () => {
    if (!editedField.conditions) {
      editedField.conditions = { logicOperator: 'AND', rules: [] };
    }
    
    const newRule = {
      fieldId: availableFields[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    
    setEditedField({
      ...editedField,
      conditions: {
        ...editedField.conditions,
        rules: [...(editedField.conditions.rules || []), newRule]
      }
    });
  };
  
  // Remove condition rule
  const removeConditionRule = (index: number) => {
    if (!editedField.conditions || !editedField.conditions.rules) return;
    
    const newRules = [...editedField.conditions.rules];
    newRules.splice(index, 1);
    
    setEditedField({
      ...editedField,
      conditions: {
        ...editedField.conditions,
        rules: newRules
      }
    });
  };
  
  // Update condition rule
  const updateConditionRule = (index: number, field: string, value: any) => {
    if (!editedField.conditions || !editedField.conditions.rules) return;
    
    const newRules = [...editedField.conditions.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    
    setEditedField({
      ...editedField,
      conditions: {
        ...editedField.conditions,
        rules: newRules
      }
    });
  };

  // Get available operators based on field type
  const getOperatorsForField = (fieldId: string) => {
    const targetField = availableFields.find(f => f.id === fieldId);
    if (!targetField) return ['equals', 'notEquals'];
    
    const operators = ['equals', 'notEquals'];
    
    // Add type-specific operators
    switch (targetField.type) {
      case 'TEXT':
      case 'LONG_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        operators.push('contains');
        break;
      case 'NUMBER':
      case 'RATING':
      case 'SLIDER':
      case 'SCALE':
      case 'DATE':
      case 'TIME':
      case 'DATETIME':
        operators.push('greaterThan', 'lessThan');
        break;
      case 'CHECKBOX':
      case 'RADIO':
      case 'DROPDOWN':
        // For options-based fields, only equals/notEquals make sense
        break;
    }
    
    return operators;
  };

  // Get value input for condition rule based on field type
  const renderConditionValueInput = (rule: any, index: number, targetField?: FormField) => {
    if (!targetField) {
      return (
        <Input
          value={rule.value}
          onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
          placeholder="Value"
        />
      );
    }

    // For fields with options, show a dropdown
    if ((targetField.type === 'DROPDOWN' || targetField.type === 'RADIO' || targetField.type === 'CHECKBOX') && targetField.options?.length > 0) {
      return (
        <Select 
          value={rule.value} 
          onValueChange={(value) => updateConditionRule(index, 'value', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {targetField.options.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For date/time fields, show date input
    if (targetField.type === 'DATE') {
      return (
        <Input
          type="date"
          value={rule.value}
          onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
          placeholder="Select date"
        />
      );
    }

    if (targetField.type === 'TIME') {
      return (
        <Input
          type="time"
          value={rule.value}
          onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
          placeholder="Select time"
        />
      );
    }

    if (targetField.type === 'DATETIME') {
      return (
        <Input
          type="datetime-local"
          value={rule.value}
          onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
          placeholder="Select date and time"
        />
      );
    }

    // For number fields, show number input
    if (targetField.type === 'NUMBER' || targetField.type === 'RATING' || targetField.type === 'SLIDER' || targetField.type === 'SCALE') {
      return (
        <Input
          type="number"
          value={rule.value}
          onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
          placeholder="Enter number"
        />
      );
    }

    // Default text input
    return (
      <Input
        value={rule.value}
        onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
        placeholder="Value"
      />
    );
  };
  
  // Function to update configuration values
  const updateConfig = (key: string, value: any) => {
    // Parse config if it's a string
    let updatedConfig: Record<string, any> = {};
    
    if (typeof editedField.config === 'string') {
      try {
        updatedConfig = JSON.parse(editedField.config);
      } catch (e) {
        console.error('Error parsing config:', e);
        // If parsing fails, start with an empty object
      }
    } else {
      updatedConfig = editedField.config || {};
    }
    
    // Handle specific conversions for file upload settings
    if (editedField.type === 'FILE') {
      if (key === 'maxFiles') {
        value = Number(value) || 1;
      } else if (key === 'maxSize') {
        value = Number(value) || 10;
      }
    }
    
    updatedConfig[key] = value;
    setEditedField({
      ...editedField,
      config: updatedConfig
    });
  };
  
  // Handle save button click
  const handleSave = () => {
    if (editedField.label.trim()) {
      // Prepare the field for saving
      const fieldToSave = { ...editedField };
      
      // If conditions are not being used, remove them
      if (!showConditions) {
        delete fieldToSave.conditions;
      } else {
        // Ensure conditions have the proper structure
        if (!fieldToSave.conditions) {
          fieldToSave.conditions = { logicOperator: 'AND', rules: [] };
        }
        
        // Clean up any empty or invalid rules
        if (fieldToSave.conditions.rules) {
          fieldToSave.conditions.rules = fieldToSave.conditions.rules.filter(rule => 
            rule.fieldId && rule.operator && rule.value !== undefined && rule.value !== ''
          );
        }
        
        // Remove conditions entirely if no valid rules exist
        if (!fieldToSave.conditions.rules || fieldToSave.conditions.rules.length === 0) {
          delete fieldToSave.conditions;
        }
      }
      
      onSave(fieldToSave);
      onOpenChange(false);
    }
  };
  
  // Function to render a preview of the field
  const renderFieldPreview = () => {
    // Use existing field preview rendering logic
    switch (editedField.type) {
      case 'TEXT':
        return (
          <Input 
            id="preview-field"
            placeholder={editedField.placeholder || 'Enter text'} 
            disabled 
            maxLength={editedField.config?.maxLength}
          />
        );

      case 'LONG_TEXT':
        return (
          <Textarea
            id="preview-field"
            placeholder={editedField.placeholder || 'Enter long text'}
            disabled
            rows={editedField.config?.rows || 4}
            maxLength={editedField.config?.maxLength}
          />
        );

      case 'EMAIL':
        return (
          <Input
            type="email"
            id="preview-field"
            placeholder={editedField.placeholder || 'email@example.com'}
            disabled
          />
        );

      case 'PHONE':
        const phoneFormat = editedField.config?.format || 'international';
        let phonePlaceholder = '(123) 456-7890';
        
        if (phoneFormat === 'us') {
          phonePlaceholder = '(555) 123-4567';
        } else if (phoneFormat === 'uk') {
          phonePlaceholder = '07700 900123';
        } else if (phoneFormat === 'india') {
          phonePlaceholder = '+91 98765 43210';
        } else {
          phonePlaceholder = '+1 (555) 123-4567';
        }
        
        return (
          <Input
            type="tel"
            id="preview-field"
            placeholder={editedField.placeholder || phonePlaceholder}
            disabled
          />
        );

      case 'URL':
        return (
          <Input
            type="url"
            id="preview-field"
            placeholder={editedField.placeholder || 'https://example.com'}
            disabled
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            id="preview-field"
            placeholder={editedField.placeholder || '0'}
            min={editedField.config?.min}
            max={editedField.config?.max}
            step={editedField.config?.step || 1}
            disabled
          />
        );

      case 'DATE':
        return (
          <Input 
            type="date" 
            id="preview-field" 
            min={editedField.config?.min} 
            max={editedField.config?.max} 
            disabled 
          />
        );

      case 'TIME':
        return (
          <Input 
            type="time" 
            id="preview-field" 
            min={editedField.config?.min} 
            max={editedField.config?.max} 
            disabled 
          />
        );

      case 'DATETIME':
        return (
          <Input 
            type="datetime-local" 
            id="preview-field" 
            min={editedField.config?.min} 
            max={editedField.config?.max} 
            disabled 
          />
        );

      case 'DROPDOWN':
        return (
          <div className="relative">
            <select
              id="preview-field"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            >
              <option value="" disabled selected>{editedField.placeholder || 'Select an option'}</option>
              {editedField.options.map((option, i) => (
                <option key={i} value={option}>{option}</option>
              ))}
            </select>
            {editedField.config?.allowSearch && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </div>
            )}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className={`space-y-2 ${editedField.config?.layout === 'horizontal' ? 'flex flex-wrap gap-4 space-y-0' : ''}`}>
            {editedField.options.length > 0 ? (
              editedField.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox id={`preview-option-${i}`} disabled />
                  <Label htmlFor={`preview-option-${i}`}>{option}</Label>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic">Add options to see preview</div>
            )}
          </div>
        );

      case 'RADIO':
        return (
          <div className={`space-y-2 ${editedField.config?.layout === 'horizontal' ? 'flex flex-wrap gap-4 space-y-0' : ''}`}>
            {editedField.options.length > 0 ? (
              editedField.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input type="radio" id={`preview-radio-${i}`} disabled className="h-4 w-4" />
                  <Label htmlFor={`preview-radio-${i}`}>{option}</Label>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic">Add options to see preview</div>
            )}
          </div>
        );

      case 'RATING':
        const maxRating = editedField.config?.max || 5;
        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: maxRating }).map((_, i) => (
              <button
                key={i}
                type="button"
                className="text-2xl text-muted-foreground"
                disabled
              >
                ★
              </button>
            ))}
          </div>
        );

      case 'SCALE':
      case 'SLIDER':
        const min = editedField.config?.min || 1;
        const max = editedField.config?.max || 10;
        const step = editedField.config?.step || 1;
        return (
          <div className="space-y-2">
            <input
              type="range"
              id="preview-field"
              min={min}
              max={max}
              step={step}
              className="w-full"
              disabled
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}</span>
              <span>{Math.floor((min + max) / 2)}</span>
              <span>{max}</span>
            </div>
          </div>
        );

      case 'FILE':
        return (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-not-allowed bg-muted/30">
              <div className="flex flex-col items-center justify-center p-3">
                <svg className="w-6 h-6 mb-2 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="text-xs text-muted-foreground">
                  {
                    editedField.config?.allowedTypes === 'images' ? 'Upload images' :
                    editedField.config?.allowedTypes === 'documents' ? 'Upload documents' :
                    editedField.config?.allowedTypes === 'custom' ? `Upload ${editedField.config?.customTypes || 'files'}` :
                    'Upload files'
                  }
                  {editedField.config?.maxFiles > 1 ? ` (Max: ${editedField.config.maxFiles})` : ''}
                </p>
                <input type="file" className="hidden" disabled />
              </div>
            </label>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground italic p-2">
            Unsupported field type
          </div>
        );
    }
  };

  // Render field-specific configurations based on field type
  const renderFieldConfig = () => {
    if (!editedField) return null;

    switch (editedField.type) {
      case 'TEXT':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Text Field Settings</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="minLength" className="sm:text-right">
                Min Length
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="minLength"
                  type="number"
                  min="0"
                  value={editedField.config?.minLength || ''}
                  onChange={(e) => updateConfig('minLength', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Minimum character length"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="maxLength" className="sm:text-right">
                Max Length
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="maxLength"
                  type="number"
                  min="0"
                  value={editedField.config?.maxLength || ''}
                  onChange={(e) => updateConfig('maxLength', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Maximum character length"
                />
              </div>
            </div>
          </div>
        );
      
      case 'LONG_TEXT':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Long Text Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minLength" className="text-right">
                Min Length
              </Label>
              <div className="col-span-3">
                <Input
                  id="minLength"
                  type="number"
                  min="0"
                  value={editedField.config?.minLength || ''}
                  onChange={(e) => updateConfig('minLength', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Minimum character length"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxLength" className="text-right">
                Max Length
              </Label>
              <div className="col-span-3">
                <Input
                  id="maxLength"
                  type="number"
                  min="0"
                  value={editedField.config?.maxLength || ''}
                  onChange={(e) => updateConfig('maxLength', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Maximum character length"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rows" className="text-right">
                Rows
              </Label>
              <div className="col-span-3">
                <Input
                  id="rows"
                  type="number"
                  min="2"
                  max="20"
                  value={editedField.config?.rows || '4'}
                  onChange={(e) => updateConfig('rows', e.target.value === '' ? 4 : Number(e.target.value))}
                  placeholder="Number of visible rows"
                />
              </div>
            </div>
          </div>
        );
      
      case 'EMAIL':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Email Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="validation" className="text-right">
                Validation
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="validation"
                  checked={editedField.config?.validateEmail !== false}
                  onCheckedChange={(checked) => updateConfig('validateEmail', checked)}
                />
                <span className="ml-2 text-sm">Validate email format</span>
              </div>
            </div>
          </div>
        );
      
      case 'PHONE':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Phone Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <div className="col-span-3">
                <Select 
                  value={editedField.config?.format || 'international'}
                  onValueChange={(value) => updateConfig('format', value)}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="us">US</SelectItem>
                    <SelectItem value="uk">UK</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 'NUMBER':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Number Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">
                Min Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="min"
                  type="number"
                  value={editedField.config?.min ?? ''}
                  onChange={(e) => updateConfig('min', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Minimum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type="number"
                  value={editedField.config?.max ?? ''}
                  onChange={(e) => updateConfig('max', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Maximum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="step" className="text-right">
                Step
              </Label>
              <div className="col-span-3">
                <Input
                  id="step"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={editedField.config?.step || '1'}
                  onChange={(e) => updateConfig('step', e.target.value === '' ? 1 : Number(e.target.value))}
                  placeholder="Step size"
                />
              </div>
            </div>
          </div>
        );
      
      case 'DATE':
      case 'TIME':
      case 'DATETIME':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{editedField.type === 'DATE' ? 'Date' : (editedField.type === 'TIME' ? 'Time' : 'Date & Time')} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">
                Min {editedField.type === 'DATE' ? 'Date' : (editedField.type === 'TIME' ? 'Time' : 'Date & Time')}
              </Label>
              <div className="col-span-3">
                <Input
                  id="min"
                  type={editedField.type.toLowerCase()}
                  value={editedField.config?.min || ''}
                  onChange={(e) => updateConfig('min', e.target.value)}
                  placeholder={`Minimum ${editedField.type.toLowerCase()}`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max {editedField.type === 'DATE' ? 'Date' : (editedField.type === 'TIME' ? 'Time' : 'Date & Time')}
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type={editedField.type.toLowerCase()}
                  value={editedField.config?.max || ''}
                  onChange={(e) => updateConfig('max', e.target.value)}
                  placeholder={`Maximum ${editedField.type.toLowerCase()}`}
                />
              </div>
            </div>
          </div>
        );
        
      case 'CHECKBOX':
      case 'RADIO':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{editedField.type === 'CHECKBOX' ? 'Checkbox' : 'Radio'} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layout" className="text-right">
                Layout
              </Label>
              <div className="col-span-3">
                <Select 
                  value={editedField.config?.layout || 'vertical'}
                  onValueChange={(value) => updateConfig('layout', value)}
                >
                  <SelectTrigger id="layout">
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 'DROPDOWN':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Dropdown Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allowSearch" className="text-right">
                Searchable
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="allowSearch"
                  checked={editedField.config?.allowSearch === true}
                  onCheckedChange={(checked) => updateConfig('allowSearch', checked)}
                />
                <span className="ml-2 text-sm">Allow searching in dropdown</span>
              </div>
            </div>
          </div>
        );
      
      case 'RATING':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Rating Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max Rating
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type="number"
                  min="1"
                  max="10"
                  value={editedField.config?.max || '5'}
                  onChange={(e) => updateConfig('max', Number(e.target.value) || 5)}
                  placeholder="Maximum rating value"
                />
              </div>
            </div>
          </div>
        );
      
      case 'SCALE':
      case 'SLIDER':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{editedField.type === 'SCALE' ? 'Scale' : 'Slider'} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">
                Min Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="min"
                  type="number"
                  value={editedField.config?.min ?? '1'}
                  onChange={(e) => updateConfig('min', e.target.value === '' ? 1 : Number(e.target.value))}
                  placeholder="Minimum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">
                Max Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="max"
                  type="number"
                  value={editedField.config?.max ?? '10'}
                  onChange={(e) => updateConfig('max', e.target.value === '' ? 10 : Number(e.target.value))}
                  placeholder="Maximum value"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="step" className="text-right">
                Step
              </Label>
              <div className="col-span-3">
                <Input
                  id="step"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={editedField.config?.step || '1'}
                  onChange={(e) => updateConfig('step', e.target.value === '' ? 1 : Number(e.target.value))}
                  placeholder="Step size"
                />
              </div>
            </div>
          </div>
        );
        
      case 'FILE':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">File Upload Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxFiles" className="text-right">
                Max Files
              </Label>
              <div className="col-span-3">
                <Input
                  id="maxFiles"
                  type="number"
                  min="1"
                  max="10"
                  value={editedField.config?.maxFiles || '1'}
                  onChange={(e) => updateConfig('maxFiles', Number(e.target.value) || 1)}
                  placeholder="Maximum number of files"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allowedTypes" className="text-right">
                Allowed Types
              </Label>
              <div className="col-span-3">
                <Select 
                  value={editedField.config?.allowedTypes || 'all'}
                  onValueChange={(value) => updateConfig('allowedTypes', value)}
                >
                  <SelectTrigger id="allowedTypes">
                    <SelectValue placeholder="Select allowed file types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="images">Images Only (jpg, png, gif)</SelectItem>
                    <SelectItem value="documents">Documents Only (pdf, doc, docx)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {editedField.config?.allowedTypes === 'custom' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customTypes" className="text-right">
                  Custom Types
                </Label>
                <div className="col-span-3">
                  <Input
                    id="customTypes"
                    value={editedField.config?.customTypes || ''}
                    onChange={(e) => updateConfig('customTypes', e.target.value)}
                    placeholder="E.g., .jpg,.png,.pdf"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter file extensions separated by commas (e.g., .jpg,.png,.pdf)
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxSize" className="text-right">
                Max Size (MB)
              </Label>
              <div className="col-span-3">
                <Input
                  id="maxSize"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={editedField.config?.maxSize || '10'}
                  onChange={(e) => updateConfig('maxSize', Number(e.target.value) || 10)}
                  placeholder="Maximum file size in MB"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] max-h-[90vh] overflow-y-auto md:max-w-[85vw] lg:max-w-[70vw] xl:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>
            {field && field.id.startsWith('temp-') ? 'Add Field' : 'Edit Field'}
          </DialogTitle>
          <DialogDescription>
            Configure your form field settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 mt-4 md:flex-row">
          {/* Field configuration panel */}
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="fieldType" className="sm:text-right md:whitespace-nowrap">
                Field Type
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Select 
                  value={editedField.type} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypes).map(([key, { label, description }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">{description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="fieldLabel" className="sm:text-right md:whitespace-nowrap">
                Label
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="fieldLabel"
                  value={editedField.label}
                  onChange={(e) => setEditedField({...editedField, label: e.target.value})}
                  placeholder="Field label"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="fieldPage" className="sm:text-right md:whitespace-nowrap">
                Page
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Select 
                  value={String(editedField.page || 1)} 
                  onValueChange={(value) => setEditedField({...editedField, page: parseInt(value, 10)})}
                >
                  <SelectTrigger id="fieldPage">
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Generate options for existing pages plus one more */}
                    {Array.from({ length: Math.max(...availableFields.map(f => f.page || 1), 1) + 1 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Page {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="fieldPlaceholder" className="sm:text-right md:whitespace-nowrap">
                Placeholder
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="fieldPlaceholder"
                  value={editedField.placeholder || ''}
                  onChange={(e) => setEditedField({...editedField, placeholder: e.target.value})}
                  placeholder="Field placeholder text"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="fieldRequired" className="sm:text-right md:whitespace-nowrap">
                Required
              </Label>
              <div className="col-span-1 sm:col-span-3 flex items-center">
                <Switch
                  id="fieldRequired"
                  checked={editedField.required}
                  onCheckedChange={(checked) => setEditedField({...editedField, required: checked})}
                />
                <span className="ml-2 text-sm">Make this field required</span>
              </div>
            </div>
            
            {/* Field type specific settings */}
            {renderFieldConfig()}
            
            {/* Conditional Logic Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="useConditions" className="sm:text-right md:whitespace-nowrap">
                Conditions
              </Label>
              <div className="col-span-1 sm:col-span-3 flex items-center">
                <Switch
                  id="useConditions"
                  checked={showConditions}
                  onCheckedChange={setShowConditions}
                />
                <span className="ml-2 text-sm">Show/hide based on other fields</span>
              </div>
            </div>
            
            {/* Conditional Logic Rules */}
            {showConditions && (
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right self-start mt-2 md:whitespace-nowrap">
                  Logic
                </Label>
                <div className="col-span-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select 
                      value={editedField.conditions?.logicOperator || 'AND'} 
                      onValueChange={(value) => setEditedField({
                        ...editedField,
                        conditions: {
                          ...editedField.conditions!,
                          logicOperator: value as 'AND' | 'OR'
                        }
                      })}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Logic type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">All conditions (AND)</SelectItem>
                        <SelectItem value="OR">Any condition (OR)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      onClick={addConditionRule} 
                      type="button" 
                      variant="outline"
                      size="sm"
                    >
                      Add Rule
                    </Button>
                  </div>
                  
                  {editedField.conditions?.rules && editedField.conditions.rules.length > 0 ? (
                    <div className="space-y-3 border rounded-md p-3">
                      {editedField.conditions.rules.map((rule, index) => {
                        const targetField = availableFields.find(f => f.id === rule.fieldId);
                        const availableOperators = getOperatorsForField(rule.fieldId);
                        
                        return (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                            <div className="space-y-1">
                              <Select 
                                value={rule.fieldId} 
                                onValueChange={(value) => updateConditionRule(index, 'fieldId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableFields
                                    .filter(f => f.id !== editedField.id) // Can't reference self
                                    .map(field => (
                                      <SelectItem key={field.id} value={field.id}>
                                        {field.label} ({field.type})
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1">
                              <Select 
                                value={rule.operator} 
                                onValueChange={(value) => updateConditionRule(index, 'operator', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableOperators.map(op => (
                                    <SelectItem key={op} value={op}>
                                      {op === 'equals' ? 'Equals' :
                                       op === 'notEquals' ? 'Not Equals' :
                                       op === 'contains' ? 'Contains' :
                                       op === 'greaterThan' ? 'Greater Than' :
                                       op === 'lessThan' ? 'Less Than' : op}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1">
                              {renderConditionValueInput(rule, index, targetField)}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeConditionRule(index)}
                              className="h-8 w-8 sm:mt-0 mt-1"
                              title="Remove condition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic border rounded-md p-3">
                      No conditions added yet. Click "Add Rule" to create a condition.
                    </div>
                  )}
                  
                  {/* Condition explanation */}
                  {editedField.conditions?.rules && editedField.conditions.rules.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">How this condition works:</h4>
                      <p className="text-sm text-blue-800">
                        This field will be shown when{' '}
                        <strong>{editedField.conditions.logicOperator === 'AND' ? 'ALL' : 'ANY'}</strong>{' '}
                        of the following conditions are met:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-blue-700">
                        {editedField.conditions.rules.map((rule, index) => {
                          const targetField = availableFields.find(f => f.id === rule.fieldId);
                          const operatorText = 
                            rule.operator === 'equals' ? 'equals' :
                            rule.operator === 'notEquals' ? 'does not equal' :
                            rule.operator === 'contains' ? 'contains' :
                            rule.operator === 'greaterThan' ? 'is greater than' :
                            rule.operator === 'lessThan' ? 'is less than' : rule.operator;
                          
                          return (
                            <li key={index} className="flex items-center">
                              <span className="mr-2">•</span>
                              <span>
                                <strong>{targetField?.label || 'Unknown field'}</strong> 
                                <span className="text-blue-600"> ({targetField?.type || 'Unknown'})</span>{' '}
                                {operatorText} "{rule.value}"
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
                        💡 <strong>Supported everywhere:</strong> This works in preview mode, published forms, and embedded forms
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {fieldTypeInfo.hasOptions && (
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right self-start mt-2 md:whitespace-nowrap">
                  Options
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option"
                      className="flex-1"
                    />
                    <Button onClick={handleAddOption} type="button" className="sm:w-auto w-full">
                      Add
                    </Button>
                  </div>
                  
                  {editedField.options.length > 0 ? (
                    <div className="space-y-1 mt-2">
                      {editedField.options.map((option, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/40 p-2 rounded">
                          <span className="truncate pr-2">{option}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(option)}
                            className="h-7 w-7 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No options added yet. Add at least one option.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Preview panel */}
          <div className="border rounded-md p-4 md:p-6 bg-muted/20 md:w-[250px] lg:w-[300px] flex-shrink-0">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Preview</h3>
              <p className="text-sm text-muted-foreground">See how your field will appear</p>
            </div>
            
            <div className="space-y-2 max-w-full overflow-hidden">
              <Label htmlFor="preview-field">
                {editedField.label || 'Field Label'}
                {editedField.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              
              {renderFieldPreview()}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6 sm:flex-row flex-col-reverse gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!editedField.label.trim() || (fieldTypeInfo.hasOptions && editedField.options.length === 0)}
            className="sm:w-auto w-full"
          >
            Save Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Form Builder Page Component
const FormBuilderPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const formId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState('fields');
  const [disableMultiPageDialogOpen, setDisableMultiPageDialogOpen] = useState(false);
  
  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Load form data on component mount
  useEffect(() => {
    loadForm();
  }, [formId]);
  
  // Function to load form data
  const loadForm = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Form>(`/forms/${formId}`);
      setForm(data);
      setFields(data.fields || []);
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
  
  // Function to save the order of fields
  const saveFormFields = async () => {
    if (!formId) return;
    
    try {
      setIsSaving(true);
      console.log("Saving fields with page numbers:", fields.map(f => ({ id: f.id, order: f.order, page: f.page || 1 })));
      
      await fetchApi(`/forms/${formId}/fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          fields: fields.map((field, index) => ({
            id: field.id,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options || [],
            config: field.config,
            order: index,
            page: field.page || 1, // Ensure page number is preserved
          })),
        },
      });

      // Refresh form data to ensure we have the latest
      loadForm();
      
      toast({
        title: 'Success',
        description: 'Form changes saved successfully',
      });
    } catch (error) {
      console.error('Error saving field order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save form changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle field drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Function to add a new field
  const handleAddField = () => {
    // Find currently active page if multi-page is enabled
    let currentPage = 1;
    
    if (form?.multiPageEnabled) {
      // Get the active tab element from the DOM (this assumes the tabs are using data-state="active" attribute)
      const activeTabElement = document.querySelector('[role="tab"][data-state="active"]');
      if (activeTabElement) {
        // Extract the page number from the tab text (assumes format "Page X")
        const tabText = activeTabElement.textContent || '';
        const pageMatch = tabText.match(/Page (\d+)/);
        if (pageMatch && pageMatch[1]) {
          currentPage = parseInt(pageMatch[1], 10);
        }
      }
    }
    
    // Create a new empty field
    const newField: FormField = {
      id: `temp-${Date.now()}`, // Temporary ID, will be replaced by server
      formId: formId,
      type: 'TEXT',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      config: {},
      order: fields.length,
      page: currentPage,
    };
    
    setEditingField(newField);
    setFieldDialogOpen(true);
  };
  
  // Function to edit a field
  const handleEditField = (field: FormField) => {
    setEditingField({ ...field });
    setFieldDialogOpen(true);
  };
  
  // Function to delete a field
  const handleDeleteField = async (field: FormField) => {
    // If the field has a temporary ID, just remove it from local state
    if (field.id.startsWith('temp-')) {
      setFields(fields.filter(f => f.id !== field.id));
      return;
    }
    
    // For fields that exist in the database, call the API to delete
    try {
      await fetchApi(`/forms/${formId}/fields/${field.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Remove from local state after successful deletion
      setFields(fields.filter(f => f.id !== field.id));
      
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete field:', error);
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive"
      });
    }
  };
  
  // Function to duplicate a field
  const handleDuplicateField = (field: FormField) => {
    // Create a copy of the field with a new temporary ID
    const newField: FormField = {
      ...field,
      id: `temp-${Date.now()}`, // Temporary ID
    };
    
    // Find index of the field being duplicated
    const fieldIndex = fields.findIndex(f => f.id === field.id);
    
    // Insert new field right after the duplicated field, not at the end
    const updatedFields = [...fields];
    updatedFields.splice(fieldIndex + 1, 0, newField);
    setFields(updatedFields);
  };
  
  // Function to save field changes
  const handleSaveField = async (field: FormField) => {
    if (!formId) return;
    
    try {
      console.log(`Saving field: ${JSON.stringify(field, null, 2)}`);
      
      // Remove properties that should not be sent for both create and update
      const { id, formId: fieldFormId, createdAt, updatedAt, ...fieldToSave } = field;
      
      // Ensure config is in the correct format
      if (typeof fieldToSave.config === 'string') {
        try {
          fieldToSave.config = JSON.parse(fieldToSave.config);
        } catch (e) {
          console.error('Error parsing config string:', e);
          // If parsing fails, use an empty object
          fieldToSave.config = {};
        }
      }
      
      // Ensure conditions is in the correct format for the API
      if (fieldToSave.conditions) {
        console.log('Saving field with conditions:', JSON.stringify(fieldToSave.conditions, null, 2));
      }
      
      // For file upload fields, ensure config has the correct properties
      if (field.type === 'FILE' && typeof fieldToSave.config === 'object') {
        // Make sure maxFiles is a number
        if (fieldToSave.config.maxFiles) {
          fieldToSave.config.maxFiles = Number(fieldToSave.config.maxFiles) || 1;
        }
        
        // Make sure maxSize is a number
        if (fieldToSave.config.maxSize) {
          fieldToSave.config.maxSize = Number(fieldToSave.config.maxSize) || 10;
        }
      }
      
      // Ensure config is properly formatted as a JSON string
      fieldToSave.config = typeof fieldToSave.config === 'object' ? 
        JSON.stringify(fieldToSave.config) : fieldToSave.config;
      
      let updatedField;
      // Check if the field is new or existing
      if (field.id.startsWith('temp-')) {
        // Add new field - send to the correct formId from the page params
        updatedField = await fetchApi<FormField>(`/forms/${formId}/fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: fieldToSave,
        });
        console.log(`Created new field with ID: ${updatedField.id}`);
      } else {
        // Update existing field
        updatedField = await fetchApi<FormField>(`/forms/${formId}/fields/${field.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          data: fieldToSave,
        });
        console.log(`Updated field with ID: ${field.id}`);
      }
      
      // Refresh the entire form to ensure we have the latest data
      const updatedForm = await fetchApi<Form>(`/forms/${formId}`);
      setForm(updatedForm);
      
      // If there are fields on page > 1, ensure multiPageEnabled is true
      const hasMultiplePages = updatedForm.fields.some(f => f.page > 1);
      if (hasMultiplePages && !updatedForm.multiPageEnabled) {
        // Update the form to enable multi-page if it's not already enabled
        await fetchApi(`/forms/${formId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            multiPageEnabled: true
          }
        });
        
        // Get the updated form again with the multi-page enabled
        const reUpdatedForm = await fetchApi<Form>(`/forms/${formId}`);
        setForm(reUpdatedForm);
        setFields(reUpdatedForm.fields || []);
      } else {
        setFields(updatedForm.fields || []);
      }
      
      toast({
        title: "Success",
        description: "Field saved successfully",
      });
      
      setFieldDialogOpen(false);
      return true;
    } catch (error) {
      console.error('Failed to save field:', error);
      toast({
        title: "Error",
        description: "Failed to save field",
        variant: "destructive"
      });
      return false;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-1">
              {loading ? <Skeleton className="h-8 w-48" /> : `Form Builder: ${form?.title || 'Untitled Form'}`}
            </h1>
            <div className="text-muted-foreground text-sm sm:text-base">
              {loading ? <Skeleton className="h-4 w-64 mt-1" /> : 'Customize your form fields'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${formId}/preview`)}
            size="sm"
            className="sm:size-default"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={saveFormFields}
            disabled={isSaving}
            size="sm"
            className="sm:size-default"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-1 mb-4">
          <TabsTrigger value="fields">Fields</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-lg sm:text-xl">Form Fields</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Add, remove, and reorder fields. Drag fields to change their order.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <Button onClick={handleAddField} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Field
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (form?.multiPageEnabled) {
                      // Check if there are fields on pages other than page 1
                      const hasFieldsOnOtherPages = fields.some(field => field.page > 1);
                      if (hasFieldsOnOtherPages) {
                        // Show confirmation dialog
                        setDisableMultiPageDialogOpen(true);
                      } else {
                        // Just disable multi-page
                        setForm(prev => prev ? { ...prev, multiPageEnabled: false } : null);
                      }
                    } else {
                      // Enable multi-page
                      setForm(prev => prev ? { ...prev, multiPageEnabled: true } : null);
                    }
                  }}
                >
                  {form?.multiPageEnabled ? 'Disable' : 'Enable'} Multi-page
                </Button>
              </div>
              
              {form?.multiPageEnabled && (
                <div className="mb-4">
                  <Button 
                    variant="outline"
                    className="w-full mb-4"
                    onClick={() => {
                      // Get the max page number from fields
                      const maxPage = Math.max(...fields.map(field => field.page || 1), 1);
                      // Add a new page
                      setFields(fields.map(field => field.page === maxPage ? { ...field, page: maxPage + 1 } : field));
                    }}
                  >
                    Add New Page
                  </Button>
                  
                  <Tabs defaultValue="1" className="w-full">
                    <TabsList className="mb-4 flex-wrap justify-start h-auto">
                      {/* Generate page tabs based on existing fields */}
                      {Array.from(
                        new Set(fields.map(f => f.page || 1))
                      ).sort((a, b) => a - b).map(page => (
                        <TabsTrigger key={page} value={page.toString()} className="mb-1">
                          Page {page}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {/* Render content for each page */}
                    {Array.from(
                      new Set(fields.map(f => f.page || 1))
                    ).sort((a, b) => a - b).map(pageNum => (
                      <TabsContent key={pageNum} value={pageNum.toString()}>
                        {loading ? (
                          <div className="space-y-3">
                            {Array(3).fill(null).map((_, i) => (
                              <Skeleton key={i} className="h-20 w-full" />
                            ))}
                          </div>
                        ) : fields.filter(f => f.page === pageNum).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No fields on page {pageNum}. Drag fields here or add new ones.</p>
                          </div>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={fields.filter(f => f.page === pageNum).map(field => field.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {fields.filter(f => f.page === pageNum).map((field) => (
                                <SortableField
                                  key={field.id}
                                  field={field}
                                  onEdit={handleEditField}
                                  onDelete={handleDeleteField}
                                  onDuplicate={handleDuplicateField}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
              
              {!form?.multiPageEnabled && (
                <>
                  {loading ? (
                    <div className="space-y-3">
                      {Array(3).fill(null).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No fields added yet. Click "Add New Field" to get started.</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={fields.map(field => field.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {fields.map((field) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            onEdit={handleEditField}
                            onDelete={handleDeleteField}
                            onDuplicate={handleDuplicateField}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between border-t pt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/forms/${formId}`)}
                className="w-full sm:w-auto"
              >
                Back to Form
              </Button>
              
              <Button
                onClick={saveFormFields}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Field Editor Dialog */}
      <FieldEditorDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        field={editingField}
        onSave={handleSaveField}
        availableFields={fields}
      />
      
      {/* Disable Multi-page Confirmation Dialog */}
      <AlertDialog open={disableMultiPageDialogOpen} onOpenChange={setDisableMultiPageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Multi-page</AlertDialogTitle>
            <AlertDialogDescription>
              You have fields on pages other than page 1. Disabling multi-page will move all fields to page 1.
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              // Disable multi-page and move all fields to page 1
              setForm(prev => prev ? { ...prev, multiPageEnabled: false } : null);
              setFields(fields.map(field => ({ ...field, page: 1 })));
              setDisableMultiPageDialogOpen(false);
              
              toast({
                title: "Multi-page Disabled",
                description: "All fields have been moved to page 1.",
              });
            }}>
              Disable Multi-page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormBuilderPage; 
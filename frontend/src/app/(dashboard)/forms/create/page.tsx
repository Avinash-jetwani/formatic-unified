'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Trash2, 
  Move, 
  EyeIcon,
  Grip,
  PencilIcon,
  X 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import slugify from 'slugify';
import clsx from 'clsx';

// Drag and drop libraries
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { fieldTypes } from '@/lib/fieldTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Form field types from the Prisma schema
enum FieldType {
  TEXT = "TEXT",
  LONG_TEXT = "LONG_TEXT",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  URL = "URL",
  NUMBER = "NUMBER",
  DATE = "DATE",
  TIME = "TIME",
  DATETIME = "DATETIME",
  RATING = "RATING",
  SLIDER = "SLIDER",
  SCALE = "SCALE",
  DROPDOWN = "DROPDOWN",
  CHECKBOX = "CHECKBOX",
  RADIO = "RADIO",
  FILE = "FILE"
}

// Form field interface
interface FormField {
  id: string; // Local ID for drag and drop
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[]; // For dropdown, radio, checkbox
  config: any; // For rating, slider, scale, etc.
  order: number;
}

// Field type definition for the sidebar
interface FieldTypeDefinition {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// Use the shared fieldTypes for the sidebar
const fieldTypeList = Object.entries(fieldTypes).map(([type, def]) => ({
  type,
  ...def
}));

// Form create page component
const FormCreatePage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState('build');
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');

  // Handler for adding a field
  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type.toLowerCase().replace('_', ' ')} field`,
      placeholder: `Enter ${type.toLowerCase().replace('_', ' ')}`,
      required: false,
      options: type === FieldType.DROPDOWN || type === FieldType.CHECKBOX || type === FieldType.RADIO 
        ? ['Option 1', 'Option 2', 'Option 3'] 
        : [],
      config: getDefaultConfig(type),
      order: fields.length
    };
    
    setEditingField(newField);
    setFieldDialogOpen(true);
  };

  // Get default configuration based on field type
  const getDefaultConfig = (type: FieldType) => {
    switch (type) {
      case FieldType.RATING:
        return { max: 5 };
      case FieldType.SLIDER:
        return { min: 0, max: 100, step: 1 };
      case FieldType.SCALE:
        return { min: 1, max: 10 };
      case FieldType.NUMBER:
        return { min: null, max: null, step: 1 };
      default:
        return {};
    }
  };

  // Handler for updating a field
  const handleUpdateField = (updatedField: FormField) => {
    // Check if the field is new (not in the fields array yet)
    const fieldExists = fields.some(field => field.id === updatedField.id);
    
    if (fieldExists) {
      // Update existing field
      setFields(fields.map(field => field.id === updatedField.id ? updatedField : field));
    } else {
      // Add new field
      setFields([...fields, updatedField]);
    }
    
    setFieldDialogOpen(false);
    setEditingField(null);
  };

  // Handler for removing a field
  const handleRemoveField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    if (editingField?.id === id) {
      setEditingField(null);
    }
  };

  // Handler for drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  // Handler for drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (over && active.id !== over.id) {
      setFields(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order values to match new positions
        return newItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Handler for saving the form
  const handleSaveForm = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form title",
        variant: "destructive"
      });
      return;
    }
    
    if (fields.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one field to your form",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // First create the form
      const formData = {
        title,
        description,
        slug: slugify(title, { lower: true, strict: true })
      };
      
      const form = await fetchApi('/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: formData
      });
      
      // Then add all fields
      for (const field of fields) {
        await fetchApi(`/forms/${(form as any).id}/fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options,
            config: typeof field.config === 'string' ? field.config : JSON.stringify(field.config ?? {}),
            order: field.order
          }
        });
      }
      
      toast({
        title: "Success",
        description: "Form created successfully",
      });
      
      // Navigate to the forms list
      router.push('/forms');
    } catch (error) {
      console.error('Failed to save form:', error);
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/forms')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Form</h1>
            <p className="text-muted-foreground">
              Build your form by adding and arranging fields
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/forms')}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveForm}
            disabled={isSaving || !title.trim() || fields.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>
      
      {/* Form title and description */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Form Title</Label>
          <Input
            id="title"
            placeholder="Enter form title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Enter form description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 h-[38px]"
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Tabs for Build and Preview */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="preview" disabled={fields.length === 0}>Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="build" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Field types sidebar */}
            <Card className="md:col-span-1 h-[calc(100vh-300px)]">
              <CardHeader>
                <CardTitle>Field Types</CardTitle>
                <CardDescription>Drag or click to add fields</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {fieldTypeList.map(fieldType => (
                      <div
                        key={fieldType.type}
                        className={clsx(
                          'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted',
                          activeDragId === fieldType.type && 'bg-muted'
                        )}
                        onClick={() => handleAddField(fieldType.type as FieldType)}
                      >
                        {fieldType.icon}
                        <span>{fieldType.label}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Form builder */}
            <div className="md:col-span-3 h-[calc(100vh-300px)] flex flex-col">
              <Card className="flex-grow overflow-hidden">
                <CardHeader>
                  <CardTitle>Form Builder</CardTitle>
                  <CardDescription>
                    {fields.length === 0
                      ? "Add fields from the sidebar to start building your form"
                      : `${fields.length} field${fields.length !== 1 ? 's' : ''} added - drag to reorder`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 border-b bg-muted/30">
                    <Label className="text-lg font-medium">{title || 'Untitled Form'}</Label>
                    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-460px)]">
                    {fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <div className="mb-2 rounded-full bg-primary/10 p-3">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium">No fields added yet</h3>
                        <p className="text-sm mt-1">Select field types from the sidebar to add them to your form</p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={[]}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-4 p-4">
                            {fields.map(field => (
                              <SortableField
                                key={field.id}
                                field={field}
                                isActive={activeDragId === field.id}
                                isEditing={editingField?.id === field.id}
                                onEdit={() => setEditingField(field)}
                                onDelete={() => handleRemoveField(field.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>{title || 'Untitled Form'}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  <p>No fields added to this form yet.</p>
                </div>
              ) : (
                fields
                  .sort((a, b) => a.order - b.order)
                  .map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {renderFieldPreview(field)}
                    </div>
                  ))
              )}
            </CardContent>
            <CardFooter>
              <Button className="ml-auto" disabled>Submit</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Field editor */}
      <FieldEditorDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        field={editingField}
        onSave={handleUpdateField}
        availableFields={fields}
      />
    </div>
  );
};

// Sortable field component for drag and drop
interface SortableFieldProps {
  field: FormField;
  isActive: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableField: React.FC<SortableFieldProps> = ({ field, isActive, isEditing, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`border rounded-md p-4 bg-card ${isActive ? 'ring-2 ring-primary' : ''} ${isEditing ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab touch-none p-1 rounded hover:bg-muted"
          >
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{field.label}</p>
              {field.required && <span className="text-destructive text-sm">*</span>}
            </div>
            <p className="text-sm text-muted-foreground">{getFieldTypeLabel(field.type)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onEdit}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Field preview */}
      <div className="mt-3 pl-9">
        {renderFieldPreview(field)}
      </div>
    </div>
  );
};

// Function to get field type label
const getFieldTypeLabel = (type: FieldType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Function to render field preview
const renderFieldPreview = (field: FormField) => {
  switch (field.type) {
    case FieldType.TEXT:
      return <Input placeholder={field.placeholder || ''} disabled />;
      
    case FieldType.LONG_TEXT:
      return <Textarea placeholder={field.placeholder || ''} disabled />;
      
    case FieldType.EMAIL:
      return <Input type="email" placeholder={field.placeholder || 'email@example.com'} disabled />;
      
    case FieldType.PHONE:
      return <Input type="tel" placeholder={field.placeholder || '(123) 456-7890'} disabled />;
      
    case FieldType.URL:
      return <Input type="url" placeholder={field.placeholder || 'https://example.com'} disabled />;
      
    case FieldType.NUMBER:
      return <Input type="number" placeholder={field.placeholder || '0'} disabled />;
      
    case FieldType.DATE:
      return <Input type="date" disabled />;
      
    case FieldType.TIME:
      return <Input type="time" disabled />;
      
    case FieldType.DATETIME:
      return <Input type="datetime-local" disabled />;
      
    case FieldType.RATING:
      return (
        <div className="flex gap-1">
          {Array.from({ length: field.config.max || 5 }).map((_, i) => (
            <div key={i} className="text-primary">★</div>
          ))}
        </div>
      );
      
    case FieldType.SLIDER:
      return (
        <div className="py-4">
          <div className="h-2 bg-muted rounded-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary" />
          </div>
        </div>
      );
      
    case FieldType.SCALE:
      return (
        <div className="flex justify-between py-2">
          {Array.from({ length: (field.config.max - field.config.min + 1) || 10 }).map((_, i) => (
            <Button
              key={i}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled
            >
              {i + (field.config.min || 1)}
            </Button>
          ))}
        </div>
      );
      
    case FieldType.DROPDOWN:
      return (
        <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled>
          <option value="" disabled selected>{field.placeholder || 'Select an option'}</option>
          {field.options.map((option, i) => (
            <option key={i} value={option}>{option}</option>
          ))}
        </select>
      );
      
    case FieldType.CHECKBOX:
      return (
        <div className="space-y-2">
          {field.options.map((option, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox id={`preview-${field.id}-${i}`} disabled />
              <Label htmlFor={`preview-${field.id}-${i}`}>{option}</Label>
            </div>
          ))}
        </div>
      );
      
    case FieldType.RADIO:
      return (
        <RadioGroup defaultValue="" className="space-y-2">
          {field.options.map((option, i) => (
            <div key={i} className="flex items-center space-x-2">
              <RadioGroupItem value={`option-${i}`} id={`preview-${field.id}-${i}`} disabled />
              <Label htmlFor={`preview-${field.id}-${i}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      );
      
    case FieldType.FILE:
      return (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
            </div>
            <input type="file" className="hidden" disabled />
          </label>
        </div>
      );
      
    default:
      return <p className="text-muted-foreground">Unsupported field type</p>;
  }
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
  
  // Update edited field when the input field changes
  useEffect(() => {
    if (field) {
      setEditedField({ ...field });
    } else {
      setEditedField(null);
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
      type: type as FieldType,
      // Reset options if new type doesn't have options
      options: fieldTypes[type].hasOptions ? editedField.options : [],
      config: getDefaultConfig(type as FieldType)
    });
  };
  
  // Reuse the getDefaultConfig function for field type changes
  function getDefaultConfig(type: FieldType) {
    switch (type) {
      case FieldType.RATING:
        return { max: 5 };
      case FieldType.SLIDER:
        return { min: 0, max: 100, step: 1 };
      case FieldType.SCALE:
        return { min: 1, max: 10 };
      case FieldType.NUMBER:
        return { min: null, max: null, step: 1 };
      default:
        return {};
    }
  }
  
  // Function to update configuration values
  const updateConfig = (key: string, value: any) => {
    setEditedField({
      ...editedField,
      config: {
        ...(editedField.config || {}),
        [key]: value
      }
    });
  };
  
  // Handler for saving the field
  const handleSave = () => {
    if (editedField && editedField.label.trim()) {
      onSave(editedField);
    }
  };
  
  // Render field configuration based on type
  const renderFieldConfig = () => {
    if (!editedField) return null;

    switch (editedField.type) {
      case FieldType.TEXT:
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('minLength', value);
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('maxLength', value);
                  }}
                  placeholder="Maximum character length"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.LONG_TEXT:
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('minLength', value);
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig('maxLength', value);
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? 4 : Number(e.target.value);
                    updateConfig('rows', value);
                  }}
                  placeholder="Number of visible rows"
                />
              </div>
            </div>
          </div>
        );
        
      case FieldType.NUMBER:
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    updateConfig('min', value);
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    updateConfig('max', value);
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : Number(e.target.value);
                    updateConfig('step', value);
                  }}
                  placeholder="Step size"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.RATING:
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
                  onChange={(e) => {
                    const max = Number(e.target.value) || 5;
                    updateConfig('max', Math.min(Math.max(max, 1), 10));
                  }}
                  placeholder="Maximum rating value"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.SCALE:
      case FieldType.SLIDER:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{editedField.type === FieldType.SCALE ? 'Scale' : 'Slider'} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">
                Min Value
              </Label>
              <div className="col-span-3">
                <Input
                  id="min"
                  type="number"
                  value={editedField.config?.min ?? '1'}
                  onChange={(e) => {
                    const min = e.target.value === '' ? 1 : Number(e.target.value);
                    updateConfig('min', min);
                  }}
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
                  onChange={(e) => {
                    const max = e.target.value === '' ? 10 : Number(e.target.value);
                    updateConfig('max', max);
                  }}
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
                  onChange={(e) => {
                    const step = e.target.value === '' ? 1 : Number(e.target.value);
                    updateConfig('step', step);
                  }}
                  placeholder="Step size"
                />
              </div>
            </div>
          </div>
        );
      
      case FieldType.CHECKBOX:
      case FieldType.RADIO:
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">{editedField.type === FieldType.CHECKBOX ? 'Checkbox' : 'Radio'} Field Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layout" className="text-right">
                Layout
              </Label>
              <div className="col-span-3">
                <Select 
                  value={editedField.config?.layout || 'vertical'}
                  onValueChange={(value) => {
                    updateConfig('layout', value);
                  }}
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
      
      case FieldType.DROPDOWN:
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
                  onCheckedChange={(checked) => {
                    updateConfig('allowSearch', checked);
                  }}
                />
                <span className="ml-2 text-sm">Allow searching in dropdown</span>
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field?.id ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>Configure the field properties</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 md:flex-row">
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
            
            {/* Options for dropdown, radio, checkbox */}
            {(editedField.type === FieldType.DROPDOWN || 
              editedField.type === FieldType.RADIO || 
              editedField.type === FieldType.CHECKBOX) && (
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <Label className="text-right self-start mt-2 md:whitespace-nowrap">
                  Options
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <Input
                      value={newOption || ''}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAddOption} 
                      type="button"
                      className="sm:w-auto w-full"
                    >
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
              
              {renderFieldPreview(editedField)}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editedField.label.trim() || ((editedField.type === FieldType.DROPDOWN || 
              editedField.type === FieldType.RADIO || 
              editedField.type === FieldType.CHECKBOX) && editedField.options.length === 0)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormCreatePage; 
'use client';

import React, { useState } from 'react';
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

// Drag and drop libraries
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Form create page component
const FormCreatePage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState('build');
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Field type definitions for the sidebar
  const fieldTypes: FieldTypeDefinition[] = [
    { type: FieldType.TEXT, label: 'Text', icon: <TextIcon />, description: 'Short text input' },
    { type: FieldType.LONG_TEXT, label: 'Long Text', icon: <LongTextIcon />, description: 'Multi-line text area' },
    { type: FieldType.EMAIL, label: 'Email', icon: <EmailIcon />, description: 'Email address input' },
    { type: FieldType.PHONE, label: 'Phone', icon: <PhoneIcon />, description: 'Phone number input' },
    { type: FieldType.URL, label: 'URL', icon: <UrlIcon />, description: 'Website URL input' },
    { type: FieldType.NUMBER, label: 'Number', icon: <NumberIcon />, description: 'Numeric input' },
    { type: FieldType.DATE, label: 'Date', icon: <DateIcon />, description: 'Date picker' },
    { type: FieldType.TIME, label: 'Time', icon: <TimeIcon />, description: 'Time picker' },
    { type: FieldType.DATETIME, label: 'Date & Time', icon: <DateTimeIcon />, description: 'Date and time picker' },
    { type: FieldType.RATING, label: 'Rating', icon: <RatingIcon />, description: 'Star rating scale' },
    { type: FieldType.SLIDER, label: 'Slider', icon: <SliderIcon />, description: 'Range slider' },
    { type: FieldType.SCALE, label: 'Scale', icon: <ScaleIcon />, description: 'Numeric scale' },
    { type: FieldType.DROPDOWN, label: 'Dropdown', icon: <DropdownIcon />, description: 'Select from options' },
    { type: FieldType.CHECKBOX, label: 'Checkbox', icon: <CheckboxIcon />, description: 'Multiple selection' },
    { type: FieldType.RADIO, label: 'Radio', icon: <RadioIcon />, description: 'Single selection' },
    { type: FieldType.FILE, label: 'File Upload', icon: <FileIcon />, description: 'File upload field' },
  ];

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
    
    setFields([...fields, newField]);
    setEditingField(newField);
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
    setFields(fields.map(field => field.id === updatedField.id ? updatedField : field));
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
        await fetchApi(`/forms/${form.id}/fields`, {
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
            config: field.config,
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
                    {fieldTypes.map(fieldType => (
                      <div
                        key={fieldType.type}
                        className="cursor-pointer p-2 border rounded-md hover:bg-accent flex flex-col items-center md:flex-row md:items-start"
                        onClick={() => handleAddField(fieldType.type)}
                      >
                        <div className="flex-shrink-0 p-1.5 bg-primary/10 rounded-md mr-0 md:mr-2 mb-1 md:mb-0">
                          {fieldType.icon}
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-sm font-medium">{fieldType.label}</p>
                          <p className="text-xs text-muted-foreground hidden md:block">{fieldType.description}</p>
                        </div>
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
      {editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Edit {getFieldTypeLabel(editingField.type)} Field</CardTitle>
                <CardDescription>Configure the field properties</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingField(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={editingField.label}
                  onChange={e => setEditingField({...editingField, label: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={editingField.placeholder || ''}
                  onChange={e => setEditingField({...editingField, placeholder: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="field-required"
                  checked={editingField.required}
                  onCheckedChange={checked => setEditingField({...editingField, required: checked})}
                />
                <Label htmlFor="field-required">Required field</Label>
              </div>
              
              {/* Options for dropdown, radio, checkbox */}
              {(editingField.type === FieldType.DROPDOWN || 
                editingField.type === FieldType.RADIO || 
                editingField.type === FieldType.CHECKBOX) && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-1">
                    {editingField.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={e => {
                            const newOptions = [...editingField.options];
                            newOptions[index] = e.target.value;
                            setEditingField({...editingField, options: newOptions});
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOptions = editingField.options.filter((_, i) => i !== index);
                            setEditingField({...editingField, options: newOptions});
                          }}
                          disabled={editingField.options.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setEditingField({
                          ...editingField,
                          options: [...editingField.options, `Option ${editingField.options.length + 1}`]
                        });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Config for numeric fields */}
              {(editingField.type === FieldType.NUMBER || 
                editingField.type === FieldType.SLIDER) && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="field-min">Min</Label>
                    <Input
                      id="field-min"
                      type="number"
                      value={editingField.config.min !== null ? editingField.config.min : ''}
                      onChange={e => {
                        const min = e.target.value === '' ? null : Number(e.target.value);
                        setEditingField({
                          ...editingField,
                          config: {...editingField.config, min}
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-max">Max</Label>
                    <Input
                      id="field-max"
                      type="number"
                      value={editingField.config.max !== null ? editingField.config.max : ''}
                      onChange={e => {
                        const max = e.target.value === '' ? null : Number(e.target.value);
                        setEditingField({
                          ...editingField,
                          config: {...editingField.config, max}
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-step">Step</Label>
                    <Input
                      id="field-step"
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={editingField.config.step || 1}
                      onChange={e => {
                        const step = Number(e.target.value) || 1;
                        setEditingField({
                          ...editingField,
                          config: {...editingField.config, step}
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              {/* Config for rating */}
              {editingField.type === FieldType.RATING && (
                <div>
                  <Label htmlFor="field-max-rating">Maximum Rating</Label>
                  <Input
                    id="field-max-rating"
                    type="number"
                    min="1"
                    max="10"
                    value={editingField.config.max || 5}
                    onChange={e => {
                      const max = Number(e.target.value) || 5;
                      setEditingField({
                        ...editingField,
                        config: {...editingField.config, max: Math.min(Math.max(max, 1), 10)}
                      });
                    }}
                    className="mt-1"
                  />
                </div>
              )}
              
              {/* Config for scale */}
              {editingField.type === FieldType.SCALE && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="field-min-scale">Min Value</Label>
                    <Input
                      id="field-min-scale"
                      type="number"
                      min="0"
                      max="9"
                      value={editingField.config.min || 1}
                      onChange={e => {
                        const min = Number(e.target.value) || 1;
                        setEditingField({
                          ...editingField,
                          config: {
                            ...editingField.config, 
                            min: Math.min(Math.max(min, 0), 9)
                          }
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-max-scale">Max Value</Label>
                    <Input
                      id="field-max-scale"
                      type="number"
                      min="1"
                      max="10"
                      value={editingField.config.max || 10}
                      onChange={e => {
                        const max = Number(e.target.value) || 10;
                        setEditingField({
                          ...editingField,
                          config: {
                            ...editingField.config, 
                            max: Math.min(Math.max(max, (editingField.config.min || 1) + 1), 10)
                          }
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setEditingField(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateField(editingField)}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
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

// Field type icon components
const TextIcon = () => <span className="text-primary">Aa</span>;
const LongTextIcon = () => <span className="text-primary">Aaa</span>;
const EmailIcon = () => <span className="text-primary">@</span>;
const PhoneIcon = () => <span className="text-primary">📞</span>;
const UrlIcon = () => <span className="text-primary">🔗</span>;
const NumberIcon = () => <span className="text-primary">123</span>;
const DateIcon = () => <span className="text-primary">📅</span>;
const TimeIcon = () => <span className="text-primary">🕒</span>;
const DateTimeIcon = () => <span className="text-primary">📅🕒</span>;
const RatingIcon = () => <span className="text-primary">★★★</span>;
const SliderIcon = () => <span className="text-primary">◎━</span>;
const ScaleIcon = () => <span className="text-primary">1-10</span>;
const DropdownIcon = () => <span className="text-primary">▼</span>;
const CheckboxIcon = () => <span className="text-primary">☑</span>;
const RadioIcon = () => <span className="text-primary">○</span>;
const FileIcon = () => <span className="text-primary">📁</span>;

export default FormCreatePage; 
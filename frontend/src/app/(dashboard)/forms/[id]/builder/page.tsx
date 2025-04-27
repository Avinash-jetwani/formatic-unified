'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Copy, Trash2, GripVertical, PlusCircle } from 'lucide-react';
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
      setEditedField({ ...field });
      setShowConditions(!!(field.conditions && field.conditions.rules && field.conditions.rules.length > 0));
    } else {
      setEditedField(null);
      setShowConditions(false);
    }
  }, [field]);
  
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
  
  // Handle save button click
  const handleSave = () => {
    if (editedField.label.trim()) {
      // If conditions are not being used, remove them
      if (!showConditions && editedField.conditions) {
        const { conditions, ...fieldWithoutConditions } = editedField;
        onSave(fieldWithoutConditions as FormField);
      } else {
        onSave(editedField);
      }
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{field && !field.id.startsWith('temp-') ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>
            Configure the field properties below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldType" className="text-right">
              Type
            </Label>
            <div className="col-span-3">
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
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldLabel" className="text-right">
              Label
            </Label>
            <div className="col-span-3">
              <Input
                id="fieldLabel"
                value={editedField.label}
                onChange={(e) => setEditedField({...editedField, label: e.target.value})}
                placeholder="Field label"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldPage" className="text-right">
              Page
            </Label>
            <div className="col-span-3">
              <Input
                id="fieldPage"
                type="number"
                min={1}
                value={editedField.page || 1}
                onChange={(e) => setEditedField({...editedField, page: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          
          {fieldTypeInfo.hasPlaceholder && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fieldPlaceholder" className="text-right">
                Placeholder
              </Label>
              <div className="col-span-3">
                <Input
                  id="fieldPlaceholder"
                  value={editedField.placeholder || ''}
                  onChange={(e) => setEditedField({...editedField, placeholder: e.target.value})}
                  placeholder="Field placeholder text"
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldRequired" className="text-right">
              Required
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch
                id="fieldRequired"
                checked={editedField.required}
                onCheckedChange={(checked) => setEditedField({...editedField, required: checked})}
              />
              <span className="ml-2 text-sm">Make this field required</span>
            </div>
          </div>
          
          {/* Conditional Logic Checkbox */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="useConditions" className="text-right">
              Conditions
            </Label>
            <div className="col-span-3 flex items-center">
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
              <Label className="text-right self-start mt-2">
                Logic
              </Label>
              <div className="col-span-3 space-y-3">
                <div className="flex items-center space-x-2">
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
                    <SelectTrigger className="w-[180px]">
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
                  <div className="space-y-2 border rounded-md p-3">
                    {editedField.conditions.rules.map((rule, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
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
                                  {field.label}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={rule.operator} 
                          onValueChange={(value) => updateConditionRule(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="notEquals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greaterThan">Greater Than</SelectItem>
                            <SelectItem value="lessThan">Less Than</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={rule.value}
                          onChange={(e) => updateConditionRule(index, 'value', e.target.value)}
                          placeholder="Value"
                        />
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeConditionRule(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic border rounded-md p-3">
                    No conditions added yet. Click "Add Rule" to create a condition.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {fieldTypeInfo.hasOptions && (
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right self-start mt-2">
                Options
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option"
                  />
                  <Button onClick={handleAddOption} type="button">
                    Add
                  </Button>
                </div>
                
                {editedField.options.length > 0 ? (
                  <div className="space-y-1 mt-2">
                    {editedField.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/40 p-2 rounded">
                        <span>{option}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(option)}
                          className="h-7 w-7"
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
        
        <DialogFooter>
          <Button 
            onClick={handleSave}
            disabled={!editedField.label.trim() || (fieldTypeInfo.hasOptions && editedField.options.length === 0)}
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
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState('fields');
  
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
      setSubmissionMessage(data.submissionMessage || '');
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
  
  // Function to save form fields
  const saveFormFields = async () => {
    if (!formId) return;
    
    setIsSaving(true);
    try {
      // Update order of fields
      const updatedFields = fields.map((field, index) => ({
        ...field,
        order: index,
      }));
      
      // Send updated fields to the server
      await fetchApi(`/forms/${formId}/fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { fields: updatedFields },
      });
      
      setFields(updatedFields);
      toast({
        title: "Success",
        description: "Form fields saved successfully",
      });
      
    } catch (error) {
      console.error('Failed to save form fields:', error);
      toast({
        title: "Error",
        description: "Failed to save form fields",
        variant: "destructive"
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
      page: 1,
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
  const handleDeleteField = (field: FormField) => {
    setFields(fields.filter(f => f.id !== field.id));
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
  const handleSaveField = async (updatedField: FormField) => {
    // Check if it's a new field (with a temporary ID)
    const isNewField = updatedField.id.startsWith('temp-');

    try {
      let savedField: FormField;

      if (isNewField) {
        // Exclude id and formId from the POST body
        const { id, formId, ...fieldData } = updatedField;
        savedField = await fetchApi<FormField>(`/forms/${formId}/fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            ...fieldData,
            config: typeof fieldData.config === 'string' ? fieldData.config : JSON.stringify(fieldData.config ?? {}),
            order: fields.length, // Set order to the end
          },
        });

        // Add the new field to the list
        setFields([...fields, savedField]);

      } else {
        // For updating an existing field, only send allowed properties
        // to avoid validation errors
        const { label, type, placeholder, required, options, config } = updatedField;
        const fieldUpdateData = {
          label,
          type,
          placeholder,
          required,
          options,
          config: typeof config === 'string' ? config : JSON.stringify(config ?? {}),
          order: updatedField.order
        };

        // Update an existing field
        savedField = await fetchApi<FormField>(`/forms/${formId}/fields/${updatedField.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          data: fieldUpdateData,
        });

        // Update the field in the list
        setFields(fields.map(f => f.id === savedField.id ? savedField : f));
      }

      toast({
        title: "Success",
        description: `Field ${isNewField ? 'added' : 'updated'} successfully`,
      });

    } catch (error) {
      console.error('Failed to save field:', error);
      toast({
        title: "Error",
        description: `Failed to ${isNewField ? 'add' : 'update'} field`,
        variant: "destructive"
      });
    }
  };
  
  // Function to save form settings
  const saveFormSettings = async () => {
    setIsSaving(true);
    try {
      await fetchApi(`/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          submissionMessage,
          category: form?.category,
          tags: form?.tags,
          isTemplate: form?.isTemplate,
          successRedirectUrl: form?.successRedirectUrl,
          multiPageEnabled: form?.multiPageEnabled
        }
      });
      
      toast({
        title: "Success",
        description: "Form settings saved successfully",
      });
    } catch (error) {
      console.error('Failed to save form settings:', error);
      toast({
        title: "Error",
        description: "Failed to save form settings",
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
            onClick={() => router.push(`/forms/${formId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {loading ? <Skeleton className="h-8 w-48" /> : `Form Builder: ${form?.title || 'Untitled Form'}`}
            </h1>
            <div className="text-muted-foreground">
              {loading ? <Skeleton className="h-4 w-64 mt-1" /> : 'Customize your form fields'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${formId}/preview`)}
          >
            Preview
          </Button>
          <Button
            onClick={saveFormFields}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>
                Add, remove, and reorder fields. Drag fields to change their order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={handleAddField} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Field
                </Button>
              </div>
              
              <div className="mb-4">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setForm(prev => prev ? { ...prev, multiPageEnabled: !prev.multiPageEnabled } : null);
                    if (form?.multiPageEnabled) {
                      // If turning off multi-page, set all fields to page 1
                      setFields(fields.map(field => ({ ...field, page: 1 })));
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
                    className="w-full"
                    onClick={() => {
                      // Get the max page number from fields
                      const maxPage = fields.reduce((max, field) => Math.max(max, field.page || 1), 1);
                      // Add a new page
                      setFields(fields.map(field => field.page === maxPage ? { ...field, page: maxPage + 1 } : field));
                    }}
                  >
                    Add New Page
                  </Button>
                </div>
              )}
              
              {form?.multiPageEnabled && (
                <div className="mb-4">
                  <Tabs defaultValue="1" className="w-full">
                    <TabsList className="mb-4 flex-wrap">
                      {Array.from(new Set(fields.map(f => f.page))).sort((a, b) => a - b).map(page => (
                        <TabsTrigger key={page} value={page.toString()}>
                          Page {page}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {Array.from(new Set(fields.map(f => f.page))).sort((a, b) => a - b).map(pageNum => (
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
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/forms/${formId}`)}
              >
                Back to Form
              </Button>
              
              <Button
                onClick={saveFormFields}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>
                Configure additional settings for your form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="formCategory">Category</Label>
                  <Input
                    id="formCategory"
                    placeholder="Enter category (e.g., Contact, Survey)"
                    className="mt-1"
                    value={form?.category || ''}
                    onChange={(e) => setForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Categorize your form for easier organization.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="formTags">Tags</Label>
                  <Input
                    id="formTags"
                    placeholder="Enter tags separated by commas"
                    className="mt-1"
                    value={form?.tags?.join(', ') || ''}
                    onChange={(e) => setForm(prev => prev ? { 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
                    } : null)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Add tags to help with searching and filtering forms.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="formSubmissionMsg">Submission Message</Label>
                  <Textarea
                    id="formSubmissionMsg"
                    placeholder="Thank you for your submission!"
                    className="mt-1"
                    value={submissionMessage}
                    onChange={(e) => setSubmissionMessage(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This message will be shown to users after they submit the form.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="formRedirect" 
                      checked={!!form?.successRedirectUrl}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setForm(prev => prev ? { ...prev, successRedirectUrl: undefined } : null);
                        } else {
                          setForm(prev => prev ? { ...prev, successRedirectUrl: 'https://' } : null);
                        }
                      }}
                    />
                    <Label htmlFor="formRedirect">Custom success redirect</Label>
                  </div>
                  
                  {form?.successRedirectUrl && (
                    <div className="pl-6">
                      <Input
                        id="formSuccessUrl"
                        placeholder="https://example.com/thank-you"
                        value={form.successRedirectUrl}
                        onChange={(e) => setForm(prev => prev ? { ...prev, successRedirectUrl: e.target.value } : null)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Redirect users to a custom URL after form submission.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="formIsTemplate" 
                      checked={!!form?.isTemplate}
                      onCheckedChange={(checked) => {
                        setForm(prev => prev ? { ...prev, isTemplate: checked } : null);
                      }}
                    />
                    <Label htmlFor="formIsTemplate">Save as template</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    Make this form available as a template for future forms.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="formRecaptcha" />
                  <Label htmlFor="formRecaptcha">Enable reCAPTCHA</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="formNotifications" />
                  <Label htmlFor="formNotifications">Email notifications</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto" onClick={saveFormSettings} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
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
    </div>
  );
};

export default FormBuilderPage; 
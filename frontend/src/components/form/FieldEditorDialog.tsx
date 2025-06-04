import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Input,
} from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { fieldTypes } from '@/lib/fieldTypes';
import { useToast } from '@/components/ui/use-toast';

export interface FormField {
  id: string;
  formId?: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
  config: any;
  order: number;
  page?: number;
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

interface FieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
  availableFields: FormField[];
  multiPageEnabled?: boolean;
}

export const FieldEditorDialog: React.FC<FieldEditorDialogProps> = ({ 
  open, 
  onOpenChange, 
  field, 
  onSave,
  availableFields,
  multiPageEnabled = true
}) => {
  const [editedField, setEditedField] = useState<FormField | null>(null);
  const [newOption, setNewOption] = useState('');
  const [showConditions, setShowConditions] = useState(false);
  const { toast } = useToast();
  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogDescription>
            Configure your form field settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Configuration panel */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="fieldType" className="sm:text-right md:whitespace-nowrap">
                Field Type
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Select value={editedField.type} onValueChange={handleTypeChange}>
                  <SelectTrigger id="fieldType">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypes).map(([type, { label, description }]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex flex-col">
                          <span className="font-medium">{label}</span>
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
            
            {multiPageEnabled && (
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
                      {Array.from({ length: Math.max(...availableFields.map(f => f.page || 1), 1) + 1 }).map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Page {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
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
            
            {/* Conditional Logic Toggle */}
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
            
            {/* Options for fields that have them */}
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
              
              <Input 
                id="preview-field"
                placeholder={editedField.placeholder || 'Enter text'} 
                disabled 
              />
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
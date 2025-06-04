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
import { Plus, X } from 'lucide-react';
import { fieldTypes } from '@/lib/fieldTypes';
import { useToast } from '@/components/ui/use-toast';

/** Re-usable FormField interface shared between create & builder pages */
export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
  config: any;
  order: number;
  page?: number;
  // conditional logic (optional)
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
  /** all fields currently in the draft (used for page numbers & conditions) */
  availableFields: FormField[];
  /** if false we hide the Page selector */
  multiPageEnabled?: boolean;
}

/**
 * Shared Field-Editor dialog used by both the initial Create-Form page and the Builder page.
 * It contains the full set of settings: options, config per-type, conditional logic etc.
 */
export const FieldEditorDialog: React.FC<FieldEditorDialogProps> = ({
  open,
  onOpenChange,
  field,
  onSave,
  availableFields,
  multiPageEnabled = true,
}) => {
  const [editedField, setEditedField] = useState<FormField | null>(null);
  const [newOption, setNewOption] = useState('');
  const { toast } = useToast();

  /* initialise */
  useEffect(() => {
    if (field) {
      let parsedConfig = field.config;
      if (typeof parsedConfig === 'string') {
        try {
          parsedConfig = JSON.parse(parsedConfig);
        } catch {
          parsedConfig = {};
        }
      }
      setEditedField({ ...field, config: parsedConfig });
    } else {
      setEditedField(null);
    }
  }, [field]);

  if (!editedField) return null;

  /* Helpers */
  const updateConfig = (key: string, value: any) => {
    setEditedField({
      ...editedField,
      config: {
        ...(editedField.config || {}),
        [key]: value,
      },
    });
  };

  /* option handlers */
  const handleAddOption = () => {
    if (newOption.trim() && !editedField.options.includes(newOption.trim())) {
      setEditedField({
        ...editedField,
        options: [...editedField.options, newOption.trim()],
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (opt: string) => {
    setEditedField({
      ...editedField,
      options: editedField.options.filter((o) => o !== opt),
    });
  };

  /* field-type change */
  const handleTypeChange = (type: string) => {
    setEditedField({
      ...editedField,
      type,
      options: fieldTypes[type]?.hasOptions ? editedField.options : [],
    });
  };

  /* save */
  const handleSaveClick = () => {
    if (!editedField.label.trim()) {
      toast({ title: 'Error', description: 'Label is required', variant: 'destructive' });
      return;
    }

    // ensure page defaults to 1 when multipage disabled
    const page = multiPageEnabled ? editedField.page || 1 : 1;

    onSave({ ...editedField, page });
    onOpenChange(false);
  };

  const ft = fieldTypes[editedField.type] || { label: 'Unknown', hasOptions: false, hasPlaceholder: false };

  /* === render helpers === */
  const renderFieldConfig = () => {
    switch (editedField.type) {
      case 'TEXT':
      case 'LONG_TEXT':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Character Limits</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Min</Label>
              <Input
                type="number"
                value={editedField.config?.minLength || ''}
                onChange={(e) => updateConfig('minLength', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max</Label>
              <Input
                type="number"
                value={editedField.config?.maxLength || ''}
                onChange={(e) => updateConfig('maxLength', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        );
      case 'NUMBER':
        return (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium">Number Settings</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Min</Label>
              <Input
                type="number"
                value={editedField.config?.min ?? ''}
                onChange={(e) => updateConfig('min', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max</Label>
              <Input
                type="number"
                value={editedField.config?.max ?? ''}
                onChange={(e) => updateConfig('max', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  /* === JSX === */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>Configure your form field</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <Select value={editedField.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fieldTypes).map(([key, v]) => (
                  <SelectItem key={key} value={key}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Label</Label>
            <Input
              className="col-span-3"
              value={editedField.label}
              onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
            />
          </div>

          {/* Placeholder */}
          {ft.hasPlaceholder && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Placeholder</Label>
              <Input
                className="col-span-3"
                value={editedField.placeholder || ''}
                onChange={(e) => setEditedField({ ...editedField, placeholder: e.target.value })}
              />
            </div>
          )}

          {/* Required */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Required</Label>
            <Switch
              checked={editedField.required}
              onCheckedChange={(checked) => setEditedField({ ...editedField, required: checked })}
            />
          </div>

          {/* Page selector */}
          {multiPageEnabled && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Page</Label>
              <Select
                value={String(editedField.page || 1)}
                onValueChange={(v) => setEditedField({ ...editedField, page: parseInt(v, 10) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.max(...availableFields.map((f) => f.page || 1), 1) + 1 }).map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Page {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Options for option-based fields */}
          {ft.hasOptions && (
            <div className="space-y-2 border-t pt-4 mt-4">
              <h4 className="font-medium">Options</h4>
              {editedField.options.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => setEditedField({
                      ...editedField,
                      options: editedField.options.map((o) => (o === opt ? e.target.value : o)),
                    })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(opt)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="New option"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                />
                <Button variant="outline" size="icon" onClick={handleAddOption} disabled={!newOption.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Type-specific config */}
          {renderFieldConfig()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveClick}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
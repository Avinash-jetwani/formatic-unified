export interface FieldTypeInfo {
  label: string;
  description: string;
  icon: string;
  hasOptions: boolean;
  hasPlaceholder: boolean;
}

export const fieldTypes: Record<string, FieldTypeInfo> = {
  TEXT: {
    label: 'Text',
    description: 'Short text input',
    icon: 'Aa',
    hasOptions: false,
    hasPlaceholder: true,
  },
  LONG_TEXT: {
    label: 'Long Text',
    description: 'Multi-line text input',
    icon: '¶',
    hasOptions: false,
    hasPlaceholder: true,
  },
  EMAIL: {
    label: 'Email',
    description: 'Email address input',
    icon: '@',
    hasOptions: false,
    hasPlaceholder: true,
  },
  PHONE: {
    label: 'Phone',
    description: 'Phone number input',
    icon: '☎',
    hasOptions: false,
    hasPlaceholder: true,
  },
  NUMBER: {
    label: 'Number',
    description: 'Numeric input',
    icon: '#',
    hasOptions: false,
    hasPlaceholder: true,
  },
  DATE: {
    label: 'Date',
    description: 'Date selector',
    icon: '📅',
    hasOptions: false,
    hasPlaceholder: false,
  },
  TIME: {
    label: 'Time',
    description: 'Time selector',
    icon: '🕒',
    hasOptions: false,
    hasPlaceholder: false,
  },
  DATETIME: {
    label: 'Date & Time',
    description: 'Date and time selector',
    icon: '📅🕒',
    hasOptions: false,
    hasPlaceholder: false,
  },
  CHECKBOX: {
    label: 'Checkbox',
    description: 'Multiple choice selection',
    icon: '☑',
    hasOptions: true,
    hasPlaceholder: false,
  },
  RADIO: {
    label: 'Radio',
    description: 'Single choice selection',
    icon: '⚪',
    hasOptions: true,
    hasPlaceholder: false,
  },
  DROPDOWN: {
    label: 'Dropdown',
    description: 'Dropdown selection',
    icon: '▼',
    hasOptions: true,
    hasPlaceholder: true,
  },
  RATING: {
    label: 'Rating',
    description: 'Star rating selection',
    icon: '★',
    hasOptions: false,
    hasPlaceholder: false,
  },
  SCALE: {
    label: 'Scale',
    description: 'Scale (range) input',
    icon: '⎯⎯⎯',
    hasOptions: false,
    hasPlaceholder: false,
  },
  SLIDER: {
    label: 'Slider',
    description: 'Slider input',
    icon: '⇄',
    hasOptions: false,
    hasPlaceholder: false,
  },
  FILE: {
    label: 'File Upload',
    description: 'File upload field',
    icon: '📁',
    hasOptions: false,
    hasPlaceholder: false,
  },
}; 
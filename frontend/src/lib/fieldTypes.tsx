import React from 'react';

export interface FieldTypeInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
  hasOptions: boolean;
  hasPlaceholder: boolean;
}

export const fieldTypes: Record<string, FieldTypeInfo> = {
  TEXT: {
    label: 'Text',
    description: 'Short text input',
    icon: <span className="text-sm">Aa</span>,
    hasOptions: false,
    hasPlaceholder: true,
  },
  LONG_TEXT: {
    label: 'Long Text',
    description: 'Multi-line text input',
    icon: <span className="text-sm">¶</span>,
    hasOptions: false,
    hasPlaceholder: true,
  },
  EMAIL: {
    label: 'Email',
    description: 'Email address input',
    icon: <span className="text-sm">@</span>,
    hasOptions: false,
    hasPlaceholder: true,
  },
  PHONE: {
    label: 'Phone',
    description: 'Phone number input',
    icon: <span className="text-sm">☎</span>,
    hasOptions: false,
    hasPlaceholder: true,
  },
  NUMBER: {
    label: 'Number',
    description: 'Numeric input',
    icon: <span className="text-sm">#</span>,
    hasOptions: false,
    hasPlaceholder: true,
  },
  DATE: {
    label: 'Date',
    description: 'Date selector',
    icon: <span className="text-sm">📅</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
  TIME: {
    label: 'Time',
    description: 'Time selector',
    icon: <span className="text-sm">🕒</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
  DATETIME: {
    label: 'Date & Time',
    description: 'Date and time selector',
    icon: <span className="text-sm">📅🕒</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
  CHECKBOX: {
    label: 'Checkbox',
    description: 'Multiple choice selection',
    icon: <span className="text-sm">☑</span>,
    hasOptions: true,
    hasPlaceholder: false,
  },
  RADIO: {
    label: 'Radio',
    description: 'Single choice selection',
    icon: <span className="text-sm">⚪</span>,
    hasOptions: true,
    hasPlaceholder: false,
  },
  DROPDOWN: {
    label: 'Dropdown',
    description: 'Dropdown selection',
    icon: <span className="text-sm">▼</span>,
    hasOptions: true,
    hasPlaceholder: true,
  },
  RATING: {
    label: 'Rating',
    description: 'Star rating selection',
    icon: <span className="text-sm">★</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
  SCALE: {
    label: 'Scale',
    description: 'Scale (range) input',
    icon: <span className="text-sm">⎯⎯⎯</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
  SLIDER: {
    label: 'Slider',
    description: 'Slider input',
    icon: <span className="text-sm">⇄</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
  FILE: {
    label: 'File Upload',
    description: 'File upload field',
    icon: <span className="text-sm">📁</span>,
    hasOptions: false,
    hasPlaceholder: false,
  },
}; 
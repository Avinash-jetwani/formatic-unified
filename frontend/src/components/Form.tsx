'use client';

import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import { FaChevronDown, FaPlus, FaTrash, FaStar, FaUpload, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { Form as FormType } from '@/lib/forms';
import { fetchApi } from '@/services/api';

interface FormProps {
  form: {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
    multiPageEnabled?: boolean;
  };
}

interface FormFieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: (string | FormFieldOption)[];
  maxRating?: number;
  fileTypes?: string;
  page?: number;
  config?: {
    min?: number;
    max?: number;
    step?: number;
    [key: string]: any;
  };
}

// Helper type guard
function isOptionObject(option: any): option is FormFieldOption {
  return option && typeof option === 'object' && 'value' in option && 'label' in option;
}

export function Form({ form }: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);

  // Get the maximum page number from form fields
  useEffect(() => {
    if (form?.fields?.length) {
      const maxPageNum = Math.max(...form.fields.map(field => field.page || 1));
      setMaxPage(maxPageNum);
    }
  }, [form]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleNextPage = () => {
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    }
  };

  const validateCurrentPage = () => {
    const currentPageFields = form.fields.filter(field => (field.page || 1) === currentPage);
    
    for (const field of currentPageFields) {
      if (field.required) {
        const value = formData[field.id];
        
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          setError(`Please fill in the required field: ${field.label}`);
          return false;
        }
        
        if (field.type === 'CHECKBOX' && Array.isArray(value) && value.length === 0) {
          setError(`Please select at least one option for: ${field.label}`);
          return false;
        }
      }
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're not on the last page, proceed to next page
    if (form.multiPageEnabled && currentPage < maxPage) {
      if (validateCurrentPage()) {
        handleNextPage();
      }
      return;
    }
    
    // Final validation before submission
    if (!validateCurrentPage()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      await fetchApi(`/submissions`, {
        method: 'POST',
        data: {
          formId: form.id,
          data: formData
        }
      });
      setSuccess(true);
      setFormData({});
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      value: formData[field.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        handleInputChange(field.id, e.target.value),
      className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200',
      placeholder: field.placeholder || ''
    };

    switch (field.type) {
      case 'TEXT':
        return <input type="text" {...commonProps} />;
      case 'LONG_TEXT':
        return <textarea {...commonProps} rows={4} className={`${commonProps.className} resize-none`} />;
      case 'EMAIL':
        return <input type="email" {...commonProps} />;
      case 'PHONE':
        return <input type="tel" {...commonProps} />;
      case 'URL':
        return <input type="url" {...commonProps} />;
      case 'NUMBER':
        return <input type="number" {...commonProps} />;
      case 'DATE':
        return <input
          id={field.id}
          type="date"
          value={formData[field.id] || ''}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm md:text-base"
          required={field.required}
        />;
      case 'TIME':
        return <input
          id={field.id}
          type="time"
          value={formData[field.id] || ''}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm md:text-base"
          required={field.required}
        />;
      case 'DATETIME':
        return <input
          id={field.id}
          type="datetime-local"
          value={formData[field.id] || ''}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm md:text-base"
          required={field.required}
        />;
      case 'RATING':
        return (
          <div className="flex space-x-2 items-center">
            {Array.from({ length: (typeof (field as any).maxRating === 'number' ? (field as any).maxRating : 5) }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleInputChange(field.id, index + 1)}
                className={classNames(
                  "w-10 h-10 flex items-center justify-center text-2xl transition-all",
                  formData[field.id] === index + 1
                    ? "text-yellow-400 scale-110"
                    : "text-gray-400 hover:text-yellow-300 hover:scale-105"
                )}
                aria-label={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
              >
                <FaStar />
              </button>
            ))}
          </div>
        );
      case 'SLIDER':
        return (
          <div className="pt-2 pb-4">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        );
      case 'SCALE':
        return (
          <div className="pt-2 pb-4">
            <input
              type="range"
              min={field.config?.min || 1}
              max={field.config?.max || 10}
              step={field.config?.step || 1}
              value={formData[field.id] || field.config?.min || 1}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{field.config?.min || 1}</span>
              <span>{Math.floor(((field.config?.min || 1) + (field.config?.max || 10)) / 2)}</span>
              <span>{field.config?.max || 10}</span>
            </div>
          </div>
        );
      case 'DROPDOWN':
        return (
          <div className="relative z-10">
            <select
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200 appearance-none pl-3 pr-10 py-2 cursor-pointer text-gray-900 dark:text-gray-100 dark:bg-gray-800"
              style={{ minHeight: 48 }}
            >
              <option value="" disabled style={{ color: '#888' }}>{field.placeholder || 'Select an option'}</option>
              {field.options?.map(option => {
                let value: string, label: string;
                if (typeof option === 'string') {
                  value = option;
                  label = option;
                } else if (isOptionObject(option)) {
                  value = option.value;
                  label = option.label;
                } else {
                  return null;
                }
                return (
                  <option key={value} value={value}>{label}</option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <FaChevronDown className="text-gray-400" />
            </div>
          </div>
        );
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.options?.map(option => {
              const currentValues = formData[field.id] || [];
              let value: string, label: string;
              if (typeof option === 'string') {
                value = option;
                label = option;
              } else if (isOptionObject(option)) {
                value = option.value;
                label = option.label;
              } else {
                return null;
              }
              return (
                <label
                  key={value}
                  className="flex items-center space-x-3 text-gray-200 hover:text-white"
                >
                  <input
                    type="checkbox"
                    value={value}
                    checked={currentValues.includes(value)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...currentValues, value]
                        : currentValues.filter((v: string) => v !== value);
                      handleInputChange(field.id, newValues);
                    }}
                    className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        );
      case 'RADIO':
        return (
          <div className="space-y-2">
            {field.options?.map(option => {
              let value: string, label: string;
              if (typeof option === 'string') {
                value = option;
                label = option;
              } else if (isOptionObject(option)) {
                value = option.value;
                label = option.label;
              } else {
                return null;
              }
              return (
                <label
                  key={value}
                  className="flex items-center space-x-3 text-gray-200 hover:text-white"
                >
                  <input
                    type="radio"
                    value={value}
                    checked={formData[field.id] === value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="h-5 w-5 border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        );
      case 'FILE':
        return (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor={field.id} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>Upload a file</span>
                  <input 
                    id={field.id}
                    name={field.id}
                    type="file" 
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleInputChange(field.id, file);
                      }
                    }}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {formData[field.id]?.name || 'PNG, JPG, PDF up to 10MB'}
              </p>
            </div>
          </div>
        );
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 sm:p-8 md:p-10 transition-all">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <svg className="h-10 w-10 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mb-2">Thank you!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Your form has been submitted successfully.</p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({});
              setCurrentPage(1); // Reset to first page
            }}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  // Filter fields by current page
  const currentPageFields = form.fields?.filter(field => (field.page || 1) === currentPage) || [];

  return (
    <div className="w-full max-w-xl mx-auto">
      <form 
        onSubmit={(e) => {
          // Always prevent default form submission
          e.preventDefault();
          // Only proceed with submission on the last page
          if (!form.multiPageEnabled || currentPage === maxPage) {
            handleSubmit(e);
          }
        }} 
        className="space-y-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-6 sm:px-6 sm:py-8 md:p-10 transition-all"
      >
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{form.description}</p>
          )}
          
          {/* Page indicator for multi-page forms */}
          {form.multiPageEnabled && maxPage > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Page {currentPage} of {maxPage}</span>
              </div>
              <div className="flex space-x-1">
                {Array.from({ length: maxPage }).map((_, i) => (
                  <div 
                    key={i} 
                    className={classNames(
                      "w-2 h-2 rounded-full",
                      currentPage === i + 1 
                        ? "bg-blue-500" 
                        : "bg-gray-300 dark:bg-gray-600"
                    )} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {currentPageFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <div className="flex justify-between items-start">
                <label htmlFor={field.id} className="block text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.description && (
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2 italic">{field.description}</span>
                )}
              </div>

              {field.type === 'TEXT' && (
                <input
                  id={field.id}
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'LONG_TEXT' && (
                <textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                />
              )}

              {field.type === 'EMAIL' && (
                <input
                  id={field.id}
                  type="email"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'PHONE' && (
                <input
                  id={field.id}
                  type="tel"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'URL' && (
                <input
                  id={field.id}
                  type="url"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'NUMBER' && (
                <input
                  id={field.id}
                  type="number"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'DATE' && (
                <input
                  id={field.id}
                  type="date"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm md:text-base"
                  required={field.required}
                />
              )}

              {field.type === 'TIME' && (
                <input
                  id={field.id}
                  type="time"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm md:text-base"
                  required={field.required}
                />
              )}

              {field.type === 'DATETIME' && (
                <input
                  id={field.id}
                  type="datetime-local"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm md:text-base"
                  required={field.required}
                />
              )}

              {field.type === 'RATING' && (
                <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
                  {Array.from({ length: (typeof (field as any).maxRating === 'number' ? (field as any).maxRating : 5) }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange(field.id, index + 1)}
                      className={classNames(
                        "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl transition-all",
                        formData[field.id] === index + 1
                          ? "text-yellow-400 scale-110"
                          : "text-gray-400 hover:text-yellow-300 hover:scale-105"
                      )}
                      aria-label={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              )}

              {field.type === 'SLIDER' && (
                <div className="pt-2 pb-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              )}

              {field.type === 'SCALE' && (
                <div className="pt-2 pb-4">
                  <input
                    type="range"
                    min={field.config?.min || 1}
                    max={field.config?.max || 10}
                    step={field.config?.step || 1}
                    value={formData[field.id] || field.config?.min || 1}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{field.config?.min || 1}</span>
                    <span>{Math.floor(((field.config?.min || 1) + (field.config?.max || 10)) / 2)}</span>
                    <span>{field.config?.max || 10}</span>
                  </div>
                </div>
              )}

              {field.type === 'DROPDOWN' && (
                <div className="relative z-10">
                  <select
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200 appearance-none pl-3 pr-10 py-2 cursor-pointer text-gray-900 dark:text-gray-100 dark:bg-gray-800"
                    style={{ minHeight: 48 }}
                  >
                    <option value="" disabled style={{ color: '#888' }}>{field.placeholder || 'Select an option'}</option>
                    {field.options?.map(option => {
                      let value: string, label: string;
                      if (typeof option === 'string') {
                        value = option;
                        label = option;
                      } else if (isOptionObject(option)) {
                        value = option.value;
                        label = option.label;
                      } else {
                        return null;
                      }
                      return (
                        <option key={value} value={value}>{label}</option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <FaChevronDown className="text-gray-400" />
                  </div>
                </div>
              )}

              {field.type === 'CHECKBOX' && (
                <div className="space-y-2">
                  {field.options?.map(option => {
                    const currentValues = formData[field.id] || [];
                    let value: string, label: string;
                    if (typeof option === 'string') {
                      value = option;
                      label = option;
                    } else if (isOptionObject(option)) {
                      value = option.value;
                      label = option.label;
                    } else {
                      return null;
                    }
                    return (
                      <label
                        key={value}
                        className="flex items-center space-x-2 sm:space-x-3 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={value}
                          checked={currentValues.includes(value)}
                          onChange={(e) => {
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter((v: string) => v !== value);
                            handleInputChange(field.id, newValues);
                          }}
                          className="h-4 w-4 sm:h-5 sm:w-5 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm sm:text-base">{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {field.type === 'RADIO' && (
                <div className="space-y-2">
                  {field.options?.map(option => {
                    let value: string, label: string;
                    if (typeof option === 'string') {
                      value = option;
                      label = option;
                    } else if (isOptionObject(option)) {
                      value = option.value;
                      label = option.label;
                    } else {
                      return null;
                    }
                    return (
                      <label
                        key={value}
                        className="flex items-center space-x-2 sm:space-x-3 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <input
                          type="radio"
                          value={value}
                          checked={formData[field.id] === value}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="h-4 w-4 sm:h-5 sm:w-5 border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm sm:text-base">{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {field.type === 'FILE' && (
                <div className="mt-1 flex justify-center px-3 sm:px-6 pt-3 sm:pt-5 pb-4 sm:pb-6 border-2 border-dashed border-gray-600 rounded-md hover:border-gray-500 transition-all bg-gray-700/50">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-xs sm:text-sm text-gray-300 justify-center">
                      <label
                        htmlFor={`file-upload-${field.id}`}
                        className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id={`file-upload-${field.id}`}
                          name={`file-upload-${field.id}`}
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleInputChange(field.id, e.target.files[0]);
                            }
                          }}
                          ref={el => { (fileInputRefs.current as Record<string, HTMLInputElement | null | undefined>)[field.id] = el; }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {('fileTypes' in field && (field as any).fileTypes) || 'PNG, JPG, GIF up to 10MB'}
                    </p>
                    {formData[field.id] && (
                      <p className="text-xs sm:text-sm text-gray-200 mt-2 truncate max-w-full">
                        Selected: {formData[field.id].name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded mt-6 sm:mt-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex justify-between">
          {/* Previous page button (only show on pages after the first) */}
          {form.multiPageEnabled && currentPage > 1 && (
            <button
              type="button"
              onClick={handlePrevPage}
              className="py-2 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-md shadow-sm text-base sm:text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Previous
            </button>
          )}

          {/* Submit or Next button */}
          <button
            type="button"
            onClick={(e) => {
              if (form.multiPageEnabled && currentPage < maxPage) {
                // Prevent form submission
                e.preventDefault();
                if (validateCurrentPage()) {
                  handleNextPage();
                }
              } else {
                // For the last page or non-multipage form, handle submission via form's onSubmit
                handleSubmit(e);
              }
            }}
            className={classNames(
              "py-2 sm:py-3 px-3 sm:px-4 border border-transparent rounded-md shadow-sm text-base sm:text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center",
              form.multiPageEnabled && currentPage < maxPage ? "ml-auto" : "w-full justify-center"
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : form.multiPageEnabled && currentPage < maxPage ? (
              <>
                Next <FaArrowRight className="ml-2" />
              </>
            ) : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
} 
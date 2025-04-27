'use client';

import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import { FaChevronDown, FaPlus, FaTrash, FaStar, FaUpload } from 'react-icons/fa';
import { Form as FormType } from '@/lib/forms';
import { fetchApi } from '@/services/api';

interface FormProps {
  form: FormType;
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
  options?: FormFieldOption[];
  maxRating?: number;
  fileTypes?: string;
}

// Helper type guard
function isOptionObject(option: any): option is { value: string; label: string } {
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

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        return <input type="date" {...commonProps} />;
      case 'TIME':
        return <input type="time" {...commonProps} />;
      case 'DATETIME':
        return <input type="datetime-local" {...commonProps} />;
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
      case 'SCALE':
        return (
          <div className="pt-2 pb-4">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              {...commonProps}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        );
      case 'DROPDOWN':
        return (
          <div className="relative">
            <select
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200 appearance-none pl-3 pr-10 py-2 cursor-pointer text-gray-900 dark:text-gray-100 dark:bg-gray-800"
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
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center py-12 max-w-md mx-auto">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-5">
          <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank you!</h2>
        <p className="text-gray-600 mb-6">Your submission has been received. We'll get back to you soon!</p>
        <button 
          onClick={() => window.location.reload()} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-8 bg-gray-800 text-white shadow-lg w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white">{form.title}</h2>
      {form.description && (
        <p className="mb-6 text-gray-200 text-lg">{form.description}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {form.fields.map(field => (
            <div key={field.id} className="form-field">
              <label
                htmlFor={field.id}
                className="block text-lg font-medium text-gray-200 mb-2"
              >
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {('description' in field && field.description) && (
                <p className="text-gray-300 mb-2 text-sm">{String((field as any).description)}</p>
              )}

              {field.type === 'TEXT' && (
                <input
                  id={field.id}
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'LONG_TEXT' && (
                <textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={field.placeholder}
                  rows={5}
                  required={field.required}
                />
              )}

              {field.type === 'EMAIL' && (
                <input
                  id={field.id}
                  type="email"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  required={field.required}
                />
              )}

              {field.type === 'TIME' && (
                <input
                  id={field.id}
                  type="time"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  required={field.required}
                />
              )}

              {field.type === 'DATETIME' && (
                <input
                  id={field.id}
                  type="datetime-local"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  required={field.required}
                />
              )}

              {field.type === 'RATING' && (
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

              {field.type === 'DROPDOWN' && (
                <div className="relative">
                  <select
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200 appearance-none pl-3 pr-10 py-2 cursor-pointer text-gray-900 dark:text-gray-100 dark:bg-gray-800"
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
              )}

              {field.type === 'FILE' && (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-600 rounded-md hover:border-gray-500 transition-all bg-gray-700/50">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-300"
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
                    <div className="flex text-sm text-gray-300">
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
                      <p className="text-sm text-gray-200 mt-2">
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
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
} 
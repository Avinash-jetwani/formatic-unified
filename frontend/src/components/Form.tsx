'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import { FaChevronDown, FaPlus, FaTrash, FaStar, FaUpload, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { Form as FormType } from '@/lib/forms';
import { fetchApi } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { safeRenderFile, getFileUrl, normalizeFileObject } from '@/lib/fileUtils';

interface FormProps {
  form: {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
    multiPageEnabled?: boolean;
    submissionMessage?: string;
    successRedirectUrl?: string;
    
    // New form settings
    expirationDate?: string;
    maxSubmissions?: number;
    requireConsent?: boolean;
    consentText?: string;
    accessRestriction?: 'none' | 'email' | 'password';
    submissionCount?: number;
    allowedEmails?: string[];
    accessPassword?: string;
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
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  
  // New state variables for form access control
  const [accessPassword, setAccessPassword] = useState('');
  const [showPassword, setShowPassword] = useState(form.accessRestriction === 'password');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [formExpired, setFormExpired] = useState(false);
  const [maxSubmissionsReached, setMaxSubmissionsReached] = useState(false);
  const [emailCheckPassed, setEmailCheckPassed] = useState(false);

  // Create state variables for email validation at the component level to avoid hooks-related errors
  const [emailForAccess, setEmailForAccess] = useState('');
  const [emailInputError, setEmailInputError] = useState<string | null>(null);
  const [isCheckingEmailAccess, setIsCheckingEmailAccess] = useState(false);
  
  // Create a function to validate email format
  const validateEmailFormat = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Create a simplified email validation function that can be reused
  const validateAndProcessEmail = (email: string) => {
    // Reset error
    setEmailInputError(null);
    
    // Basic validation
    if (!email.trim()) {
      setEmailInputError('Please enter your email address');
      return false;
    }
    
    if (!validateEmailFormat(email)) {
      setEmailInputError('Please enter a valid email address');
      return false;
    }
    
    // Store the email in formData so it will be included in the submission
    setFormData(prev => ({
      ...prev,
      emailAccess: email
    }));
    
    // Check if the email is in the allowed list
    const allowedEmails = form.allowedEmails || [];
    console.log("Validating email against allowed list:", { email, allowedEmails });
    
    if (allowedEmails.length > 0) {
      const isAllowed = allowedEmails.some(
        allowedEmail => allowedEmail.toLowerCase() === email.toLowerCase()
      );
      
      console.log("Email validation result:", { email, isAllowed });
      
      if (!isAllowed) {
        setEmailInputError(`The email address "${email}" is not authorized to access this form.`);
        return false;
      }
    }
    
    return true;
  };
  
  // Handle email submission 
  const handleEmailAccessSubmit = () => {
    setIsCheckingEmailAccess(true);
    
    try {
      const isEmailValid = validateAndProcessEmail(emailForAccess);
      
      if (isEmailValid) {
        setEmailCheckPassed(true);
      }
    } catch (err) {
      console.error('Email validation error:', err);
      setEmailInputError('There was an error validating your email. Please try again.');
    } finally {
      setIsCheckingEmailAccess(false);
    }
  };
  
  // Create a useEffect to log and debug the email value changes only when needed
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug("Email access value updated:", emailForAccess);
    }
  }, [emailForAccess]);

  // Create a ref for the email input field
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus on the email input when the form is shown
  useEffect(() => {
    if (form.accessRestriction === 'email' && !emailCheckPassed && emailInputRef.current) {
      // Small delay to ensure the input is fully rendered
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [form.accessRestriction, emailCheckPassed]);

  // Restore the original handleInputChange function for form fields
  const handleInputChange = (fieldId: string, value: any) => {
    // Special handling for files
    if (value instanceof File) {
      handleFileUpload(fieldId, value);
      return;
    }
    
    // Normal handling for other field types
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear any field errors when the user changes a value
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  // Keep our email-specific input handler separate
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailForAccess(e.target.value);
  };

  // Add a debug effect to log form props
  useEffect(() => {
    if (form.accessRestriction === 'email') {
      console.log('Form access restriction:', form.accessRestriction);
      console.log('Allowed emails list:', form.allowedEmails);
    }
  }, [form.accessRestriction, form.allowedEmails]);

  // Get the maximum page number from form fields
  useEffect(() => {
    if (form?.fields?.length) {
      const maxPageNum = Math.max(...form.fields.map(field => field.page || 1));
      setMaxPage(maxPageNum);
    }
  }, [form]);

  // Check for form expiration or max submissions
  useEffect(() => {
    // Check for form expiration - use UTC comparison for consistency
    if (form.expirationDate) {
      const expiration = new Date(form.expirationDate);
      const now = new Date();
      if (expiration < now) {
        setFormExpired(true);
      }
    }
    
    // Check for max submissions reached
    if (form.maxSubmissions && form.submissionCount && form.submissionCount >= form.maxSubmissions) {
      setMaxSubmissionsReached(true);
    }
  }, [form]);

  // Handle redirect after submission if successRedirectUrl is set
  useEffect(() => {
    if (success && form.successRedirectUrl) {
      // Redirect after a small delay to ensure the success state is shown briefly
      const redirectTimer = setTimeout(() => {
        window.location.href = form.successRedirectUrl as string;
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [success, form.successRedirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow submission if the form is expired or max submissions reached
    if (formExpired) {
      setError('This form has expired and is no longer accepting submissions');
      return;
    }
    
    if (maxSubmissionsReached) {
      setError('This form has reached its maximum number of submissions');
      return;
    }
    
    // If password protection is enabled but password not yet validated
    if (form.accessRestriction === 'password' && showPassword) {
      if (!accessPassword) {
        setPasswordError('Please enter the password');
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Validate password against the form's password
        if (accessPassword !== form.accessPassword) {
          setPasswordError('Invalid password');
          setIsSubmitting(false);
          return;
        }
        
        // Password is correct, show the form
        setShowPassword(false);
        setIsSubmitting(false);
        return; // Don't submit the form yet, just show the actual form
      } catch (err) {
        setPasswordError('Invalid password');
        setIsSubmitting(false);
        return;
      }
    }
    
    // CRITICAL FIX: If email validation has already passed (emailCheckPassed is true),
    // don't re-validate it here - just proceed with submission
    if (form.accessRestriction === 'email' && !emailCheckPassed) {
      setError('Please enter an authorized email address to access this form');
      return;
    }
    
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
    
    // Check if all required file uploads are complete
    const requiredFileFields = form.fields
      .filter(field => field.type === 'FILE' && field.required);
    
    for (const field of requiredFileFields) {
      if (!formData[field.id] || !Array.isArray(formData[field.id]) || formData[field.id].length === 0) {
        setFieldErrors(prev => ({
          ...prev,
          [field.id]: 'Please upload at least one file'
        }));
        return;
      }
    }
    
    // If file is currently uploading, prevent submission
    if (isFileUploading) {
      toast({
        title: "Upload in progress",
        description: "Please wait for file uploads to complete before submitting the form.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Collect analytics data
      const getBrowser = () => {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf("Firefox") > -1) return "Firefox";
        if (userAgent.indexOf("Chrome") > -1) return "Chrome";
        if (userAgent.indexOf("Safari") > -1) return "Safari";
        if (userAgent.indexOf("Edge") > -1) return "Edge";
        if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
        return "Unknown";
      };
      
      const getDeviceType = () => {
        const userAgent = navigator.userAgent;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
          return "Mobile";
        }
        if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(userAgent)) {
          return "Tablet";
        }
        return "Desktop";
      };
      
      // Always use the validated email if we're in email restriction mode and validation passed
      let emailFieldValue = null;
      
      if (form.accessRestriction === 'email') {
        // We've already validated this email, so use it directly
        emailFieldValue = emailForAccess;
        console.log("Using pre-validated email for submission:", emailFieldValue);
      } else {
        // For non-email restricted forms, look for an email in the form data
        if (formData.emailAccess) {
          emailFieldValue = formData.emailAccess;
        } else {
          // Look for any field that contains a valid email
          for (const [fieldId, value] of Object.entries(formData)) {
            if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              emailFieldValue = value;
              break;
            }
          }
        }
      }
      
      console.log("Submitting with email:", emailFieldValue);
      
      // Prepare the submission data for the final submission
      // This is the critical fix - ensure all required fields are included
      const submissionPayload = {
        formId: form.id,
        data: formData,
        // Add access control and consent data
        consentGiven: form.requireConsent ? consentGiven : true,
        accessPassword: form.accessRestriction === 'password' ? accessPassword : undefined,
        // CRITICAL: Always include the validated email
        emailAccess: emailFieldValue,
        // Analytics data
        ipAddress: null, // We'll get this from the server side
        userAgent: navigator.userAgent,
        referrer: document.referrer || window.location.href,
        browser: getBrowser(),
        device: getDeviceType(),
        location: null, // We'll get this from the server side
        // If we already have a submissionId from file uploads, include it
        ...(submissionId ? { submissionId } : {})
      };
      
      console.log("Complete submission payload:", submissionPayload);
      
      await fetchApi(`/forms/public/${form.id}/submit`, {
        method: 'POST',
        data: submissionPayload
      });
      
      setSuccess(true);
      setFormData({});
    } catch (err: any) {
      console.error('Form submission error:', err);
      
      // Handle email validation error from backend
      if (err.message && (
        err.message.includes('email') || 
        err.message.includes('authorized') || 
        err.message.includes('allowed'))
      ) {
        // Show the email form again
        setEmailCheckPassed(false);
        // Set a more user-friendly error message
        setEmailInputError('The email address you provided is not authorized to access this form.');
        setError('The email address you provided is not authorized to access this form.');
      } else {
        setError(err.message || 'Failed to submit form. Please try again.');
      }
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
                onClick={(e) => handleInputChange(field.id, index + 1)}
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
                    onChange={(e) => handleInputChange(field.id, value)}
                    className="h-5 w-5 border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        );
      case 'FILE':
        const fieldFiles = Array.isArray(formData[field.id]) ? formData[field.id] : [];
        
        // Parse config if it's a string
        let fieldConfig = field.config || {};
        if (typeof field.config === 'string') {
          try {
            fieldConfig = JSON.parse(field.config);
          } catch (e) {
            console.error('Error parsing field config:', e);
            // If parsing fails, use default values
          }
        }
        
        const maxFiles = fieldConfig?.maxFiles || 1;
        const hasReachedMaxFiles = fieldFiles.length >= maxFiles;
        const isUploading = isFileUploading && uploadProgress[field.id] !== undefined;
        const currentProgress = uploadProgress[field.id] || 0;
        
        return (
          <div className="space-y-3">
            {/* List of uploaded files */}
            {fieldFiles.length > 0 && (
              <div className="space-y-2">
                {fieldFiles.map((file: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700 truncate">{safeRenderFile(file)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(field.id, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload progress bar */}
            {isUploading && (
              <div className="w-full">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Uploading: {currentProgress}%</p>
              </div>
            )}
            
            {/* Error message */}
            {fileErrors[field.id] && (
              <p className="text-sm text-red-500">{fileErrors[field.id]}</p>
            )}
            
            {/* Upload button */}
            {!hasReachedMaxFiles && !isUploading && (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
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
                            handleFileUpload(field.id, file);
                          }
                        }}
                        ref={el => { fileInputRefs.current[field.id] = el; }}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {fieldConfig?.allowedTypes === 'images' 
                      ? 'JPG, PNG, GIF up to ' 
                      : fieldConfig?.allowedTypes === 'documents'
                        ? 'PDF, DOC, DOCX up to '
                        : fieldConfig?.allowedTypes === 'custom' && fieldConfig?.customTypes
                          ? `${fieldConfig.customTypes} up to `
                          : 'Any file type up to '
                    }
                    {fieldConfig?.maxSize || 10}MB
                    {maxFiles > 1 ? ` (Max ${maxFiles} files)` : ''}
                  </p>
                </div>
              </div>
            )}
            
            {/* Max files message */}
            {hasReachedMaxFiles && !isUploading && (
              <p className="text-sm text-amber-600">
                Maximum number of files reached ({maxFiles}). Remove a file to upload another one.
              </p>
            )}
          </div>
        );
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  // Add a password form render function
  const renderPasswordForm = () => {
    return (
      <div className="form-password-protection p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">{form.title} - Password Protected</h2>
        <p className="mb-4 text-gray-700">This form is password-protected. Please enter the password to access it.</p>
        
        <div className="mb-4">
          <label htmlFor="form-password" className="block mb-2 text-sm font-medium text-gray-900">
            Password
          </label>
          <div className="relative">
            <input 
              type={isPasswordVisible ? "text" : "password"}
              id="form-password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              className="w-full p-2 border rounded-md text-gray-900 bg-white pr-10"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {isPasswordVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>
        
        <button 
          type="button"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Checking...' : 'Submit'}
        </button>
      </div>
    );
  };
  
  // Add rendering for form expiration and max submissions
  const renderFormUnavailable = () => {
    let message = '';
    
    if (formExpired) {
      message = 'This form has expired and is no longer accepting submissions.';
    } else if (maxSubmissionsReached) {
      message = 'This form has reached its maximum number of submissions and is no longer accepting new responses.';
    }
    
    return (
      <div className="form-unavailable p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{form.title}</h2>
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          <p className="font-medium">{message}</p>
        </div>
      </div>
    );
  };

  // Log the form configuration on first render
  useEffect(() => {
    console.log('Form config:', {
      id: form.id,
      title: form.title,
      accessRestriction: form.accessRestriction,
      allowedEmails: form.allowedEmails
    });
  }, [form]);

  // Add the missing EmailProtectionForm component
  const EmailProtectionForm = () => {
    // Form submission handler that ensures email is stored in formData
    const onFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Make sure email is in formData
      setFormData(prev => ({
        ...prev,
        emailAccess: emailForAccess
      }));
      
      // Proceed with validation and submission
      handleEmailAccessSubmit();
    };
    
    return (
      <div className="p-5 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {form.title || 'Form'} - Email Required
        </h2>
        
        <p className="mb-4 text-gray-600">
          This form requires an authorized email address to submit. Please enter your email to proceed.
        </p>
        
        <form onSubmit={onFormSubmit}>
          <div className="mb-4">
            <label 
              htmlFor="email-access-input" 
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            
            <input 
              type="email"
              id="email-access-input"
              value={emailForAccess}
              onChange={handleEmailChange}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
              placeholder="Enter your email address"
              autoFocus
            />
            
            {emailInputError && (
              <p className="mt-2 text-sm text-red-600">
                {emailInputError}
              </p>
            )}
          </div>
          
          <button 
            type="submit"
            className={`bg-blue-500 text-white px-4 py-2 rounded ${isCheckingEmailAccess ? 'opacity-70 cursor-wait' : 'hover:bg-blue-600'}`}
            disabled={isCheckingEmailAccess}
          >
            {isCheckingEmailAccess ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    );
  };

  // Add the missing renderEmailAccessForm function
  const renderEmailAccessForm = () => {
    return <EmailProtectionForm />;
  };

  // Reset function for email validation
  const resetEmailValidation = useCallback(() => {
    setEmailCheckPassed(false);
    setEmailForAccess('');
    setEmailInputError(null);
  }, []);
  
  // Add Effect to reset email form when there's an error related to emails
  useEffect(() => {
    if (
      error && 
      form.accessRestriction === 'email' && 
      (error.includes('email') || error.includes('authorized') || error.includes('allowed'))
    ) {
      setEmailCheckPassed(false);
      setEmailInputError(error);
    }
  }, [error, form.accessRestriction]);
  
  // Reset email validation when the form changes
  useEffect(() => {
    if (form.accessRestriction === 'email') {
      setEmailCheckPassed(false);
      setEmailForAccess('');
      setEmailInputError(null);
    }
  }, [form.id, form.accessRestriction]);

  // Page navigation functions
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
    
    // Check for GDPR consent on the last page
    if (form.requireConsent && currentPage === maxPage && !consentGiven) {
      setError('Please provide consent to submit this form');
      
      // Find the consent checkbox element and scroll to it
      const consentCheckbox = document.getElementById('consent-checkbox');
      if (consentCheckbox) {
        consentCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        consentCheckbox.focus();
      }
      
      return false;
    }
    
    setError(null);
    return true;
  };

  // Handle file upload
  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!file) return;
    
    // Clear previous errors for this field
    setFileErrors(prev => ({ ...prev, [fieldId]: '' }));
    
    // Find the field config
    const field = form.fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // Parse config if it's a string
    let fieldConfig = field.config || {};
    if (typeof field.config === 'string') {
      try {
        fieldConfig = JSON.parse(field.config);
      } catch (e) {
        console.error('Error parsing field config:', e);
        // If parsing fails, use default values
      }
    }
    
    // Check file size limit (10MB default unless configured otherwise)
    const maxSize = (fieldConfig?.maxSize || 10) * 1024 * 1024; // Convert MB to bytes
    
    if (file.size > maxSize) {
      setFileErrors(prev => ({
        ...prev,
        [fieldId]: `File too large. Maximum size is ${fieldConfig?.maxSize || 10}MB.`
      }));
      return;
    }
    
    // Check file type if restricted
    if (fieldConfig?.allowedTypes && fieldConfig.allowedTypes !== 'all') {
      let allowed = false;
      
      if (fieldConfig.allowedTypes === 'images' && file.type.startsWith('image/')) {
        allowed = true;
      } else if (fieldConfig.allowedTypes === 'documents' && 
                (file.type === 'application/pdf' || 
                 file.type.includes('word') || 
                 file.type.includes('doc'))) {
        allowed = true;
      } else if (fieldConfig.allowedTypes === 'custom' && fieldConfig.customTypes) {
        const customTypes = (fieldConfig.customTypes || '').split(',').map((t: string) => t.trim());
        const ext = file.name.split('.').pop()?.toLowerCase();
        allowed = customTypes.some((type: string) => type.includes(ext || ''));
      }
      
      if (!allowed) {
        setFileErrors(prev => ({
          ...prev,
          [fieldId]: `File type not allowed. Allowed types: ${
            fieldConfig.allowedTypes === 'images' 
              ? 'Images (jpg, png, gif)' 
              : fieldConfig.allowedTypes === 'documents'
                ? 'Documents (pdf, doc, docx)'
                : fieldConfig.customTypes || 'Unknown'
          }`
        }));
        return;
      }
    }
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      formData.append('formId', form.id);
      
      // If we have a submission ID, use it, otherwise it will be generated on the server
      if (submissionId) {
        formData.append('submissionId', submissionId);
      }
      
      setIsFileUploading(true);
      setUploadProgress(prev => ({ ...prev, [fieldId]: 0 }));
      
      // Upload to our Next.js API route - these routes forward to the backend
      const uploadEndpoint = submissionId 
        ? `/api/uploads/form/${form.id}/submission/${submissionId}`
        : `/api/uploads`;
      
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fieldId]: percentComplete }));
        }
      });
      
      // Set up completion handler
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          const response = JSON.parse(xhr.responseText);
          
          // If this was a new submission, save the ID
          if (response.submissionId && !submissionId) {
            setSubmissionId(response.submissionId);
          }
          
          // Save the file info in the form data
          setFormData(prev => {
            // If field already has files, append to array
            if (Array.isArray(prev[fieldId])) {
              return {
                ...prev,
                [fieldId]: [...prev[fieldId], {
                  name: file.name,
                  url: response.url,
                  size: response.size,
                  key: response.key,
                  type: file.type
                }]
              };
            } else {
              // Otherwise create new array
              return {
                ...prev,
                [fieldId]: [{
                  name: file.name,
                  url: response.url,
                  size: response.size,
                  key: response.key,
                  type: file.type
                }]
              };
            }
          });
          
          setUploadProgress(prev => ({ ...prev, [fieldId]: 100 }));
          
          // Clear the file input to allow the same file to be uploaded again
          if (fileInputRefs.current[fieldId]) {
            fileInputRefs.current[fieldId].value = '';
          }
        } else {
          // Error
          let errorMessage = 'Upload failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage = errorResponse.error || errorMessage;
          } catch (e) {
            // If can't parse, use generic error
          }
          setFileErrors(prev => ({ ...prev, [fieldId]: errorMessage }));
        }
        
        setIsFileUploading(false);
      });
      
      // Set up error handler
      xhr.addEventListener('error', () => {
        setFileErrors(prev => ({ ...prev, [fieldId]: 'Network error during upload' }));
        setIsFileUploading(false);
      });
      
      // Open and send the request
      xhr.open('POST', uploadEndpoint, true);
      xhr.send(formData);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setFileErrors(prev => ({ ...prev, [fieldId]: 'Failed to process file upload' }));
      setIsFileUploading(false);
    }
  };
  
  // Remove a file from the uploaded files list
  const handleRemoveFile = (fieldId: string, fileIndex: number) => {
    setFormData(prev => {
      if (!Array.isArray(prev[fieldId])) return prev;
      
      const newFiles = [...prev[fieldId]];
      newFiles.splice(fileIndex, 1);
      
      return {
        ...prev,
        [fieldId]: newFiles
      };
    });
  };

  if (success) {
    // Show the success message and then redirect if applicable
    return (
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 sm:p-8 md:p-10 transition-all">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <svg className="h-10 w-10 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mb-2">Thank you!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {form.submissionMessage || "Your form has been submitted successfully."}
          </p>
          {!form.successRedirectUrl && (
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
          )}
          {form.successRedirectUrl && (
            <p className="text-sm text-gray-500">Redirecting you shortly...</p>
          )}
        </div>
      </div>
    );
  }

  if (formExpired || maxSubmissionsReached) {
    return renderFormUnavailable();
  }
  
  if (form.accessRestriction === 'password' && showPassword) {
    return renderPasswordForm();
  }

  if (form.accessRestriction === 'email' && !emailCheckPassed) {
    // Use the component-based approach for better reliability
    return renderEmailAccessForm();
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
                      onClick={(e) => handleInputChange(field.id, index + 1)}
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
                          onChange={(e) => handleInputChange(field.id, value)}
                          className="h-4 w-4 sm:h-5 sm:w-5 border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm sm:text-base">{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {field.type === 'FILE' && (
                renderField(field)
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

        {form.requireConsent && currentPage === maxPage && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  id="consent-checkbox"
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    if (e.target.checked) {
                      setError(null); // Clear error when consent is given
                    }
                  }}
                  className={`h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${!consentGiven && error && error.includes('consent') ? 'border-red-500 ring-2 ring-red-500' : ''}`}
                  aria-required="true"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="consent-checkbox" className={`font-medium ${!consentGiven && error && error.includes('consent') ? 'text-red-600 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {form.consentText || 'I consent to having this website store my submitted information.'}
                </label>
                {error && error.includes('consent') && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500 font-semibold">
                    You must agree to the consent statement to proceed.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex justify-between">
          {/* Previous page button (only show on pages after the first) */}
          {form.multiPageEnabled && currentPage > 1 && (
            <button
              type="button"
              onClick={() => {
                if (validateCurrentPage()) {
                  handlePrevPage();
                }
              }}
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
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AtSign, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Call the auth service to send password reset email
      const response = await authService.forgotPassword(email);
      setSuccessMessage(response.message || 'Password reset email has been sent if the email exists in our system.');
      setEmail(''); // Clear the form
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding & info (hidden on mobile) */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary to-primary/80 text-white lg:flex lg:flex-col lg:justify-between p-8">
        <div>
          <h1 className="text-3xl font-bold">Formatic</h1>
          <p className="mt-2 text-primary-foreground/90">Streamlined form management</p>
        </div>
        
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6">Reset your password</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Easy recovery</h3>
                <p className="text-sm text-primary-foreground/80">
                  Reset your password in just a few simple steps.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Secure process</h3>
                <p className="text-sm text-primary-foreground/80">
                  Your account security is our top priority.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-primary-foreground/70">
          &copy; {new Date().getFullYear()} Formatic. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full p-4 flex items-center justify-center lg:w-1/2 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="rounded-full bg-primary h-12 w-12 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">F</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border shadow-sm p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Forgot your password?</h1>
              <p className="text-muted-foreground mt-2">
                Enter your email address below and we'll send you a link to reset your password.
              </p>
            </div>
            
            {successMessage && (
              <div className="mb-6 p-4 rounded-md bg-success/10 border border-success text-success flex items-start">
                <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive text-destructive flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary hover:text-primary/90 inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
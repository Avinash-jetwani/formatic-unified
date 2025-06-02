'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AtSign, Lock, LogIn, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Call the auth service to login
      await authService.login(email, password, rememberMe);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid email or password. Please try again.');
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
          <Logo size="lg" />
          <p className="mt-2 text-primary-foreground/90">Streamlined form management</p>
        </div>
        
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6">Welcome back!</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Sign in to access your forms, submissions, and analytics.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Create powerful forms</h3>
                <p className="text-sm text-primary-foreground/80">
                  Build custom forms with our intuitive drag-and-drop interface.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Collect responses</h3>
                <p className="text-sm text-primary-foreground/80">
                  Gather and organize submissions in a centralized database.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Analyze results</h3>
                <p className="text-sm text-primary-foreground/80">
                  Gain insights with powerful analytics and visualization tools.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-primary-foreground/70">
          &copy; {new Date().getFullYear()} Datizmo. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full p-4 flex items-center justify-center lg:w-1/2 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          
          <div className="bg-card rounded-lg border shadow-sm p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Sign in to Datizmo</h1>
              <p className="text-muted-foreground mt-2">
                Enter your credentials to access your account
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
              
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    name="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm cursor-pointer"
                  >
                    Keep me signed in<span className="hidden md:inline"> on this device</span>
                  </label>
                </div>
                
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/90">
                    Forgot password?
                  </Link>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Sign in
                    </>
                  )}
                </Button>
              </div>
            </form>
            

          </div>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary/90">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/logo';
import { 
  AtSign, 
  Lock, 
  User, 
  Building,
  Phone,
  Globe,
  Check, 
  AlertCircle, 
  Github, 
  Twitter,
  Eye,
  EyeOff,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = Basic info, 2 = Additional info

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    hasCapital: false,
    hasNumber: false,
    hasSpecial: false,
    isLongEnough: false,
    notTooLong: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear email error when email is changed
    if (name === 'email') {
      setEmailError('');
    }
    
    // Check password strength on change
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validatePassword = (password: string) => {
    setPasswordValidation({
      hasCapital: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
      isLongEnough: password.length >= 8,
      notTooLong: password.length <= 16
    });
  };

  const isPasswordStrong = () => {
    const { hasCapital, hasNumber, hasSpecial, isLongEnough, notTooLong } = passwordValidation;
    return hasCapital && hasNumber && hasSpecial && isLongEnough && notTooLong;
  };

  const getPasswordStrength = () => {
    const { hasCapital, hasNumber, hasSpecial, isLongEnough, notTooLong } = passwordValidation;
    const validCount = [hasCapital, hasNumber, hasSpecial, isLongEnough, notTooLong].filter(Boolean).length;
    
    if (validCount <= 1) return { strength: 'weak', color: 'bg-destructive' };
    if (validCount <= 3) return { strength: 'medium', color: 'bg-warning' };
    if (validCount <= 4) return { strength: 'good', color: 'bg-info' };
    return { strength: 'strong', color: 'bg-success' };
  };

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email) return false;
    
    setIsCheckingEmail(true);
    setEmailError('');
    
    try {
      // Call the auth service to check if email exists
      const exists = await authService.checkEmailExists(email);
      
      if (exists) {
        setEmailError('This email is already registered. Please use a different email or sign in.');
        return true;
      }
      
      return false;
    } catch (err) {
      setEmailError('Unable to verify email. Please try again.');
      return true;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const goToNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate first step
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (!isPasswordStrong()) {
      setError('Please create a stronger password.');
      return;
    }
    
    // Check if email is already registered
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      return;
    }
    
    setError('');
    setStep(2);
  };

  const goToPreviousStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Call the auth service to register the user
      await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        company: formData.company,
        phone: formData.phone,
        website: formData.website
      });
      
      setSuccessMessage('Account created successfully! Redirecting to dashboard...');
      
      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Sign up form */}
      <div className="w-full lg:w-1/2 p-4 flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          
          <div className="bg-card rounded-lg border shadow-sm p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-muted-foreground mt-2">
                Join Datizmo and start creating powerful forms
              </p>
            </div>
            
            {/* Progress steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    1
                  </div>
                  <span className="text-xs mt-1">Personal Info</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${step === 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    2
                  </div>
                  <span className="text-xs mt-1">Additional Info</span>
                </div>
              </div>
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
            
            <form onSubmit={step === 1 ? goToNextStep : handleSubmit} className="space-y-5">
              {step === 1 ? (
                // Step 1: Basic Info
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="firstName" className="block text-sm font-medium">
                        First name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          className="pl-10"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label htmlFor="lastName" className="block text-sm font-medium">
                        Last name
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
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
                        className={cn("pl-10", emailError && "border-destructive focus-visible:ring-destructive")}
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => formData.email && checkEmailExists(formData.email)}
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs text-destructive mt-1 flex items-center">
                        <X className="h-3.5 w-3.5 mr-1" /> {emailError}
                      </p>
                    )}
                    {isCheckingEmail && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <svg className="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking email...
                      </p>
                    )}
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
                        autoComplete="new-password"
                        required
                        className="pl-10 pr-10"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setPasswordFocus(true)}
                        onBlur={() => setPasswordFocus(false)}
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
                    
                    {/* Password strength meter */}
                    {formData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getPasswordStrength().color} transition-all duration-300`} 
                              style={{ width: `${(Object.values(passwordValidation).filter(Boolean).length / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium capitalize">{getPasswordStrength().strength}</span>
                        </div>
                        
                        {/* Password requirements */}
                        <div className={`bg-card border rounded-md p-3 space-y-2 transition-all duration-300 ${passwordFocus || formData.password ? 'opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden'}`}>
                          <p className="text-xs font-medium mb-2">Password must contain:</p>
                          <ul className="space-y-1 text-xs">
                            <li className="flex items-center space-x-2">
                              {passwordValidation.isLongEnough ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={passwordValidation.isLongEnough ? 'text-success' : 'text-muted-foreground'}>
                                At least 8 characters
                              </span>
                            </li>
                            <li className="flex items-center space-x-2">
                              {passwordValidation.notTooLong ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={passwordValidation.notTooLong ? 'text-success' : 'text-muted-foreground'}>
                                Maximum 16 characters
                              </span>
                            </li>
                            <li className="flex items-center space-x-2">
                              {passwordValidation.hasCapital ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={passwordValidation.hasCapital ? 'text-success' : 'text-muted-foreground'}>
                                At least one capital letter
                              </span>
                            </li>
                            <li className="flex items-center space-x-2">
                              {passwordValidation.hasNumber ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={passwordValidation.hasNumber ? 'text-success' : 'text-muted-foreground'}>
                                At least one number
                              </span>
                            </li>
                            <li className="flex items-center space-x-2">
                              {passwordValidation.hasSpecial ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={passwordValidation.hasSpecial ? 'text-success' : 'text-muted-foreground'}>
                                At least one special character
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium">
                      Confirm password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        className={`pl-10 pr-10 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-destructive mt-1 flex items-center">
                        <X className="h-3.5 w-3.5 mr-1" /> Passwords do not match
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        isCheckingEmail ||
                        !!emailError ||
                        !formData.firstName ||
                        !formData.lastName ||
                        !formData.email ||
                        !formData.password ||
                        !formData.confirmPassword ||
                        formData.password !== formData.confirmPassword ||
                        !isPasswordStrong()
                      }
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                // Step 2: Additional Info
                <>
                  <div className="space-y-1">
                    <label htmlFor="company" className="block text-sm font-medium">
                      Company (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="company"
                        name="company"
                        type="text"
                        className="pl-10"
                        placeholder="Acme Inc."
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-sm font-medium">
                      Phone number (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="pl-10"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="website" className="block text-sm font-medium">
                      Website (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        className="pl-10"
                        placeholder="https://yourcompany.com"
                        value={formData.website}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 mt-6">
                    <Checkbox
                      id="terms"
                      name="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      required
                    />
                    <label 
                      htmlFor="terms" 
                      className="text-sm cursor-pointer mt-1"
                    >
                      I agree to the{' '}
                      <Link
                        href="/terms"
                        className="font-medium text-primary hover:text-primary/90"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        className="font-medium text-primary hover:text-primary/90"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className="w-1/3"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !agreeToTerms}
                      className="w-2/3"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or sign up with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  <Twitter className="h-5 w-5 mr-2" />
                  Twitter
                </Button>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/90">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right side - Branding & info (hidden on mobile) */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary to-primary/80 text-white lg:flex lg:flex-col lg:justify-between p-8">
        <div>
          <Logo size="lg" />
          <p className="mt-2 text-primary-foreground/90">Streamlined form management</p>
        </div>
        
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6">Start your journey</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Create an account and unlock the full potential of Datizmo's form management platform.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Free 14-day trial</h3>
                <p className="text-sm text-primary-foreground/80">
                  Test all premium features with no credit card required.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Unlimited forms</h3>
                <p className="text-sm text-primary-foreground/80">
                  Create as many forms as you need with our flexible plans.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Premium support</h3>
                <p className="text-sm text-primary-foreground/80">
                  Get dedicated help from our customer success team.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 bg-white/10 rounded-lg p-6">
            <blockquote className="italic text-primary-foreground/90">
              "Datizmo has revolutionized how we collect and manage customer feedback. It's become an essential tool for our business."
            </blockquote>
            <div className="mt-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-primary-foreground font-medium">AJ</span>
              </div>
              <div className="ml-3">
                <p className="font-medium">Alex Johnson</p>
                <p className="text-sm text-primary-foreground/70">Product Manager, TechCorp</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-primary-foreground/70">
          &copy; {new Date().getFullYear()} Datizmo. All rights reserved.
        </div>
      </div>
    </div>
  );
} 
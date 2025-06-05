'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  Zap,
  Building,
  GraduationCap,
  Store,
  HeartPulse,
  Plane,
  UserCheck,
  FileText,
  Mail,
  Calendar,
  ShoppingCart,
  Heart,
  MessageSquare,
  UserPlus,
  CreditCard,
  Briefcase,
  Award,
  Gift,
  MapPin,
  Phone,
  Camera,
  Music,
  Gamepad2,
  Car,
  Home,
  Utensils,
  Dumbbell,
  BookOpen,
  Palette,
  Code,
  Laptop,
  Smartphone,
  Globe,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
  Rocket,
  Crown,
  Sparkles,
  ArrowRight,
  Eye,
  Copy,
  Download,
  Share2,
  ChevronDown,
  X,
  Check,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Logo from '@/components/ui/logo';

// Template interface (same as dashboard version)
interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  industry: string;
  complexity: 'Simple' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  popularity: number;
  rating: number;
  tags: string[];
  icon: React.ReactNode;
  preview: string[];
  fields: {
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    config?: any;
    order: number;
  }[];
  isNew?: boolean;
  isTrending?: boolean;
}

// Same comprehensive template data as dashboard version
const TEMPLATE_GALLERY: FormTemplate[] = [
  // Business Templates
  {
    id: 'customer-feedback-pro',
    title: 'Customer Feedback Pro',
    description: 'Advanced customer feedback form with NPS scoring, satisfaction ratings, and detailed analytics',
    category: 'Business',
    industry: 'General',
    complexity: 'Intermediate',
    estimatedTime: '2 min',
    popularity: 95,
    rating: 4.9,
    tags: ['feedback', 'nps', 'customer-service', 'analytics'],
    icon: <MessageSquare className="h-6 w-6" />,
    preview: ['Name & Contact', 'Service Rating', 'NPS Score', 'Detailed Feedback', 'Follow-up Preferences'],
    isTrending: true,
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "RADIO", label: "Overall Satisfaction", options: ["Extremely Satisfied", "Very Satisfied", "Satisfied", "Dissatisfied", "Very Dissatisfied"], required: true, order: 2 },
      { type: "RADIO", label: "How likely are you to recommend us? (0-10)", options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], required: true, order: 3 },
      { type: "CHECKBOX", label: "What did you like most?", options: ["Product Quality", "Customer Service", "Pricing", "Delivery Speed", "User Experience"], required: false, order: 4 },
      { type: "LONG_TEXT", label: "Additional Comments", placeholder: "Please share any additional feedback...", required: false, order: 5 }
    ]
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation Form',
    description: 'Convert visitors into leads with this optimized form designed for maximum conversions',
    category: 'Business',
    industry: 'Marketing',
    complexity: 'Simple',
    estimatedTime: '1 min',
    popularity: 88,
    rating: 4.8,
    tags: ['leads', 'marketing', 'conversion', 'sales'],
    icon: <TrendingUp className="h-6 w-6" />,
    preview: ['Contact Info', 'Company Details', 'Interest Level', 'Budget Range', 'Timeline'],
    isNew: true,
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Business Email", placeholder: "your.email@company.com", required: true, order: 1 },
      { type: "TEXT", label: "Company Name", placeholder: "Your company", required: true, order: 2 },
      { type: "PHONE", label: "Phone Number", placeholder: "+1 (555) 123-4567", required: false, order: 3 },
      { type: "DROPDOWN", label: "Company Size", options: ["1-10 employees", "11-50 employees", "51-200 employees", "201-1000 employees", "1000+ employees"], required: false, order: 4 },
      { type: "RADIO", label: "Budget Range", options: ["Under $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000+"], required: false, order: 5 }
    ]
  },
  {
    id: 'contact-form-pro',
    title: 'Contact Form Pro',
    description: 'Advanced contact form with department routing and priority levels',
    category: 'Business',
    industry: 'General',
    complexity: 'Simple',
    estimatedTime: '2 min',
    popularity: 92,
    rating: 4.8,
    tags: ['contact', 'support', 'communication'],
    icon: <Mail className="h-6 w-6" />,
    preview: ['Contact Info', 'Department', 'Priority', 'Message', 'Follow-up'],
    isTrending: true,
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "PHONE", label: "Phone Number", placeholder: "+1 (555) 123-4567", required: false, order: 2 },
      { type: "DROPDOWN", label: "Department", options: ["Sales", "Support", "Billing", "General Inquiry"], required: true, order: 3 },
      { type: "RADIO", label: "Priority", options: ["Low", "Medium", "High", "Urgent"], required: true, order: 4 },
      { type: "TEXT", label: "Subject", placeholder: "Brief subject line", required: true, order: 5 },
      { type: "LONG_TEXT", label: "Message", placeholder: "Describe your inquiry in detail...", required: true, order: 6 }
    ]
  },
  {
    id: 'job-application',
    title: 'Job Application Form',
    description: 'Professional job application with resume upload and screening questions',
    category: 'Business',
    industry: 'HR',
    complexity: 'Intermediate',
    estimatedTime: '6 min',
    popularity: 89,
    rating: 4.7,
    tags: ['jobs', 'hr', 'recruitment', 'careers'],
    icon: <Briefcase className="h-6 w-6" />,
    preview: ['Personal Info', 'Experience', 'Resume Upload', 'Cover Letter', 'Availability'],
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "PHONE", label: "Phone Number", placeholder: "+1 (555) 123-4567", required: true, order: 2 },
      { type: "TEXT", label: "Position Applied For", placeholder: "Job title", required: true, order: 3 },
      { type: "DROPDOWN", label: "Years of Experience", options: ["0-1 years", "2-5 years", "6-10 years", "10+ years"], required: true, order: 4 },
      { type: "FILE", label: "Resume", required: true, order: 5 },
      { type: "LONG_TEXT", label: "Cover Letter", placeholder: "Tell us why you're perfect for this role...", required: false, order: 6 }
    ]
  },
  // Education Templates
  {
    id: 'student-application',
    title: 'Student Application Form',
    description: 'Comprehensive application form for educational institutions with document uploads',
    category: 'Education',
    industry: 'Academic',
    complexity: 'Advanced',
    estimatedTime: '5 min',
    popularity: 82,
    rating: 4.7,
    tags: ['education', 'application', 'students', 'admissions'],
    icon: <GraduationCap className="h-6 w-6" />,
    preview: ['Personal Info', 'Academic History', 'Documents', 'Essays', 'References'],
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "student@email.com", required: true, order: 1 },
      { type: "DATE", label: "Date of Birth", required: true, order: 2 },
      { type: "TEXT", label: "Previous School", placeholder: "Name of your previous institution", required: true, order: 3 },
      { type: "DROPDOWN", label: "Grade Level Applying For", options: ["9th Grade", "10th Grade", "11th Grade", "12th Grade", "Undergraduate", "Graduate"], required: true, order: 4 },
      { type: "FILE", label: "Transcript", required: true, order: 5 },
      { type: "LONG_TEXT", label: "Personal Statement", placeholder: "Tell us about yourself and why you want to join our institution...", required: true, order: 6 }
    ]
  },
  {
    id: 'event-registration',
    title: 'Event Registration',
    description: 'Professional event registration with attendee management and preferences',
    category: 'Education',
    industry: 'Events',
    complexity: 'Intermediate',
    estimatedTime: '3 min',
    popularity: 84,
    rating: 4.7,
    tags: ['events', 'registration', 'attendees', 'workshops'],
    icon: <Calendar className="h-6 w-6" />,
    preview: ['Personal Info', 'Event Selection', 'Dietary Needs', 'Accessibility'],
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "PHONE", label: "Phone Number", placeholder: "+1 (555) 123-4567", required: false, order: 2 },
      { type: "TEXT", label: "Organization", placeholder: "Your company/organization", required: false, order: 3 },
      { type: "CHECKBOX", label: "Sessions to Attend", options: ["Opening Keynote", "Workshop A", "Workshop B", "Panel Discussion", "Networking Lunch"], required: true, order: 4 },
      { type: "TEXT", label: "Dietary Restrictions", placeholder: "Any dietary requirements?", required: false, order: 5 },
      { type: "TEXT", label: "Accessibility Needs", placeholder: "Any accessibility requirements?", required: false, order: 6 }
    ]
  },
  // Healthcare Templates
  {
    id: 'patient-intake',
    title: 'Patient Intake Form',
    description: 'HIPAA-compliant patient intake form with medical history and insurance information',
    category: 'Healthcare',
    industry: 'Medical',
    complexity: 'Advanced',
    estimatedTime: '8 min',
    popularity: 91,
    rating: 4.9,
    tags: ['healthcare', 'patient', 'medical', 'hipaa'],
    icon: <HeartPulse className="h-6 w-6" />,
    preview: ['Personal Info', 'Insurance', 'Medical History', 'Current Medications', 'Emergency Contact'],
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Patient's full name", required: true, order: 0 },
      { type: "DATE", label: "Date of Birth", required: true, order: 1 },
      { type: "TEXT", label: "Insurance Provider", placeholder: "Your insurance company", required: true, order: 2 },
      { type: "TEXT", label: "Policy Number", placeholder: "Insurance policy number", required: true, order: 3 },
      { type: "CHECKBOX", label: "Current Symptoms", options: ["Fever", "Cough", "Headache", "Nausea", "Fatigue", "Pain", "Other"], required: false, order: 4 },
      { type: "LONG_TEXT", label: "Medical History", placeholder: "Please describe any relevant medical history...", required: false, order: 5 },
      { type: "TEXT", label: "Emergency Contact Name", placeholder: "Emergency contact full name", required: true, order: 6 },
      { type: "PHONE", label: "Emergency Contact Phone", placeholder: "+1 (555) 123-4567", required: true, order: 7 }
    ]
  },
  // Travel Templates
  {
    id: 'travel-booking',
    title: 'Travel Booking Form',
    description: 'Complete travel booking form with preferences and special requirements',
    category: 'Travel',
    industry: 'Tourism',
    complexity: 'Advanced',
    estimatedTime: '5 min',
    popularity: 81,
    rating: 4.6,
    tags: ['travel', 'booking', 'vacation', 'tourism'],
    icon: <Plane className="h-6 w-6" />,
    preview: ['Traveler Info', 'Destination', 'Dates', 'Preferences', 'Special Requests'],
    fields: [
      { type: "TEXT", label: "Primary Traveler Name", placeholder: "Full name as on passport", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "PHONE", label: "Phone Number", placeholder: "+1 (555) 123-4567", required: true, order: 2 },
      { type: "NUMBER", label: "Number of Travelers", placeholder: "1", required: true, order: 3 },
      { type: "TEXT", label: "Destination", placeholder: "Where would you like to go?", required: true, order: 4 },
      { type: "DATE", label: "Departure Date", required: true, order: 5 },
      { type: "DATE", label: "Return Date", required: true, order: 6 },
      { type: "DROPDOWN", label: "Accommodation Type", options: ["Hotel", "Resort", "Vacation Rental", "Hostel", "Camping"], required: false, order: 7 },
      { type: "LONG_TEXT", label: "Special Requests", placeholder: "Any special requirements or preferences?", required: false, order: 8 }
    ]
  },
  // Personal Templates
  {
    id: 'wedding-rsvp',
    title: 'Wedding RSVP',
    description: 'Beautiful wedding RSVP form with meal preferences and guest management',
    category: 'Personal',
    industry: 'Events',
    complexity: 'Intermediate',
    estimatedTime: '3 min',
    popularity: 76,
    rating: 4.8,
    tags: ['wedding', 'rsvp', 'events', 'celebration'],
    icon: <Heart className="h-6 w-6" />,
    preview: ['Guest Names', 'Attendance', 'Meal Choices', 'Dietary Restrictions', 'Song Requests'],
    fields: [
      { type: "TEXT", label: "Primary Guest Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "TEXT", label: "Plus One Name", placeholder: "Guest's full name (if applicable)", required: false, order: 1 },
      { type: "RADIO", label: "Will you attend?", options: ["Joyfully Accept", "Regretfully Decline"], required: true, order: 2 },
      { type: "DROPDOWN", label: "Meal Choice (Guest 1)", options: ["Chicken", "Beef", "Fish", "Vegetarian", "Vegan"], required: false, order: 3 },
      { type: "DROPDOWN", label: "Meal Choice (Guest 2)", options: ["Chicken", "Beef", "Fish", "Vegetarian", "Vegan"], required: false, order: 4 },
      { type: "TEXT", label: "Dietary Restrictions", placeholder: "Any allergies or dietary needs?", required: false, order: 5 },
      { type: "TEXT", label: "Song Request", placeholder: "Request a song for the reception", required: false, order: 6 }
    ]
  },
  // More Advanced Templates
  {
    id: 'product-feedback',
    title: 'Product Feedback Pro',
    description: 'Advanced product feedback form with feature requests, bug reports, and satisfaction metrics',
    category: 'Business',
    industry: 'Product',
    complexity: 'Advanced',
    estimatedTime: '4 min',
    popularity: 87,
    rating: 4.8,
    tags: ['product', 'feedback', 'features', 'bugs'],
    icon: <MessageSquare className="h-6 w-6" />,
    preview: ['Product Info', 'Feature Requests', 'Bug Reports', 'Satisfaction Rating', 'Priority Level'],
    isNew: true,
    fields: [
      { type: "TEXT", label: "Product Name", placeholder: "Which product?", required: true, order: 0 },
      { type: "DROPDOWN", label: "Feedback Type", options: ["Feature Request", "Bug Report", "General Feedback", "Improvement Suggestion"], required: true, order: 1 },
      { type: "RADIO", label: "Priority Level", options: ["Low", "Medium", "High", "Critical"], required: true, order: 2 },
      { type: "LONG_TEXT", label: "Detailed Description", placeholder: "Please describe your feedback in detail...", required: true, order: 3 },
      { type: "RADIO", label: "Overall Satisfaction", options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"], required: true, order: 4 }
    ]
  },
  {
    id: 'subscription-signup',
    title: 'Subscription Sign-up',
    description: 'Complete subscription form with plan selection, billing info, and preferences',
    category: 'Business',
    industry: 'SaaS',
    complexity: 'Intermediate',
    estimatedTime: '3 min',
    popularity: 83,
    rating: 4.7,
    tags: ['subscription', 'billing', 'plans', 'saas'],
    icon: <CreditCard className="h-6 w-6" />,
    preview: ['Personal Info', 'Plan Selection', 'Billing Address', 'Payment Method', 'Preferences'],
    fields: [
      { type: "TEXT", label: "Full Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "DROPDOWN", label: "Subscription Plan", options: ["Basic - $9/month", "Pro - $29/month", "Enterprise - $99/month"], required: true, order: 2 },
      { type: "TEXT", label: "Company Name", placeholder: "Your company (optional)", required: false, order: 3 },
      { type: "CHECKBOX", label: "Add-ons", options: ["Priority Support", "Advanced Analytics", "Custom Integrations", "White Label"], required: false, order: 4 }
    ]
  },
  {
    id: 'course-evaluation',
    title: 'Course Evaluation',
    description: 'Comprehensive course evaluation with instructor feedback and learning outcomes assessment',
    category: 'Education',
    industry: 'Academic',
    complexity: 'Intermediate',
    estimatedTime: '4 min',
    popularity: 79,
    rating: 4.6,
    tags: ['education', 'evaluation', 'course', 'feedback'],
    icon: <GraduationCap className="h-6 w-6" />,
    preview: ['Course Info', 'Instructor Rating', 'Content Quality', 'Learning Outcomes', 'Recommendations'],
    fields: [
      { type: "TEXT", label: "Course Name", placeholder: "Name of the course", required: true, order: 0 },
      { type: "TEXT", label: "Instructor Name", placeholder: "Instructor's name", required: true, order: 1 },
      { type: "RADIO", label: "Overall Course Rating", options: ["Excellent", "Very Good", "Good", "Fair", "Poor"], required: true, order: 2 },
      { type: "RADIO", label: "Instructor Effectiveness", options: ["Excellent", "Very Good", "Good", "Fair", "Poor"], required: true, order: 3 },
      { type: "CHECKBOX", label: "What did you like most?", options: ["Course Content", "Teaching Style", "Assignments", "Resources", "Interaction"], required: false, order: 4 },
      { type: "LONG_TEXT", label: "Suggestions for Improvement", placeholder: "How can this course be improved?", required: false, order: 5 }
    ]
  },
  {
    id: 'appointment-booking',
    title: 'Appointment Booking',
    description: 'Professional appointment booking form with time slots, service selection, and patient details',
    category: 'Healthcare',
    industry: 'Medical',
    complexity: 'Advanced',
    estimatedTime: '5 min',
    popularity: 85,
    rating: 4.8,
    tags: ['appointment', 'booking', 'healthcare', 'scheduling'],
    icon: <Calendar className="h-6 w-6" />,
    preview: ['Patient Info', 'Service Type', 'Preferred Date/Time', 'Medical History', 'Insurance'],
    fields: [
      { type: "TEXT", label: "Patient Name", placeholder: "Full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "PHONE", label: "Phone Number", placeholder: "+1 (555) 123-4567", required: true, order: 2 },
      { type: "DROPDOWN", label: "Service Type", options: ["General Consultation", "Specialist Consultation", "Follow-up", "Procedure", "Emergency"], required: true, order: 3 },
      { type: "DATE", label: "Preferred Date", required: true, order: 4 },
      { type: "DROPDOWN", label: "Preferred Time", options: ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"], required: true, order: 5 },
      { type: "LONG_TEXT", label: "Reason for Visit", placeholder: "Brief description of your concern...", required: false, order: 6 }
    ]
  },
  {
    id: 'return-request',
    title: 'Return Request Form',
    description: 'E-commerce return request form with order details, reason selection, and return preferences',
    category: 'Retail',
    industry: 'E-commerce',
    complexity: 'Intermediate',
    estimatedTime: '3 min',
    popularity: 78,
    rating: 4.5,
    tags: ['returns', 'ecommerce', 'customer-service', 'refund'],
    icon: <ShoppingCart className="h-6 w-6" />,
    preview: ['Order Info', 'Return Reason', 'Item Details', 'Refund Method', 'Additional Notes'],
    fields: [
      { type: "TEXT", label: "Order Number", placeholder: "Your order number", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "Email used for order", required: true, order: 1 },
      { type: "TEXT", label: "Item Name", placeholder: "Name of item to return", required: true, order: 2 },
      { type: "DROPDOWN", label: "Reason for Return", options: ["Defective Item", "Wrong Size", "Wrong Color", "Not as Described", "Changed Mind", "Damaged in Shipping"], required: true, order: 3 },
      { type: "RADIO", label: "Preferred Resolution", options: ["Full Refund", "Exchange", "Store Credit"], required: true, order: 4 },
      { type: "LONG_TEXT", label: "Additional Details", placeholder: "Please provide any additional information...", required: false, order: 5 }
    ]
  },
  {
    id: 'product-orders',
    title: 'Product Orders Form',
    description: 'Comprehensive product ordering form with quantity, customization, and shipping options',
    category: 'Retail',
    industry: 'E-commerce',
    complexity: 'Advanced',
    estimatedTime: '4 min',
    popularity: 80,
    rating: 4.6,
    tags: ['orders', 'products', 'ecommerce', 'shipping'],
    icon: <ShoppingCart className="h-6 w-6" />,
    preview: ['Product Selection', 'Quantity', 'Customization', 'Shipping Info', 'Payment Details'],
    fields: [
      { type: "TEXT", label: "Customer Name", placeholder: "Your full name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "DROPDOWN", label: "Product", options: ["Product A", "Product B", "Product C", "Custom Product"], required: true, order: 2 },
      { type: "NUMBER", label: "Quantity", placeholder: "1", required: true, order: 3 },
      { type: "CHECKBOX", label: "Customization Options", options: ["Custom Color", "Custom Size", "Engraving", "Gift Wrapping"], required: false, order: 4 },
      { type: "LONG_TEXT", label: "Shipping Address", placeholder: "Full shipping address...", required: true, order: 5 },
      { type: "DROPDOWN", label: "Shipping Method", options: ["Standard (5-7 days)", "Express (2-3 days)", "Overnight"], required: true, order: 6 }
    ]
  },
  {
    id: 'party-planning',
    title: 'Party Planning Form',
    description: 'Complete party planning form with guest count, preferences, and special requirements',
    category: 'Personal',
    industry: 'Events',
    complexity: 'Intermediate',
    estimatedTime: '4 min',
    popularity: 72,
    rating: 4.4,
    tags: ['party', 'planning', 'events', 'celebration'],
    icon: <Gift className="h-6 w-6" />,
    preview: ['Event Details', 'Guest Count', 'Venue Preferences', 'Catering', 'Entertainment'],
    fields: [
      { type: "TEXT", label: "Host Name", placeholder: "Your name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "TEXT", label: "Event Type", placeholder: "Birthday, Anniversary, etc.", required: true, order: 2 },
      { type: "DATE", label: "Event Date", required: true, order: 3 },
      { type: "NUMBER", label: "Expected Guest Count", placeholder: "Number of guests", required: true, order: 4 },
      { type: "DROPDOWN", label: "Venue Type", options: ["Indoor", "Outdoor", "Restaurant", "Home", "Event Hall"], required: true, order: 5 },
      { type: "CHECKBOX", label: "Services Needed", options: ["Catering", "DJ/Music", "Photography", "Decorations", "Entertainment"], required: false, order: 6 },
      { type: "LONG_TEXT", label: "Special Requirements", placeholder: "Any special requests or requirements...", required: false, order: 7 }
    ]
  },
  {
    id: 'gift-registry',
    title: 'Gift Registry',
    description: 'Personal gift registry form for weddings, baby showers, and special occasions',
    category: 'Personal',
    industry: 'Events',
    complexity: 'Simple',
    estimatedTime: '3 min',
    popularity: 68,
    rating: 4.3,
    tags: ['gifts', 'registry', 'wedding', 'baby-shower'],
    icon: <Gift className="h-6 w-6" />,
    preview: ['Personal Info', 'Event Details', 'Gift Preferences', 'Delivery Info', 'Thank You Message'],
    fields: [
      { type: "TEXT", label: "Registry Owner", placeholder: "Your name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "TEXT", label: "Event Type", placeholder: "Wedding, Baby Shower, etc.", required: true, order: 2 },
      { type: "DATE", label: "Event Date", required: true, order: 3 },
      { type: "DROPDOWN", label: "Gift Categories", options: ["Home & Kitchen", "Electronics", "Clothing", "Books", "Experiences", "Cash Gifts"], required: false, order: 4 },
      { type: "LONG_TEXT", label: "Delivery Address", placeholder: "Where should gifts be delivered?", required: true, order: 5 },
      { type: "LONG_TEXT", label: "Special Message", placeholder: "Thank you message for gift givers...", required: false, order: 6 }
    ]
  },
  {
    id: 'bug-report',
    title: 'Bug Report Form',
    description: 'Technical bug report form with severity levels, reproduction steps, and system information',
    category: 'Technology',
    industry: 'Software',
    complexity: 'Advanced',
    estimatedTime: '5 min',
    popularity: 86,
    rating: 4.9,
    tags: ['bugs', 'technical', 'software', 'development'],
    icon: <Code className="h-6 w-6" />,
    preview: ['Bug Details', 'Severity Level', 'Reproduction Steps', 'System Info', 'Screenshots'],
    fields: [
      { type: "TEXT", label: "Reporter Name", placeholder: "Your name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "TEXT", label: "Bug Title", placeholder: "Brief description of the bug", required: true, order: 2 },
      { type: "DROPDOWN", label: "Severity", options: ["Critical", "High", "Medium", "Low"], required: true, order: 3 },
      { type: "DROPDOWN", label: "Browser/Platform", options: ["Chrome", "Firefox", "Safari", "Edge", "Mobile App", "Desktop App"], required: true, order: 4 },
      { type: "LONG_TEXT", label: "Steps to Reproduce", placeholder: "1. Go to...\n2. Click on...\n3. See error", required: true, order: 5 },
      { type: "LONG_TEXT", label: "Expected vs Actual Behavior", placeholder: "What should happen vs what actually happens", required: true, order: 6 },
      { type: "FILE", label: "Screenshots/Files", required: false, order: 7 }
    ]
  },
  {
    id: 'feature-request',
    title: 'Feature Request Form',
    description: 'Product feature request form with use cases, priority, and business justification',
    category: 'Technology',
    industry: 'Product',
    complexity: 'Intermediate',
    estimatedTime: '4 min',
    popularity: 82,
    rating: 4.7,
    tags: ['features', 'product', 'enhancement', 'development'],
    icon: <Lightbulb className="h-6 w-6" />,
    preview: ['Feature Details', 'Use Case', 'Priority', 'Business Value', 'Mockups'],
    fields: [
      { type: "TEXT", label: "Requester Name", placeholder: "Your name", required: true, order: 0 },
      { type: "EMAIL", label: "Email Address", placeholder: "your.email@example.com", required: true, order: 1 },
      { type: "TEXT", label: "Feature Title", placeholder: "Brief feature description", required: true, order: 2 },
      { type: "DROPDOWN", label: "Priority", options: ["High", "Medium", "Low"], required: true, order: 3 },
      { type: "DROPDOWN", label: "Category", options: ["UI/UX", "Performance", "Integration", "Security", "Analytics", "Other"], required: true, order: 4 },
      { type: "LONG_TEXT", label: "Detailed Description", placeholder: "Describe the feature in detail...", required: true, order: 5 },
      { type: "LONG_TEXT", label: "Use Case/Business Justification", placeholder: "Why is this feature needed? How will it help?", required: true, order: 6 },
      { type: "FILE", label: "Mockups/Wireframes", required: false, order: 7 }
    ]
  }
];

const PublicTemplateGalleryPage = () => {
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedComplexity, setSelectedComplexity] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);

  // Get unique values for filters
  const categories = ['All', ...Array.from(new Set(TEMPLATE_GALLERY.map(t => t.category)))];
  const complexities = ['All', 'Simple', 'Intermediate', 'Advanced'];
  const industries = ['All', ...Array.from(new Set(TEMPLATE_GALLERY.map(t => t.industry)))];

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = TEMPLATE_GALLERY.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesComplexity = selectedComplexity === 'All' || template.complexity === selectedComplexity;
      const matchesIndustry = selectedIndustry === 'All' || template.industry === selectedIndustry;
      
      return matchesSearch && matchesCategory && matchesComplexity && matchesIndustry;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedComplexity, selectedIndustry, sortBy]);

  // Handle template selection - redirect to signup
  const handleUseTemplate = (template: FormTemplate) => {
    // Store template selection in localStorage for after signup
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    router.push('/register?from=template');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Public Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
            <Link href="/register" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Sparkles className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Template Gallery
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Create professional forms in seconds with our stunning, pre-built templates
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm mb-8">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                <span>One-Click Creation</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <Crown className="h-4 w-4" />
                <span>Professional Design</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <Rocket className="h-4 w-4" />
                <span>Instant Setup</span>
              </div>
            </div>
            <Link href="/register">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg">
                Sign Up to Use Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12">
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedCategory}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.map(category => (
                    <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                      {selectedCategory === category && <Check className="mr-2 h-4 w-4" />}
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {selectedComplexity}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {complexities.map(complexity => (
                    <DropdownMenuItem key={complexity} onClick={() => setSelectedComplexity(complexity)}>
                      {selectedComplexity === complexity && <Check className="mr-2 h-4 w-4" />}
                      {complexity}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12">
                    Sort: {sortBy}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('popularity')}>
                    {sortBy === 'popularity' && <Check className="mr-2 h-4 w-4" />}
                    Most Popular
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating')}>
                    {sortBy === 'rating' && <Check className="mr-2 h-4 w-4" />}
                    Highest Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    {sortBy === 'name' && <Check className="mr-2 h-4 w-4" />}
                    Name A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    {sortBy === 'newest' && <Check className="mr-2 h-4 w-4" />}
                    Newest First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Template Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          layout
        >
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full overflow-hidden bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 border-0 group">
                  {/* Card Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                            {template.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.isNew && (
                              <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                New
                              </Badge>
                            )}
                            {template.isTrending && (
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                                Trending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardDescription className="text-sm leading-relaxed mt-3">
                      {template.description}
                    </CardDescription>
                  </CardHeader>

                  {/* Card Content */}
                  <CardContent className="pb-4">
                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{template.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{template.popularity}%</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.complexity}
                      </Badge>
                    </div>

                    {/* Preview Fields */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Form includes:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.preview.slice(0, 3).map((field, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                        {template.preview.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.preview.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Card Footer */}
                  <CardFooter className="pt-4 border-t">
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                                {template.icon}
                              </div>
                              {template.title}
                            </DialogTitle>
                            <DialogDescription>
                              {template.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{template.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{template.estimatedTime}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {template.complexity}
                              </Badge>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-3">Form Fields Preview:</h4>
                              <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                {template.fields.map((field, index) => (
                                  <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded border">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{field.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {field.type} {field.required && '(Required)'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={() => handleUseTemplate(template)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Use This Template
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-6">
              <Search className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find the perfect template
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedComplexity('All');
                setSelectedIndustry('All');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Form?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Sign up now and start using these professional templates instantly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium transition-all duration-200">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTemplateGalleryPage; 
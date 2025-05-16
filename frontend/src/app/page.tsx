'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Check, 
  FileText, 
  LineChart, 
  Webhook, 
  Bell, 
  Shield, 
  BarChart4, 
  Sparkles,
  ChevronDown,
  Star,
  MonitorSmartphone,
  Code,
  Upload,
  Zap,
  X,
  Calendar,
  Users,
  Briefcase,
  Utensils,
  Building,
  GraduationCap,
  Store,
  HeartPulse,
  Plane,
  Layers,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Testimonials data
const testimonials = [
  {
    quote: "Formatic has revolutionized how we collect and analyze customer feedback. The form builder is intuitive and the analytics are powerful.",
    author: "Sarah Johnson",
    role: "Product Manager",
    company: "TechCorp"
  },
  {
    quote: "The webhook integration is a game-changer. We've connected our forms to our CRM and the data flows seamlessly.",
    author: "Michael Chen",
    role: "CTO",
    company: "Dataflow Inc"
  },
  {
    quote: "We've reduced our form processing time by 70% since switching to Formatic. The conditional logic feature is brilliant!",
    author: "Emma Rodriguez",
    role: "Operations Director",
    company: "GlobalServe"
  }
];

// Pricing plans
const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for individuals and small projects",
    features: [
      "Up to 3 forms",
      "100 submissions/month",
      "Basic analytics",
      "Email notifications",
      "Standard support"
    ]
  },
  {
    name: "Professional",
    price: "$29",
    description: "Ideal for growing businesses",
    features: [
      "Unlimited forms",
      "10,000 submissions/month",
      "Advanced analytics",
      "Webhook integrations",
      "File uploads",
      "Priority support"
    ],
    recommended: true
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For organizations with advanced needs",
    features: [
      "Unlimited everything",
      "Custom branding",
      "Advanced security",
      "API access",
      "Dedicated support",
      "SLA guarantee"
    ]
  }
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Form examples data
const formExamples = [
  {
    id: "customer-feedback",
    title: "Customer Feedback",
    formIcon: <FileText className="text-blue-500 dark:text-blue-400" />,
    fields: [
      { 
        label: "Name", 
        type: "text", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "John Doe" 
      },
      { 
        label: "Email", 
        type: "email", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "example@company.com" 
      },
      { 
        label: "Category", 
        type: "select", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M11 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17L5 19L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 7L5 9L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "Product Feedback",
        isSelect: true
      }
    ]
  },
  {
    id: "event-registration",
    title: "Event Registration",
    formIcon: <Calendar className="text-violet-500 dark:text-violet-400" />,
    fields: [
      { 
        label: "Full Name", 
        type: "text", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "Emma Thompson" 
      },
      { 
        label: "Email", 
        type: "email", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "emma@example.com" 
      },
      { 
        label: "Event", 
        type: "select", 
        icon: <Calendar className="h-4 w-4 text-slate-400" />,
        value: "Annual Tech Conference 2023",
        isSelect: true
      },
      { 
        label: "Number of Guests", 
        type: "select", 
        icon: <Users className="h-4 w-4 text-slate-400" />,
        value: "2",
        isSelect: true,
        small: true
      },
      { 
        label: "Dietary Restrictions", 
        type: "select", 
        icon: <Utensils className="h-4 w-4 text-slate-400" />,
        value: "Vegetarian",
        isSelect: true,
        small: true
      }
    ]
  },
  {
    id: "job-application",
    title: "Job Application",
    formIcon: <Briefcase className="text-emerald-500 dark:text-emerald-400" />,
    fields: [
      { 
        label: "Name", 
        type: "text", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "Michael Chen" 
      },
      { 
        label: "Email", 
        type: "email", 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value: "michael@example.com" 
      },
      { 
        label: "Position", 
        type: "select", 
        icon: <Briefcase className="h-4 w-4 text-slate-400" />,
        value: "Senior Software Engineer",
        isSelect: true
      },
      { 
        label: "Resume", 
        type: "file", 
        icon: <Upload className="h-4 w-4 text-slate-400" />,
        value: "resume.pdf",
        isFile: true
      },
      { 
        label: "Experience", 
        type: "select", 
        icon: <Layers className="h-4 w-4 text-slate-400" />,
        value: "5+ years",
        isSelect: true,
        small: true
      }
    ]
  }
];

// Form use cases by industry
const formUseCases = [
  {
    icon: <Building className="h-12 w-12 mb-4 text-blue-500" />,
    title: "Business",
    cases: ["Customer Feedback", "Contact Requests", "Order Forms", "Subscription Sign-ups"]
  },
  {
    icon: <GraduationCap className="h-12 w-12 mb-4 text-violet-500" />,
    title: "Education",
    cases: ["Student Applications", "Course Evaluations", "Event Registrations", "Research Surveys"]
  },
  {
    icon: <Store className="h-12 w-12 mb-4 text-emerald-500" />,
    title: "Retail",
    cases: ["Product Feedback", "Return Requests", "Loyalty Programs", "Gift Registries"]
  },
  {
    icon: <HeartPulse className="h-12 w-12 mb-4 text-red-500" />,
    title: "Healthcare",
    cases: ["Patient Intake", "Appointment Requests", "Satisfaction Surveys", "Referral Forms"]
  },
  {
    icon: <Plane className="h-12 w-12 mb-4 text-sky-500" />,
    title: "Travel",
    cases: ["Booking Forms", "Travel Preferences", "Feedback Surveys", "Loyalty Programs"]
  },
  {
    icon: <Users className="h-12 w-12 mb-4 text-amber-500" />,
    title: "Personal",
    cases: ["Event RSVPs", "Gift Wishlists", "Contact Information", "Party Planning"]
  }
];

export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeForm, setActiveForm] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState({
    features: false,
    stats: false,
    pricing: false,
    useCases: false
  });

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.getElementById('features');
      const statsSection = document.getElementById('stats');
      const pricingSection = document.getElementById('pricing');
      const useCasesSection = document.getElementById('use-cases');
      
      if (featuresSection) {
        const rect = featuresSection.getBoundingClientRect();
        setIsVisible(prev => ({ ...prev, features: rect.top < window.innerHeight * 0.75 }));
      }
      
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        setIsVisible(prev => ({ ...prev, stats: rect.top < window.innerHeight * 0.75 }));
      }
      
      if (pricingSection) {
        const rect = pricingSection.getBoundingClientRect();
        setIsVisible(prev => ({ ...prev, pricing: rect.top < window.innerHeight * 0.75 }));
      }
      
      if (useCasesSection) {
        const rect = useCasesSection.getBoundingClientRect();
        setIsVisible(prev => ({ ...prev, useCases: rect.top < window.innerHeight * 0.75 }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking a nav link
  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  // Form carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveForm(prev => (prev + 1) % formExamples.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Testimonial carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
            {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container-content flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-xl">Formatic</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#use-cases" className="text-sm font-medium hover:text-primary transition-colors">Use Cases</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
            <Link href="/register" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </nav>
          
          {/* Mobile Navigation Button */}
          <button 
            className="md:hidden rounded-md p-2 bg-primary/10 hover:bg-primary/20 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        <motion.div 
          className={`md:hidden absolute top-16 inset-x-0 z-50 bg-background border-b shadow-lg`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: mobileMenuOpen ? 1 : 0,
            height: mobileMenuOpen ? 'auto' : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {mobileMenuOpen && (
            <div className="container-content py-4 px-4 space-y-4 flex flex-col">
              <a 
                href="#features" 
                className="text-sm font-medium py-3 px-2 rounded hover:bg-primary/10 transition-colors"
                onClick={handleMobileNavClick}
              >
                Features
              </a>
              <a 
                href="#use-cases" 
                className="text-sm font-medium py-3 px-2 rounded hover:bg-primary/10 transition-colors"
                onClick={handleMobileNavClick}
              >
                Use Cases
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium py-3 px-2 rounded hover:bg-primary/10 transition-colors"
                onClick={handleMobileNavClick}
              >
                How It Works
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium py-3 px-2 rounded hover:bg-primary/10 transition-colors"
                onClick={handleMobileNavClick}
              >
                Pricing
              </a>
              <div className="border-t pt-4 mt-2 space-y-4">
                <Link 
                  href="/login" 
                  className="block text-sm font-medium py-3 px-2 rounded hover:bg-primary/10 transition-colors"
                  onClick={handleMobileNavClick}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="block rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={handleMobileNavClick}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 lg:py-28 bg-gradient-to-b from-background to-primary/5 overflow-hidden">
          <div className="container-content">
            <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
              <motion.div 
                className="flex-1 space-y-6 text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Create Powerful Forms with <span className="text-primary dark:text-blue-400 dark:glow-text">Ease</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  Build, manage, and analyze forms with our intuitive platform. Collect submissions, integrate with your tools, and gain actionable insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                  <Link href="/register" className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center justify-center shimmer">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <a href="#how-it-works" className="rounded-md bg-secondary px-6 py-3 text-base font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors inline-flex items-center justify-center">
                    See How It Works
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start pt-6 text-sm text-muted-foreground gap-4">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    <span>14-day free trial</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="w-full lg:flex-1 relative max-w-md mx-auto lg:max-w-lg mt-8 lg:mt-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative w-full mx-auto aspect-[5/4] sm:aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700/50 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 shadow-lg dark:shadow-xl">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
                  
                  {/* Top decorative line for current form */}
                  <div 
                    className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
                      activeForm === 0 ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' : 
                      activeForm === 1 ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500' :
                      'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                    }`}
                  ></div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={formExamples[activeForm].id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-4 sm:p-6 flex flex-col"
                    >
                      {/* Header with logo */}
                      <div className="flex items-center mb-4 sm:mb-6">
                        <div className="flex items-center">
                          <div className={`h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center ${
                            activeForm === 0 ? 'text-blue-600 dark:text-blue-400' : 
                            activeForm === 1 ? 'text-violet-600 dark:text-violet-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {formExamples[activeForm].formIcon}
                          </div>
                          <span className={`ml-2 font-bold text-sm sm:text-base ${
                            activeForm === 0 ? 'text-blue-600 dark:text-blue-400' : 
                            activeForm === 1 ? 'text-violet-600 dark:text-violet-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>Formatic</span>
                        </div>
                        
                        <div className="ml-auto flex space-x-1">
                          <button className="w-6 h-6 sm:w-7 sm:h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-500 dark:text-slate-400">
                              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        {/* Form Title */}
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-3 sm:mb-5">{formExamples[activeForm].title}</h2>
                        
                        {/* Form fields */}
                        <div className="space-y-3 sm:space-y-4 overflow-y-auto">
                          {formExamples[activeForm].fields.map((field, index) => {
                            // Skip some fields on mobile for better display 
                            if (field.small && index > 3) return null;
                            
                            return (
                              <div key={index} className={`space-y-1 sm:space-y-1.5 ${field.small ? 'w-full sm:w-1/2 sm:inline-block sm:pr-2' : 'w-full'}`}>
                                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                                {field.isFile ? (
                                  <div className="relative">
                                    <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                                      {field.icon}
                                    </div>
                                    <div 
                                      className="w-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-2 sm:pr-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center text-xs sm:text-sm"
                                    >
                                      <span className="text-slate-600 dark:text-slate-300 truncate">{field.value}</span>
                                    </div>
                                  </div>
                                ) : field.isSelect ? (
                                  <div className="relative">
                                    <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                                      {field.icon}
                                    </div>
                                    <select 
                                      className="w-full appearance-none py-1.5 sm:py-2 pl-8 sm:pl-10 pr-6 sm:pr-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-xs sm:text-sm"
                                    >
                                      <option>{field.value}</option>
                                    </select>
                                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                                      {field.icon}
                                    </div>
                                    <input 
                                      type={field.type} 
                                      className="w-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-2 sm:pr-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-xs sm:text-sm"
                                      value={field.value}
                                      readOnly
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Button row */}
                        <div className="flex gap-2 mt-auto pt-3 sm:pt-4">
                          <button className={`flex-1 h-8 sm:h-10 bg-gradient-to-r font-medium rounded-lg flex items-center justify-center transition-colors shadow-sm text-white text-xs sm:text-sm ${
                            activeForm === 0 ? 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700' : 
                            activeForm === 1 ? 'from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 hover:from-violet-600 hover:to-violet-700' :
                            'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 hover:from-emerald-600 hover:to-emerald-700'
                          }`}>
                            <span>Submit</span>
                            <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <PlusCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                              activeForm === 0 ? 'text-blue-500 dark:text-blue-400' : 
                              activeForm === 1 ? 'text-violet-500 dark:text-violet-400' :
                              'text-emerald-500 dark:text-emerald-400'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                {/* Form switcher dots */}
                <div className="flex justify-center mt-4 gap-2">
                  {formExamples.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setActiveForm(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === activeForm ? (
                          index === 0 ? 'bg-blue-500 scale-125' : 
                          index === 1 ? 'bg-violet-500 scale-125' :
                          'bg-emerald-500 scale-125'
                        ) : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      aria-label={`View ${formExamples[index].title} example`}
                    />
                  ))}
                </div>
                
                {/* Floating elements for visual interest - made more visible on mobile */}
                <div className={`absolute -top-3 -right-3 sm:-top-4 sm:-right-4 h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center animate-float-strong shadow-lg border-2 border-white/30 dark:border-slate-700/60 ${
                  activeForm === 0 ? 'bg-blue-500/40 dark:bg-blue-700/50' : 
                  activeForm === 1 ? 'bg-violet-500/40 dark:bg-violet-700/50' :
                  'bg-emerald-500/40 dark:bg-emerald-700/50'
                }`}>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground dark:text-white">
                    {formExamples[activeForm].formIcon}
                  </div>
                </div>
                <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 h-12 w-12 sm:h-14 sm:w-14 bg-primary/40 dark:bg-primary/60 rounded-full flex items-center justify-center animate-float-strong delay-300 shadow-lg border-2 border-white/30 dark:border-slate-700/60">
                  <LineChart className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground dark:text-white" />
                </div>
                <div className="absolute top-1/2 -right-2 sm:-right-6 transform -translate-y-1/2 translate-x-1/4 h-14 w-14 sm:h-16 sm:w-16 bg-primary/40 dark:bg-primary/60 rounded-full flex items-center justify-center animate-float-strong delay-500 shadow-lg border-2 border-white/30 dark:border-slate-700/60">
                  <Webhook className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground dark:text-white" />
                </div>
                <div className="absolute top-1/4 -left-3 sm:-left-6 h-10 w-10 sm:h-12 sm:w-12 bg-primary/40 dark:bg-primary/60 rounded-full flex items-center justify-center animate-float-strong delay-700 shadow-lg border-2 border-white/30 dark:border-slate-700/60">
                  <Bell className="h-5 w-5 text-primary-foreground dark:text-white" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="py-16 bg-gradient-to-b from-background to-primary/5">
          <div className="container-content space-y-12">
            <motion.div 
              className="text-center space-y-4"
              variants={fadeIn}
              initial="hidden"
              animate={isVisible.useCases ? "visible" : "hidden"}
            >
              <div className="inline-block mb-2">
                <div className="flex items-center justify-center space-x-2 bg-primary/10 px-3 py-1 rounded-full">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Endless Possibilities</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Build forms for any purpose
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                From simple contact forms to complex multi-page applications, Formatic adapts to your specific needs
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.useCases ? "visible" : "hidden"}
            >
              {formUseCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  className="group bg-card rounded-xl border p-6 text-center hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
                    style={{ 
                      background: index === 0 ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' : 
                                index === 1 ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' :
                                index === 2 ? 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)' :
                                index === 3 ? 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' :
                                index === 4 ? 'linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%)' :
                                'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)'
                    }}
                  ></div>
                  <div className="flex justify-center mb-4 relative">
                    <div className="relative transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                      {useCase.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mt-2 mb-4 relative">{useCase.title}</h3>
                  <ul className="space-y-2 relative">
                    {useCase.cases.map((caseItem, i) => (
                      <li key={i} className="text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300">{caseItem}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-12 bg-gradient-to-r from-primary/5 to-secondary/10">
          <div className="container-content">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.stats ? "visible" : "hidden"}
            >
              <motion.div variants={fadeIn} className="p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">10k+</div>
                <div className="text-sm text-muted-foreground">Forms Created</div>
              </motion.div>
              <motion.div variants={fadeIn} className="p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">1M+</div>
                <div className="text-sm text-muted-foreground">Submissions</div>
              </motion.div>
              <motion.div variants={fadeIn} className="p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">5k+</div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </motion.div>
              <motion.div variants={fadeIn} className="p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5 pointer-events-none"></div>
          <div className="container-content space-y-16 relative z-10">
            <motion.div 
              className="text-center space-y-4"
              variants={fadeIn}
              initial="hidden"
              animate={isVisible.features ? "visible" : "hidden"}
            >
              <div className="inline-block mb-2">
                <div className="flex items-center justify-center space-x-2 bg-primary/10 px-3 py-1 rounded-full">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Powerful Features</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to manage forms
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Formatic provides all the tools you need to create, share, and analyze forms efficiently.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 gap-8 md:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.features ? "visible" : "hidden"}
            >
              <motion.div 
                variants={fadeIn}
                className="group bg-card rounded-lg border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-primary via-primary/50 to-transparent"></div>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                  <FileText className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="mb-2 text-xl font-medium group-hover:text-primary transition-colors duration-300">Intuitive Form Builder</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Create beautiful, responsive forms with our drag-and-drop builder. Add conditional logic, multi-page flows, and custom validation.
                </p>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="group bg-card rounded-lg border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-blue-500 via-blue-500/50 to-transparent"></div>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                  <Webhook className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="mb-2 text-xl font-medium group-hover:text-primary transition-colors duration-300">Seamless Integrations</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Connect your forms to other services with our powerful webhook system. Send data where you need it, when you need it.
                </p>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="group bg-card rounded-lg border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-violet-500 via-violet-500/50 to-transparent"></div>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                  <BarChart4 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="mb-2 text-xl font-medium group-hover:text-primary transition-colors duration-300">Advanced Analytics</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Gain insights from submission data with comprehensive analytics. Track completion rates, field performance, and user behavior.
                </p>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="group bg-card rounded-lg border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-amber-500 via-amber-500/50 to-transparent"></div>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                  <Bell className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="mb-2 text-xl font-medium group-hover:text-primary transition-colors duration-300">Smart Notifications</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Stay informed with customizable notifications. Get alerted about new submissions, form activity, and system events.
                </p>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="group bg-card rounded-lg border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-emerald-500 via-emerald-500/50 to-transparent"></div>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                  <Upload className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="mb-2 text-xl font-medium group-hover:text-primary transition-colors duration-300">File Management</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Collect and organize file uploads securely. Preview images, manage documents, and control access with ease.
                </p>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="group bg-card rounded-lg border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-red-500 via-red-500/50 to-transparent"></div>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                  <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="mb-2 text-xl font-medium group-hover:text-primary transition-colors duration-300">Enterprise Security</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Protect your data with advanced security features. Role-based access control, data encryption, and compliance tools.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section - Enhanced */}
        <section id="how-it-works" className="py-20 bg-gradient-to-b from-background to-secondary/10 overflow-hidden">
          <div className="container-content relative">
            <motion.div 
              className="text-center mb-16 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-2">
                <div className="flex items-center justify-center space-x-2 bg-primary/10 px-3 py-1 rounded-full">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Simple Process</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Formatic Works</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                A streamlined workflow for collecting and managing form submissions
              </p>
            </motion.div>
            
                          <div className="relative">
                {/* Connecting line removed as requested */}
                
                <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2 }
                  }
                }}
              >
                <motion.div 
                  className="flex flex-col items-center text-center space-y-4"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { duration: 0.6 }
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-md relative z-10">
                    <span>1</span>
                    <div className="absolute -inset-1 rounded-full bg-blue-400/20 animate-pulse opacity-75"></div>
                  </div>
                  <h3 className="text-xl font-bold">Create Forms</h3>
                  <p className="text-muted-foreground">
                    Build custom forms with our intuitive drag-and-drop interface. Add fields, conditional logic, and validation.
                  </p>
                  <div className="relative w-full aspect-video mt-4 rounded-lg overflow-hidden bg-card border shadow-md group perspective">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="absolute inset-4 border-2 border-dashed border-blue-500/30 rounded-md flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                      <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded shadow-sm">
                        <FileText className="h-10 w-10 text-blue-500" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center text-center space-y-4"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { duration: 0.6 }
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-md relative z-10">
                    <span>2</span>
                    <div className="absolute -inset-1 rounded-full bg-violet-400/20 animate-pulse opacity-75 delay-300"></div>
                  </div>
                  <h3 className="text-xl font-bold">Collect Submissions</h3>
                  <p className="text-muted-foreground">
                    Share your forms and gather responses. Receive notifications as submissions come in.
                  </p>
                  <div className="relative w-full aspect-video mt-4 rounded-lg overflow-hidden bg-card border shadow-md group perspective">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-violet-500/10 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="absolute inset-4 border-2 border-dashed border-violet-500/30 rounded-md flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                      <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded shadow-sm">
                        <div className="relative">
                          <Zap className="h-10 w-10 text-violet-500" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center text-center space-y-4"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { duration: 0.6 }
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-md relative z-10">
                    <span>3</span>
                    <div className="absolute -inset-1 rounded-full bg-emerald-400/20 animate-pulse opacity-75 delay-600"></div>
                  </div>
                  <h3 className="text-xl font-bold">Analyze & Act</h3>
                  <p className="text-muted-foreground">
                    Review submissions, export data, trigger webhooks, and gain insights through analytics.
                  </p>
                  <div className="relative w-full aspect-video mt-4 rounded-lg overflow-hidden bg-card border shadow-md group perspective">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="absolute inset-4 border-2 border-dashed border-emerald-500/30 rounded-md flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                      <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded shadow-sm">
                        <LineChart className="h-10 w-10 text-emerald-500" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-70"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-secondary/10 blur-3xl opacity-70"></div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-b from-background to-primary/5 overflow-hidden">
          <div className="container-content">
            <motion.div 
              className="text-center mb-16 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-2">
                <div className="flex items-center justify-center space-x-2 bg-primary/10 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-sm font-medium text-primary">Trusted by Thousands</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Users Say</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Join thousands of satisfied customers using Formatic
              </p>
            </motion.div>
            
            <motion.div 
              className="relative max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className={`p-8 md:p-12 bg-card rounded-xl border shadow-sm overflow-hidden ${
                    index === activeTestimonial ? 'block' : 'hidden'
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute top-0 left-0 w-20 h-20 bg-primary/10 rounded-br-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 rounded-tl-3xl"></div>
                  
                  <div className="relative">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <span className="text-primary text-xl font-bold">
                          {testimonial.author.split(' ').map(name => name[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-4 flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <blockquote className="text-lg md:text-xl italic mb-6">
                          "{testimonial.quote}"
                        </blockquote>
                        <div>
                          <div className="font-medium">{testimonial.author}</div>
                          <div className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-primary scale-125' : 'bg-primary/20'
                    }`}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <div className="absolute -z-10 top-1/4 -left-12 w-24 h-24 rounded-full bg-primary/5 animate-float"></div>
              <div className="absolute -z-10 bottom-1/4 -right-12 w-32 h-32 rounded-full bg-primary/5 animate-float delay-300"></div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gradient-to-b from-secondary/10 to-background">
          <div className="container-content">
            <motion.div 
              className="text-center mb-16 space-y-4"
              variants={fadeIn}
              initial="hidden"
              animate={isVisible.pricing ? "visible" : "hidden"}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Choose the plan that's right for you
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.pricing ? "visible" : "hidden"}
            >
              {pricingPlans.map((plan, index) => (
                <motion.div 
                  key={plan.name}
                  variants={fadeIn}
                  className={`relative bg-card rounded-xl border ${
                    plan.recommended ? 'border-primary shadow-md' : 'shadow-sm'
                  } p-8 flex flex-col h-full`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-full">
                      Recommended
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-4">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.price !== "Free" && <span className="text-muted-foreground ml-2">/month</span>}
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href="/register"
                    className={`rounded-md px-6 py-3 text-base font-semibold transition-colors inline-flex items-center justify-center ${
                      plan.recommended 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {plan.price === "Free" ? "Sign Up" : "Start Free Trial"}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            
            <div className="text-center mt-10 text-sm text-muted-foreground">
              All plans include a 14-day free trial. No credit card required.
            </div>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        <section className="py-20 relative overflow-hidden">
          {/* Background with animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/5 to-violet-500/10 animate-gradient-flow bg-[length:200%_auto]"></div>
          
          {/* Background shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-4 border-primary/20 animate-float"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-4 border-blue-500/20 animate-float delay-300"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full border-4 border-violet-500/20 animate-float delay-500"></div>
          </div>
          
          <div className="container-content text-center space-y-8 relative z-10">
            <motion.h2 
              className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-violet-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Ready to transform your form management?
            </motion.h2>
            <motion.p 
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
            >
              Join thousands of users creating forms and collecting responses with Formatic.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/register"
                className="group relative rounded-md bg-primary dark:bg-blue-600 px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 dark:hover:bg-blue-500 transition-colors inline-flex items-center justify-center dark:shadow-lg dark:shadow-blue-500/20 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                <span className="relative flex items-center">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </Link>
              <Link
                href="/contact"
                className="group relative rounded-md bg-secondary dark:bg-slate-600 px-8 py-4 text-base font-semibold text-secondary-foreground dark:text-white hover:bg-secondary/80 dark:hover:bg-slate-500 transition-colors inline-flex items-center justify-center border border-transparent dark:border-white/10 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                <span className="relative">Contact Sales</span>
              </Link>
            </motion.div>
            <motion.div 
              className="mt-8 flex justify-center items-center gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800"></div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Join 5,000+ users</span>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 md:py-12 bg-background">
        <div className="container-content">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-6">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">F</span>
                </div>
                <span className="font-bold text-xl">Formatic</span>
              </Link>
              <p className="text-muted-foreground max-w-xs">
                Create, manage, and analyze forms with ease. The complete form management platform.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <span className="sr-only">Twitter</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <span className="sr-only">LinkedIn</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <span className="sr-only">GitHub</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Customers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div className="col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Guides</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div className="col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Formatic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
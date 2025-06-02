'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Building, Phone, Globe, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Define extended user profile type
interface UserProfile {
  name: string;
  company: string;
  phone: string;
  website: string;
}

export default function ProfileSection() {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    name: user?.name || '',
    company: '',
    phone: '',
    website: '',
  });
  const router = useRouter();

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) { // Don't fetch if user ID is not available
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        interface ProfileResponse {
          name?: string;
          company?: string;
          phone?: string;
          website?: string;
          [key: string]: any;
        }
        
        // Connect to backend directly where the database is properly configured
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`/api/users/${user.id}`, { // Use user.id
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(`Server responded with ${res.status}: ${errorData.message || res.statusText}`);
        }
        
        const response = await res.json();
        
        if (response) { // Check if response is not null/undefined
          setFormData({
            name: response.name || user?.name || '',
            company: response.company || '',
            phone: response.phone || '',
            website: response.website || '',
          });
        } else {
          // API returned null or no data
          throw new Error('Could not load profile data: Empty response');
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
        toast({
          title: 'Error Loading Profile',
          description: (error as Error).message || 'Could not load your profile. Please try again.',
          variant: 'destructive',
        });
        // Fall back to basic user data from context if load fails
        setFormData(prev => ({
          ...prev,
          name: user?.name || '',
          company: user?.company || '',
          phone: user?.phone || '',
          website: user?.website || '',
        }));
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
  }, [user, toast]); // Add toast to dependency array

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(false);

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User ID not found. Please re-login.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Basic validation
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      // Validate website format if provided
      if (formData.website && !isValidUrl(formData.website)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid website URL",
          variant: "destructive",
        });
        return;
      }

      // Connect to backend directly where the database is properly configured
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}`, { // Use user.id
        method: 'PATCH', // Use PATCH as per backend controller
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Server responded with ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const updatedUser = await response.json();
      
      // Update the user context if needed
      if (typeof setUser === 'function' && updatedUser) {
        setUser({
          ...user,
          ...updatedUser
        });

        // Also update the user in storage to persist the changes
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        if (storage.getItem('user')) {
          const storedUser = JSON.parse(storage.getItem('user') || '{}');
          storage.setItem('user', JSON.stringify({
            ...storedUser,
            ...updatedUser
          }));
        }
      }

      setUpdateSuccess(true);
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });

      // Refresh page data
      router.refresh();
      
      // Hide success indicator after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Helper function to validate URLs
  const isValidUrl = (url: string) => {
    if (!url) return true; // Empty is valid (not required)
    try {
      // Add protocol if missing
      const urlToCheck = url.match(/^https?:\/\//) ? url : `https://${url}`;
      new URL(urlToCheck);
      return true;
    } catch {
      return false;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Loading your profile information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Type */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-medium">Account Type</h3>
              <p className="text-sm text-muted-foreground">
                Your account permissions and access level
              </p>
            </div>
            <Badge variant={user?.role === 'SUPER_ADMIN' ? "default" : "secondary"} className="ml-auto">
              {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Client'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Your name"
                required
                className={!formData.name.trim() ? "border-red-500" : ""}
              />
              {!formData.name.trim() && (
                <p className="text-xs text-red-500 mt-1">Name is required</p>
              )}
            </div>

            {/* Company Field */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Company</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Building className="h-4 w-4" />
                </div>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Your company name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Your phone number"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Website Field */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="Your website URL"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-3">
            <Button
              type="submit"
              disabled={saving}
              className={`w-full sm:w-auto ${updateSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : updateSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
} 
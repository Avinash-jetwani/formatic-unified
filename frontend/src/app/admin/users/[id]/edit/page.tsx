'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { adminService, User, UpdateUserRequest } from '@/services/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserRole = 'SUPER_ADMIN' | 'CLIENT';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export default function EditUserPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: '',
    name: '',
    role: 'CLIENT' as UserRole,
    status: 'ACTIVE' as UserStatus,
    company: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await adminService.getUserById(userId);
      setUser(userData);
      
      // Initialize form with user data
      setFormData({
        email: userData.email,
        name: userData.name || '',
        role: userData.role,
        status: userData.status,
        company: userData.company || '',
        phone: userData.phone || '',
        website: userData.website || ''
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    if (!password) return true; // Empty password is valid on edit (no change)
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setPasswordError('Password must contain at least one special character');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Email is required.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password && !validatePassword(formData.password)) {
      toast({
        title: 'Validation Error',
        description: passwordError,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSaving(true);
      await adminService.updateUser(userId, formData);
      toast({
        title: 'Success',
        description: 'User updated successfully.',
      });
      // Navigate back to user details page
      router.push(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateUserRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Action buttons for header
  const headerActions = (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full sm:w-auto"
        onClick={() => router.push(`/admin/users/${userId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span className="whitespace-nowrap">Cancel</span>
      </Button>
      <Button 
        type="submit" 
        size="sm" 
        form="edit-user-form"
        disabled={saving}
        className="w-full sm:w-auto"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="whitespace-nowrap">Saving</span>
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Save Changes</span>
          </>
        )}
      </Button>
    </>
  );

  return (
    <PageLayout
      title={loading ? 'Loading...' : `Edit User: ${user?.name || user?.email || ''}`}
      description="Update user details and settings"
      actions={headerActions}
    >
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4 mb-2" />
            <Skeleton className="h-4 w-2/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Edit User</CardTitle>
            <CardDescription>
              Update user information and account settings
            </CardDescription>
          </CardHeader>
          <form id="edit-user-form" onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => handleChange('role', value)}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Field */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: UserStatus) => handleChange('status', value)}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="LOCKED">Locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Field */}
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Company Name"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Website Field */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Password Reset Section */}
                <div className="space-y-2 sm:col-span-2 border-t pt-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-medium">Reset Password</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Optional: Set a new password for this user
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange('password', value);
                          if (value) validatePassword(value);
                        }}
                        placeholder="Leave blank to keep current password"
                      />
                      <button 
                        type="button"
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-destructive">{passwordError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave this field empty if you don't want to change the password. New password must include at least 8 characters with uppercase, lowercase, numbers, and special characters.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 px-4 sm:px-6 py-4 sm:py-6 border-t">
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto"
                onClick={() => router.push(`/admin/users/${userId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </PageLayout>
  );
} 
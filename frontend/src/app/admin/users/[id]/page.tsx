'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/ui/PageLayout';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  Clock, 
  FileText, 
  ListChecks, 
  CheckCircle2, 
  Lock, 
  UserX, 
  UserCheck, 
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { adminService, User, UserStats } from '@/services/admin';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Fetch user and stats in parallel
      const [userData, statsData] = await Promise.all([
        adminService.getUserById(userId),
        adminService.getUserStats(userId)
      ]);
      
      setUser(userData);
      setUserStats(statsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (newStatus: UserStatus) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const updatedUser = await adminService.updateUser(userId, { status: newStatus });
      setUser(updatedUser);
      
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
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

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a new password.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      toast({
        title: 'Validation Error',
        description: passwordError,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      await adminService.resetUserPassword(userId, newPassword);
      
      toast({
        title: 'Success',
        description: 'Password has been reset successfully.',
      });
      
      setIsResetPasswordOpen(false);
      setNewPassword('');
      setShowPassword(false);
      setPasswordError('');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      await adminService.deleteUser(userId);
      
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });
      
      router.push('/admin/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'LOCKED':
        return <Badge variant="destructive">Locked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="default">Admin</Badge>;
      case 'CLIENT':
        return <Badge variant="outline">Client</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Action buttons for header
  const headerActions = (
    <>
      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => router.push('/admin/users')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span className="whitespace-nowrap">Back to Users</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => router.push(`/admin/users/${userId}/edit`)}
      >
        <Edit className="mr-2 h-4 w-4" />
        <span className="whitespace-nowrap">Edit</span>
      </Button>
      <Button 
        variant="destructive" 
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span className="whitespace-nowrap">Delete</span>
      </Button>
    </>
  );

  return (
    <PageLayout
      title={loading ? 'Loading User...' : `${user?.name || 'User'}`}
      description={loading ? '' : user?.email || ''}
      actions={headerActions}
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - User profile and actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* User profile card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl sm:text-4xl">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <CardTitle className="text-center text-xl sm:text-2xl">{user?.name || 'Unnamed User'}</CardTitle>
                <CardDescription className="text-center break-all">{user?.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-center flex-wrap gap-2">
                    {user?.role && getRoleBadge(user.role)}
                    {user?.status && (
                      <span className="ml-0 sm:ml-2">{getStatusBadge(user.status)}</span>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {user?.phone && (
                    <div className="flex items-center text-sm overflow-hidden">
                      <Phone className="flex-shrink-0 mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{user.phone}</span>
                    </div>
                  )}
                  
                  {user?.company && (
                    <div className="flex items-center text-sm overflow-hidden">
                      <Building className="flex-shrink-0 mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{user.company}</span>
                    </div>
                  )}
                  
                  {user?.website && (
                    <div className="flex items-center text-sm overflow-hidden">
                      <Globe className="flex-shrink-0 mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{user.website}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm">
                    <Clock className="flex-shrink-0 mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      Created {formatDistanceToNow(new Date(user?.createdAt || ''), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Clock className="flex-shrink-0 mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {user?.lastLogin 
                        ? `Last login ${formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}`
                        : 'Never logged in'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {/* Action buttons */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setIsResetPasswordOpen(true)}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
                
                {user?.status === 'ACTIVE' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleUpdateUserStatus('INACTIVE')}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate User
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleUpdateUserStatus('ACTIVE')}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate User
                  </Button>
                )}
                
                {user?.status !== 'LOCKED' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleUpdateUserStatus('LOCKED')}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Lock Account
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleUpdateUserStatus('ACTIVE')}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Unlock Account
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* User stats card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Forms Created</p>
                    <p className="text-xl sm:text-2xl font-bold">{userStats?.formsCount || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Submissions</p>
                    <p className="text-xl sm:text-2xl font-bold">{userStats?.submissionsCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Tabbed content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4 grid grid-cols-3 w-full overflow-x-auto">
                <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="forms" className="whitespace-nowrap">Forms</TabsTrigger>
                <TabsTrigger value="activity" className="whitespace-nowrap">Activity</TabsTrigger>
              </TabsList>
              
              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>
                      Overview of user activity and information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Forms</p>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                          <p className="font-medium">{userStats?.formsCount || 0}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Submissions</p>
                        <div className="flex items-center">
                          <ListChecks className="h-4 w-4 mr-1 text-muted-foreground" />
                          <p className="font-medium">{userStats?.submissionsCount || 0}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                        <div>
                          {user?.status && getStatusBadge(user.status)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Last Login</p>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <p className="text-xs sm:text-sm">
                            {user?.lastLogin 
                              ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent activity */}
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
                      {userStats?.activityLog && userStats.activityLog.length > 0 ? (
                        <div className="space-y-3">
                          {userStats.activityLog.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="rounded-full p-1 bg-primary/10">
                                {activity.type === 'form_created' ? (
                                  <FileText className="h-3 w-3 text-primary" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.details}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Account information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                        <div className="flex items-center overflow-hidden">
                          <Mail className="flex-shrink-0 h-4 w-4 mr-1 text-muted-foreground" />
                          <p className="font-medium truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Role</p>
                        <div>
                          {user?.role && getRoleBadge(user.role)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Created On</p>
                        <p className="font-medium text-sm">
                          {user?.createdAt && format(new Date(user.createdAt), 'PPP')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium text-sm">
                          {user?.updatedAt && format(new Date(user.updatedAt), 'PPP')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Forms tab */}
              <TabsContent value="forms" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Forms</CardTitle>
                    <CardDescription>
                      Forms created by this user
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userStats?.formsList && userStats.formsList.length > 0 ? (
                      <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
                        <div className="space-y-4">
                          {userStats.formsList.map((form) => (
                            <Card key={form.id} className="overflow-hidden">
                              <CardHeader className="pb-2 px-3 sm:px-6">
                                <CardTitle className="text-sm sm:text-base truncate">{form.title}</CardTitle>
                              </CardHeader>
                              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-2 px-3 sm:px-6">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={() => router.push(`/forms/${form.id}`)}
                                >
                                  <Edit className="mr-2 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={() => router.push(`/forms/${form.id}/preview`)}
                                >
                                  <Eye className="mr-2 h-3 w-3" />
                                  Preview
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px]">
                        <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground text-center">
                          This user hasn't created any forms yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Activity tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>
                      Recent user activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userStats?.activityLog && userStats.activityLog.length > 0 ? (
                      <ScrollArea className="h-[300px] sm:h-[500px] pr-4">
                        <div className="space-y-4">
                          {userStats.activityLog.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                                {activity.type === 'form_created' ? (
                                  <FileText className="h-4 w-4 text-primary" />
                                ) : activity.type === 'form_updated' ? (
                                  <Edit className="h-4 w-4 text-primary" />
                                ) : activity.type === 'form_published' ? (
                                  <Globe className="h-4 w-4 text-primary" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base break-words">{activity.details}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {format(new Date(activity.date), 'PPP p')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px]">
                        <Clock className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground text-center">
                          No activity recorded for this user
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user. They will need to use this password for their next login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewPassword(value);
                    if (value) validatePassword(value);
                  }}
                  placeholder="Enter new password"
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
                Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => {
                setIsResetPasswordOpen(false);
                setNewPassword('');
                setPasswordError('');
                setShowPassword(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto"
              onClick={handleResetPassword} 
              disabled={!newPassword || !!passwordError}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be permanently deleted from the system along with all their forms and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
} 
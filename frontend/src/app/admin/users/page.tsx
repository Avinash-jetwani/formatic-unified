'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Search, 
  Download, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  UserCog, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Lock, 
  UserX, 
  UserCheck, 
  Filter, 
  ChevronDown,
  Check,
  Clock,
  Users,
  UserPlus,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star,
  Zap,
  Globe,
  Mail,
  Phone,
  Building,
  MapPin,
  Award,
  Target,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Sparkles,
  BarChart3,
  Crown,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/ui/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, getStatusVariant } from '@/components/ui/PageLayout';
import { adminService, User } from '@/services/admin';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type UserRole = 'CLIENT' | 'SUPER_ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

// Enhanced Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
};

const statsVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

// Advanced Theme Generator
const generateUserTheme = (stats: any) => {
  const totalUsers = stats?.total || 0;
  const activeRate = stats?.total > 0 ? (stats?.active / stats?.total) * 100 : 0;
  const adminCount = stats?.admins || 0;
  
  if (activeRate >= 90 && totalUsers > 50) {
    // High engagement theme
    return {
      primary: 'from-emerald-400 via-green-500 to-teal-600',
      secondary: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20',
      accent: 'border-emerald-200 dark:border-emerald-700',
      glow: 'shadow-emerald-500/20',
      particle: 'bg-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400'
    };
  } else if (totalUsers > 20) {
    // Growing community theme
    return {
      primary: 'from-blue-400 via-indigo-500 to-purple-600',
      secondary: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20',
      accent: 'border-blue-200 dark:border-blue-700',
      glow: 'shadow-blue-500/20',
      particle: 'bg-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    };
  } else if (adminCount > 1) {
    // Admin focused theme
    return {
      primary: 'from-purple-400 via-pink-500 to-rose-600',
      secondary: 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20',
      accent: 'border-purple-200 dark:border-purple-700',
      glow: 'shadow-purple-500/20',
      particle: 'bg-purple-400',
      text: 'text-purple-600 dark:text-purple-400'
    };
  } else {
    // Default theme
    return {
      primary: 'from-slate-400 via-gray-500 to-zinc-600',
      secondary: 'from-slate-50 to-gray-100 dark:from-slate-900/20 dark:to-gray-800/20',
      accent: 'border-slate-200 dark:border-slate-700',
      glow: 'shadow-slate-500/20',
      particle: 'bg-slate-400',
      text: 'text-slate-600 dark:text-slate-400'
    };
  }
};

// Floating particles background
const FloatingParticles = ({ theme }: { theme: any }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        className={`absolute w-2 h-2 ${theme.particle} rounded-full opacity-20`}
        initial={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        }}
        animate={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        }}
        transition={{
          duration: Math.random() * 15 + 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
        style={{
          filter: 'blur(1px)',
        }}
      />
    ))}
  </div>
);

// Enhanced Counter Animation
const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  className = "",
  prefix = "",
  suffix = ""
}: {
  value: string | number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const finalValue = typeof value === 'string' ? parseInt(value.replace(/,/g, '')) || 0 : value;

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(finalValue * progress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [finalValue, duration]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created' | 'login'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    recentlyActive: 0,
    growthRate: 0,
    avgFormsPerUser: 0,
    totalSubmissions: 0
  });

  // Theme based on user data
  const theme = useMemo(() => generateUserTheme(stats), [stats]);
  
  // Enhanced filtering and sorting
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = currentTab === 'all' || 
        (currentTab === 'active' && user.status === 'ACTIVE') ||
        (currentTab === 'inactive' && user.status === 'INACTIVE') ||
        (currentTab === 'locked' && user.status === 'LOCKED') ||
        (currentTab === 'admin' && user.role === 'SUPER_ADMIN');
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesTab && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || a.email;
          bValue = b.name || b.email;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'login':
          aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
          bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, currentTab, roleFilter, statusFilter, sortBy, sortOrder]);

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'CLIENT' as UserRole,
    status: 'ACTIVE' as UserStatus,
    company: '',
    phone: '',
    website: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await adminService.getAllUsers();
      setUsers(userData);
      calculateStats(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData: User[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentUsers = userData.filter(user => new Date(user.createdAt) > monthAgo).length;
    const totalForms = userData.reduce((sum, user) => sum + (user.formsCount || 0), 0);
    const totalSubmissions = userData.reduce((sum, user) => sum + (user.submissionsCount || 0), 0);
    
    setStats({
      total: userData.length,
      active: userData.filter(user => user.status === 'ACTIVE').length,
      inactive: userData.filter(user => user.status !== 'ACTIVE').length,
      admins: userData.filter(user => user.role === 'SUPER_ADMIN').length,
      recentlyActive: userData.filter(user => 
        user.lastLogin && new Date(user.lastLogin) > weekAgo
      ).length,
      growthRate: userData.length > 0 ? (recentUsers / userData.length) * 100 : 0,
      avgFormsPerUser: userData.length > 0 ? totalForms / userData.length : 0,
      totalSubmissions
    });
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      toast({
        title: 'Validation Error',
        description: 'Email and password are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(newUser.password)) {
      toast({
        title: 'Validation Error',
        description: passwordError,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      await adminService.createUser(newUser);
      toast({
        title: 'Success',
        description: 'User created successfully.',
      });
      setIsCreateDialogOpen(false);
      // Reset form
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'CLIENT',
        status: 'ACTIVE',
        company: '',
        phone: '',
        website: ''
      });
      setShowPassword(false);
      setPasswordError('');
      // Reload users
      await loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userIdToDelete) return;
    
    try {
      setLoading(true);
      await adminService.deleteUser(userIdToDelete);
      setUsers(users.filter(user => user.id !== userIdToDelete));
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUserIdToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      setLoading(true);
      await adminService.updateUser(userId, { status: newStatus });
      
      // Update in the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
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

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/${userId}/edit`);
  };

  // Enhanced refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const handleSort = (field: 'name' | 'email' | 'created' | 'login') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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

  // Enhanced action buttons for header
  const headerActions = (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        Refresh
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          size="sm" 
          onClick={() => setIsCreateDialogOpen(true)}
          className={cn("gap-2 bg-gradient-to-r", theme.primary)}
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </motion.div>
    </>
  );

  return (
    <div className="relative min-h-screen">
      <FloatingParticles theme={theme} />
      <div className="relative z-10">
        <PageLayout 
          title="User Management"
          description="Manage your community with advanced user controls and insights"
          actions={headerActions}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >

          {/* Enhanced Stats Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {/* Total Users */}
            <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
              <Card className={cn("overflow-hidden", theme.glow)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">
                        <AnimatedCounter value={stats.total} />
                      </p>
                    </div>
                    <div className={cn("p-2 rounded-lg bg-gradient-to-r", theme.secondary)}>
                      <Users className={cn("h-5 w-5", theme.text)} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{stats.growthRate.toFixed(1)}% this month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Users */}
            <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold text-green-600">
                        <AnimatedCounter value={stats.active} />
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <span>{((stats.active / Math.max(stats.total, 1)) * 100).toFixed(1)}% of total</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Admins */}
            <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admins</p>
                      <p className="text-2xl font-bold text-purple-600">
                        <AnimatedCounter value={stats.admins} />
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Crown className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 mr-1" />
                    <span>Admin access</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recently Active */}
            <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                      <p className="text-2xl font-bold text-blue-600">
                        <AnimatedCounter value={stats.recentlyActive} />
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Last 7 days</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Avg Forms */}
            <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Forms</p>
                      <p className="text-2xl font-bold text-amber-600">
                        <AnimatedCounter value={stats.avgFormsPerUser.toFixed(1)} />
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                      <BarChart3 className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Target className="h-3 w-3 mr-1" />
                    <span>Per user</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Submissions */}
            <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        <AnimatedCounter value={stats.totalSubmissions} />
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                      <Zap className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span>Total collected</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Enhanced Main Content Card */}
          <motion.div variants={itemVariants}>
            <Card className={cn("overflow-hidden", theme.accent)}>
        <CardHeader className="pb-4">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and their permissions
          </CardDescription>
          
          <div className="mt-4 overflow-x-auto">
            <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
              <TabsList className="w-full flex flex-nowrap whitespace-nowrap overflow-x-auto max-w-full sm:inline-flex">
                <TabsTrigger value="all" className="flex-shrink-0">All Users</TabsTrigger>
                <TabsTrigger value="active" className="flex-shrink-0">Active</TabsTrigger>
                <TabsTrigger value="inactive" className="flex-shrink-0">Inactive</TabsTrigger>
                <TabsTrigger value="locked" className="flex-shrink-0">Locked</TabsTrigger>
                <TabsTrigger value="admin" className="flex-shrink-0">Admins</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Role filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto sm:min-w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {roleFilter === 'all' ? 'All Roles' : roleFilter === 'SUPER_ADMIN' ? 'Admins' : 'Clients'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                    {roleFilter === 'all' && <Check className="mr-2 h-4 w-4" />}
                    All Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('SUPER_ADMIN')}>
                    {roleFilter === 'SUPER_ADMIN' && <Check className="mr-2 h-4 w-4" />}
                    Admins
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('CLIENT')}>
                    {roleFilter === 'CLIENT' && <Check className="mr-2 h-4 w-4" />}
                    Clients
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Status filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto sm:min-w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {statusFilter === 'all' ? 'All Status' : statusFilter.toLowerCase()}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    {statusFilter === 'all' && <Check className="mr-2 h-4 w-4" />}
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                    {statusFilter === 'ACTIVE' && <Check className="mr-2 h-4 w-4" />}
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('INACTIVE')}>
                    {statusFilter === 'INACTIVE' && <Check className="mr-2 h-4 w-4" />}
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('LOCKED')}>
                    {statusFilter === 'LOCKED' && <Check className="mr-2 h-4 w-4" />}
                    Locked
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop Table View - Hidden on smaller screens */}
          <div className="rounded-md border hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSort('name')}>
                    Name
                    {sortBy === 'name' && (
                      <span className="ml-2 inline-block">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                    Email
                    {sortBy === 'email' && (
                      <span className="ml-2 inline-block">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('login')}>
                    Last Active
                    {sortBy === 'login' && (
                      <span className="ml-2 inline-block">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('created')}>
                    Created
                    {sortBy === 'created' && (
                      <span className="ml-2 inline-block">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array(5).fill(null).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[70px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground mb-2">No users found</p>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setRoleFilter('all');
                          setCurrentTab('all');
                        }}>
                          Reset filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name || 'Unnamed User'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm">{user.formsCount || 0} forms</span>
                          <span className="mx-1">·</span>
                          <span className="text-sm">{user.submissionsCount || 0} submissions</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div onClick={(e) => e.stopPropagation()} className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(user.id)}
                            title="View user details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user.id)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'INACTIVE')}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              
                              {user.status !== 'LOCKED' ? (
                                <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'LOCKED')}>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Lock Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unlock Account
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setUserIdToDelete(user.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {loading ? (
              // Loading skeletons for cards
              Array(3).fill(null).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[150px] mb-2" />
                      <Skeleton className="h-5 w-[60px]" />
                    </div>
                    <Skeleton className="h-3 w-[180px]" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center mb-3">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-[70%]" />
                  </CardContent>
                </Card>
              ))
            ) : filteredUsers.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-2">No users found</p>
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setCurrentTab('all');
                }}>
                  Reset filters
                </Button>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center mb-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <CardTitle className="text-md">{user.name || 'Unnamed User'}</CardTitle>
                      </div>
                      {getStatusBadge(user.status)}
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center mt-2 mb-2 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        {getRoleBadge(user.role)}
                        {user.company && (
                          <span className="ml-2">{user.company}</span>
                        )}
                      </div>
                      <div>
                        {user.lastLogin ? (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                          </div>
                        ) : (
                          <span>Never logged in</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Created {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</p>
                      <div className="flex items-center mt-1">
                        <span>{user.formsCount || 0} forms</span>
                        <span className="mx-1">·</span>
                        <span>{user.submissionsCount || 0} submissions</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="flex justify-between items-center p-2 border-t">
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="text-xs"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="text-xs"
                      onClick={() => handleEditUser(user.id)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          <MoreHorizontal className="mr-1 h-3 w-3" />
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === 'ACTIVE' ? (
                          <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'INACTIVE')}>
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        
                        {user.status !== 'LOCKED' ? (
                          <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'LOCKED')}>
                            <Lock className="mr-2 h-4 w-4" />
                            Lock
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Unlock
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setUserIdToDelete(user.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
            </Card>
          </motion.div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They'll receive an email with login instructions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewUser({ ...newUser, password: value });
                      if (value) validatePassword(value);
                    }}
                    required
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
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                </p>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={newUser.status}
                    onValueChange={(value: UserStatus) => setNewUser({ ...newUser, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="LOCKED">Locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="company" className="text-sm font-medium">
                  Company
                </label>
                <Input
                  id="company"
                  placeholder="Company Inc."
                  value={newUser.company}
                  onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="website" className="text-sm font-medium">
                    Website
                  </label>
                  <Input
                    id="website"
                    placeholder="example.com"
                    value={newUser.website}
                    onChange={(e) => setNewUser({ ...newUser, website: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={!newUser.email || !newUser.password}>
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be permanently deleted from the system along with all their forms and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </motion.div>
        </PageLayout>
      </div>
    </div>
  );
} 
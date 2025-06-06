'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Webhook, webhookService } from '@/services/webhook';
import { 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  Eye, 
  PowerOff, 
  Power,
  RefreshCw,
  Download,
  Plus,
  Webhook as WebhookIcon,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  Zap,
  Target,
  BarChart3,
  Globe,
  Settings,
  Star,
  AlertOctagon,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export default function AdminWebhooksPage() {
  const router = useRouter();
  
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  
  // Enhanced stats calculation
  const stats = useMemo(() => {
    const total = webhooks.length;
    const active = webhooks.filter(w => w.active && w.adminApproved === true).length;
    const pending = webhooks.filter(w => w.adminApproved === null).length;
    const rejected = webhooks.filter(w => w.adminApproved === false).length;
    const locked = webhooks.filter(w => w.adminLocked === true).length;
    const templates = webhooks.filter(w => w.isTemplate === true).length;
    
    const totalRequests = webhooks.reduce((sum, w) => sum + (w.dailyUsage || 0), 0);
    const avgRequestsPerWebhook = total > 0 ? totalRequests / total : 0;
    const successRate = active > 0 ? (active / total) * 100 : 0;
    
    // Calculate 30-day growth (mock data for now)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWebhooks = webhooks.filter(w => new Date(w.createdAt) > thirtyDaysAgo).length;
    const growthRate = total > 0 ? (recentWebhooks / total) * 100 : 0;
    
    return {
      total,
      active,
      pending,
      rejected,
      locked,
      templates,
      totalRequests,
      avgRequestsPerWebhook,
      successRate,
      growthRate
    };
  }, [webhooks]);
  
  // Load all webhooks
  useEffect(() => {
    loadWebhooks();
  }, []);
  
  const loadWebhooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📊 Fetching all webhooks...');
      const data = await webhookService.getAllWebhooks();
      console.log(`✅ Loaded ${data.length} webhooks successfully`);
      setWebhooks(data);
    } catch (err) {
      console.error('❌ Error loading webhooks:', err);
      setError('Failed to load webhooks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWebhooks();
    setIsRefreshing(false);
  };
  
  // Approve a webhook
  const approveWebhook = async (webhookId: string) => {
    console.log(`🔄 Approving webhook ${webhookId}...`);
    try {
      const result = await webhookService.approveWebhook(webhookId);
      console.log(`✅ Webhook ${webhookId} approved successfully:`, result);
      await loadWebhooks();
      return true;
    } catch (err) {
      console.error(`❌ Error approving webhook ${webhookId}:`, err);
      throw err;
    }
  };
  
  // Reject a webhook
  const rejectWebhook = async (webhookId: string) => {
    console.log(`🔄 Rejecting webhook ${webhookId}...`);
    try {
      const result = await webhookService.rejectWebhook(webhookId);
      console.log(`✅ Webhook ${webhookId} rejected successfully:`, result);
      await loadWebhooks();
      return true;
    } catch (err) {
      console.error(`❌ Error rejecting webhook ${webhookId}:`, err);
      throw err;
    }
  };
  
  // View webhook details
  const viewWebhookDetails = (formId: string, webhookId: string) => {
    router.push(`/forms/${formId}/webhooks/${webhookId}/logs`);
  };
  
  // Filter webhooks
  const filteredWebhooks = useMemo(() => {
    return webhooks.filter(webhook => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.formTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = webhook.active && webhook.adminApproved === true;
      } else if (filterStatus === 'inactive') {
        matchesStatus = !webhook.active || webhook.adminApproved === false;
      } else if (filterStatus === 'pending') {
        matchesStatus = webhook.adminApproved === null;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [webhooks, searchTerm, filterStatus]);

  // Sort webhooks to show pending at the top
  const sortedWebhooks = useMemo(() => {
    return [...filteredWebhooks].sort((a, b) => {
      // Pending webhooks come first
      if (a.adminApproved === null && b.adminApproved !== null) return -1;
      if (a.adminApproved !== null && b.adminApproved === null) return 1;
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredWebhooks]);
  
  // Add lock/unlock webhook function
  const toggleLockWebhook = async (webhookId: string, currentLocked: boolean) => {
    try {
      await webhookService.updateWebhook(
        webhooks.find(w => w.id === webhookId)?.formId || '', 
        webhookId, 
        { adminLocked: !currentLocked }
      );
      await loadWebhooks();
      toast({
        title: currentLocked ? 'Webhook unlocked' : 'Webhook locked',
        description: currentLocked 
          ? 'The webhook can now be modified by the client.'
          : 'The webhook has been locked and cannot be modified by the client.',
      });
      return true;
    } catch (err) {
      console.error('Error locking/unlocking webhook:', err);
      toast({
        title: 'Error',
        description: 'Failed to update webhook lock status.',
        variant: 'destructive',
      });
      throw err;
    }
  };
  
  // Add a function to toggle webhook active status
  const toggleWebhookActive = async (webhookId: string, currentActive: boolean) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) return false;
      
      await webhookService.updateWebhook(
        webhook.formId, 
        webhookId, 
        { 
          active: !currentActive,
        }
      );
      
      await loadWebhooks();
      
      toast({
        title: currentActive ? 'Webhook deactivated' : 'Webhook activated',
        description: currentActive 
          ? 'The webhook has been deactivated and will not process submissions.'
          : 'The webhook has been activated and can now process submissions.',
      });
      return true;
    } catch (err) {
      console.error('Error toggling webhook active status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update webhook status.',
        variant: 'destructive',
      });
      throw err;
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
    </>
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Enhanced Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600">
                  <WebhookIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Webhooks Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Monitor and manage webhook integrations across your platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {/* Total Webhooks */}
        <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Webhooks</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter value={stats.total} />
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                  <WebhookIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+{stats.growthRate.toFixed(1)}% this month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Webhooks */}
        <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    <AnimatedCounter value={stats.active} />
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <span>{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% success rate</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Approval */}
        <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">
                    <AnimatedCounter value={stats.pending} />
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Awaiting approval</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Requests */}
        <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requests</p>
                  <p className="text-2xl font-bold text-blue-600">
                    <AnimatedCounter value={stats.totalRequests} />
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3 mr-1" />
                <span>Daily total</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Locked Webhooks */}
        <motion.div variants={statsVariants} whileHover={cardHoverVariants.hover}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Locked</p>
                  <p className="text-2xl font-bold text-purple-600">
                    <AnimatedCounter value={stats.locked} />
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" />
                <span>Admin protected</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Pending Webhooks Alert */}
      <AnimatePresence>
        {stats.pending > 0 && (
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Webhooks Awaiting Approval</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      There {stats.pending === 1 ? 'is' : 'are'} {stats.pending} webhook{stats.pending !== 1 ? 's' : ''} waiting for your approval. 
                      Webhooks won't receive any data until approved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Main Content Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Webhook Management</CardTitle>
                <CardDescription>
                  Monitor, approve, and manage webhook integrations
                </CardDescription>
              </div>
            </div>
            
            {/* Enhanced Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search webhooks, URLs, forms..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All webhooks</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold">Error Loading Webhooks</h3>
                <p className="text-muted-foreground text-center mt-2 max-w-md">
                  {error}
                </p>
                <Button className="mt-4" onClick={loadWebhooks}>
                  Try Again
                </Button>
              </motion.div>
            ) : webhooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="rounded-full bg-muted p-4 mb-4">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Webhooks Found</h3>
                <p className="text-muted-foreground text-center mt-2 max-w-md">
                  There are no webhooks configured in the system.
                </p>
              </motion.div>
            ) : filteredWebhooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Matching Webhooks</h3>
                <p className="text-muted-foreground text-center mt-2 max-w-md">
                  No webhooks match your current search or filter criteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredWebhooks.length} of {webhooks.length} webhooks
                    {filterStatus === 'pending' && stats.pending > 0 && (
                      <span className="ml-1 text-amber-600 font-medium">
                        ({stats.pending} pending approval)
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Webhook</TableHead>
                        <TableHead>Form</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {sortedWebhooks.map((webhook, index) => (
                          <motion.tr
                            key={webhook.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-muted/50"
                          >
                            <TableCell>
                              <div className="font-medium">{webhook.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {webhook.url}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{webhook.formTitle || "Unknown Form"}</div>
                              <div className="text-xs text-muted-foreground">{webhook.formId}</div>
                            </TableCell>
                            <TableCell>
                              {webhook.clientName ? (
                                <div>
                                  <div className="font-medium">{webhook.clientName}</div>
                                  <div className="text-xs text-muted-foreground">{webhook.clientEmail}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{webhook.createdById || 'System'}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {webhook.adminApproved === null ? (
                                  <Badge variant="outline" className="border-amber-500 text-amber-500">
                                    Pending Approval
                                  </Badge>
                                ) : webhook.adminApproved ? (
                                  webhook.active ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      Inactive
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="destructive">
                                    Rejected
                                  </Badge>
                                )}
                                {webhook.adminLocked && (
                                  <Badge variant="outline" className="border-purple-500 text-purple-500">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                                {webhook.isTemplate && (
                                  <Badge variant="secondary">
                                    <Star className="h-3 w-3 mr-1" />
                                    Template
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(webhook.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => viewWebhookDetails(webhook.formId, webhook.id)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View details</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => toggleLockWebhook(webhook.id, webhook.adminLocked === true)}
                                      >
                                        {webhook.adminLocked 
                                          ? <Unlock className="h-4 w-4" /> 
                                          : <Lock className="h-4 w-4" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {webhook.adminLocked ? 'Unlock webhook' : 'Lock webhook'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => toggleWebhookActive(webhook.id, webhook.active)}
                                      >
                                        {webhook.active 
                                          ? <PowerOff className="h-4 w-4 text-red-500" /> 
                                          : <Power className="h-4 w-4 text-green-500" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {webhook.active ? 'Deactivate' : 'Activate'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {webhook.adminApproved === null && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={async () => {
                                              try {
                                                toast({ title: 'Processing', description: 'Approving webhook...' });
                                                await approveWebhook(webhook.id);
                                                toast({ 
                                                  title: 'Webhook approved', 
                                                  description: 'The webhook has been approved and can now receive data.' 
                                                });
                                              } catch (err) {
                                                toast({ 
                                                  title: 'Error', 
                                                  description: 'Failed to approve webhook', 
                                                  variant: 'destructive' 
                                                });
                                              }
                                            }}
                                          >
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Approve webhook</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={async () => {
                                              if (confirm('Are you sure you want to reject this webhook?')) {
                                                try {
                                                  toast({ title: 'Processing', description: 'Rejecting webhook...' });
                                                  await rejectWebhook(webhook.id);
                                                  toast({ 
                                                    title: 'Webhook rejected', 
                                                    description: 'The webhook has been rejected and will not receive any data.' 
                                                  });
                                                } catch (err) {
                                                  toast({ 
                                                    title: 'Error', 
                                                    description: 'Failed to reject webhook', 
                                                    variant: 'destructive' 
                                                  });
                                                }
                                              }
                                            }}
                                          >
                                            <XCircle className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Reject webhook</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 
'use client';

import { useState } from 'react';
import { WebhookStats } from '@/services/webhook';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, BarChart, TrendingUp, Percent, Clock4 } from 'lucide-react';

interface WebhookDashboardProps {
  stats: WebhookStats;
  title?: string;
  description?: string;
}

export function WebhookDashboard({ stats, title, description }: WebhookDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '24h'>('7d');
  
  const statusIcons = {
    SUCCESS: <Check className="h-4 w-4 text-green-500" />,
    FAILED: <X className="h-4 w-4 text-destructive" />,
    PENDING: <Clock className="h-4 w-4 text-blue-500" />,
    SCHEDULED: <Clock4 className="h-4 w-4 text-yellow-500" />
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'destructive';
      case 'PENDING': return 'default';
      case 'SCHEDULED': return 'outline';
      default: return 'outline';
    }
  };
  
  // Filter daily stats based on selected time range
  const filteredDailyStats = stats.dailyStats.filter(stat => {
    // Logic to filter based on timeRange would go here
    return true; // For now, show all
  });
  
  // Group daily stats by date to combine different statuses
  const groupedByDate = filteredDailyStats.reduce((acc, stat) => {
    const date = stat.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = {};
    }
    acc[date][stat.status] = stat.count;
    return acc;
  }, {} as Record<string, Record<string, number>>);
  
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <div className="text-2xl font-bold">{stats.metrics.totalDeliveries}</div>
              </div>
              <BarChart className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <div className="text-2xl font-bold">{(stats.metrics.successRate * 100).toFixed(1)}%</div>
              </div>
              <Percent className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <div className="text-2xl font-bold">{stats.metrics.averageResponseMs}ms</div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>
                Distribution of webhook delivery statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.overallStats.map((stat) => (
                  <div key={stat.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcons[stat.status as keyof typeof statusIcons]}
                        <span className="font-medium">{stat.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{stat.count}</span>
                        <span className="text-muted-foreground text-sm">
                          ({Math.round((stat.count / stats.metrics.totalDeliveries) * 100)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          stat.status === 'SUCCESS' ? 'bg-green-500' :
                          stat.status === 'FAILED' ? 'bg-destructive' :
                          stat.status === 'PENDING' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${(stat.count / stats.metrics.totalDeliveries) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Response time chart would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>
                Webhook deliveries by day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-end space-x-2">
                  <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                    <TabsList className="grid w-40 grid-cols-3">
                      <TabsTrigger value="24h">24h</TabsTrigger>
                      <TabsTrigger value="7d">7d</TabsTrigger>
                      <TabsTrigger value="30d">30d</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Daily activity chart would go here
                </div>
                
                <div className="space-y-2">
                  {Object.entries(groupedByDate).map(([date, statuses]) => (
                    <div key={date} className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div className="flex gap-2">
                          {Object.entries(statuses).map(([status, count]) => (
                            <Badge key={status} variant="outline" className="flex items-center gap-1">
                              {statusIcons[status as keyof typeof statusIcons]}
                              <span>{count}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
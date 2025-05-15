'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface WebhookSummaryProps {
  totalWebhooks: number;
  activeWebhooks: number;
  pendingApproval: number;
  recentDeliveries: {
    success: number;
    failed: number;
    pending: number;
  };
  topForms: {
    id: string;
    name: string;
    webhookCount: number;
  }[];
}

export function WebhookSummary({
  totalWebhooks,
  activeWebhooks,
  pendingApproval,
  recentDeliveries,
  topForms,
}: WebhookSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              {activeWebhooks} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            {pendingApproval > 0 && <Badge>{pendingApproval}</Badge>}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval}</div>
            <p className="text-xs text-muted-foreground">
              {pendingApproval === 0 ? 'All webhooks approved' : 'Webhooks awaiting approval'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-green-500">
                <CheckCircle className="mr-1 h-4 w-4" />
                <span className="text-lg font-bold">{recentDeliveries.success}</span>
              </div>
              <div className="flex items-center text-destructive">
                <XCircle className="mr-1 h-4 w-4" />
                <span className="text-lg font-bold">{recentDeliveries.failed}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span className="text-lg font-bold">{recentDeliveries.pending}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Forms with Webhooks</CardTitle>
          <CardDescription>
            Forms with the most webhook integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {topForms.length > 0 ? (
              topForms.map((form) => (
                <div key={form.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="font-medium">{form.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {form.webhookCount} webhook{form.webhookCount === 1 ? '' : 's'}
                    </div>
                  </div>
                  <Link href={`/forms/${form.id}/webhooks`} passHref>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="px-6 py-6 text-center text-muted-foreground">
                No forms with webhooks found
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/admin/webhooks">View All Webhooks</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Shield, Bell, Package, TrendingUp, MessageSquare } from 'lucide-react';

interface EmailPreferences {
  emailNotificationsEnabled: boolean;
  securityNotifications: boolean;
  accountUpdates: boolean;
  webhookNotifications: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
}

export default function EmailPreferencesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    emailNotificationsEnabled: true,
    securityNotifications: true,
    accountUpdates: true,
    webhookNotifications: true,
    productUpdates: true,
    marketingEmails: false,
    weeklyReports: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadEmailPreferences();
    }
  }, [user?.id]);

  const loadEmailPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user?.id}/email-preferences`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences({
          emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
          securityNotifications: data.securityNotifications ?? true,
          accountUpdates: data.accountUpdates ?? true,
          webhookNotifications: data.webhookNotifications ?? true,
          productUpdates: data.productUpdates ?? true,
          marketingEmails: data.marketingEmails ?? false,
          weeklyReports: data.weeklyReports ?? true,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load email preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveEmailPreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/users/${user?.id}/email-preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email preferences updated successfully',
        });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const PreferenceSwitch = ({ 
    id, 
    checked, 
    onCheckedChange, 
    disabled = false 
  }: { 
    id: string; 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="data-[state=checked]:bg-blue-600"
    />
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Email Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Control which email notifications you receive from Datizmo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>
            Choose which types of emails you'd like to receive. You can update these preferences at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="space-y-1">
              <Label htmlFor="master-toggle" className="text-base font-semibold text-blue-900 dark:text-blue-100">
                Email Notifications
              </Label>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Master toggle for all email notifications. When disabled, you won't receive any emails from us.
              </p>
            </div>
            <PreferenceSwitch
              id="master-toggle"
              checked={preferences.emailNotificationsEnabled}
              onCheckedChange={(checked) => updatePreference('emailNotificationsEnabled', checked)}
            />
          </div>

          <Separator />

          {/* Individual Preferences */}
          <div className="grid gap-6">
            {/* Security Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="security" className="text-base font-medium">
                    Security Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important security alerts, login attempts, password changes, and account security updates.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                id="security"
                checked={preferences.securityNotifications}
                onCheckedChange={(checked) => updatePreference('securityNotifications', checked)}
                disabled={!preferences.emailNotificationsEnabled}
              />
            </div>

            {/* Account Updates */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="account" className="text-base font-medium">
                    Account Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Profile changes, subscription updates, billing notifications, and welcome messages.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                id="account"
                checked={preferences.accountUpdates}
                onCheckedChange={(checked) => updatePreference('accountUpdates', checked)}
                disabled={!preferences.emailNotificationsEnabled}
              />
            </div>

            {/* Webhook Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="webhooks" className="text-base font-medium">
                    Webhook Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Webhook setup confirmations, approval notifications, test results, failure alerts, and performance reports.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                id="webhooks"
                checked={preferences.webhookNotifications}
                onCheckedChange={(checked) => updatePreference('webhookNotifications', checked)}
                disabled={!preferences.emailNotificationsEnabled}
              />
            </div>

            {/* Product Updates */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="product" className="text-base font-medium">
                    Product Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New features, product announcements, platform updates, and improvement notifications.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                id="product"
                checked={preferences.productUpdates}
                onCheckedChange={(checked) => updatePreference('productUpdates', checked)}
                disabled={!preferences.emailNotificationsEnabled}
              />
            </div>

            {/* Weekly Reports */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="reports" className="text-base font-medium">
                    Weekly Activity Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summaries of your form activity, submission statistics, and account insights.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                id="reports"
                checked={preferences.weeklyReports}
                onCheckedChange={(checked) => updatePreference('weeklyReports', checked)}
                disabled={!preferences.emailNotificationsEnabled}
              />
            </div>

            {/* Marketing Emails */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-pink-600 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="text-base font-medium">
                    Marketing Communications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Optional promotional emails, tips and best practices, industry insights, and special offers.
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                id="marketing"
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
                disabled={!preferences.emailNotificationsEnabled}
              />
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveEmailPreferences} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Some critical emails (like security alerts and password resets) may still be sent even if you disable certain categories, 
              as they are essential for account security and functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
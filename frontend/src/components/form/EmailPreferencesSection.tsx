"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Webhook, BarChart3, Shield } from 'lucide-react';

interface FormEmailPreferences {
  emailNotifications: boolean;
  webhookNotificationsEnabled: boolean;
  formAnalyticsReports: boolean;
  securityAlerts: boolean;
}

interface EmailPreferencesSectionProps {
  formId: string;
}

export default function EmailPreferencesSection({ formId }: EmailPreferencesSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<FormEmailPreferences>({
    emailNotifications: true,
    webhookNotificationsEnabled: true,
    formAnalyticsReports: true,
    securityAlerts: true,
  });

  useEffect(() => {
    if (formId) {
      loadFormEmailPreferences();
    }
  }, [formId]);

  const loadFormEmailPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}/email-preferences`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences({
          emailNotifications: data.emailNotifications ?? true,
          webhookNotificationsEnabled: data.webhookNotificationsEnabled ?? true,
          formAnalyticsReports: data.formAnalyticsReports ?? true,
          securityAlerts: data.securityAlerts ?? true,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load form email preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading form email preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form email preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFormEmailPreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/forms/${formId}/email-preferences`, {
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
          description: 'Form email preferences updated successfully',
        });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving form email preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update form email preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof FormEmailPreferences, value: boolean) => {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Control which email notifications you receive for this specific form
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Submission Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="space-y-1">
            <Label htmlFor="form-submissions" className="text-base font-semibold text-blue-900 dark:text-blue-100">
              New Form Submissions
            </Label>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Get notified when someone submits this form
            </p>
          </div>
          <PreferenceSwitch
            id="form-submissions"
            checked={preferences.emailNotifications}
            onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Individual Form Preferences */}
        <div className="grid gap-4">
          {/* Webhook Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Webhook className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="webhook-notifications" className="text-base font-medium">
                  Webhook Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about webhook setup, approvals, test results, and failures for this form
                </p>
              </div>
            </div>
            <PreferenceSwitch
              id="webhook-notifications"
              checked={preferences.webhookNotificationsEnabled}
              onCheckedChange={(checked) => updatePreference('webhookNotificationsEnabled', checked)}
              disabled={!preferences.emailNotifications}
            />
          </div>

          {/* Analytics Reports */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="analytics-reports" className="text-base font-medium">
                  Analytics Reports
                </Label>
                <p className="text-sm text-muted-foreground">
                  Weekly and monthly reports about this form's performance and submission statistics
                </p>
              </div>
            </div>
            <PreferenceSwitch
              id="analytics-reports"
              checked={preferences.formAnalyticsReports}
              onCheckedChange={(checked) => updatePreference('formAnalyticsReports', checked)}
              disabled={!preferences.emailNotifications}
            />
          </div>

          {/* Security Alerts */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="security-alerts" className="text-base font-medium">
                  Security Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications like spam detection, suspicious activity, and form abuse alerts
                </p>
              </div>
            </div>
            <PreferenceSwitch
              id="security-alerts"
              checked={preferences.securityAlerts}
              onCheckedChange={(checked) => updatePreference('securityAlerts', checked)}
              disabled={!preferences.emailNotifications}
            />
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveFormEmailPreferences} 
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
            <strong>Note:</strong> These settings only affect notifications for this specific form. 
            You can manage your global email preferences in your account settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 
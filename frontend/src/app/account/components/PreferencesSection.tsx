'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { Moon, Sun, Globe, Clock, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface EmailPreferences {
  emailNotificationsEnabled: boolean;
}

export default function PreferencesSection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    emailNotificationsEnabled: true,
  });
  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    if (user?.id) {
      loadEmailPreferences();
    }
  }, [user?.id]);

  const loadEmailPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await fetch(`/api/users/${user?.id}/email-preferences`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEmailPreferences({
          emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
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
      setLoadingPreferences(false);
    }
  };

  const saveEmailPreferences = async (newPreferences: EmailPreferences) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/users/${user?.id}/email-preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        setEmailPreferences(newPreferences);
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

  const handleEmailNotificationToggle = async (checked: boolean) => {
    const newPreferences = {
      ...emailPreferences,
      emailNotificationsEnabled: checked,
    };
    await saveEmailPreferences(newPreferences);
  };

  const handleThemeChange = async (theme: string) => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call to update theme preference
      await fetch('/api/preferences/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      setPreferences({ ...preferences, theme });
      toast({
        title: 'Success',
        description: 'Theme preference updated.',
      });
    } catch (error) {
      console.error('Failed to update theme:', error);
      toast({
        title: 'Error',
        description: 'Failed to update theme preference.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call to update language preference
      await fetch('/api/preferences/language', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
      });

      setPreferences({ ...preferences, language });
      toast({
        title: 'Success',
        description: 'Language preference updated.',
      });
    } catch (error) {
      console.error('Failed to update language:', error);
      toast({
        title: 'Error',
        description: 'Failed to update language preference.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call to update timezone preference
      await fetch('/api/preferences/timezone', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timezone }),
      });

      setPreferences({ ...preferences, timezone });
      toast({
        title: 'Success',
        description: 'Timezone preference updated.',
      });
    } catch (error) {
      console.error('Failed to update timezone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update timezone preference.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingPreferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Theme Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(2).fill(null).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your application experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notification Preferences */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Control your email notification preferences
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold text-blue-900 dark:text-blue-100">Email Notifications</Label>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={emailPreferences.emailNotificationsEnabled}
                onCheckedChange={handleEmailNotificationToggle}
                disabled={saving}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            
            {saving && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Saving preferences...</span>
              </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> For detailed email notification preferences, visit the{' '}
                <a href="/account/preferences" className="text-blue-600 hover:underline">
                  Notifications section
                </a>{' '}
                where you can configure specific types of emails you want to receive.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Theme Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <h3 className="font-medium">Theme</h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred color theme
            </p>
          </div>
          <Select
            value={preferences.theme}
            onValueChange={handleThemeChange}
            disabled={saving}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center">
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center">
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2 flex items-center">
                    <Sun className="w-3 h-3" />
                    <Moon className="w-3 h-3" />
                  </span>
                  System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <h3 className="font-medium">Language</h3>
            <p className="text-sm text-muted-foreground">
              Select your preferred language
            </p>
          </div>
          <Select
            value={preferences.language}
            onValueChange={handleLanguageChange}
            disabled={saving}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  {preferences.language === 'en' ? 'English' : 'Coming Soon'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  English
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timezone Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-medium">Timezone</h3>
            <p className="text-sm text-muted-foreground">
              Set your local timezone
            </p>
          </div>
          <Select
            value={preferences.timezone}
            onValueChange={handleTimezoneChange}
            disabled={saving}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {preferences.timezone}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Intl.supportedValuesOf('timeZone').map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {timezone}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
} 
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Moon, Sun, Globe, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function PreferencesSection() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      browser: true,
    },
  });

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

  if (saving) {
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

        {/* Notification Preferences */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Choose how you want to receive notifications
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(checked) => {
                  setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      email: checked,
                    },
                  });
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in your browser
                </p>
              </div>
              <Switch
                checked={preferences.notifications.browser}
                onCheckedChange={(checked) => {
                  setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      browser: checked,
                    },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
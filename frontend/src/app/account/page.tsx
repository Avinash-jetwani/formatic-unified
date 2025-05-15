'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSection from '@/app/account/components/ProfileSection';
import SecuritySection from '@/app/account/components/SecuritySection';
import PreferencesSection from '@/app/account/components/PreferencesSection';
import NotificationsSection from '@/app/account/components/NotificationsSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile and account preferences
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={handleBackClick}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="md:col-span-1 bg-card">
            <CardContent className="p-0">
              <nav className="flex md:flex-col gap-1 p-1 md:p-2 overflow-x-auto md:overflow-x-visible">
                <Button 
                  variant={activeTab === 'profile' ? "default" : "ghost"} 
                  className="justify-start w-full"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </Button>
                <Button 
                  variant={activeTab === 'security' ? "default" : "ghost"} 
                  className="justify-start w-full"
                  onClick={() => setActiveTab('security')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Security</span>
                </Button>
                <Button 
                  variant={activeTab === 'preferences' ? "default" : "ghost"} 
                  className="justify-start w-full"
                  onClick={() => setActiveTab('preferences')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Preferences</span>
                </Button>
                <Button 
                  variant={activeTab === 'notifications' ? "default" : "ghost"} 
                  className="justify-start w-full"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span>Notifications</span>
                </Button>
              </nav>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'security' && <SecuritySection />}
            {activeTab === 'preferences' && <PreferencesSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
          </div>
        </div>
      </div>
    </div>
  );
} 
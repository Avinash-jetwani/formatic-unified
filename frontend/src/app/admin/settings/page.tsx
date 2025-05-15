'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Server, Database, ShieldCheck, Globe, MailCheck } from 'lucide-react';
import { PageLayout } from '@/components/ui/PageLayout';

export default function AdminSettingsPage() {
  return (
    <PageLayout
      title="System Settings"
      description="Configure and manage system-wide settings for your application"
    >
      {/* Settings Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="mb-6 w-full grid grid-cols-2 md:grid-cols-5 md:w-auto">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="server">
            <Server className="h-4 w-4 mr-2" />
            Server
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email settings for notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Provider</p>
                    <p className="text-sm text-muted-foreground">Currently using SMTP</p>
                  </div>
                  <Badge className="flex items-center gap-1">
                    <MailCheck className="h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>View your system's current status and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Version</p>
                    <p>1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p>Today</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Environment</p>
                    <p>Production</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-green-500 font-medium">Healthy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="server" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Settings</CardTitle>
              <CardDescription>Configure server resources and options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This tab is still under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Configure database connections and manage backups</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This tab is still under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage authentication settings and security policies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This tab is still under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-party Integrations</CardTitle>
              <CardDescription>Connect with external services and APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This tab is still under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
} 
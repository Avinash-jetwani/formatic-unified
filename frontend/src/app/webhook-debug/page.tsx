'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function WebhookDebugPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [receivedWebhooks, setReceivedWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:3000/api/webhook-test');
  const [webhookName, setWebhookName] = useState('Test Webhook');
  
  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/webhook-debug?action=list-webhooks');
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchReceivedWebhooks = async () => {
    try {
      const response = await fetch('/api/webhook-test');
      const data = await response.json();
      setReceivedWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error fetching received webhooks:', error);
    }
  };
  
  const createWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhook-debug?action=create-webhook&name=${encodeURIComponent(webhookName)}&url=${encodeURIComponent(webhookUrl)}`);
      const data = await response.json();
      await fetchWebhooks();
      alert('Webhook created successfully!');
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Error creating webhook. See console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  const testWebhook = async (webhookId?: string) => {
    setLoading(true);
    try {
      const url = webhookId 
        ? `/api/webhook-debug?action=test-webhook&webhookId=${webhookId}`
        : '/api/webhook-debug?action=test-webhook';
      
      const response = await fetch(url);
      const data = await response.json();
      setTestResult(data);
      
      // Refresh received webhooks after a short delay
      setTimeout(() => {
        fetchReceivedWebhooks();
      }, 1000);
      
    } catch (error) {
      console.error('Error testing webhook:', error);
      setTestResult({ status: 'error', message: 'Error testing webhook' });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchWebhooks();
    fetchReceivedWebhooks();
    
    // Set up refresh interval
    const interval = setInterval(() => {
      fetchReceivedWebhooks();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Webhook Debug Tool</h1>
      
      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create & Test</TabsTrigger>
          <TabsTrigger value="list">Registered Webhooks</TabsTrigger>
          <TabsTrigger value="received">Received Webhooks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Webhook</CardTitle>
              <CardDescription>Create a test webhook for debugging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook Name</label>
                <Input 
                  value={webhookName} 
                  onChange={(e) => setWebhookName(e.target.value)} 
                  placeholder="Enter webhook name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <Input 
                  value={webhookUrl} 
                  onChange={(e) => setWebhookUrl(e.target.value)} 
                  placeholder="Enter webhook URL"
                />
                <p className="text-xs text-muted-foreground">
                  Use http://localhost:3000/api/webhook-test to test with the built-in receiver
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" disabled={loading} onClick={() => setWebhookUrl('http://localhost:3000/api/webhook-test')}>
                Reset
              </Button>
              <Button disabled={loading} onClick={createWebhook}>
                Create Webhook
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook</CardTitle>
              <CardDescription>Send a test payload to the first available webhook</CardDescription>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <p>No webhooks available. Create one first.</p>
              ) : (
                <div>
                  <p>Will test webhook: <strong>{webhooks[0]?.name}</strong> ({webhooks[0]?.url})</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                disabled={loading || webhooks.length === 0} 
                onClick={() => testWebhook(webhooks[0]?.id)}
              >
                Send Test Payload
              </Button>
            </CardFooter>
          </Card>
          
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle>Test Result</CardTitle>
                <CardDescription>
                  Status: <Badge variant={testResult.status === 'success' ? 'default' : 'destructive'}>
                    {testResult.status}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
                  <pre className="text-xs">{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Registered Webhooks</CardTitle>
              <CardDescription>All currently registered webhooks</CardDescription>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <p>No webhooks registered yet.</p>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <Card key={webhook.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{webhook.name}</CardTitle>
                        <CardDescription>{webhook.url}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            <Badge variant={webhook.active ? 'default' : 'outline'}>
                              {webhook.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Auth Type:</span>{' '}
                            {webhook.authType}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Events:</span>{' '}
                            {webhook.eventTypes.join(', ')}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={loading}
                          onClick={() => testWebhook(webhook.id)}
                        >
                          Test
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                disabled={loading}
                onClick={fetchWebhooks}
              >
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="received" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Received Webhooks</CardTitle>
              <CardDescription>Webhooks received by the test endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              {receivedWebhooks.length === 0 ? (
                <p>No webhooks received yet.</p>
              ) : (
                <div className="space-y-4">
                  {receivedWebhooks.map((webhook) => (
                    <Card key={webhook.id}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          {new Date(webhook.timestamp).toLocaleString()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                          <pre className="text-xs">{JSON.stringify(webhook.body, null, 2)}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                disabled={loading}
                onClick={fetchReceivedWebhooks}
              >
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const WebhooksFallback = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params?.id as string;
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [statusDetails, setStatusDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<any>(null);

  useEffect(() => {
    checkBackendStatus();
    checkProxyStatus();
  }, []);

  const checkBackendStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      
      setStatusDetails(data);
      
      if (data.api_status?.status === 'success') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking backend status:', error);
      setBackendStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkProxyStatus = async () => {
    try {
      const response = await fetch('/api/webhook-proxy?url=/api-status');
      const data = await response.json();
      setProxyStatus(data);
    } catch (error) {
      console.error('Error checking proxy status:', error);
      setProxyStatus({ status: 'error', error: { message: 'Failed to connect to proxy' } });
    }
  };

  const goBack = () => {
    router.push(`/forms/${formId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-muted-foreground">
              Webhook functionality troubleshooting
            </p>
          </div>
        </div>
        <Button onClick={checkBackendStatus} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Check Backend
        </Button>
      </div>
      
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Webhook Connection Issue
            <Badge variant="destructive">Not Connected</Badge>
          </CardTitle>
          <CardDescription>
            We're having trouble connecting to the backend webhook service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-center">
              {backendStatus === 'checking' ? 'Checking backend connection...' :
               backendStatus === 'connected' ? 'Backend is connected but webhook service is unavailable' :
               'Cannot connect to backend server'}
            </h3>
            <p className="text-muted-foreground mt-2 text-center max-w-lg">
              {backendStatus === 'checking' ? 'Please wait while we check the connection to the backend server...' :
               backendStatus === 'connected' ? 'The backend server is responding, but the webhook service might not be implemented or configured correctly.' :
               'Make sure your backend server is running and accessible at the configured URL.'}
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What could be wrong?</h3>
            <div className="bg-muted p-4 rounded-md">
              <ol className="list-decimal list-inside space-y-2">
                <li className="py-1">
                  <strong>Missing Backend Server</strong>: Ensure your backend server is running at http://localhost:3001
                </li>
                <li className="py-1">
                  <strong>API URL Configuration</strong>: Your code is trying to connect to <code className="px-1 py-0.5 bg-muted-foreground/20 rounded">http://localhost:4000</code> instead of the correct backend URL
                </li>
                <li className="py-1">
                  <strong>Not Implemented</strong>: The webhook feature might not be fully implemented on the backend yet
                </li>
                <li className="py-1">
                  <strong>Authentication Issues</strong>: Your token might be invalid or expired
                </li>
              </ol>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md overflow-x-auto">
            <h4 className="font-medium mb-2">Debugging Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-semibold mb-1">Debug API Response:</h5>
                <pre className="text-xs whitespace-pre-wrap bg-muted-foreground/10 p-2 rounded overflow-auto max-h-[200px]">{JSON.stringify(statusDetails, null, 2)}</pre>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-1">Proxy API Response:</h5>
                <pre className="text-xs whitespace-pre-wrap bg-muted-foreground/10 p-2 rounded overflow-auto max-h-[200px]">{JSON.stringify(proxyStatus, null, 2)}</pre>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check if the backend server is running (run <code className="px-1 py-0.5 bg-muted-foreground/20 rounded">npm run start</code> in the backend directory)</li>
              <li>Review the <code className="px-1 py-0.5 bg-muted-foreground/20 rounded">webhook-implementation-plan.md</code> and <code className="px-1 py-0.5 bg-muted-foreground/20 rounded">webhook-progress.md</code> files</li>
              <li>Check browser console for detailed error messages</li>
              <li>Verify that webhook endpoints are properly implemented in the backend</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhooksFallback; 
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Code, ExternalLink } from 'lucide-react';

export default function WebhookHelpPage() {
  const params = useParams();
  const router = useRouter();
  
  const formId = params.id as string;
  
  // Navigate back to webhooks page
  const handleBackClick = () => {
    router.push(`/forms/${formId}/webhooks`);
  };
  
  // Navigate to documentation
  const handleDocsClick = () => {
    router.push(`/forms/${formId}/webhooks/guide`);
  };
  
  // Navigate to debug tool
  const handleDebugClick = () => {
    router.push('/webhook-debug');
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Webhook Resources</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Webhook Documentation
            </CardTitle>
            <CardDescription>
              Learn how to use webhooks and implement receivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our comprehensive documentation covers everything you need to know about setting up and using webhooks in your application:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mb-4">
              <li>Understanding webhook basics</li>
              <li>Security best practices</li>
              <li>Payload format reference</li>
              <li>Code samples in multiple languages</li>
            </ul>
            <Button className="w-full" onClick={handleDocsClick}>
              View Documentation
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-500" />
              Webhook Debug Tool
            </CardTitle>
            <CardDescription>
              Test your webhook implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our debug tool helps you test your webhook implementation and troubleshoot issues:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mb-4">
              <li>Send test webhook payloads</li>
              <li>Inspect webhook requests and responses</li>
              <li>Verify signature validation</li>
              <li>Debug payload formatting issues</li>
            </ul>
            <Button className="w-full" onClick={handleDebugClick}>
              Open Debug Tool
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
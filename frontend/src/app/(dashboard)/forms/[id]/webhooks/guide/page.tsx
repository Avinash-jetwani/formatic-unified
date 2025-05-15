'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Code, Shield, Clock, Settings, Zap } from 'lucide-react';

export default function WebhookGuidePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  const formId = params.id as string;
  
  // Navigate back to webhooks page
  const handleBackClick = () => {
    router.push(`/forms/${formId}/webhooks`);
  };
  
  // Navigate to debug page
  const handleDebugClick = () => {
    router.push('/webhook-debug');
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Webhook Documentation</h1>
        </div>
        <Button onClick={handleDebugClick} variant="outline" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Open Debug Tool
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payload">Payload Format</TabsTrigger>
          <TabsTrigger value="code">Code Samples</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What are Webhooks?</CardTitle>
              <CardDescription>
                Webhooks allow your applications to receive real-time updates when form submissions occur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Webhooks provide a way for our platform to send automatic notifications to your system when certain events occur, 
                such as when a new form submission is received. Instead of constantly polling our API to check for new submissions,
                webhooks push the data directly to your endpoint as soon as the event happens.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      Real-time Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Receive data instantly when submissions are created or updated, allowing for immediate processing.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-500" />
                      Customizable
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Configure which events trigger webhooks and filter exactly which data fields are included.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
                <h3 className="font-medium text-blue-800 mb-2">Important: Admin Approval Process</h3>
                <p className="text-sm text-blue-700">
                  For security reasons, all webhooks created by clients require approval by a super admin before they can receive data.
                  When you create a new webhook, it will be in a "Pending Approval" state until reviewed by an administrator.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Webhook Status Lifecycle</CardTitle>
              <CardDescription>
                Understanding the different states of a webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>
                  <p className="text-sm">Webhook has been created but is waiting for admin approval before it can receive data.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Rejected</Badge>
                  <p className="text-sm">Admin has rejected the webhook. It will not receive any data.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge>Active</Badge>
                  <p className="text-sm">Webhook is approved and will receive data for configured events.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-gray-100 text-gray-500">Inactive</Badge>
                  <p className="text-sm">Webhook is approved but currently disabled. It will not receive data until reactivated.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Deactivated by Admin</Badge>
                  <p className="text-sm">Admin has deactivated this webhook. Only an admin can reactivate it.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Locked
                    </span>
                  </Badge>
                  <p className="text-sm">Admin has locked this webhook. It cannot be modified by clients.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* SETUP GUIDE TAB */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setting Up Your Webhook</CardTitle>
              <CardDescription>
                Follow these steps to create and configure a webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 1: Create an Endpoint</h3>
                <p className="text-sm text-muted-foreground">
                  First, create an endpoint on your server that can receive HTTP POST requests. This endpoint will process the webhook data.
                </p>
                <div className="bg-muted p-4 rounded-md mt-2">
                  <p className="text-sm font-mono">https://your-server.com/api/webhooks/formatic</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 2: Configure Your Webhook</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate to the Webhooks section of your form and click "Create Webhook". Fill in the required information:
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 mt-2">
                  <li><strong>Name:</strong> A descriptive name for your webhook</li>
                  <li><strong>URL:</strong> The endpoint where webhook data will be sent</li>
                  <li><strong>Events:</strong> Which events should trigger this webhook (e.g., new submissions)</li>
                  <li><strong>Authentication:</strong> How your endpoint authenticates webhook requests</li>
                  <li><strong>Field Filtering:</strong> Optionally include or exclude specific form fields</li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 3: Wait for Approval</h3>
                <p className="text-sm text-muted-foreground">
                  After creating your webhook, it will be in "Pending Approval" status. A super admin will review and approve it.
                </p>
                <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mt-2">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Your webhook will not receive any data until it has been approved by an administrator.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 4: Test Your Webhook</h3>
                <p className="text-sm text-muted-foreground">
                  Once approved, you can test your webhook by clicking the "Test" button. This will send a sample payload to your endpoint.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Securing Your Webhooks</CardTitle>
              <CardDescription>
                Best practices for secure webhook implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Signature Verification</h3>
                <p className="text-sm text-muted-foreground">
                  We sign all webhook payloads with an HMAC-SHA256 signature. You should verify this signature to ensure the request is authentic.
                </p>
                <div className="bg-muted p-4 rounded-md mt-2">
                  <p className="text-sm font-mono">
                    # The signature is included in the X-Formatic-Signature header<br />
                    # Format: sha256=&lt;signature&gt;
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Authentication Options</h3>
                <p className="text-sm text-muted-foreground">
                  You can secure your webhook endpoint using one of these authentication methods:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">Basic Auth</h4>
                    <p className="text-xs text-muted-foreground">
                      Provide username and password for HTTP Basic Authentication
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">Bearer Token</h4>
                    <p className="text-xs text-muted-foreground">
                      Authenticate using a Bearer token in the Authorization header
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">API Key</h4>
                    <p className="text-xs text-muted-foreground">
                      Use a custom header with your API key
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">IP Restriction</h4>
                    <p className="text-xs text-muted-foreground">
                      Limit which IP addresses can send webhooks to your endpoint
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md mt-4">
                <h4 className="font-medium mb-2">Security Best Practices</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Always verify the webhook signature</li>
                  <li>Use HTTPS for your webhook endpoint</li>
                  <li>Implement rate limiting on your endpoint</li>
                  <li>Keep your secret keys and tokens secure</li>
                  <li>Process webhooks asynchronously when possible</li>
                  <li>Implement proper error handling</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* PAYLOAD FORMAT TAB */}
        <TabsContent value="payload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Payload Format</CardTitle>
              <CardDescription>
                Understanding the data structure sent to your endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Webhooks are sent as HTTP POST requests with a JSON payload. The structure varies slightly depending on the event type.
              </p>
              
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Sample Payload: New Submission</h4>
                <pre className="text-xs overflow-auto p-2 bg-slate-800 text-slate-50 rounded">
{`{
  "event": "SUBMISSION_CREATED",
  "form": {
    "id": "form_abc123",
    "title": "Contact Form"
  },
  "submission": {
    "id": "sub_xyz789",
    "createdAt": "2023-05-15T14:22:31Z",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I'm interested in your services"
    }
  },
  "timestamp": "2023-05-15T14:22:32Z",
  "signature": "sha256=a1b2c3d4e5..."
}`}
                </pre>
              </div>
              
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-medium">Field Descriptions</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Field</div>
                  <div className="font-medium col-span-2">Description</div>
                  
                  <div>event</div>
                  <div className="col-span-2">The type of event that triggered the webhook</div>
                  
                  <div>form</div>
                  <div className="col-span-2">Information about the form</div>
                  
                  <div>submission</div>
                  <div className="col-span-2">The submission data, including all form fields</div>
                  
                  <div>timestamp</div>
                  <div className="col-span-2">ISO 8601 timestamp when the webhook was sent</div>
                  
                  <div>signature</div>
                  <div className="col-span-2">HMAC-SHA256 signature for verification</div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-medium">Supported Event Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">SUBMISSION_CREATED</h4>
                    <p className="text-xs text-muted-foreground">
                      Triggered when a new form submission is created
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">SUBMISSION_UPDATED</h4>
                    <p className="text-xs text-muted-foreground">
                      Triggered when a form submission is updated
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">FORM_PUBLISHED</h4>
                    <p className="text-xs text-muted-foreground">
                      Triggered when a form is published
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-1">FORM_UNPUBLISHED</h4>
                    <p className="text-xs text-muted-foreground">
                      Triggered when a form is unpublished
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* CODE SAMPLES TAB */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Samples</CardTitle>
              <CardDescription>
                Example implementations for different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="nodejs">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="csharp">C#</TabsTrigger>
                </TabsList>
                
                <TabsContent value="nodejs" className="mt-4 space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <h4 className="font-medium mb-2">Express.js Webhook Receiver</h4>
                    <pre className="text-xs overflow-auto p-2 bg-slate-800 text-slate-50 rounded">
{`const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Your webhook secret key from Formatic
const webhookSecret = 'your_webhook_secret';

// Verify webhook signature
function verifySignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return \`sha256=\${expectedSignature}\` === signature;
}

app.post('/api/webhooks/formatic', (req, res) => {
  const signature = req.headers['x-formatic-signature'];
  
  // Verify the webhook signature
  if (!verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook data
  const { event, form, submission } = req.body;
  
  console.log(\`Received \${event} for form: \${form.title}\`);
  console.log('Submission data:', submission.data);
  
  // Your business logic here
  // e.g., save to database, send notification, etc.
  
  // Respond with success
  res.status(200).send('Webhook received');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="php" className="mt-4 space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <h4 className="font-medium mb-2">PHP Webhook Receiver</h4>
                    <pre className="text-xs overflow-auto p-2 bg-slate-800 text-slate-50 rounded">
{`<?php
// Get the webhook payload
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

// Get the signature from headers
$headers = getallheaders();
$signature = isset($headers['X-Formatic-Signature']) ? $headers['X-Formatic-Signature'] : '';

// Your webhook secret from Formatic
$webhookSecret = 'your_webhook_secret';

// Verify signature
function verifySignature($payload, $signature, $secret) {
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($expectedSignature, $signature);
}

// Check if the signature is valid
if (!verifySignature($payload, $signature, $webhookSecret)) {
    http_response_code(401);
    echo 'Invalid signature';
    exit;
}

// Process the webhook data
$event = $data['event'];
$form = $data['form'];
$submission = $data['submission'];

// Log the webhook
error_log("Received {$event} for form: {$form['title']}");
error_log("Submission data: " . json_encode($submission['data']));

// Your business logic here
// e.g., save to database, send notification, etc.

// Example: Insert into database
try {
    $db = new PDO('mysql:host=localhost;dbname=your_database', 'username', 'password');
    
    $stmt = $db->prepare("INSERT INTO form_submissions 
        (form_id, submission_id, form_name, submission_data, event_type) 
        VALUES (?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $form['id'],
        $submission['id'],
        $form['title'],
        json_encode($submission['data']),
        $event
    ]);
    
    http_response_code(200);
    echo 'Webhook processed successfully';
} catch (Exception $e) {
    error_log('Error processing webhook: ' . $e->getMessage());
    http_response_code(500);
    echo 'Error processing webhook';
}
?>`}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="python" className="mt-4 space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <h4 className="font-medium mb-2">Python (Flask) Webhook Receiver</h4>
                    <pre className="text-xs overflow-auto p-2 bg-slate-800 text-slate-50 rounded">
{`from flask import Flask, request, jsonify
import hmac
import hashlib
import json

app = Flask(__name__)

# Your webhook secret from Formatic
WEBHOOK_SECRET = 'your_webhook_secret'

def verify_signature(payload, signature):
    """Verify the webhook signature"""
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"sha256={expected_signature}" == signature

@app.route('/api/webhooks/formatic', methods=['POST'])
def webhook_receiver():
    # Get the signature from headers
    signature = request.headers.get('X-Formatic-Signature')
    
    # Get the raw payload
    payload = request.data.decode('utf-8')
    
    # Verify the signature
    if not verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Parse the JSON payload
    data = json.loads(payload)
    
    # Extract the data
    event = data.get('event')
    form = data.get('form')
    submission = data.get('submission')
    
    print(f"Received {event} for form: {form['title']}")
    print(f"Submission data: {submission['data']}")
    
    # Your business logic here
    # e.g., save to database, send notification, etc.
    
    return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)`}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="csharp" className="mt-4 space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <h4 className="font-medium mb-2">C# (ASP.NET Core) Webhook Receiver</h4>
                    <pre className="text-xs overflow-auto p-2 bg-slate-800 text-slate-50 rounded">
{`using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

[ApiController]
[Route("api/webhooks")]
public class WebhookController : ControllerBase
{
    // Your webhook secret from Formatic
    private const string WebhookSecret = "your_webhook_secret";

    [HttpPost("formatic")]
    public async Task<IActionResult> ReceiveWebhook()
    {
        // Read the request body
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();

        // Get the signature from headers
        var signature = Request.Headers["X-Formatic-Signature"].ToString();

        // Verify the signature
        if (!VerifySignature(payload, signature))
        {
            return Unauthorized("Invalid signature");
        }

        // Parse the JSON payload
        var data = JsonConvert.DeserializeObject<WebhookPayload>(payload);

        // Process the webhook
        Console.WriteLine($"Received {data.Event} for form: {data.Form.Title}");
        Console.WriteLine($"Submission data: {JsonConvert.SerializeObject(data.Submission.Data)}");

        // Your business logic here
        // e.g., save to database, send notification, etc.

        return Ok(new { status = "success" });
    }

    private bool VerifySignature(string payload, string signature)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(WebhookSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedSignature = $"sha256={BitConverter.ToString(hash).Replace("-", "").ToLower()}";

        return computedSignature == signature;
    }
}

public class WebhookPayload
{
    [JsonProperty("event")]
    public string Event { get; set; }

    [JsonProperty("form")]
    public FormInfo Form { get; set; }

    [JsonProperty("submission")]
    public Submission Submission { get; set; }

    [JsonProperty("timestamp")]
    public string Timestamp { get; set; }
}

public class FormInfo
{
    [JsonProperty("id")]
    public string Id { get; set; }

    [JsonProperty("title")]
    public string Title { get; set; }
}

public class Submission
{
    [JsonProperty("id")]
    public string Id { get; set; }

    [JsonProperty("createdAt")]
    public string CreatedAt { get; set; }

    [JsonProperty("data")]
    public dynamic Data { get; set; }
}`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-6">
                <h3 className="font-medium text-blue-800 mb-2">Testing Your Implementation</h3>
                <p className="text-sm text-blue-700">
                  Use our webhook debug tool to test your implementation. It allows you to send test payloads to your endpoint
                  and verify that your code is working correctly.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={handleDebugClick}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Open Debug Tool
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import axios from 'axios';

export default function WebhookDebugTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('Contact Form');
  const [testData, setTestData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '123-456-7890',
    message: 'This is a test message'
  });

  const sendTestWebhook = async () => {
    if (!webhookUrl) {
      setError('Please enter a webhook URL');
      return;
    }
    
    if (!formId) {
      setError('Please enter a form ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Prepare the webhook payload
      const payload = {
        event: 'SUBMISSION_CREATED',
        form: {
          id: formId,
          title: formTitle
        },
        submission: {
          id: `sub_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
          data: testData
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending webhook payload:', payload);
      console.log('To URL:', webhookUrl);
      
      // Send the webhook directly
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Formatic-Webhook-Service/1.0',
          'X-Formatic-Event': 'SUBMISSION_CREATED',
          'X-Formatic-Delivery-ID': `del_${Date.now().toString(36)}`
        }
      });
      
      console.log('Webhook response:', response.data);
      setResult({
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    } catch (err: any) {
      console.error('Error sending webhook:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        setResult({
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Webhook Debug Tester</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL
        </label>
        <input
          type="text"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form ID
        </label>
        <input
          type="text"
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Title
        </label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Submission Data</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={testData.name}
              onChange={(e) => setTestData({...testData, name: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={testData.email}
              onChange={(e) => setTestData({...testData, email: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={testData.phone}
              onChange={(e) => setTestData({...testData, phone: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={testData.message}
              onChange={(e) => setTestData({...testData, message: e.target.value})}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={sendTestWebhook}
        disabled={loading}
        className={`px-4 py-2 bg-blue-600 text-white rounded ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
      >
        {loading ? 'Sending...' : 'Send Test Webhook'}
      </button>
      
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold text-red-700">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Webhook Response</h3>
          <div className="p-4 bg-gray-100 border rounded">
            <p><strong>Status:</strong> {result.status}</p>
            
            <div className="mt-2">
              <h4 className="font-bold">Headers:</h4>
              <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto">
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </div>
            
            <div className="mt-2">
              <h4 className="font-bold">Data:</h4>
              <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="font-bold text-lg mb-2">Webhook Payload</h3>
        <pre className="p-4 bg-gray-100 border rounded text-sm overflow-auto">
{`{
  "event": "SUBMISSION_CREATED",
  "form": {
    "id": "${formId}",
    "title": "${formTitle}"
  },
  "submission": {
    "id": "sub_uniqueid",
    "createdAt": "${new Date().toISOString()}",
    "data": ${JSON.stringify(testData, null, 2)}
  },
  "timestamp": "${new Date().toISOString()}"
}`}
        </pre>
      </div>
      
      <div className="mt-6">
        <h3 className="font-bold text-lg mb-2">PHP Debugging Instructions</h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="mb-2">If your webhooks aren't being inserted into the database, add this PHP code to your webhook receiver:</p>
          <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto">
{`<?php
// At the top of your webhook-receiver.php file
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log the raw request to a file
$rawInput = file_get_contents('php://input');
$headers = getallheaders();
file_put_contents(
    'webhook-debug.log', 
    date('Y-m-d H:i:s') . " Received webhook\\n" .
    "Headers: " . json_encode($headers) . "\\n" .
    "Body: " . $rawInput . "\\n\\n", 
    FILE_APPEND
);

// Then continue with your processing
`}
          </pre>
          
          <p className="mt-4 mb-2">Make sure your database table exists and has the correct structure:</p>
          <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto">
{`CREATE TABLE IF NOT EXISTS \`formatic_submissions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`form_id\` varchar(100) NOT NULL,
  \`submission_id\` varchar(100) NOT NULL,
  \`form_name\` varchar(255) DEFAULT NULL,
  \`submission_data\` text DEFAULT NULL,
  \`submitted_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`event_type\` varchar(50) DEFAULT NULL,
  \`status\` varchar(50) DEFAULT 'received',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
          </pre>
          
          <p className="mt-4 mb-2">Double-check your PHP function code:</p>
          <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto">
{`function receiveFormaticWebhook() {
    $request = \\Slim\\Slim::getInstance()->request();
    $payload = json_decode($request->getBody());
    
    // Debug - write to log file
    error_log("Formatic webhook received: " . print_r($payload, true));
    
    try {
        $db = getDB();
        
        // Make sure these fields match what's coming in
        $formId = $payload->form->id;
        $submissionId = $payload->submission->id;
        $formName = $payload->form->title;
        $submissionData = json_encode($payload->submission->data);
        $eventType = $payload->event;
        
        // Debug - log the values we're trying to insert
        error_log("Inserting: formId=$formId, submissionId=$submissionId, formName=$formName, data=$submissionData, event=$eventType");
        
        $sql = "INSERT INTO formatic_submissions (form_id, submission_id, form_name, submission_data, event_type) 
                VALUES (:form_id, :submission_id, :form_name, :submission_data, :event_type)";
        
        $stmt = $db->prepare($sql);
        $stmt->bindParam("form_id", $formId);
        $stmt->bindParam("submission_id", $submissionId);
        $stmt->bindParam("form_name", $formName);
        $stmt->bindParam("submission_data", $submissionData);
        $stmt->bindParam("event_type", $eventType);
        
        // Execute and check result
        $result = $stmt->execute();
        error_log("SQL execution result: " . ($result ? "success" : "failed"));
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Webhook data received and stored',
            'reference_id' => $db->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
} 
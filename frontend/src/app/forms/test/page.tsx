'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestForm() {
  const router = useRouter();
  const [formId, setFormId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formId) {
      setStatus('error');
      setErrorMessage('Please enter a Form ID');
      return;
    }
    
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Send the form submission
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formId,
          data: formData,
          webhookUrl: webhookUrl // Optional webhook URL override
        }),
      });

      const result = await response.json();
      console.log('Submission result:', result);
      
      setResponse(result);
      setStatus('success');
      
      // Clear form data but keep formId and webhookUrl
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
      setErrorMessage('There was a problem submitting your form. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Form Submission & Webhooks</h1>
      
      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>Your form was submitted successfully. This should trigger a webhook to your PHP endpoint.</p>
          <div className="mt-4">
            <h3 className="font-bold">Response:</h3>
            <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error!</p>
          <p>{errorMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="formId" className="block text-sm font-medium text-gray-700">Form ID</label>
          <input
            type="text"
            id="formId"
            name="formId"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        
        <div>
          <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Webhook URL</label>
          <input
            type="text"
            id="webhookUrl"
            name="webhookUrl"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          ></textarea>
        </div>
        
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            status === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Debug Information</h2>
        <p className="mb-2">This form will submit to the following endpoint:</p>
        <code className="block bg-gray-100 p-2 rounded">/api/submissions</code>
        
        <p className="mt-4 mb-2">With the following payload:</p>
        <pre className="bg-gray-100 p-3 rounded overflow-auto">
          {JSON.stringify({
            formId: formId,
            data: formData,
            webhookUrl: webhookUrl
          }, null, 2)}
        </pre>
        
        <p className="mt-4 mb-2">The webhook will be sent to:</p>
        <code className="block bg-gray-100 p-2 rounded">{webhookUrl || 'https://test.glassshop.aeapp.uk/api/formatic-webhook'}</code>
      </div>
    </div>
  );
} 
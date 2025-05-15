'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { safeRenderFile, isImageFile } from '@/lib/fileUtils';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('formId', 'test-form-id');
    formData.append('fieldId', 'test-field-id');
    formData.append('submissionId', 'test-submission-id');

    try {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      // Set up completion handler
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          const response = JSON.parse(xhr.responseText);
          setUploadedFileUrl(response.url);
          toast({
            title: "Success",
            description: "File uploaded successfully!",
          });
        } else {
          // Error
          toast({
            title: "Error",
            description: "Failed to upload file",
            variant: "destructive",
          });
        }
        setUploading(false);
      });
      
      // Set up error handler
      xhr.addEventListener('error', () => {
        toast({
          title: "Error",
          description: "Network error during upload",
          variant: "destructive",
        });
        setUploading(false);
      });
      
      // Open and send the request
      xhr.open('POST', '/api/uploads', true);
      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Test File Upload</h1>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            <div className="flex flex-col items-center justify-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                {file ? safeRenderFile(file) : 'Click to select a file or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </label>
        </div>
        
        {uploading && (
          <div className="w-full">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        
        {uploadedFileUrl && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <p className="text-sm font-medium mb-2">Uploaded File:</p>
            {uploadedFileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={uploadedFileUrl} alt="Uploaded" className="w-full rounded-md" />
            ) : (
              <a 
                href={uploadedFileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {uploadedFileUrl}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
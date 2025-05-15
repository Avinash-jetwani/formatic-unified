/**
 * Utility functions for handling file objects throughout the application
 */
import { fetchApi } from '@/services/api';

/**
 * Safely renders a file object or any value as a displayable string
 * Handles various formats of file objects including arrays
 */
export const safeRenderFile = (fileData: any): string => {
  // Handle null/undefined
  if (fileData === undefined || fileData === null) return 'No file';
  
  // Handle string (URL or filename)
  if (typeof fileData === 'string') {
    return fileData;
  }
  
  // Handle array of files
  if (Array.isArray(fileData)) {
    return fileData.map(file => safeRenderFile(file)).join(', ');
  }
  
  // Handle File objects
  if (fileData instanceof File) {
    return fileData.name;
  }
  
  // Handle object with common properties
  if (typeof fileData === 'object') {
    // Try commonly used properties in order of preference
    if ('name' in fileData && typeof fileData.name === 'string') {
      return fileData.name;
    }
    if ('filename' in fileData && typeof fileData.filename === 'string') {
      return fileData.filename;
    }
    if ('originalname' in fileData && typeof fileData.originalname === 'string') {
      return fileData.originalname;
    }
    if ('url' in fileData && typeof fileData.url === 'string') {
      return fileData.url;
    }
    if ('path' in fileData && typeof fileData.path === 'string') {
      return fileData.path;
    }
    
    // If we can't find common properties, try to JSON stringify
    try {
      return JSON.stringify(fileData);
    } catch (e) {
      return 'Object data';
    }
  }
  
  // Fallback - convert to string
  try {
    return String(fileData);
  } catch (e) {
    return 'Unknown file data';
  }
};

/**
 * Check if file object is an image based on type or extension
 */
export const isImageFile = (file: any): boolean => {
  // Handle null/undefined
  if (!file) return false;
  
  // Handle strings (check for image extensions)
  if (typeof file === 'string') {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return extensions.some(ext => 
      file.toLowerCase().endsWith(ext)
    );
  }
  
  // Check for MIME type
  if (typeof file === 'object') {
    if (file.type && typeof file.type === 'string') {
      return file.type.startsWith('image/');
    }
    
    // Check URL if available
    if (file.url && typeof file.url === 'string') {
      return isImageFile(file.url);
    }
    
    // Check name if available
    if (file.name && typeof file.name === 'string') {
      return isImageFile(file.name);
    }
  }
  
  return false;
};

/**
 * Request a new signed URL for a file
 * @param key The S3 key for the file
 * @param expiresIn Optional expiration time in seconds (default: 1 hour)
 */
export const refreshSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    // Call our backend to get a fresh signed URL
    const response = await fetchApi<{ url: string }>(`/uploads/signed-url?key=${encodeURIComponent(key)}&expires=${expiresIn}`);
    
    if (response && response.url) {
      return response.url;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error refreshing signed URL:', error);
    // Return a fallback that will go through our proxy
    return `/api/uploads/files/${key}`;
  }
};

/**
 * Safely extract the URL from a file object regardless of format
 */
export const getFileUrl = async (file: any, forceRefresh: boolean = false): Promise<string | null> => {
  // Handle null/undefined
  if (!file) return null;
  
  // Handle string (already a URL)
  if (typeof file === 'string') {
    return file;
  }
  
  // Handle object
  if (typeof file === 'object') {
    // If we have an S3 key and need to refresh the URL
    if (file.key && (forceRefresh || isSignedUrlExpired(file.url))) {
      try {
        return await refreshSignedUrl(file.key);
      } catch (error) {
        console.error('Error refreshing URL:', error);
        // Fallback to existing URL
      }
    }
    
    // Try to get URL from common properties
    if (file.url && typeof file.url === 'string') {
      return file.url;
    }
    if (file.path && typeof file.path === 'string') {
      return file.path;
    }
    if (file.location && typeof file.location === 'string') {
      return file.location;
    }
    
    // If we have an S3 key but no URL, try to get a signed URL
    if (file.key && typeof file.key === 'string') {
      try {
        return await refreshSignedUrl(file.key);
      } catch (error) {
        console.error('Error getting signed URL:', error);
      }
    }
  }
  
  return null;
};

/**
 * Check if a signed URL appears to be expired or close to expiring
 * This is a best-effort check based on URL parameters
 */
const isSignedUrlExpired = (url: string | undefined): boolean => {
  if (!url) return true;
  
  try {
    // AWS signed URLs contain an X-Amz-Expires and X-Amz-Date parameter
    // We can parse these to determine if the URL is close to expiration
    const urlObj = new URL(url);
    
    // URL doesn't contain AWS signature parameters
    if (!url.includes('X-Amz-Signature=')) {
      return false;
    }
    
    const expiresParam = urlObj.searchParams.get('X-Amz-Expires');
    const dateParam = urlObj.searchParams.get('X-Amz-Date');
    
    if (!expiresParam || !dateParam) {
      // If it's a signed URL but missing parameters, consider it expired
      return true;
    }
    
    // AWS date format: YYYYMMDDTHHMMSSZ
    const awsDate = dateParam.replace('T', '').replace('Z', '');
    const year = parseInt(awsDate.slice(0, 4));
    const month = parseInt(awsDate.slice(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(awsDate.slice(6, 8));
    const hour = parseInt(awsDate.slice(8, 10));
    const minute = parseInt(awsDate.slice(10, 12));
    const second = parseInt(awsDate.slice(12, 14));
    
    const expiresSeconds = parseInt(expiresParam);
    const signedDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    const expirationDate = new Date(signedDate.getTime() + expiresSeconds * 1000);
    
    // Consider URLs expired if they're within 5 minutes of expiration
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expirationDate < fiveMinutesFromNow;
  } catch (error) {
    // If we can't parse the URL, assume it's not expired
    return false;
  }
};

/**
 * Convert any file data to a standardized file object format
 */
export const normalizeFileObject = async (fileData: any): Promise<{
  url: string;
  key?: string;
  name?: string;
  type?: string;
  size?: number;
} | null> => {
  if (!fileData) return null;
  
  // Already a string URL
  if (typeof fileData === 'string') {
    return {
      url: fileData,
      name: fileData.split('/').pop() || 'file'
    };
  }
  
  // Object with required properties
  if (typeof fileData === 'object') {
    const url = await getFileUrl(fileData);
    if (!url) return null;
    
    return {
      url,
      key: fileData.key || null,
      name: fileData.name || fileData.filename || fileData.originalname || url.split('/').pop() || 'file',
      type: fileData.type || fileData.mimeType || fileData.contentType || null,
      size: typeof fileData.size === 'number' ? fileData.size : null
    };
  }
  
  return null;
};

/**
 * Normalize an array of file data into standardized file objects
 */
export const normalizeFileArray = async (files: any): Promise<Array<{
  url: string;
  key?: string;
  name?: string;
  type?: string;
  size?: number;
}>> => {
  if (!files) return [];
  
  // Single file object
  if (!Array.isArray(files)) {
    const normalizedFile = await normalizeFileObject(files);
    return normalizedFile ? [normalizedFile] : [];
  }
  
  // Array of files - process in parallel
  const normalizedFiles = await Promise.all(
    files.map(file => normalizeFileObject(file))
  );
  
  // Filter out null values
  return normalizedFiles.filter(file => file !== null) as Array<{
    url: string;
    key?: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
}; 
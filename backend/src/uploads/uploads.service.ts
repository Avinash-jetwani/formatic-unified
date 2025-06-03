import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadsDir = '/home/ec2-user/formatic-unified/uploads';

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // Generate a unique key for local storage
  private generateKey(formId: string, submissionId: string, fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueId = uuidv4();
    return `submissions/${formId}/${submissionId}/${uniqueId}.${extension}`;
  }

  // Process image to optimize storage (resize + compress)
  private async optimizeImage(buffer: Buffer, maxWidth: number = 1600): Promise<Buffer> {
    try {
      // Analyze image to get dimensions
      const metadata = await sharp(buffer).metadata();
      
      // Only resize if wider than maxWidth
      if (metadata.width && metadata.width > maxWidth) {
        return sharp(buffer)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
      }
      
      // Otherwise just optimize
      return sharp(buffer)
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Failed to optimize image: ${error}`);
      return buffer; // Return original if processing fails
    }
  }

  // Upload file to local storage
  async uploadFile(
    formId: string,
    submissionId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    optimizeImages: boolean = true
  ): Promise<{ url: string, key: string, size: number }> {
    let processedBuffer = buffer;
    
    // Optimize images if enabled and file is an image
    if (optimizeImages && mimeType.startsWith('image/')) {
      processedBuffer = await this.optimizeImage(buffer);
    }
    
    const key = this.generateKey(formId, submissionId, fileName);
    const filePath = path.join(this.uploadsDir, key);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file to local storage
      fs.writeFileSync(filePath, processedBuffer);
      
      // Generate URL for accessing the file
      const url = `https://datizmo.com/uploads/${key}`;
      
      return {
        url: url,
        key: key,
        size: processedBuffer.length,
      };
    } catch (error) {
      this.logger.error(`Local upload error: ${error}`);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Get a URL for an existing file (for local storage, just return the URL)
  async getSignedUrl(key: string, expiresInSeconds: number = 60 * 60): Promise<string> {
    try {
      const filePath = path.join(this.uploadsDir, key);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }
      
      // For local storage, return the direct URL
      return `https://datizmo.com/uploads/${key}`;
    } catch (error) {
      this.logger.error(`Failed to generate file URL: ${error}`);
      throw new Error('Failed to generate file access URL');
    }
  }

  // Delete file from local storage
  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, key);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.logger.error(`Local delete error: ${error}`);
      throw new Error('Failed to delete file from storage');
    }
  }
} 
import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, S3_PUBLIC_URL } from '../config/aws.config';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  // Generate a unique key for S3 storage
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

  // Upload file to S3
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
    
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Body: processedBuffer,
          ContentType: mimeType,
          // Removed ACL 'public-read' since the bucket has Block Public Access enabled
        })
      );
      
      // Generate a signed URL for accessing the private object
      // Set expiry time to 7 days (can be adjusted)
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 60 * 60 * 24 * 7 // 7 days in seconds
      });
      
      return {
        url: signedUrl,
        key: key,
        size: processedBuffer.length,
      };
    } catch (error) {
      this.logger.error(`S3 upload error: ${error}`);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Get a signed URL for an existing file
  async getSignedUrl(key: string, expiresInSeconds: number = 60 * 60): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });
      
      return await getSignedUrl(s3Client, command, { 
        expiresIn: expiresInSeconds 
      });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error}`);
      throw new Error('Failed to generate file access URL');
    }
  }

  // Delete file from S3
  async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
        })
      );
    } catch (error) {
      this.logger.error(`S3 delete error: ${error}`);
      throw new Error('Failed to delete file from storage');
    }
  }
} 
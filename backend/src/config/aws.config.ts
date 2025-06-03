import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'formatic-uploads-dev';
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || `https://${S3_BUCKET_NAME}.s3.amazonaws.com`; 
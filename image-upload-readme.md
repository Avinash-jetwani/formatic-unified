# Formatic - Image Upload Functionality

This document provides an overview of the image upload functionality implemented in the Formatic application.

## Features Implemented

1. **S3 Integration**: Files are uploaded to Amazon S3 for secure and scalable storage
2. **Image Optimization**: Automatic resizing and compression of images to reduce storage costs
3. **File Type Validation**: Configurable file type restrictions (images, documents, custom)
4. **Size Limitations**: Configurable maximum file size
5. **Multiple Uploads**: Support for multiple file uploads per field
6. **Progress Tracking**: Real-time upload progress indicators
7. **Form Builder Configuration**: Full configuration options in the form builder

## Configuration

### Environment Variables

You'll need to set up the following environment variables:

#### Backend (.env)
```
# S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=formatic-upload-dev
S3_PUBLIC_URL=https://formatic-upload-dev.s3.amazonaws.com
```

#### Frontend (.env.local)
```
# S3 Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_S3_BUCKET_NAME=formatic-upload-dev
NEXT_PUBLIC_S3_PUBLIC_URL=https://formatic-upload-dev.s3.amazonaws.com
```

### AWS S3 Setup

1. Create an S3 bucket named `formatic-upload-dev` (or your preferred name)
2. Set up CORS configuration for your bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourproductiondomain.com"],
       "ExposeHeaders": ["ETag", "x-amz-request-id"]
     }
   ]
   ```
3. Create an IAM user with programmatic access and attach the `AmazonS3FullAccess` policy
4. Get the access key and secret key for this IAM user

## Cost Optimization

Several strategies have been implemented to keep storage costs low:

1. **Image Compression**: Images are automatically compressed using the Sharp library
2. **Image Resizing**: Large images are resized to a maximum width of 1600px
3. **File Type & Size Restrictions**: Configurable limits prevent unnecessarily large files
4. **Planned S3 Lifecycle Rules**: Configure S3 lifecycle rules to:
   - Move files to S3 Infrequent Access after 30 days
   - Move to Glacier after 90 days
   - Optional auto-deletion after a longer period (e.g., 1 year)

## Testing

1. A test upload page is available at `/test-upload` for quick testing of file uploads
2. In the form builder, add a "File Upload" field to your form
3. Configure the field with your desired settings:
   - Max Files: Number of files allowed (default: 1)
   - Allowed Types: Images, Documents, Custom
   - Custom Types: Specify file extensions if using custom types
   - Max Size: Maximum file size in MB (default: 10MB)

## Technical Implementation

The file upload functionality is implemented with:

1. Backend (NestJS):
   - `UploadsModule` with `UploadsController` and `UploadsService`
   - AWS S3 integration using the AWS SDK
   - File optimization with Sharp

2. Frontend (Next.js):
   - API routes for forwarding uploads to the backend
   - Enhanced Form component with file upload handling
   - Progress tracking with XMLHttpRequest
   - Field validation and type checking

## Troubleshooting

1. **Upload Fails**: Check your AWS credentials and S3 bucket permissions
2. **File Size Issues**: Check the size limits in the form field configuration
3. **File Type Errors**: Verify the file type against allowed types in the field configuration
4. **Missing Environment Variables**: Ensure all required environment variables are set

## Future Enhancements

1. Implement S3 bucket lifecycle rules for long-term storage cost optimization
2. Add user-specific upload quotas to prevent abuse
3. Implement server-side virus scanning before storage
4. Add image preview generation for admin dashboards 
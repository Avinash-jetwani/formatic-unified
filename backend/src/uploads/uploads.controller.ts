import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus, 
  UseGuards,
  Logger,
  Get,
  NotFoundException,
  Header,
  Res,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../config/aws.config';
import { Response } from 'express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
// This type definition is needed for file uploads
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
};

@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(
    private readonly uploadsService: UploadsService,
    private readonly prismaService: PrismaService,
  ) {}

  // Add a test endpoint for the test upload page
  @Post('authenticated/test')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTestFile(
    @UploadedFile() file: MulterFile,
    @Body() body: { fieldId: string }
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    this.logger.log('Test upload received: ' + file.originalname);
    
    // Use test form and submission IDs
    const testFormId = 'test-form-id';
    const testSubmissionId = 'test-submission-id';
    
    // Upload file to S3
    const uploadResult = await this.uploadsService.uploadFile(
      testFormId,
      testSubmissionId,
      file.originalname,
      file.buffer,
      file.mimetype
    );
    
    return uploadResult;
  }

  // NEW: Endpoint for getting a signed URL for a file
  @Get('signed-url')
  async getSignedUrl(
    @Query('key') key: string,
    @Query('expires') expiresIn: string
  ) {
    if (!key) {
      throw new HttpException('Key parameter is required', HttpStatus.BAD_REQUEST);
    }
    
    try {
      // Default to 1 hour if not specified, but allow custom expiration
      const expiresInSeconds = expiresIn ? parseInt(expiresIn) : 60 * 60;
      
      const signedUrl = await this.uploadsService.getSignedUrl(key, expiresInSeconds);
      return { url: signedUrl };
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error}`);
      throw new HttpException('Failed to generate file URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint for authenticated users (form owners)
  @Post('authenticated/:formId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAuthenticatedFile(
    @Param('formId') formId: string,
    @UploadedFile() file: MulterFile,
    @Body() body: { fieldId: string }
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    const form = await this.prismaService.form.findUnique({
      where: { id: formId },
    });
    
    if (!form) {
      throw new HttpException('Form not found', HttpStatus.NOT_FOUND);
    }
    
    // Get field configuration if a field ID was provided
    let fieldConfig: any = null;
    if (body.fieldId) {
      const field = await this.prismaService.formField.findFirst({
        where: { 
          formId: formId,
          id: body.fieldId 
        }
      });
      
      if (field && field.config) {
        fieldConfig = typeof field.config === 'string' 
          ? JSON.parse(field.config)
          : field.config;
      }
    }
    
    // Apply field-specific file validations if config exists
    if (fieldConfig) {
      // Check max file size
      const maxSizeMB = fieldConfig.maxSize || 10; // Default max size in MB
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        throw new HttpException(`File too large. Maximum size is ${maxSizeMB}MB.`, HttpStatus.BAD_REQUEST);
      }
      
      // Check file type restrictions
      if (fieldConfig.allowedTypes && fieldConfig.allowedTypes !== 'all') {
        let isAllowed = false;
        
        if (fieldConfig.allowedTypes === 'images' && file.mimetype.startsWith('image/')) {
          isAllowed = true;
        } else if (fieldConfig.allowedTypes === 'documents' && 
                  (file.mimetype === 'application/pdf' || 
                   file.mimetype.includes('word') || 
                   file.mimetype.includes('doc'))) {
          isAllowed = true;
        } else if (fieldConfig.allowedTypes === 'custom' && fieldConfig.customTypes) {
          const customTypes = fieldConfig.customTypes.split(',').map(t => t.trim());
          const fileExt = '.' + file.originalname.split('.').pop()?.toLowerCase();
          isAllowed = customTypes.some(type => type.includes(fileExt));
        }
        
        if (!isAllowed) {
          throw new HttpException(
            `File type not allowed. Allowed types: ${
              fieldConfig.allowedTypes === 'images' 
                ? 'Images (jpg, png, gif)' 
                : fieldConfig.allowedTypes === 'documents'
                  ? 'Documents (pdf, doc, docx)'
                  : fieldConfig.customTypes || 'Unknown'
            }`, 
            HttpStatus.BAD_REQUEST
          );
        }
      }
    } else {
      // If no field config, apply default size limit
      const maxSizeMB = 10; // Default max size in MB
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        throw new HttpException(`File too large. Maximum size is ${maxSizeMB}MB.`, HttpStatus.BAD_REQUEST);
      }
    }
    
    // Create a temporary submission ID for the file
    const tempId = `temp-${Date.now()}`;
    
    // Upload file to S3
    const uploadResult = await this.uploadsService.uploadFile(
      formId,
      tempId,
      file.originalname,
      file.buffer,
      file.mimetype
    );
    
    return uploadResult;
  }

  // Endpoint for public form submissions
  @Post('form/:formId/submission/:submissionId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('formId') formId: string,
    @Param('submissionId') submissionId: string,
    @UploadedFile() file: MulterFile,
    @Body() body: { fieldId: string }
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    // Verify form exists and is published
    const form = await this.prismaService.form.findUnique({
      where: { id: formId },
    });
    
    if (!form || !form.published) {
      throw new HttpException('Form not found or not published', HttpStatus.NOT_FOUND);
    }
    
    // Get field configuration if a field ID was provided
    let fieldConfig: any = null;
    if (body.fieldId) {
      const field = await this.prismaService.formField.findFirst({
        where: { 
          formId: formId,
          id: body.fieldId 
        }
      });
      
      if (field && field.config) {
        fieldConfig = typeof field.config === 'string' 
          ? JSON.parse(field.config)
          : field.config;
      }
    }
    
    // Verify submission exists
    let submission;
    try {
      submission = await this.prismaService.submission.findUnique({
        where: { id: submissionId },
      });
    } catch (error) {
      this.logger.error(`Error finding submission: ${error}`);
    }
    
    // Apply field-specific file validations if config exists
    if (fieldConfig) {
      // Check max file size
      const maxSizeMB = fieldConfig.maxSize || 10; // Default max size in MB
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        throw new HttpException(`File too large. Maximum size is ${maxSizeMB}MB.`, HttpStatus.BAD_REQUEST);
      }
      
      // Check file type restrictions
      if (fieldConfig.allowedTypes && fieldConfig.allowedTypes !== 'all') {
        let isAllowed = false;
        
        if (fieldConfig.allowedTypes === 'images' && file.mimetype.startsWith('image/')) {
          isAllowed = true;
        } else if (fieldConfig.allowedTypes === 'documents' && 
                  (file.mimetype === 'application/pdf' || 
                   file.mimetype.includes('word') || 
                   file.mimetype.includes('doc'))) {
          isAllowed = true;
        } else if (fieldConfig.allowedTypes === 'custom' && fieldConfig.customTypes) {
          const customTypes = fieldConfig.customTypes.split(',').map(t => t.trim());
          const fileExt = '.' + file.originalname.split('.').pop()?.toLowerCase();
          isAllowed = customTypes.some(type => type.includes(fileExt));
        }
        
        if (!isAllowed) {
          throw new HttpException(
            `File type not allowed. Allowed types: ${
              fieldConfig.allowedTypes === 'images' 
                ? 'Images (jpg, png, gif)' 
                : fieldConfig.allowedTypes === 'documents'
                  ? 'Documents (pdf, doc, docx)'
                  : fieldConfig.customTypes || 'Unknown'
            }`, 
            HttpStatus.BAD_REQUEST
          );
        }
      }
      
      // Check maximum number of files
      if (submission && body.fieldId) {
        const submissionData = submission.data as Record<string, any>;
        const existingFiles = Array.isArray(submissionData[body.fieldId]) 
          ? submissionData[body.fieldId] 
          : [];
        
        const maxFiles = fieldConfig.maxFiles || 1;
        if (existingFiles.length >= maxFiles) {
          throw new HttpException(
            `Maximum number of files (${maxFiles}) reached for this field.`, 
            HttpStatus.BAD_REQUEST
          );
        }
      }
    } else {
      // If no field config, apply default size limit
      const maxSizeMB = 10; // Default max size in MB
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        throw new HttpException(`File too large. Maximum size is ${maxSizeMB}MB.`, HttpStatus.BAD_REQUEST);
      }
    }
    
    // Upload file to S3
    const uploadResult = await this.uploadsService.uploadFile(
      formId,
      submissionId,
      file.originalname,
      file.buffer,
      file.mimetype
    );
    
    // If we have an existing submission, update its data
    if (submission) {
      const submissionData = submission.data as Record<string, any>;
      
      // If the field already has files, add to the array
      if (body.fieldId && Array.isArray(submissionData[body.fieldId])) {
        submissionData[body.fieldId].push({
          name: file.originalname,
          url: uploadResult.url,
          key: uploadResult.key,
          size: uploadResult.size,
          type: file.mimetype,
        });
      } else if (body.fieldId) {
        // Otherwise create a new array
        submissionData[body.fieldId] = [{
          name: file.originalname,
          url: uploadResult.url,
          key: uploadResult.key,
          size: uploadResult.size,
          type: file.mimetype,
        }];
      }
      
      // Update the submission
      await this.prismaService.submission.update({
        where: { id: submissionId },
        data: { data: submissionData },
      });
    }
    
    return uploadResult;
  }

  // Add this new method to serve files directly from S3
  @Get('files/:key(*)')
  async serveFile(@Param('key') key: string, @Res() res: Response) {
    try {
      // Generate a signed URL
      const signedUrl = await this.uploadsService.getSignedUrl(key, 300); // 5 minute expiration
      
      // Redirect to the signed URL
      return res.redirect(signedUrl);
    } catch (error) {
      this.logger.error(`Error serving file: ${error}`);
      throw new NotFoundException('File not found or access denied');
    }
  }
} 
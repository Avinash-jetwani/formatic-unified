import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role, WebhookEventType } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import { WebhookDeliveryService } from '../webhooks/webhook-delivery.service';
import axios from 'axios';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    private webhookDeliveryService: WebhookDeliveryService
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto) {
    // Check if form exists and is published
    const form = await this.prisma.form.findUnique({
      where: { id: createSubmissionDto.formId },
      include: {
        webhooks: {
          where: { active: true }
        }
      }
    });
    
    if (!form || !form.published) {
      throw new NotFoundException('Form not found or not published');
    }
    
    const submission = await this.prisma.submission.create({
      data: {
        formId: createSubmissionDto.formId,
        data: createSubmissionDto.data,
        status: 'new',
        // Store analytics data
        ipAddress: createSubmissionDto.ipAddress,
        userAgent: createSubmissionDto.userAgent,
        referrer: createSubmissionDto.referrer,
        browser: createSubmissionDto.browser,
        device: createSubmissionDto.device,
        location: createSubmissionDto.location,
      },
    });

    // Trigger webhooks if present
    if (form.webhooks && form.webhooks.length > 0) {
      this.triggerWebhooks(form, submission).catch(err => {
        console.error('Error triggering webhooks:', err);
      });
    }
    
    return submission;
  }

  // In /src/submissions/submissions.service.ts - update the findAll method
  async findAll(userId: string, userRole: Role) {
    // Super admin can see all submissions
    if (userRole === Role.SUPER_ADMIN) {
      return this.prisma.submission.findMany({
        include: {
          form: {
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
      });
    }
    
    // Clients can only see submissions for their forms
    return this.prisma.submission.findMany({
      where: {
        form: {
          clientId: userId,
        },
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
            clientId: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
    });
  }

  async findByForm(formId: string, userId: string, userRole: Role) {
    // Check if form exists
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access submissions for this form');
    }
    
    return this.prisma.submission.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            fields: true
          }
        },
      },
    });
    
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && submission.form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access this submission');
    }
    
    return submission;
  }

  async update(id: string, updateSubmissionDto: UpdateSubmissionDto, userId: string, userRole: Role) {
    // Check if submission exists and user has permission
    const submission = await this.findOne(id, userId, userRole);
    
    const updateData: any = {};
    
    // Only update fields that are provided
    if (updateSubmissionDto.status !== undefined) {
      updateData.status = updateSubmissionDto.status;
      updateData.statusUpdatedAt = new Date();
    }
    
    if (updateSubmissionDto.notes !== undefined) {
      updateData.notes = updateSubmissionDto.notes;
      updateData.notesUpdatedAt = new Date();
    }
    
    if (updateSubmissionDto.tags !== undefined) {
      updateData.tags = updateSubmissionDto.tags;
    }
    
    const updatedSubmission = await this.prisma.submission.update({
      where: { id },
      data: updateData,
    });

    // Trigger webhook for submission updated if status changed
    if (updateSubmissionDto.status !== undefined && updateSubmissionDto.status !== submission.status) {
      this.triggerWebhooks(submission.form.id, updatedSubmission, WebhookEventType.SUBMISSION_UPDATED);
    }
    
    return updatedSubmission;
  }

  async findSiblings(id: string, formId: string, userId: string, userRole: Role) {
    // Check permissions first
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access submissions for this form');
    }
    
    // Find the current submission to get its timestamp
    const currentSubmission = await this.prisma.submission.findUnique({
      where: { id },
      select: { createdAt: true },
    });
    
    if (!currentSubmission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    
    // Find the next submission (newer than the current one)
    const nextSubmission = await this.prisma.submission.findFirst({
      where: {
        formId,
        createdAt: { gt: currentSubmission.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    
    // Find the previous submission (older than the current one)
    const previousSubmission = await this.prisma.submission.findFirst({
      where: {
        formId,
        createdAt: { lt: currentSubmission.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    
    return {
      next: nextSubmission?.id || null,
      previous: previousSubmission?.id || null,
    };
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Check if submission exists and user has permission
    await this.findOne(id, userId, userRole);
    
    await this.prisma.submission.delete({ where: { id } });
    return { id };
  }

  async exportSubmission(id: string, format: string, userId: string, userRole: Role): Promise<Buffer> {
    try {
      // Check if submission exists and user has permission
      const submission = await this.findOne(id, userId, userRole);
      
      if (format !== 'pdf') {
        throw new Error('Only PDF export is supported');
      }
      
      // Create PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // Add content to PDF
      doc.fontSize(20).text('Submission Details', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Form: ${submission.form.title}`);
      doc.text(`Submission ID: ${submission.id}`);
      doc.text(`Date: ${new Date(submission.createdAt).toLocaleString()}`);
      doc.moveDown();
      
      // Add form fields
      doc.fontSize(14).text('Responses:');
      doc.moveDown();
      
      submission.form.fields.forEach((field) => {
        doc.fontSize(12).text(`${field.label}:`, { continued: true });
        doc.text(` ${submission.data[field.id] || 'No response'}`);
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
      
      // Return PDF buffer
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        doc.on('error', (err) => {
          reject(new InternalServerErrorException(`Failed to generate PDF: ${err.message}`));
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to export submission: ${error.message}`);
    }
  }

  // Helper method to trigger webhooks for a form submission
  private async triggerWebhooks(form, submission) {
    // Process each webhook
    for (const webhook of form.webhooks) {
      try {
        // Only process active webhooks
        if (!webhook.active) continue;
        
        // Check if webhook includes SUBMISSION_CREATED event
        if (!webhook.eventTypes || 
            !Array.isArray(webhook.eventTypes) || 
            !webhook.eventTypes.includes('SUBMISSION_CREATED')) {
          continue;
        }
        
        // Create webhook payload
        const payload = {
          event: 'SUBMISSION_CREATED',
          form: {
            id: form.id,
            title: form.title
          },
          submission: {
            id: submission.id,
            createdAt: submission.createdAt,
            data: this.filterSubmissionData(submission.data, webhook)
          },
          timestamp: new Date().toISOString()
        };
        
        // Setup headers
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'Formatic-Webhook-Service/1.0',
          'X-Formatic-Event': 'SUBMISSION_CREATED',
          'X-Formatic-Delivery-ID': `del_${Date.now().toString(36)}`
        };
        
        // Add auth headers if necessary
        if (webhook.authType === 'BEARER' && webhook.authValue) {
          headers['Authorization'] = `Bearer ${webhook.authValue}`;
        } else if (webhook.authType === 'API_KEY' && webhook.authValue) {
          headers['X-API-Key'] = webhook.authValue;
        }
        
        // Send webhook POST request
        console.log(`Sending webhook to ${webhook.url}`);
        const response = await axios.post(webhook.url, payload, { headers });
        
        // Create a delivery log record
        await this.prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            submissionId: submission.id,
            eventType: 'SUBMISSION_CREATED',
            status: response.status >= 200 && response.status < 300 ? 'SUCCESS' : 'FAILED',
            requestTimestamp: new Date(),
            responseTimestamp: new Date(),
            requestBody: payload,
            responseBody: response.data,
            statusCode: response.status,
            attemptCount: 1
          }
        });
        
        console.log(`Webhook ${webhook.id} delivered successfully: ${response.status}`);
      } catch (error) {
        console.error(`Error delivering webhook ${webhook.id}:`, error);
        
        // Create a failed delivery log
        try {
          await this.prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              submissionId: submission.id,
              eventType: 'SUBMISSION_CREATED',
              status: 'FAILED',
              requestTimestamp: new Date(),
              requestBody: {
                event: 'SUBMISSION_CREATED',
                form: { id: form.id, title: form.title },
                submission: { id: submission.id }
              },
              errorMessage: error.message || 'Unknown error',
              attemptCount: 1
            }
          });
        } catch (err) {
          console.error('Error creating webhook delivery log:', err);
        }
      }
    }
  }
  
  private filterSubmissionData(data, webhook) {
    if (!data) return {};
    
    // Create a copy of the data
    const filteredData = { ...data };
    
    // Apply include fields filter
    if (webhook.includeFields && webhook.includeFields.length > 0) {
      Object.keys(filteredData).forEach(key => {
        if (!webhook.includeFields.includes(key)) {
          delete filteredData[key];
        }
      });
    }
    
    // Apply exclude fields filter
    if (webhook.excludeFields && webhook.excludeFields.length > 0) {
      webhook.excludeFields.forEach(field => {
        delete filteredData[field];
      });
    }
    
    return filteredData;
  }
}

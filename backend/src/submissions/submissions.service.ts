import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role, WebhookEventType } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import { WebhookDeliveryService } from '../webhooks/webhook-delivery.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    private webhookDeliveryService: WebhookDeliveryService,
    private emailService: EmailService
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto) {
    // Check if form exists and is published
    const form = await this.prisma.form.findUnique({
      where: { id: createSubmissionDto.formId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!form || !form.published) {
      throw new NotFoundException('Form not found or not published');
    }
    
    // Create the submission
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

    // Send email notification to form owner
    try {
      await this.emailService.sendFormSubmissionNotification(
        {
          email: form.client.email,
          name: form.client.name,
          id: form.client.id,
        },
        {
          formTitle: form.title,
          formId: form.id,
          submissionId: submission.id,
          submittedBy: 'Anonymous', // Could be enhanced to capture user info
                     submissionData: submission.data as Record<string, any>,
          submissionDate: submission.createdAt,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send form submission notification: ${error.message}`, error.stack);
      // Don't fail the submission if email fails
    }

    // Trigger webhooks for this form
    this.triggerWebhooks(form.id, submission);
    
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
              fields: true,
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
            fields: true,
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
  private async triggerWebhooks(formId: string, submission: any, eventType: WebhookEventType = WebhookEventType.SUBMISSION_CREATED) {
    try {
      this.logger.log(`Triggering webhooks for form ${formId}, submission ${submission.id}, event ${eventType}`);
      
      // Find all active webhooks for this form
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          formId,
          active: true,
          adminApproved: true,
          eventTypes: {
            has: eventType
          }
        }
      });
      
      this.logger.log(`Found ${webhooks.length} webhooks to trigger`);
      
      // Queue a delivery for each webhook
      for (const webhook of webhooks) {
        await this.webhookDeliveryService.queueDelivery(
          webhook.id,
          eventType,
          submission.id
        );
      }
    } catch (error) {
      this.logger.error(`Error triggering webhooks: ${error.message}`, error.stack);
    }
  }
}

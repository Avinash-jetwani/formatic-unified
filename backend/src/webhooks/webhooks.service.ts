import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { Role, Webhook, WebhookEventType } from '@prisma/client';
import axios from 'axios';
import { createHmac } from 'crypto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject, IsEnum } from 'class-validator';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async create(formId: string, createWebhookDto: CreateWebhookDto, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    // Check if form exists and user has access
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
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

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    // Basic permission check (can be expanded)
    if (form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to add webhooks to this form');
    }

    const webhook = await this.prisma.webhook.create({
      data: {
        ...createWebhookDto,
        formId,
        createdById: userId,
        // Auto-approve webhooks created by SUPER_ADMIN, require approval for CLIENT
        adminApproved: userRole === Role.SUPER_ADMIN ? true : null,
      },
    });

    // Send webhook setup confirmation email (only for CLIENT users, not SUPER_ADMIN)
    if (userRole === Role.CLIENT) {
      try {
        await this.emailService.sendWebhookSetupConfirmation(
          {
            email: form.client.email,
            name: form.client.name,
            id: form.client.id,
          },
          {
            webhookName: webhook.name,
            webhookId: webhook.id,
            webhookUrl: webhook.url,
            formTitle: form.title,
            formId: form.id,
            createdAt: webhook.createdAt,
            eventTypes: webhook.eventTypes,
          }
        );
      } catch (error) {
        this.logger.error(`Failed to send webhook setup confirmation email: ${error.message}`, error.stack);
        // Don't fail the webhook creation if email fails
      }
    }

    return this.toResponseDto(webhook);
  }

  async findAll(formId: string, userId: string, userRole: Role): Promise<WebhookResponseDto[]> {
    // Check if form exists and user has access
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    // Basic permission check (can be expanded)
    if (form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view webhooks for this form');
    }

    const webhooks = await this.prisma.webhook.findMany({
      where: { formId },
    });

    return webhooks.map(webhook => this.toResponseDto(webhook));
  }

  async findOne(id: string, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view this webhook');
    }

    return this.toResponseDto(webhook);
  }

  async update(id: string, updateWebhookDto: UpdateWebhookDto, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this webhook');
    }

    // If webhook is locked by admin, clients cannot modify it
    if (webhook.adminLocked && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('This webhook has been locked by an administrator and cannot be modified');
    }

    // Detect if we're activating or deactivating
    let isDeactivating = false;
    let isActivating = false;
    
    if (updateWebhookDto.active !== undefined) {
      isDeactivating = webhook.active === true && updateWebhookDto.active === false;
      isActivating = webhook.active === false && updateWebhookDto.active === true;
    }

    // If a client is trying to activate a webhook that was deactivated by an admin, prevent it
    if (isActivating && webhook.deactivatedById && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('This webhook was deactivated by an administrator and cannot be reactivated');
    }

    // Prepare update data
    const updateData: any = { ...updateWebhookDto };
    
    // If admin is deactivating, track who did it
    if (isDeactivating && userRole === Role.SUPER_ADMIN) {
      updateData.deactivatedById = userId;
    }
    
    // If admin is activating, clear deactivation info
    if (isActivating && userRole === Role.SUPER_ADMIN) {
      updateData.deactivatedById = null;
    }
    
    // If admin is specifically locking/unlocking this webhook
    if (userRole === Role.SUPER_ADMIN && updateWebhookDto.adminLocked !== undefined) {
      updateData.adminLocked = updateWebhookDto.adminLocked;
    }

    const updatedWebhook = await this.prisma.webhook.update({
      where: { id },
      data: updateData,
    });

    return this.toResponseDto(updatedWebhook);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this webhook');
    }

    await this.prisma.webhook.delete({
      where: { id },
    });
  }

  async testWebhook(id: string, testDto: TestWebhookDto, userId: string, userRole: Role): Promise<any> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { 
        form: {
          include: {
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
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to test this webhook');
    }

    try {
      // Get the event type from the DTO or default to SUBMISSION_CREATED
      const eventType = testDto.eventType || WebhookEventType.SUBMISSION_CREATED;
      
      // Create a test payload based on the event type
      let payload: any;
      
      if (eventType === WebhookEventType.SUBMISSION_CREATED || eventType === WebhookEventType.SUBMISSION_UPDATED) {
        // For submission events
        const submissionId = `sub_test_${Date.now().toString(36)}`;
        payload = {
          event: eventType,
          form: {
            id: webhook.form.id,
            title: webhook.form.title || 'Test Form'
          },
          submission: {
            id: submissionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'new',
            data: testDto.payload 
              ? (typeof testDto.payload === 'string' ? JSON.parse(testDto.payload) : testDto.payload)
              : {
                  name: 'Test User',
                  email: 'test@example.com',
                  message: 'This is a test webhook from Formatic',
                  phone: '123-456-7890'
                }
          },
          timestamp: new Date().toISOString()
        };
      } else if (eventType === WebhookEventType.FORM_PUBLISHED || eventType === WebhookEventType.FORM_UNPUBLISHED) {
        // For form events
        payload = {
          event: eventType,
          form: {
            id: webhook.form.id,
            title: webhook.form.title || 'Test Form',
            description: webhook.form.description || 'Test form description',
            published: eventType === WebhookEventType.FORM_PUBLISHED ? true : false,
            createdAt: webhook.form.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          client: {
            id: webhook.form.clientId,
            name: 'Test Client'
          },
          timestamp: new Date().toISOString()
        };
      }

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Formatic-Webhook-Service/1.0',
        'X-Formatic-Event': eventType,
        'X-Formatic-Delivery-ID': `test_${Date.now().toString(36)}`
      };

      // Add authentication if needed
      if (webhook.authType === 'BEARER' && webhook.authValue) {
        headers['Authorization'] = `Bearer ${webhook.authValue}`;
      } else if (webhook.authType === 'API_KEY' && webhook.authValue) {
        headers['X-API-Key'] = webhook.authValue;
      } else if (webhook.authType === 'BASIC' && webhook.authValue) {
        const auth = Buffer.from(webhook.authValue).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      // Add signature if secret key is present
      if (webhook.secretKey) {
        const signature = this.generateSignature(JSON.stringify(payload), webhook.secretKey);
        headers['X-Webhook-Signature'] = signature;
      }

      // Log what we're about to send
      this.logger.log(`Sending test webhook to ${webhook.url}`);
      this.logger.debug('Webhook payload:', JSON.stringify(payload));
      
      // Send the webhook
      const response = await axios.post(webhook.url, payload, { headers, timeout: 10000 });
      
      // Create a log entry
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: eventType,
          status: 'SUCCESS',
          requestTimestamp: new Date(),
          responseTimestamp: new Date(),
          requestBody: payload,
          responseBody: response.data,
          statusCode: response.status,
          attemptCount: 1
        }
      });

              // Send test success email notification
        try {
          await this.emailService.sendWebhookTestNotification(
            {
              email: webhook.form.client.email,
              name: webhook.form.client.name,
              id: webhook.form.client.id,
            },
            {
              webhookName: webhook.name,
              webhookId: webhook.id,
              webhookUrl: webhook.url,
              formTitle: webhook.form.title,
              formId: webhook.form.id,
              createdAt: webhook.createdAt,
              eventTypes: webhook.eventTypes,
              success: true,
              statusCode: response.status,
              responseData: response.data,
              errorMessage: undefined,
              testDate: new Date(),
            }
          );
        } catch (emailError) {
          this.logger.error(`Failed to send webhook test success email: ${emailError.message}`, emailError.stack);
          // Don't fail the test if email fails
        }

      return {
        success: true,
        message: `Test webhook sent to ${webhook.url}`,
        statusCode: response.status,
        responseData: response.data
      };
    } catch (error) {
      // Log the error
      this.logger.error(`Error sending test webhook to ${webhook.url}`, error.stack);
      
      // Create a failed delivery log
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: testDto.eventType || 'SUBMISSION_CREATED',
          status: 'FAILED',
          requestTimestamp: new Date(),
          requestBody: error.config?.data ? 
            (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) 
            : {},
          errorMessage: error.message,
          statusCode: error.response?.status,
          attemptCount: 1
        }
      });

      // Send test failure email notification
      try {
        await this.emailService.sendWebhookTestNotification(
          {
            email: webhook.form.client.email,
            name: webhook.form.client.name,
            id: webhook.form.client.id,
          },
          {
            webhookName: webhook.name,
            webhookId: webhook.id,
            webhookUrl: webhook.url,
            formTitle: webhook.form.title,
            formId: webhook.form.id,
            createdAt: webhook.createdAt,
            eventTypes: webhook.eventTypes,
            success: false,
            statusCode: error.response?.status,
            responseData: undefined,
            errorMessage: error.message,
            testDate: new Date(),
          }
        );
      } catch (emailError) {
        this.logger.error(`Failed to send webhook test failure email: ${emailError.message}`, emailError.stack);
        // Don't fail the test if email fails
      }

      return {
        success: false,
        message: `Failed to send test webhook: ${error.message}`,
        error: error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Admin only: Approve or reject a webhook
   */
  async approveWebhook(id: string, approved: boolean, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    // Only SUPER_ADMIN can approve webhooks
    if (userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can approve webhooks');
    }

    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { 
        form: {
          include: {
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
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Get admin user info for the email
    const adminUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    const updatedWebhook = await this.prisma.webhook.update({
      where: { id },
      data: {
        adminApproved: approved,
        adminNotes: approved ? 'Approved by admin' : 'Rejected by admin',
      },
    });

    // Send approval/rejection email to webhook owner
    try {
      await this.emailService.sendWebhookApprovalNotification(
        {
          email: webhook.form.client.email,
          name: webhook.form.client.name,
          id: webhook.form.client.id,
        },
        {
          webhookName: webhook.name,
          webhookId: webhook.id,
          webhookUrl: webhook.url,
          formTitle: webhook.form.title,
          formId: webhook.form.id,
          createdAt: webhook.createdAt,
          eventTypes: webhook.eventTypes,
          approved: approved,
          adminNotes: approved ? 'Your webhook has been approved and is now active.' : 'Your webhook has been rejected.',
          adminName: adminUser?.name || 'Administrator',
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send webhook approval notification email: ${error.message}`, error.stack);
      // Don't fail the approval if email fails
    }

    this.logger.log(`Webhook ${id} ${approved ? 'approved' : 'rejected'} by admin ${userId}`);

    return this.toResponseDto(updatedWebhook);
  }

  /**
   * Admin only: Find all webhooks that need approval
   */
  async findAllPending(userId: string): Promise<WebhookResponseDto[]> {
    // Get all webhooks that aren't approved yet
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        adminApproved: null
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            clientId: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    this.logger.log(`Found ${webhooks.length} webhooks pending approval`);
    
    // Map to response DTOs with extra form info
    return webhooks.map(webhook => ({
      ...this.toResponseDto(webhook),
      formTitle: webhook.form.title,
      clientName: webhook.form.client?.name,
      clientEmail: webhook.form.client?.email
    }));
  }

  /**
   * Admin only: Find all webhooks for admin oversight
   */
  async findAllForAdmin(userId: string): Promise<WebhookResponseDto[]> {
    // Get all webhooks with form and client info
    const webhooks = await this.prisma.webhook.findMany({
      include: {
        form: {
          select: {
            id: true,
            title: true,
            clientId: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    this.logger.log(`Found ${webhooks.length} total webhooks for admin`);
    
    // Map to response DTOs with extra form info
    return webhooks.map(webhook => ({
      ...this.toResponseDto(webhook),
      formTitle: webhook.form?.title || 'Unknown Form',
      clientName: webhook.form?.client?.name || 'Unknown Client',
      clientEmail: webhook.form?.client?.email
    }));
  }

  // Helper to convert database model to response DTO
  private toResponseDto(webhook: Webhook): WebhookResponseDto {
    // Exclude sensitive fields like secretKey
    const { secretKey, authValue, ...rest } = webhook as any;
    
    return {
      ...rest,
      secretKeySet: !!secretKey,
      authValueSet: !!authValue,
    };
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secretKey: string): string {
    const hmac = createHmac('sha256', secretKey);
    return `sha256=${hmac.update(payload).digest('hex')}`;
  }
} 
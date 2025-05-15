import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { Role, WebhookEventType } from '@prisma/client';
import axios from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new webhook
   */
  async create(formId: string, createWebhookDto: CreateWebhookDto, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    // Validate form ownership
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    // Check if user has permission (is form owner or super admin)
    if (form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to create webhooks for this form');
    }

    // Process JSON fields
    const headers = createWebhookDto.headers ? JSON.parse(createWebhookDto.headers) : null;
    const filterConditions = createWebhookDto.filterConditions ? JSON.parse(createWebhookDto.filterConditions) : null;

    // Handle admin approval based on role
    // Set to null for CLIENT (pending) and true for SUPER_ADMIN (auto-approved)
    const adminApproved = userRole === Role.SUPER_ADMIN ? true : null;

    // Create webhook
    const webhook = await this.prisma.webhook.create({
      data: {
        formId,
        createdById: userId,
        adminApproved,
        name: createWebhookDto.name,
        url: createWebhookDto.url,
        active: createWebhookDto.active,
        secretKey: createWebhookDto.secretKey,
        authType: createWebhookDto.authType,
        authValue: createWebhookDto.authValue,
        allowedIpAddresses: createWebhookDto.allowedIpAddresses || [],
        verificationToken: createWebhookDto.verificationToken,
        eventTypes: createWebhookDto.eventTypes,
        headers,
        includeFields: createWebhookDto.includeFields || [],
        excludeFields: createWebhookDto.excludeFields || [],
        retryCount: createWebhookDto.retryCount,
        retryInterval: createWebhookDto.retryInterval,
        dailyLimit: createWebhookDto.dailyLimit,
        dailyUsage: 0,
        filterConditions,
        isTemplate: createWebhookDto.isTemplate,
        templateId: createWebhookDto.templateId,
      },
    });

    return new WebhookResponseDto(webhook);
  }

  /**
   * Get all webhooks for a form
   */
  async findAll(formId: string, userId: string, userRole: Role): Promise<WebhookResponseDto[]> {
    // Validate form ownership
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    // Check if user has permission (is form owner or super admin)
    if (form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view webhooks for this form');
    }

    // Get webhooks
    const webhooks = await this.prisma.webhook.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map(webhook => new WebhookResponseDto(webhook));
  }

  /**
   * Get a webhook by ID
   */
  async findOne(id: string, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Check if user has permission (is form owner or super admin)
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view this webhook');
    }

    return new WebhookResponseDto(webhook);
  }

  /**
   * Update a webhook
   */
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

    // Prevent clients from changing admin-controlled fields
    if (userRole !== Role.SUPER_ADMIN) {
      delete updateData.adminApproved;
      delete updateData.adminNotes;
      delete updateData.adminLocked;
      delete updateData.deactivatedById;
    }

    try {
      const updatedWebhook = await this.prisma.webhook.update({
        where: { id },
        data: updateData,
      });

      return new WebhookResponseDto(updatedWebhook);
    } catch (error) {
      this.logger.error(`Error updating webhook: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update webhook: ${error.message}`);
    }
  }

  /**
   * Delete a webhook
   */
  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    // First get the webhook to check permissions
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Check if user has permission (is form owner or super admin)
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this webhook');
    }

    // Delete webhook
    await this.prisma.webhook.delete({
      where: { id },
    });
  }

  /**
   * Test a webhook by sending a sample payload
   */
  async testWebhook(id: string, testDto: TestWebhookDto, userId: string, userRole: Role): Promise<any> {
    // First get the webhook to check permissions
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Check if user has permission (is form owner or super admin)
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to test this webhook');
    }

    // Check if webhook is active
    if (!webhook.active) {
      return {
        success: false,
        error: {
          message: 'Webhook is inactive. Please activate it before testing.',
          status: 400
        }
      };
    }

    // Check if webhook is admin approved (if user is not super admin)
    if (!webhook.adminApproved && userRole !== Role.SUPER_ADMIN) {
      return {
        success: false,
        error: {
          message: 'Webhook is not approved by admin. It must be approved before it can be used.',
          status: 400
        }
      };
    }

    // Generate test payload
    const form = webhook.form;
    const timestamp = new Date().toISOString();
    
    let payload;
    if (testDto?.payload) {
      try {
        payload = JSON.parse(testDto.payload);
      } catch (e) {
        throw new BadRequestException('Invalid JSON payload');
      }
    } else {
      // Generate a sample payload if none provided
      payload = {
        event: WebhookEventType.SUBMISSION_CREATED,
        form: {
          id: form.id,
          title: form.title,
        },
        submission: {
          id: 'test_submission_id',
          createdAt: timestamp,
          data: {
            name: 'Test User',
            email: 'test@example.com',
            message: 'This is a test webhook submission',
          }
        },
        timestamp,
        test: true
      };
    }

    // Prepare headers
    let headers: Record<string, string> = {};
    
    // Add custom headers if defined
    if (webhook.headers) {
      headers = { ...webhook.headers };
    }
    
    // Add authentication
    switch (webhook.authType) {
      case 'BEARER':
        headers['Authorization'] = `Bearer ${webhook.authValue}`;
        break;
      case 'API_KEY':
        headers['X-API-Key'] = webhook.authValue;
        break;
      case 'BASIC':
        const auth = Buffer.from(webhook.authValue || '').toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        break;
    }
    
    // Add signature if secret key is present
    if (webhook.secretKey) {
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secretKey);
      headers['X-Webhook-Signature'] = signature;
    }
    
    // Add verification token if present
    if (webhook.verificationToken) {
      headers['X-Webhook-Token'] = webhook.verificationToken;
    }

    try {
      // Send the test webhook
      const response = await axios.post(webhook.url, payload, { headers });
      
      // Log the test delivery (but don't count against daily limit)
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: WebhookEventType.SUBMISSION_CREATED,
          status: 'SUCCESS',
          requestTimestamp: new Date(),
          responseTimestamp: new Date(),
          requestBody: payload,
          responseBody: response.data,
          statusCode: response.status,
          attemptCount: 1,
        },
      });
      
      return {
        success: true,
        requestSent: {
          url: webhook.url,
          headers,
          payload,
        },
        response: {
          status: response.status,
          data: response.data,
        }
      };
    } catch (error) {
      // Log the failed test delivery
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: WebhookEventType.SUBMISSION_CREATED,
          status: 'FAILED',
          requestTimestamp: new Date(),
          requestBody: payload,
          errorMessage: error.message,
          statusCode: error.response?.status,
          responseBody: error.response?.data,
          attemptCount: 1,
        },
      });
      
      return {
        success: false,
        requestSent: {
          url: webhook.url,
          headers,
          payload,
        },
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        }
      };
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secretKey: string): string {
    const hmac = createHmac('sha256', secretKey);
    return `sha256=${hmac.update(payload).digest('hex')}`;
  }
} 
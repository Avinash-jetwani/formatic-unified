import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { Role, Webhook } from '@prisma/client';
import axios from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async create(formId: string, createWebhookDto: CreateWebhookDto, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    // Check if form exists and user has access
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
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
      },
    });

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

    const updatedWebhook = await this.prisma.webhook.update({
      where: { id },
      data: updateWebhookDto,
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
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to test this webhook');
    }

    try {
      // Create a test payload
      const submissionId = `sub_test_${Date.now().toString(36)}`;
      const payload = {
        event: 'SUBMISSION_CREATED',
        form: {
          id: webhook.form.id,
          title: webhook.form.title || 'Test Form'
        },
        submission: {
          id: submissionId,
          createdAt: new Date().toISOString(),
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

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Formatic-Webhook-Service/1.0',
        'X-Formatic-Event': 'SUBMISSION_CREATED',
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
          eventType: 'SUBMISSION_CREATED',
          status: 'SUCCESS',
          requestTimestamp: new Date(),
          responseTimestamp: new Date(),
          requestBody: payload,
          responseBody: response.data,
          statusCode: response.status,
          attemptCount: 1
        }
      });

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
          eventType: 'SUBMISSION_CREATED',
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

      return {
        success: false,
        message: `Failed to send test webhook: ${error.message}`,
        error: error.message,
        statusCode: error.response?.status
      };
    }
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
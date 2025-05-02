import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus, WebhookEventType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queue a webhook delivery for various events
   * @param webhookId The ID of the webhook to trigger
   * @param eventType The type of event (e.g., SUBMISSION_CREATED)
   * @param submissionId Optional ID of the submission for submission-related events
   */
  async queueDelivery(
    webhookId: string, 
    eventType: string,
    submissionId?: string
  ): Promise<void> {
    try {
      this.logger.log(`Queuing webhook delivery: webhook=${webhookId}, event=${eventType}${submissionId ? `, submission=${submissionId}` : ''}`);
      
      // Find the webhook
      const webhook = await this.prisma.webhook.findUnique({
        where: { id: webhookId },
        include: {
          form: true
        }
      });
      
      if (!webhook || !webhook.active) {
        this.logger.debug(`Webhook ${webhookId} not found or inactive - skipping delivery`);
        return;
      }
      
      let payload: any = {
        event: eventType,
        timestamp: new Date().toISOString()
      };
      
      // Create different payloads based on event type
      if (eventType === WebhookEventType.SUBMISSION_CREATED || eventType === WebhookEventType.SUBMISSION_UPDATED) {
        if (!submissionId) {
          this.logger.error(`Missing submissionId for ${eventType} event`);
          return;
        }
        
        // For submission events, include submission data
        const submission = await this.prisma.submission.findUnique({
          where: { id: submissionId },
          include: { form: true }
        });
        
        if (!submission) {
          this.logger.debug(`Submission ${submissionId} not found - skipping delivery`);
          return;
        }
        
        payload = {
          ...payload,
          form: {
            id: submission.form.id,
            title: submission.form.title || 'Form'
          },
          submission: {
            id: submission.id,
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
            status: submission.status,
            data: this.filterSubmissionData(submission.data, webhook)
          }
        };
      } 
      else if (eventType === WebhookEventType.FORM_PUBLISHED || eventType === WebhookEventType.FORM_UNPUBLISHED) {
        // For form events, include form data
        payload = {
          ...payload,
          form: {
            id: webhook.form.id,
            title: webhook.form.title || 'Form',
            description: webhook.form.description,
            published: webhook.form.published,
            createdAt: webhook.form.createdAt,
            updatedAt: webhook.form.updatedAt
          },
          client: {
            id: webhook.form.clientId
          }
        };
      }
      
      // Create a delivery record
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          submissionId,
          eventType: eventType as WebhookEventType,
          status: WebhookDeliveryStatus.PENDING,
          requestBody: payload,
          attemptCount: 0,
          nextAttempt: new Date() // Schedule for immediate delivery
        }
      });
      
      this.logger.log(`Webhook delivery queued for webhook ${webhookId}, event ${eventType}`);
    } catch (error) {
      this.logger.error(`Error queueing webhook delivery: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Filter submission data based on webhook include/exclude fields
   */
  private filterSubmissionData(data: any, webhook: any) {
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
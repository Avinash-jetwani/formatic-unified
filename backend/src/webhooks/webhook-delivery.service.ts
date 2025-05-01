import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus, WebhookEventType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queue a webhook delivery when a submission is created
   */
  async queueDelivery(webhookId: string, submissionId: string, eventType: string): Promise<void> {
    try {
      this.logger.log(`Queuing webhook delivery: webhook=${webhookId}, submission=${submissionId}, event=${eventType}`);
      
      // Find the webhook
      const webhook = await this.prisma.webhook.findUnique({
        where: { id: webhookId }
      });
      
      if (!webhook || !webhook.active) {
        this.logger.debug(`Webhook ${webhookId} not found or inactive - skipping delivery`);
        return;
      }
      
      // Find the submission
      const submission = await this.prisma.submission.findUnique({
        where: { id: submissionId },
        include: { form: true }
      });
      
      if (!submission) {
        this.logger.debug(`Submission ${submissionId} not found - skipping delivery`);
        return;
      }
      
      // Create payload
      const payload = {
        event: eventType,
        form: {
          id: submission.form.id,
          title: submission.form.title || 'Form'
        },
        submission: {
          id: submission.id,
          createdAt: submission.createdAt,
          data: this.filterSubmissionData(submission.data, webhook)
        },
        timestamp: new Date().toISOString()
      };
      
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
      
      this.logger.log(`Webhook delivery queued for webhook ${webhookId}, submission ${submissionId}`);
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
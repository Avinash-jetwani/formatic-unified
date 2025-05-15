import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus, WebhookEventType, Submission, Webhook } from '@prisma/client';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queue a webhook delivery for processing
   */
  async queueDelivery(webhook: Webhook, submission: Submission, eventType: WebhookEventType): Promise<void> {
    try {
      // Check if webhook is active
      if (!webhook.active) {
        this.logger.debug(`Webhook ${webhook.id} is inactive - skipping delivery`);
        return;
      }

      // Check if webhook has been deactivated by an admin
      if (webhook.deactivatedById) {
        this.logger.debug(`Webhook ${webhook.id} has been deactivated by an admin - skipping delivery`);
        return;
      }
      
      // Check if webhook is approved by admin - this is a strict requirement
      if (webhook.adminApproved !== true) {
        this.logger.debug(`Webhook ${webhook.id} is not approved by admin (status: ${webhook.adminApproved === false ? 'rejected' : 'pending'}) - skipping delivery`);
        return;
      }

      // Check daily limit if set
      if (webhook.dailyLimit) {
        // Check if we need to reset the daily counter
        if (webhook.dailyResetAt && new Date() > webhook.dailyResetAt) {
          await this.resetDailyUsage(webhook.id);
        } else if (webhook.dailyUsage >= webhook.dailyLimit) {
          this.logger.warn(`Webhook ${webhook.id} has reached daily limit - skipping delivery`);
          return;
        }
      }

      // Check if this event type is supported by the webhook
      if (!webhook.eventTypes.includes(eventType)) {
        this.logger.debug(`Webhook ${webhook.id} doesn't listen for ${eventType} events - skipping delivery`);
        return;
      }

      // Apply conditions (if any)
      if (webhook.filterConditions && !this.evaluateConditions(webhook.filterConditions, submission)) {
        this.logger.debug(`Webhook ${webhook.id} conditions not met - skipping delivery`);
        return;
      }

      // Create payload
      const payload = this.createPayload(webhook, submission, eventType);

      // Create an initial delivery record in PENDING status
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          submissionId: submission.id,
          eventType,
          status: WebhookDeliveryStatus.PENDING,
          requestBody: payload,
          attemptCount: 0,
          nextAttempt: new Date(), // Schedule for immediate delivery
        },
      });

      // Update daily usage counter if there's a limit
      if (webhook.dailyLimit) {
        await this.incrementDailyUsage(webhook.id);
      }

      this.logger.log(`Queued webhook delivery for webhook ${webhook.id}, submission ${submission.id}`);
    } catch (error) {
      this.logger.error(`Error queueing webhook delivery: ${error.message}`, error.stack);
    }
  }

  /**
   * Process pending webhook deliveries
   */
  async processQueue(): Promise<void> {
    this.logger.debug('Processing webhook delivery queue');
    try {
      // Find pending deliveries ready to be sent
      const pendingDeliveries = await this.prisma.webhookDelivery.findMany({
        where: {
          OR: [
            { status: WebhookDeliveryStatus.PENDING },
            { 
              status: WebhookDeliveryStatus.SCHEDULED,
              nextAttempt: { lte: new Date() } 
            }
          ]
        },
        include: {
          webhook: true,
        },
        take: 50, // Process in batches
      });

      this.logger.debug(`Found ${pendingDeliveries.length} pending webhook deliveries`);

      // Process each delivery
      for (const delivery of pendingDeliveries) {
        await this.processDelivery(delivery);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook queue: ${error.message}`, error.stack);
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedDeliveries(): Promise<void> {
    this.logger.debug('Retrying failed webhook deliveries');
    try {
      // Get failed deliveries that still have retries available
      const failedDeliveries = await this.prisma.webhookDelivery.findMany({
        where: {
          status: WebhookDeliveryStatus.FAILED,
          nextAttempt: { lte: new Date() },
          webhook: {
            active: true,
            adminApproved: true,
            deactivatedById: null // Only retry webhooks that haven't been deactivated by an admin
          }
        },
        include: {
          webhook: true,
        },
      });

      this.logger.debug(`Found ${failedDeliveries.length} failed webhook deliveries to retry`);

      // Process each failed delivery
      for (const delivery of failedDeliveries) {
        // Check if we've hit the retry limit
        if (delivery.attemptCount >= delivery.webhook.retryCount) {
          // Mark as permanently failed
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: WebhookDeliveryStatus.FAILED,
              errorMessage: `Maximum retry attempts (${delivery.webhook.retryCount}) reached`,
              nextAttempt: null, // No more retries
            },
          });
          continue;
        }

        // Schedule for retry
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.SCHEDULED,
            nextAttempt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error retrying failed webhook deliveries: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a single webhook delivery
   */
  private async processDelivery(delivery: any): Promise<void> {
    this.logger.debug(`Processing webhook delivery ${delivery.id}`);
    
    try {
      // Make sure the webhook is still active - skip if inactive
      if (!delivery.webhook.active) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.FAILED,
            errorMessage: 'Webhook is currently inactive',
            nextAttempt: null,
          },
        });
        return;
      }

      // Make sure the webhook hasn't been deactivated by an admin
      if (delivery.webhook.deactivatedById) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.FAILED,
            errorMessage: 'Webhook has been deactivated by administrator',
            nextAttempt: null,
          },
        });
        return;
      }

      // Make sure the webhook is approved by an admin
      if (delivery.webhook.adminApproved !== true) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.FAILED,
            errorMessage: delivery.webhook.adminApproved === false
              ? 'Webhook has been rejected by administrator'
              : 'Webhook is pending administrator approval',
            nextAttempt: null,
          },
        });
        return;
      }

      // Prepare headers
      const headers = this.buildHeaders(delivery.webhook, delivery.requestBody);

      // Attempt to send the webhook
      const result = await this.sendWebhook(delivery.webhook.url, delivery.requestBody, headers);

      // Update the delivery record
      if (result.success) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.SUCCESS,
            responseTimestamp: new Date(),
            responseBody: result.data,
            statusCode: result.statusCode,
            attemptCount: delivery.attemptCount + 1,
            nextAttempt: null,
          },
        });
        this.logger.log(`Successfully delivered webhook ${delivery.id}`);
      } else {
        // Calculate next retry time
        const nextAttempt = this.calculateNextRetryTime(
          delivery.webhook.retryInterval,
          delivery.attemptCount
        );

        // Update with failure
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: delivery.attemptCount + 1 >= delivery.webhook.retryCount
              ? WebhookDeliveryStatus.FAILED
              : WebhookDeliveryStatus.SCHEDULED,
            responseTimestamp: new Date(),
            responseBody: result.data,
            statusCode: result.statusCode,
            errorMessage: result.error,
            attemptCount: delivery.attemptCount + 1,
            nextAttempt: delivery.attemptCount + 1 >= delivery.webhook.retryCount
              ? null
              : nextAttempt,
          },
        });
        this.logger.warn(`Failed to deliver webhook ${delivery.id}: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Error processing delivery ${delivery.id}: ${error.message}`, error.stack);
      
      // Update with system error
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          errorMessage: `System error: ${error.message}`,
          attemptCount: delivery.attemptCount + 1,
          nextAttempt: null,
        },
      });
    }
  }

  /**
   * Send a webhook to the specified URL
   */
  private async sendWebhook(url: string, payload: any, headers: Record<string, string>): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        headers,
        timeout: 10000, // 10 seconds timeout
      };

      const response = await axios.post(url, payload, config);
      
      return {
        success: true,
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        statusCode: axiosError.response?.status,
        data: axiosError.response?.data,
        error: axiosError.message,
      };
    }
  }

  /**
   * Build headers for the webhook request
   */
  private buildHeaders(webhook: Webhook, payload: any): Record<string, string> {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Formatic-Webhook-Service',
      'X-Webhook-ID': webhook.id,
    };
    
    // Add custom headers if defined
    if (webhook.headers) {
      headers = { ...headers, ...webhook.headers };
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
    
    return headers;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secretKey: string): string {
    const hmac = createHmac('sha256', secretKey);
    return `sha256=${hmac.update(payload).digest('hex')}`;
  }

  /**
   * Create the webhook payload
   */
  private createPayload(webhook: Webhook, submission: Submission, eventType: WebhookEventType): any {
    // Basic payload structure
    const payload: any = {
      event: eventType,
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id,
    };

    // Add form data
    payload.form = {
      id: webhook.formId,
    };

    // Add submission data
    if (submission) {
      let submissionData: any = {
        id: submission.id,
        createdAt: submission.createdAt,
        status: submission.status,
      };

      // Filter submission data based on include/exclude fields
      const data = submission.data as any;
      
      if (data) {
        if (webhook.includeFields && webhook.includeFields.length > 0) {
          // Only include specified fields
          const filteredData: any = {};
          webhook.includeFields.forEach(field => {
            if (data[field] !== undefined) {
              filteredData[field] = data[field];
            }
          });
          submissionData.data = filteredData;
        } else if (webhook.excludeFields && webhook.excludeFields.length > 0) {
          // Include all except excluded fields
          const filteredData = { ...data };
          webhook.excludeFields.forEach(field => {
            delete filteredData[field];
          });
          submissionData.data = filteredData;
        } else {
          // Include all data
          submissionData.data = data;
        }
      }

      payload.submission = submissionData;
    }

    return payload;
  }

  /**
   * Evaluate conditions against submission data
   */
  private evaluateConditions(conditions: any, submission: Submission): boolean {
    try {
      if (!conditions) return true;
      
      const parsedConditions = typeof conditions === 'string' 
        ? JSON.parse(conditions) 
        : conditions;
      
      if (!parsedConditions.rules || parsedConditions.rules.length === 0) {
        return true;
      }

      const data = submission.data as any;
      const logicOperator = parsedConditions.logicOperator?.toUpperCase() || 'AND';
      
      // Evaluate each rule
      const results = parsedConditions.rules.map((rule: any) => {
        const { fieldId, operator, value } = rule;
        const fieldValue = data[fieldId];
        
        if (fieldValue === undefined) return false;
        
        switch (operator) {
          case 'equals':
            return fieldValue === value;
          case 'notEquals':
            return fieldValue !== value;
          case 'contains':
            return String(fieldValue).includes(String(value));
          case 'greaterThan':
            return Number(fieldValue) > Number(value);
          case 'lessThan':
            return Number(fieldValue) < Number(value);
          default:
            return false;
        }
      });
      
      // Combine results based on logic operator
      return logicOperator === 'AND'
        ? results.every(result => result)
        : results.some(result => result);
    } catch (error) {
      this.logger.error(`Error evaluating conditions: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Calculate the next retry time with exponential backoff
   */
  private calculateNextRetryTime(retryInterval: number, attemptCount: number): Date {
    // Exponential backoff: retryInterval * 2^attemptCount (capped at 24 hours)
    const backoffSeconds = Math.min(
      retryInterval * Math.pow(2, attemptCount),
      86400 // 24 hours in seconds
    );
    
    const nextAttempt = new Date();
    nextAttempt.setSeconds(nextAttempt.getSeconds() + backoffSeconds);
    
    return nextAttempt;
  }

  /**
   * Reset daily usage counter
   */
  private async resetDailyUsage(webhookId: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    await this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        dailyUsage: 0,
        dailyResetAt: tomorrow,
      },
    });
  }

  /**
   * Increment daily usage counter
   */
  private async incrementDailyUsage(webhookId: string): Promise<void> {
    await this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        dailyUsage: {
          increment: 1
        }
      },
    });
  }
} 
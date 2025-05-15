import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WebhookProcessorTask {
  private readonly logger = new Logger(WebhookProcessorTask.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processWebhookQueue() {
    this.logger.log('Processing webhook queue...');

    try {
      // Find pending webhook deliveries
      const pendingDeliveries = await this.prisma.webhookDelivery.findMany({
        where: {
          status: WebhookDeliveryStatus.PENDING,
          nextAttempt: {
            lte: new Date(),
          },
        },
        include: {
          webhook: true,
        },
        take: 10, // Process in batches
      });

      this.logger.log(`Found ${pendingDeliveries.length} pending webhook deliveries`);

      // Process each pending delivery
      for (const delivery of pendingDeliveries) {
        try {
          this.logger.log(`Processing webhook delivery ${delivery.id} for webhook ${delivery.webhookId}`);

          // Update status to processing
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SCHEDULED' as WebhookDeliveryStatus,
              attemptCount: delivery.attemptCount + 1,
            },
          });

          // Prepare headers
          const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Formatic-Webhook-Service/1.0',
            'X-Formatic-Event': delivery.eventType,
            'X-Formatic-Delivery-ID': delivery.id,
          };

          // Add authentication if needed
          if (delivery.webhook.authType === 'BEARER' && delivery.webhook.authValue) {
            headers['Authorization'] = `Bearer ${delivery.webhook.authValue}`;
          } else if (delivery.webhook.authType === 'API_KEY' && delivery.webhook.authValue) {
            headers['X-API-Key'] = delivery.webhook.authValue;
          } else if (delivery.webhook.authType === 'BASIC' && delivery.webhook.authValue) {
            const auth = Buffer.from(delivery.webhook.authValue).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
          }

          // Send the webhook
          this.logger.log(`Sending webhook to ${delivery.webhook.url}`);
          const response = await axios.post(delivery.webhook.url, delivery.requestBody, {
            headers,
            timeout: 5000, // 5 second timeout
          });

          // Update delivery record with success
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: WebhookDeliveryStatus.SUCCESS,
              responseTimestamp: new Date(),
              responseBody: response.data,
              statusCode: response.status,
            },
          });

          this.logger.log(`Successfully delivered webhook ${delivery.id}`);
        } catch (error) {
          this.logger.error(`Error delivering webhook ${delivery.id}: ${error.message}`);

          // Calculate next retry time based on attempt count using exponential backoff
          const nextAttempt = new Date();
          const retryInterval = Math.min(
            delivery.webhook.retryInterval * Math.pow(2, delivery.attemptCount),
            3600, // Max 1 hour between retries
          );
          nextAttempt.setSeconds(nextAttempt.getSeconds() + retryInterval);

          // Update delivery record with failure
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status:
                delivery.attemptCount + 1 >= delivery.webhook.retryCount
                  ? WebhookDeliveryStatus.FAILED
                  : WebhookDeliveryStatus.SCHEDULED,
              errorMessage: error.message,
              statusCode: error.response?.status,
              responseBody: error.response?.data,
              nextAttempt: delivery.attemptCount + 1 >= delivery.webhook.retryCount ? null : nextAttempt,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error processing webhook queue: ${error.message}`, error.stack);
    }
  }
} 
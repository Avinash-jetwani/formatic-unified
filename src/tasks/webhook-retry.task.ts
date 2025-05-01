import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookDeliveryService } from '../webhooks/webhook-delivery.service';
import { WebhookLogsService } from '../webhooks/webhook-logs.service';

@Injectable()
export class WebhookRetryTask {
  private readonly logger = new Logger(WebhookRetryTask.name);

  constructor(
    private readonly webhookDeliveryService: WebhookDeliveryService,
    private readonly webhookLogsService: WebhookLogsService,
  ) {}

  /**
   * Process webhook delivery queue every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processWebhookQueue() {
    this.logger.debug('Running scheduled webhook queue processing task');
    try {
      await this.webhookDeliveryService.processQueue();
    } catch (error) {
      this.logger.error(`Error processing webhook queue: ${error.message}`, error.stack);
    }
  }

  /**
   * Retry failed webhook deliveries every 15 minutes
   */
  @Cron(CronExpression.EVERY_15_MINUTES)
  async retryFailedWebhooks() {
    this.logger.debug('Running scheduled webhook retry task');
    try {
      await this.webhookDeliveryService.retryFailedDeliveries();
    } catch (error) {
      this.logger.error(`Error retrying failed webhooks: ${error.message}`, error.stack);
    }
  }

  /**
   * Clean up old webhook logs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs() {
    this.logger.debug('Running scheduled webhook log cleanup task');
    try {
      // Clean up logs older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await this.webhookLogsService.cleanupOldLogs(ninetyDaysAgo);
      this.logger.log(`Cleaned up ${result.count} old webhook delivery logs`);
    } catch (error) {
      this.logger.error(`Error cleaning up webhook logs: ${error.message}`, error.stack);
    }
  }
} 
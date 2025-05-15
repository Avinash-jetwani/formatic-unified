import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus } from '@prisma/client';

interface WebhookLogsFilter {
  status?: WebhookDeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

@Injectable()
export class WebhookLogsService {
  private readonly logger = new Logger(WebhookLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get webhook delivery logs with pagination and filtering
   */
  async getDeliveryLogs(
    webhookId: string,
    filters: WebhookLogsFilter
  ) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = filters;
      const skip = (page - 1) * limit;

      // Build where clause with filters
      const where: any = { webhookId };
      if (status) {
        where.status = status;
      }
      if (startDate || endDate) {
        where.requestTimestamp = {};
        if (startDate) {
          where.requestTimestamp.gte = startDate;
        }
        if (endDate) {
          where.requestTimestamp.lte = endDate;
        }
      }

      // Get logs with pagination
      const [data, total] = await Promise.all([
        this.prisma.webhookDelivery.findMany({
          where,
          skip,
          take: limit,
          orderBy: { requestTimestamp: 'desc' },
        }),
        this.prisma.webhookDelivery.count({ where }),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting webhook logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a single webhook delivery log
   */
  async getDeliveryLog(id: string) {
    const log = await this.prisma.webhookDelivery.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Webhook delivery log with ID ${id} not found`);
    }

    return log;
  }

  /**
   * Retry a failed webhook delivery
   */
  async retryDelivery(id: string) {
    const log = await this.prisma.webhookDelivery.findUnique({
      where: { id },
      include: { webhook: true },
    });

    if (!log) {
      throw new NotFoundException(`Webhook delivery log with ID ${id} not found`);
    }

    if (log.status !== WebhookDeliveryStatus.FAILED) {
      return {
        success: false,
        message: 'Only failed deliveries can be retried',
      };
    }

    // Schedule for retry by setting status to SCHEDULED
    await this.prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: WebhookDeliveryStatus.SCHEDULED,
        nextAttempt: new Date(),
        attemptCount: log.attemptCount + 1,
      },
    });

    return {
      success: true,
      message: 'Webhook delivery has been scheduled for retry',
    };
  }

  /**
   * Get webhook delivery statistics
   */
  async getDeliveryStats(webhookId: string, days: number = 7) {
    // Simple stats for now
    const total = await this.prisma.webhookDelivery.count({
      where: { webhookId },
    });

    const successCount = await this.prisma.webhookDelivery.count({
      where: {
        webhookId,
        status: WebhookDeliveryStatus.SUCCESS,
      },
    });

    const failedCount = await this.prisma.webhookDelivery.count({
      where: {
        webhookId,
        status: WebhookDeliveryStatus.FAILED,
      },
    });

    const pendingCount = await this.prisma.webhookDelivery.count({
      where: {
        webhookId,
        status: WebhookDeliveryStatus.PENDING,
      },
    });

    return {
      dailyStats: [],
      overallStats: [
        { status: 'SUCCESS', count: successCount },
        { status: 'FAILED', count: failedCount },
        { status: 'PENDING', count: pendingCount }
      ],
      metrics: {
        totalDeliveries: total,
        successRate: total > 0 ? (successCount / total) * 100 : 0,
        averageResponseMs: 0  // Simplified - not calculating actual time
      },
    };
  }

  /**
   * Clean up old webhook logs
   */
  async cleanupOldLogs(olderThan: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
    try {
      const result = await this.prisma.webhookDelivery.deleteMany({
        where: {
          requestTimestamp: {
            lt: olderThan,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old webhook logs`);
      return { deletedCount: result.count };
    } catch (error) {
      this.logger.error(`Error cleaning up old logs: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
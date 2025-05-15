import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus } from '@prisma/client';

@Injectable()
export class WebhookLogsService {
  private readonly logger = new Logger(WebhookLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get webhook delivery logs with filtering options
   */
  async getDeliveryLogs(
    webhookId: string,
    filters: {
      status?: WebhookDeliveryStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      page?: number;
    } = {}
  ) {
    try {
      const { status, startDate, endDate, limit = 50, page = 1 } = filters;
      const skip = (page - 1) * limit;

      // Build where conditions
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
      const [logs, total] = await Promise.all([
        this.prisma.webhookDelivery.findMany({
          where,
          orderBy: { requestTimestamp: 'desc' },
          take: limit,
          skip,
          include: {
            submission: {
              select: {
                id: true,
                createdAt: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.webhookDelivery.count({ where }),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching webhook logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getDeliveryStats(webhookId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily stats
      const dailyStats = await this.prisma.$queryRaw`
        SELECT 
          DATE(request_timestamp) as date,
          status,
          COUNT(*) as count
        FROM "WebhookDelivery"
        WHERE webhook_id = ${webhookId}
          AND request_timestamp >= ${startDate}
        GROUP BY DATE(request_timestamp), status
        ORDER BY date DESC
      `;

      // Get overall stats
      const overallStats = await this.prisma.webhookDelivery.groupBy({
        by: ['status'],
        where: {
          webhookId,
        },
        _count: {
          id: true,
        },
      });

      // Calculate success rate
      const totalDeliveries = overallStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const successfulDeliveries = overallStats.find(stat => stat.status === WebhookDeliveryStatus.SUCCESS)?._count.id || 0;
      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      // Calculate average response time
      const avgResponseTime = await this.prisma.webhookDelivery.aggregate({
        where: {
          webhookId,
          status: WebhookDeliveryStatus.SUCCESS,
          responseTimestamp: { not: null },
        },
        _avg: {
          // Approximate the response time as difference between timestamps
          // Note: This is not exact as Prisma doesn't support time difference directly
          // A better approach would be to store responseTime as a separate field
          // For demonstration, we'll calculate it in JS after fetching records
        },
      });

      // Get some successful deliveries to calculate average response time
      const successfulDeliveryData = await this.prisma.webhookDelivery.findMany({
        where: {
          webhookId,
          status: WebhookDeliveryStatus.SUCCESS,
          responseTimestamp: { not: null },
        },
        select: {
          requestTimestamp: true,
          responseTimestamp: true,
        },
        take: 100, // Limited to last 100 to avoid performance issues
      });

      // Calculate average response time
      let totalResponseTime = 0;
      let count = 0;
      
      for (const delivery of successfulDeliveryData) {
        const requestTime = new Date(delivery.requestTimestamp).getTime();
        const responseTime = new Date(delivery.responseTimestamp).getTime();
        totalResponseTime += (responseTime - requestTime);
        count++;
      }
      
      const averageResponseMs = count > 0 ? totalResponseTime / count : 0;

      return {
        dailyStats,
        overallStats: overallStats.map(stat => ({
          status: stat.status,
          count: stat._count.id,
        })),
        metrics: {
          totalDeliveries,
          successRate,
          averageResponseMs,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching webhook stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a single webhook delivery log
   */
  async getDeliveryLog(id: string) {
    try {
      const log = await this.prisma.webhookDelivery.findUnique({
        where: { id },
        include: {
          webhook: {
            select: {
              id: true,
              name: true,
              url: true,
              formId: true,
            },
          },
          submission: {
            select: {
              id: true,
              createdAt: true,
              status: true,
            },
          },
        },
      });

      if (!log) {
        return null;
      }

      return log;
    } catch (error) {
      this.logger.error(`Error fetching webhook log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retry a failed webhook delivery
   */
  async retryDelivery(id: string) {
    try {
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id },
        include: {
          webhook: true,
        },
      });

      if (!delivery) {
        throw new Error(`Webhook delivery ${id} not found`);
      }

      if (delivery.status === WebhookDeliveryStatus.SUCCESS) {
        throw new Error(`Webhook delivery ${id} already succeeded`);
      }

      // Schedule for retry
      await this.prisma.webhookDelivery.update({
        where: { id },
        data: {
          status: WebhookDeliveryStatus.SCHEDULED,
          nextAttempt: new Date(),
          errorMessage: `Manual retry requested at ${new Date().toISOString()}`,
        },
      });

      return { success: true, message: 'Webhook delivery scheduled for retry' };
    } catch (error) {
      this.logger.error(`Error retrying webhook delivery: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up old webhook delivery logs
   */
  async cleanupOldLogs(olderThan: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
    try {
      // Delete logs older than specified date (default: 90 days)
      const result = await this.prisma.webhookDelivery.deleteMany({
        where: {
          requestTimestamp: {
            lt: olderThan,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old webhook delivery logs`);
      return { count: result.count };
    } catch (error) {
      this.logger.error(`Error cleaning up webhook logs: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
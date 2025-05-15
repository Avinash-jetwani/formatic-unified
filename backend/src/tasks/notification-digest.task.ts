import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationDigestTask {
  private readonly logger = new Logger(NotificationDigestTask.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDailyDigests() {
    this.logger.log('Processing daily notification digests...');

    try {
      // Get all forms that have digest notifications enabled
      const forms = await this.prisma.form.findMany({
        where: {
          emailNotifications: true,
          notificationType: 'digest',
          notificationEmails: {
            isEmpty: false
          }
        },
        select: {
          id: true,
          title: true,
          notificationEmails: true
        }
      });

      this.logger.log(`Found ${forms.length} forms with digest notifications enabled`);

      for (const form of forms) {
        // Get all unprocessed notifications for this form
        const pendingNotifications = await this.prisma.pendingNotification.findMany({
          where: {
            formId: form.id,
            processed: false
          },
          include: {
            submission: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        if (pendingNotifications.length === 0) {
          continue;
        }

        this.logger.log(`Processing ${pendingNotifications.length} notifications for form: ${form.title}`);

        // Group submissions by form
        const submissionsData = pendingNotifications.map(notification => ({
          id: notification.submission.id,
          createdAt: notification.submission.createdAt,
          data: notification.submission.data
        }));

        // In a real implementation, you would:
        // 1. Format an email with the submissions digest
        // 2. Send the email to each recipient in form.notificationEmails
        // Here we just log it
        this.logger.log(`Would send digest email to: ${form.notificationEmails.join(', ')}`);
        this.logger.log(`With ${submissionsData.length} submissions`);

        // Mark all these notifications as processed
        await this.prisma.pendingNotification.updateMany({
          where: {
            id: {
              in: pendingNotifications.map(n => n.id)
            }
          },
          data: {
            processed: true,
            processedAt: new Date()
          }
        });
      }

      this.logger.log('Daily notification digest processing completed');
    } catch (error) {
      this.logger.error('Error processing notification digests:', error);
    }
  }
} 
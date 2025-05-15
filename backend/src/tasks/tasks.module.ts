import * as crypto from 'crypto';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhookProcessorTask } from './webhook-processor.task';
import { NotificationDigestTask } from './notification-digest.task';

// Make crypto globally available for scheduler
(global as any).crypto = crypto;

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [WebhookProcessorTask, NotificationDigestTask],
})
export class TasksModule {} 
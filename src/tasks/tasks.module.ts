import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookRetryTask } from './webhook-retry.task';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WebhooksModule,
  ],
  providers: [WebhookRetryTask],
  exports: [],
})
export class TasksModule {} 
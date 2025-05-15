import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookSecurityService } from './webhook-security.service';
import { WebhookLogsService } from './webhook-logs.service';
import { WebhookLogsController } from './webhook-logs.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController, WebhookLogsController],
  providers: [
    WebhooksService,
    WebhookDeliveryService,
    WebhookSecurityService,
    WebhookLogsService
  ],
  exports: [
    WebhooksService,
    WebhookDeliveryService,
    WebhookSecurityService,
    WebhookLogsService
  ],
})
export class WebhooksModule {} 
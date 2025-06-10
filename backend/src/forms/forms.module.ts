import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { EmailModule } from '../email/email.module';
import { FormAccessService } from './form-access.service';

@Module({
  imports: [PrismaModule, WebhooksModule, EmailModule],
  controllers: [FormsController],
  providers: [FormsService, FormAccessService],
  exports: [FormsService, FormAccessService]
})
export class FormsModule {}
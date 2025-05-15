import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject, IsEnum } from 'class-validator';
import { WebhookEventType } from '@prisma/client';

export class TestWebhookDto {
  @ApiProperty({ 
    description: 'Custom payload to send in the test',
    required: false,
    type: Object
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @ApiProperty({
    description: 'Event type to test',
    required: false,
    enum: WebhookEventType,
    default: WebhookEventType.SUBMISSION_CREATED
  })
  @IsEnum(WebhookEventType)
  @IsOptional()
  eventType?: WebhookEventType = WebhookEventType.SUBMISSION_CREATED;
} 
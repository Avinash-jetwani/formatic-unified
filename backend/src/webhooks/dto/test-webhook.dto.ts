import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class TestWebhookDto {
  @ApiProperty({ 
    description: 'Custom payload to send in the test',
    required: false,
    type: Object
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
} 
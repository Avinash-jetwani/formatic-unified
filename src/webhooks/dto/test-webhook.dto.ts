import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class TestWebhookDto {
  @ApiPropertyOptional({ description: 'Custom payload for testing' })
  @IsJSON()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value : JSON.stringify(value))
  payload?: string;
} 
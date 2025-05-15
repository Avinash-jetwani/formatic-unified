import { IsString, IsUrl, IsBoolean, IsEnum, IsArray, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateWebhookDto } from './create-webhook.dto';

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiProperty({ description: 'Whether this webhook is locked by admin (admin only)', required: false })
  @IsBoolean()
  @IsOptional()
  adminLocked?: boolean;
} 
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateWebhookDto } from './create-webhook.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiPropertyOptional({ description: 'Admin approval status (super admin only)' })
  @IsBoolean()
  @IsOptional()
  adminApproved?: boolean;

  @ApiPropertyOptional({ description: 'Admin notes about this webhook (super admin only)' })
  @IsOptional()
  adminNotes?: string;
} 
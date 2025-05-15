import { IsString, IsUrl, IsOptional, IsBoolean, IsArray, IsEnum, IsInt, IsJSON, Min, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookAuthType, WebhookEventType } from '@prisma/client';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Name of the webhook' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL endpoint to send webhook data to' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Whether the webhook is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean = true;

  @ApiPropertyOptional({ description: 'Secret key for HMAC verification' })
  @IsString()
  @IsOptional()
  secretKey?: string;

  // Authentication
  @ApiPropertyOptional({ 
    description: 'Authentication type', 
    enum: WebhookAuthType, 
    default: WebhookAuthType.NONE 
  })
  @IsEnum(WebhookAuthType)
  @IsOptional()
  authType?: WebhookAuthType = WebhookAuthType.NONE;

  @ApiPropertyOptional({ description: 'Authentication value (token, API key, etc.)' })
  @IsString()
  @IsOptional()
  @ValidateIf(o => o.authType !== WebhookAuthType.NONE)
  authValue?: string;

  // Security enhancements
  @ApiPropertyOptional({ description: 'IP addresses allowed to receive webhooks', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedIpAddresses?: string[];

  @ApiPropertyOptional({ description: 'Additional verification token' })
  @IsString()
  @IsOptional()
  verificationToken?: string;

  // Configuration
  @ApiPropertyOptional({ 
    description: 'Event types that trigger this webhook', 
    enum: WebhookEventType, 
    isArray: true,
    default: [WebhookEventType.SUBMISSION_CREATED] 
  })
  @IsEnum(WebhookEventType, { each: true })
  @IsArray()
  @IsOptional()
  eventTypes?: WebhookEventType[] = [WebhookEventType.SUBMISSION_CREATED];

  @ApiPropertyOptional({ description: 'Custom headers to send with webhook' })
  @IsJSON()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value : JSON.stringify(value))
  headers?: string;

  @ApiPropertyOptional({ description: 'Fields to include in webhook payload', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includeFields?: string[];

  @ApiPropertyOptional({ description: 'Fields to exclude from webhook payload', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeFields?: string[];

  // Delivery settings
  @ApiPropertyOptional({ description: 'Number of retry attempts for failed webhooks', default: 3 })
  @IsInt()
  @Min(0)
  @IsOptional()
  retryCount?: number = 3;

  @ApiPropertyOptional({ description: 'Interval between retries in seconds', default: 60 })
  @IsInt()
  @Min(1)
  @IsOptional()
  retryInterval?: number = 60;

  // Rate limiting & quotas
  @ApiPropertyOptional({ description: 'Maximum webhook triggers per day' })
  @IsInt()
  @Min(1)
  @IsOptional()
  dailyLimit?: number;

  // Filter conditions
  @ApiPropertyOptional({ description: 'Conditions for when to trigger webhook' })
  @IsJSON()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value : JSON.stringify(value))
  filterConditions?: string;

  // Template support
  @ApiPropertyOptional({ description: 'Whether this is a webhook template', default: false })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean = false;

  @ApiPropertyOptional({ description: 'Template ID if creating from a template' })
  @IsString()
  @IsOptional()
  templateId?: string;
} 
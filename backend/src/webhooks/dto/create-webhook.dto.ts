import { IsString, IsUrl, IsBoolean, IsEnum, IsArray, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum WebhookAuthType {
  NONE = 'NONE',
  BASIC = 'BASIC',
  BEARER = 'BEARER',
  API_KEY = 'API_KEY',
}

enum WebhookEventType {
  SUBMISSION_CREATED = 'SUBMISSION_CREATED',
  SUBMISSION_UPDATED = 'SUBMISSION_UPDATED',
  FORM_PUBLISHED = 'FORM_PUBLISHED',
  FORM_UNPUBLISHED = 'FORM_UNPUBLISHED',
}

export class CreateWebhookDto {
  @ApiProperty({ description: 'Name of the webhook' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL where webhook payloads will be sent' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Whether the webhook is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean = true;

  @ApiProperty({ description: 'Secret key for signature verification', required: false })
  @IsString()
  @IsOptional()
  secretKey?: string;

  @ApiProperty({ enum: WebhookAuthType, default: WebhookAuthType.NONE })
  @IsEnum(WebhookAuthType)
  @IsOptional()
  authType?: WebhookAuthType = WebhookAuthType.NONE;

  @ApiProperty({ description: 'Authentication value (token, apiKey, etc.)', required: false })
  @IsString()
  @IsOptional()
  authValue?: string;

  @ApiProperty({ type: [String], enum: WebhookEventType, default: [WebhookEventType.SUBMISSION_CREATED] })
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  @IsOptional()
  eventTypes?: WebhookEventType[] = [WebhookEventType.SUBMISSION_CREATED];

  @ApiProperty({ type: [String], description: 'Fields to include in payload (empty means all fields)', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includeFields?: string[] = [];

  @ApiProperty({ type: [String], description: 'Fields to exclude from payload', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeFields?: string[] = [];

  @ApiProperty({ description: 'Number of retry attempts for failed deliveries', default: 3 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  retryCount?: number = 3;

  @ApiProperty({ description: 'Retry interval in seconds', default: 60 })
  @IsInt()
  @Min(10)
  @Max(3600)
  @IsOptional()
  retryInterval?: number = 60;

  @ApiProperty({ description: 'Allowed IP addresses', type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedIpAddresses?: string[] = [];

  @ApiProperty({ description: 'Whether this webhook is a template', default: false })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean = false;
} 
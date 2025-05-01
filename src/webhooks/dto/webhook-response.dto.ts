import { ApiProperty } from '@nestjs/swagger';
import { WebhookAuthType, WebhookEventType } from '@prisma/client';
import { Exclude, Expose, Transform } from 'class-transformer';

export class WebhookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  formId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? '******' : null)
  secretKey: string;

  // User tracking & permissions
  @ApiProperty({ required: false })
  createdById: string;

  @ApiProperty()
  adminApproved: boolean;

  @ApiProperty({ required: false })
  adminNotes: string;

  // Authentication
  @ApiProperty()
  authType: WebhookAuthType;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? '******' : null)
  authValue: string;

  // Security enhancements
  @ApiProperty()
  allowedIpAddresses: string[];

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? '******' : null)
  verificationToken: string;

  // Configuration
  @ApiProperty({ isArray: true })
  eventTypes: WebhookEventType[];

  @ApiProperty({ required: false })
  @Transform(({ value }) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  headers: any;

  @ApiProperty({ isArray: true })
  includeFields: string[];

  @ApiProperty({ isArray: true })
  excludeFields: string[];

  // Delivery settings
  @ApiProperty()
  retryCount: number;

  @ApiProperty()
  retryInterval: number;

  // Rate limiting & quotas
  @ApiProperty({ required: false })
  dailyLimit: number;

  @ApiProperty()
  dailyUsage: number;

  @ApiProperty({ required: false })
  dailyResetAt: Date;

  // Filter conditions
  @ApiProperty({ required: false })
  @Transform(({ value }) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  filterConditions: any;

  // Template support
  @ApiProperty()
  isTemplate: boolean;

  @ApiProperty({ required: false })
  templateId: string;

  constructor(partial: Partial<WebhookResponseDto>) {
    Object.assign(this, partial);
  }
} 
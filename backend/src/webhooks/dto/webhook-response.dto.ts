import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ type: Boolean, description: 'Whether a secret key is set' })
  secretKeySet: boolean;

  @ApiProperty({ required: false })
  authType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether an auth value is set' })
  authValueSet: boolean;

  @ApiProperty({ type: [String] })
  eventTypes: string[];

  @ApiProperty({ type: [String] })
  includeFields: string[];

  @ApiProperty({ type: [String] })
  excludeFields: string[];

  @ApiProperty()
  retryCount: number;

  @ApiProperty()
  retryInterval: number;

  @ApiProperty({ type: [String] })
  allowedIpAddresses: string[];

  @ApiProperty({ required: false })
  isTemplate?: boolean;

  @ApiProperty({ required: false })
  adminApproved?: boolean;

  @ApiProperty({ required: false })
  createdById?: string;
} 
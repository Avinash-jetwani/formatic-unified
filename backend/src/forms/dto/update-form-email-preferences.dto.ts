import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFormEmailPreferencesDto {
  @ApiProperty({ description: 'Email notifications for new form submissions', required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ description: 'Webhook notifications for this form', required: false })
  @IsOptional()
  @IsBoolean()
  webhookNotificationsEnabled?: boolean;

  @ApiProperty({ description: 'Form analytics reports (weekly/monthly)', required: false })
  @IsOptional()
  @IsBoolean()
  formAnalyticsReports?: boolean;

  @ApiProperty({ description: 'Security alerts for this form (spam detection, etc.)', required: false })
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;
} 
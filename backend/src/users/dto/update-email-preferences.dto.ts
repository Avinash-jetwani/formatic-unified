import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailPreferencesDto {
  @ApiProperty({ description: 'Master toggle for all email notifications', required: false })
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @ApiProperty({ description: 'Security notifications (login attempts, password changes)', required: false })
  @IsOptional()
  @IsBoolean()
  securityNotifications?: boolean;

  @ApiProperty({ description: 'Account updates (profile changes, subscription changes)', required: false })
  @IsOptional()
  @IsBoolean()
  accountUpdates?: boolean;

  @ApiProperty({ description: 'All webhook-related emails', required: false })
  @IsOptional()
  @IsBoolean()
  webhookNotifications?: boolean;

  @ApiProperty({ description: 'Product announcements and updates', required: false })
  @IsOptional()
  @IsBoolean()
  productUpdates?: boolean;

  @ApiProperty({ description: 'Marketing communications', required: false })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiProperty({ description: 'Weekly activity summaries', required: false })
  @IsOptional()
  @IsBoolean()
  weeklyReports?: boolean;
} 
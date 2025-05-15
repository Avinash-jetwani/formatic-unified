import { IsBoolean, IsOptional, IsString, IsArray, IsDateString, IsInt, Min, IsEmail, IsIn } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFormDto } from './create-form.dto';

export class UpdateFormDto extends PartialType(CreateFormDto) {
  @IsOptional()
  @IsString()
  submissionMessage?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  successRedirectUrl?: string;

  @IsOptional()
  @IsBoolean()
  multiPageEnabled?: boolean;
  
  // New fields
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxSubmissions?: number;

  @IsBoolean()
  @IsOptional()
  requireConsent?: boolean;

  @IsString()
  @IsOptional()
  consentText?: string;

  @IsString()
  @IsIn(['none', 'email', 'password'])
  @IsOptional()
  accessRestriction?: string;

  @IsString()
  @IsOptional()
  accessPassword?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  allowedEmails?: string[];

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  notificationEmails?: string[];

  @IsString()
  @IsIn(['all', 'digest'])
  @IsOptional()
  notificationType?: string;
}
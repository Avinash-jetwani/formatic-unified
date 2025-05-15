import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, IsDateString, IsInt, Min, IsEmail, IsIn } from 'class-validator';

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
  
  @IsString()
  @IsOptional()
  submissionMessage?: string;
  
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
  
  @IsString()
  @IsOptional()
  category?: string;
  
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;
  
  @IsUrl()
  @IsOptional()
  successRedirectUrl?: string;
  
  @IsBoolean()
  @IsOptional()
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
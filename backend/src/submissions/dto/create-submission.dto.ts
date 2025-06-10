import { IsNotEmpty, IsObject, IsString, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  formId: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
  
  // Analytics data
  @IsOptional()
  @IsString()
  ipAddress?: string;
  
  @IsOptional()
  @IsString()
  userAgent?: string;
  
  @IsOptional()
  @IsString()
  referrer?: string;
  
  @IsOptional()
  @IsString()
  browser?: string;
  
  @IsOptional()
  @IsString()
  device?: string;
  
  @IsOptional()
  @IsObject()
  location?: {
    country?: string;
    city?: string;
  };
  
  @IsOptional()
  @IsString()
  timezone?: string;
}
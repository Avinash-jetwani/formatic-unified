import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

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
}
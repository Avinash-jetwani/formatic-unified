import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';
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
}
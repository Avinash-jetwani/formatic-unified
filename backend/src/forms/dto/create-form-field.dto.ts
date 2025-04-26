import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { FieldType } from '@prisma/client';

export class CreateFormFieldDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsEnum(FieldType)
  @IsNotEmpty()
  type: FieldType;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean = false;

  @IsNumber()
  @IsNotEmpty()
  order: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[] = [];

  // ← new: any type‑specific config, e.g. { maxChars: 5000 } or { min:0, max:100, step:1 }
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
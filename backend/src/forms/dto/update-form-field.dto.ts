import { IsArray, IsBoolean, IsEnum, IsJSON, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { FieldType } from '@prisma/client';

export class UpdateFormFieldDto {
  @IsEnum(FieldType)
  @IsOptional()
  type?: FieldType;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsJSON()
  @IsOptional()
  config?: string;
  
  @IsObject()
  @IsOptional()
  conditions?: {
    logicOperator?: 'AND' | 'OR';
    rules?: {
      fieldId: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
      value: any;
    }[];
  };
}
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
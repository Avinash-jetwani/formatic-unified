import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
  
  @IsString()
  @IsOptional()
  company?: string;
  
  @IsString()
  @IsOptional()
  phone?: string;
  
  @IsString()
  @IsOptional()
  website?: string;
}
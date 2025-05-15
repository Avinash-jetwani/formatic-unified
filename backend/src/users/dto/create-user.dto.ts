import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  company?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  website?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
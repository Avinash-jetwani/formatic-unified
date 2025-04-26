import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  formId: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
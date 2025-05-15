import { IsString, IsOptional, IsEnum } from 'class-validator';

enum SubmissionStatus {
  NEW = 'new',
  VIEWED = 'viewed',
  ARCHIVED = 'archived'
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  notesUpdatedAt?: string;

  @IsOptional()
  tags?: string[];
} 
import { IsOptional, IsString } from 'class-validator';

export class AnalyzeResumeDto {
  @IsString()
  jobDescription!: string;

  @IsOptional()
  @IsString()
  analysisId?: string;
}

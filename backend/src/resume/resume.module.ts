import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { ResumeAnalysis } from './entities/resume-analysis.entity';
import { AiModule } from '../ai/ai.module';
import { AutoOptimizeModule } from '../auto-optimize/auto-optimize.module';
import { PdfModule } from '../pdf/pdf.module';
import { ResumeBudgetService } from '../budget/resume-budget.service';
import { InterviewAiService } from '../interview/interview-ai.service';
import { History } from '../history/entities/history.entity';
import { UsersModule } from '../user/user.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResumeAnalysis]),
    AiModule,
    AutoOptimizeModule,
    PdfModule,
    UsersModule,
    HistoryModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeBudgetService, InterviewAiService],
})
export class ResumeModule {}

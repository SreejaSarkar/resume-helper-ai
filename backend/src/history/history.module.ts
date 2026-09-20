import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from './entities/history.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { UsersModule } from '../user/user.module';
import { ResumeAnalysis } from '../resume/entities/resume-analysis.entity';
import { ATSAnalysis } from '../ats/ats.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([History, ResumeAnalysis, ATSAnalysis]),
    UsersModule,
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}

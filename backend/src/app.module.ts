import { Module } from '@nestjs/common';
import { ResumeModule } from './resume/resume.module';
import { DatabaseModule } from './database/database.module';
import { HistoryModule } from './history/history.module';
import { UsersModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AtsModule } from './ats/ats.module';

@Module({
  imports: [
    DatabaseModule,
    ResumeModule,
    HistoryModule,
    UsersModule,
    AdminModule,
    FeedbackModule,
    AtsModule,
  ],
})
export class AppModule {}

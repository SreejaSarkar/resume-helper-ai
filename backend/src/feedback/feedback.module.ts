import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './feedback.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { UsersModule } from '../user/user.module';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, User]), UsersModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}

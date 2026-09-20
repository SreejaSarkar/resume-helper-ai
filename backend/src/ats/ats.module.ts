import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtsService } from './ats.service';
import { ATSAnalysis } from './ats.entity';
import { AtsController } from './ats.controller';
import { History } from '../history/entities/history.entity';
import { HistoryModule } from '../history/history.module';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ATSAnalysis]),
    HistoryModule,
    UsersModule,
  ],
  providers: [AtsService],
  controllers: [AtsController],
  exports: [AtsService],
})
export class AtsModule {}

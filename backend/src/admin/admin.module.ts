import { Module } from '@nestjs/common';
import { UsersModule } from '../user/user.module';
import { HistoryModule } from '../history/history.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, HistoryModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

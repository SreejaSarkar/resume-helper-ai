import { Controller, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthRequest } from '../auth/auth.types';

@UseGuards(FirebaseAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  get(@Req() req: AuthRequest) {
    const userId = req.user.uid;
    return this.historyService.getUserHistory(userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user.uid;
    return this.historyService.delete(id, userId);
  }
}

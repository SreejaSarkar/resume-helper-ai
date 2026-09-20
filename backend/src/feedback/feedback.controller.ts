import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AuthRequest } from '../auth/auth.types';

@UseGuards(FirebaseAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  submit(@Req() req: AuthRequest, @Body() body: any) {
    return this.service.create(req.user.uid, body);
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Get('admin/:userId')
  getUserFeedback(@Param('userId') userId: string) {
    return this.service.getUserFeedback(userId);
  }
}

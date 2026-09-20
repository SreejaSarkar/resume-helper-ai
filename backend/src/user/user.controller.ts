import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthRequest } from '../auth/auth.types';
import { UserService } from './user.service';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@Req() req: AuthRequest) {
    return this.userService.getProfile(req.user.uid);
  }
}

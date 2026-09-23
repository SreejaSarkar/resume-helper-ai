import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthRequest } from '../auth/auth.types';
import { UserService } from './user.service';
import { normalizeUserRole } from './user.entity';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: AuthRequest) {
    const user = await this.userService.getProfile(req.user.uid);

    if (!user) {
      return user;
    }

    return {
      ...user,
      role: normalizeUserRole(user.role),
    };
  }
}

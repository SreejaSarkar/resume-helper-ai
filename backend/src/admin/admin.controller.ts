import { Controller, Get, Req, Patch, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { AuthRequest } from '../auth/auth.types';

@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsersWithFeedbackCount();
  }

  @Patch('users/:id/suspend')
  toggleSuspend(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.adminService.toggleSuspend(id, req.user);
  }

  @Patch('users/:id/role')
  toggleRole(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.adminService.toggleRole(id, req.user);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}

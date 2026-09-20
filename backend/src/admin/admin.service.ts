import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HistoryService } from '../history/history.service';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.entity';

export interface CurrentUser {
  uid: string;
  email?: string;
  name?: string;
  role?: UserRole;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly historyService: HistoryService,
  ) {}

  async getAllUsers(search?: string) {
    return this.userService.searchUsers(search);
  }

  async toggleSuspend(targetUserId: string, actor: CurrentUser) {
    const target = await this.userService.findById(targetUserId);

    if (!target) throw new NotFoundException('User not found');

    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot suspend super admin');
    }

    if (target.role === UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can suspend admins');
    }

    return this.userService.toggleSuspend(targetUserId);
  }

  async toggleRole(targetUserId: string, actor: CurrentUser) {
    const target = await this.userService.findById(targetUserId);

    if (!target) throw new NotFoundException('User not found');

    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify super admin role');
    }

    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can change roles');
    }

    return this.userService.toggleRole(targetUserId);
  }

  async getStats() {
    return this.historyService.getPlatformStats();
  }

  async getUsersWithFeedbackCount() {
    return this.userService.getUsersWithFeedbackCount();
  }
}

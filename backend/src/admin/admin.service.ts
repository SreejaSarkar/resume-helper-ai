import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HistoryService } from '../history/history.service';
import { UserService } from '../user/user.service';
import { UserRole, isAdminRole } from '../user/user.entity';

export interface CurrentUser {
  uid: string;
  email?: string;
  name?: string;
  role?: UserRole;
}

type AdminUserFilters = {
  search?: string;
  role?: string;
  status?: string;
  sort?: string;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly historyService: HistoryService,
  ) {}

  async getAllUsers(search?: string) {
    return this.userService.searchUsers(search);
  }

  async getDashboard(filters: AdminUserFilters = {}) {
    const [overview, activity, users] = await Promise.all([
      this.userService.getAdminOverview(),
      this.historyService.getPlatformStats(),
      this.userService.getAdminUsers(filters),
    ]);

    return {
      overview,
      activity,
      users,
      filters,
    };
  }

  async toggleSuspend(targetUserId: string, actor: CurrentUser) {
    const target = await this.userService.findById(targetUserId);
    const actorUser = await this.userService.findByFirebaseUid(actor.uid);

    if (!target) throw new NotFoundException('User not found');

    if (!isAdminRole(actor.role)) {
      throw new ForbiddenException('Admin access only');
    }

    if (actorUser?.id === targetUserId) {
      throw new ForbiddenException('You cannot suspend your own account');
    }

    return this.userService.toggleSuspend(targetUserId);
  }

  async toggleRole(targetUserId: string, actor: CurrentUser) {
    const target = await this.userService.findById(targetUserId);

    if (!target) throw new NotFoundException('User not found');

    if (!isAdminRole(actor.role)) {
      throw new ForbiddenException('Admin access only');
    }

    return this.userService.toggleRole(targetUserId);
  }

  async getStats() {
    const [overview, activity] = await Promise.all([
      this.userService.getAdminOverview(),
      this.historyService.getPlatformStats(),
    ]);

    return {
      overview,
      activity,
    };
  }

  async getUsersWithFeedbackCount(filters: AdminUserFilters = {}) {
    return this.userService.getAdminUsers(filters);
  }
}

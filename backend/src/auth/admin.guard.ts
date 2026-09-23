import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthRequest } from './auth.types';
import { isAdminRole } from '../user/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();

    if (!isAdminRole(req.user?.role)) {
      throw new ForbiddenException('Admin access only');
    }

    return true;
  }
}

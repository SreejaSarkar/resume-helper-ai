import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthRequest } from './auth.types';
import { UserRole } from '../user/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();

    if (req.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access only');
    }

    return true;
  }
}

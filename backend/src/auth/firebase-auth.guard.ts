import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { firebaseAdmin } from './firebase';
import { UserService } from '../user/user.service';
import { AuthRequest } from './auth.types';
import { normalizeUserRole } from '../user/user.entity';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing auth token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      const email =
        typeof decodedToken.email === 'string' ? decodedToken.email : undefined;
      const phoneNumber =
        typeof decodedToken.phone_number === 'string'
          ? decodedToken.phone_number
          : undefined;
      const name =
        typeof decodedToken.name === 'string' && decodedToken.name.length > 0
          ? decodedToken.name
          : (email ?? phoneNumber ?? decodedToken.uid);

      const dbUser = await this.userService.findOrCreate({
        uid: decodedToken.uid,
        email,
        name,
        phoneNumber,
      });

      if (dbUser.suspended === true) {
        throw new ForbiddenException('Your account has been suspended');
      }

      request.user = {
        uid: decodedToken.uid,
        email,
        name,
        phoneNumber,
        role: normalizeUserRole(dbUser.role),
      };

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }

      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}

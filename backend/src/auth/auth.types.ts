import { Request } from 'express';
import { UserRole } from '../user/user.entity';

export interface AuthRequest extends Request {
  user: {
    uid: string;
    email?: string;
    name?: string;
    phoneNumber?: string;
    role: UserRole;
  };
}

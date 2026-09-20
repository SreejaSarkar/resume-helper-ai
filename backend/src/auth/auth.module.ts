import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [UsersModule],
  providers: [FirebaseAuthGuard],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}

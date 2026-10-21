import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import { AuthGuard, AdminGuard } from './auth.guard.ts';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AdminGuard],
  exports: [AuthService, AuthGuard, AdminGuard],
})
export class AuthModule {}

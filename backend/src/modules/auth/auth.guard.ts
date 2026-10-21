import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service.ts';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = this.auth.userFromRequest(req);
    if (!user) throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục.');
    req.user = user;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = this.auth.userFromRequest(req);
    if (!user) throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục.');
    if (user.role !== 'admin') throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    req.user = user;
    return true;
  }
}

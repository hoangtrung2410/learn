import { Controller, Post, Get, Body, Inject, Req, UseGuards } from '@nestjs/common';
import { AuthService, toPublicUser } from './auth.service.ts';
import { AuthGuard } from './auth.guard.ts';

const ipOf = (req: any): string => req.ip || req.socket?.remoteAddress || 'unknown';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: any, @Req() req: any) {
    return this.auth.register(body, ipOf(req));
  }

  @Post('login')
  login(@Body() body: any, @Req() req: any) {
    return this.auth.login(body, ipOf(req));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: any) {
    return { user: toPublicUser(req.user) };
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  changePassword(@Body() body: any, @Req() req: any) {
    return this.auth.changePassword(req.user, body);
  }
}

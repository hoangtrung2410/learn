import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { AuthService } from './auth.service.ts';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() body: { username?: string; password?: string }) {
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: { username?: string; password?: string; name?: string; email?: string }) {
    return this.authService.register(body);
  }

  @Post('google')
  async loginWithGoogle(@Body() body: { email?: string; name?: string; avatar?: string }) {
    return this.authService.loginWithGoogle(body);
  }

  @Post('guest')
  async guestLogin() {
    return this.authService.guestLogin();
  }

  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}

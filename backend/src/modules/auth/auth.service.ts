import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'user' | 'guest';
  avatar: string;
  isSuperAdmin: boolean;
  provider: 'local' | 'google' | 'guest';
  createdAt: number;
}

@Injectable()
export class AuthService {
  // Pre-seeded users in memory database
  private users: Map<string, { user: AuthUser; passwordHash?: string }> = new Map();

  constructor() {
    // Seed requested Super Admin account
    this.seedSuperAdmin();
  }

  private seedSuperAdmin() {
    const superAdminUser: AuthUser = {
      id: 'usr-superadmin-01',
      username: 'hoangyen040221',
      name: 'Hoàng Yến (Super Admin)',
      email: 'hoangyen040221@linguapulse.edu.vn',
      role: 'superadmin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isSuperAdmin: true,
      provider: 'local',
      createdAt: Date.now(),
    };

    this.users.set('hoangyen040221', {
      user: superAdminUser,
      passwordHash: 'hoangyen040221', // Plaintext check for demo / test account as requested
    });

    // Also seed a default demo student
    const studentUser: AuthUser = {
      id: 'usr-student-01',
      username: 'hocvien_demo',
      name: 'Nguyễn Văn Minh (Học viên)',
      email: 'minh.student@gmail.com',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      isSuperAdmin: false,
      provider: 'local',
      createdAt: Date.now(),
    };

    this.users.set('hocvien_demo', {
      user: studentUser,
      passwordHash: '123456',
    });
  }

  async login(body: { username?: string; password?: string }) {
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    if (!username || !password) {
      throw new BadRequestException('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }

    const record = this.users.get(username);
    if (!record || record.passwordHash !== password) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    return {
      success: true,
      user: record.user,
      token: `lp-jwt-${record.user.id}-${Date.now()}`,
      message: record.user.role === 'superadmin' ? 'Chào mừng Super Admin Hoàng Yến!' : 'Đăng nhập thành công!',
    };
  }

  async register(body: { username?: string; password?: string; name?: string; email?: string }) {
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';
    const name = (body.name || '').trim() || username;
    const email = (body.email || '').trim().toLowerCase();

    if (!username || !password) {
      throw new BadRequestException('Tên đăng nhập và mật khẩu không được để trống.');
    }

    if (username.length < 3) {
      throw new BadRequestException('Tên đăng nhập phải có ít nhất 3 ký tự.');
    }

    if (this.users.has(username)) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại trong hệ thống.');
    }

    const newUser: AuthUser = {
      id: 'usr-' + Date.now(),
      username,
      name,
      email: email || `${username}@user.linguapulse.edu.vn`,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      isSuperAdmin: false,
      provider: 'local',
      createdAt: Date.now(),
    };

    this.users.set(username, {
      user: newUser,
      passwordHash: password,
    });

    return {
      success: true,
      user: newUser,
      token: `lp-jwt-${newUser.id}-${Date.now()}`,
      message: 'Đăng ký tài khoản mới thành công!',
    };
  }

  async loginWithGoogle(body: { email?: string; name?: string; avatar?: string }) {
    const email = (body.email || 'user.google@gmail.com').trim().toLowerCase();
    const name = body.name || 'Người dùng Google';
    const avatar = body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

    // If Google user has hoangyen email or username
    const isSuperAdminEmail = email.includes('hoangyen040221');
    const existingUsername = email.split('@')[0];

    let user: AuthUser;
    if (this.users.has(existingUsername)) {
      user = this.users.get(existingUsername)!.user;
    } else {
      user = {
        id: 'usr-google-' + Date.now(),
        username: existingUsername,
        name,
        email,
        role: isSuperAdminEmail ? 'superadmin' : 'user',
        avatar,
        isSuperAdmin: isSuperAdminEmail,
        provider: 'google',
        createdAt: Date.now(),
      };
      this.users.set(existingUsername, { user });
    }

    return {
      success: true,
      user,
      token: `lp-jwt-google-${user.id}-${Date.now()}`,
      message: 'Đăng nhập Google thành công!',
    };
  }

  async guestLogin() {
    const guestUser: AuthUser = {
      id: 'usr-guest-' + Math.floor(Math.random() * 10000),
      username: 'guest_' + Math.floor(Math.random() * 1000),
      name: 'Khách Học Thử',
      role: 'guest',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      isSuperAdmin: false,
      provider: 'guest',
      createdAt: Date.now(),
    };

    return {
      success: true,
      user: guestUser,
      token: `lp-jwt-guest-${guestUser.id}`,
      message: 'Chào mừng bạn trải nghiệm chế độ Khách!',
    };
  }

  async getAllUsers() {
    return Array.from(this.users.values()).map((r) => r.user);
  }
}

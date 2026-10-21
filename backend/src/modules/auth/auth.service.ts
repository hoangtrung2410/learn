import { Inject, Injectable, UnauthorizedException, BadRequestException, ForbiddenException, HttpException } from '@nestjs/common';
import { DbService } from '../db/db.service.ts';
import { config } from '../../common/config.ts';
import crypto from 'crypto';
import { hashPassword, verifyPassword, signToken, verifyToken, AttemptLimiter } from '../../common/security.ts';

// Dấu vân tay mật khẩu: đổi/đặt lại mật khẩu thì mọi token cũ mất hiệu lực.
const pwFingerprint = (hash: string) => crypto.createHash('sha256').update(hash).digest('hex').slice(0, 12);
// Băm giả để thời gian phản hồi như nhau dù tài khoản có tồn tại hay không.
const DUMMY_HASH = hashPassword('khong-phai-mat-khau-that');

export interface DbUser {
  id: number;
  username: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'user';
  disabled: number;
  created_at: number;
}

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar: string;
  isSuperAdmin: boolean;
  provider: 'local';
  createdAt: number;
}

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const toPublicUser = (u: DbUser): PublicUser => ({
  id: String(u.id),
  username: u.username,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`,
  isSuperAdmin: u.role === 'admin',
  provider: 'local',
  createdAt: u.created_at,
});

@Injectable()
export class AuthService {
  private loginLimiter = new AttemptLimiter(8, 15 * 60 * 1000);
  private registerLimiter = new AttemptLimiter(20, 60 * 60 * 1000);

  constructor(@Inject(DbService) private readonly db: DbService) {}

  private issue(user: DbUser) {
    const token = signToken({ sub: user.id, role: user.role, pv: pwFingerprint(user.password_hash) }, this.db.jwtSecret, config.tokenTtlDays() * 86400);
    return { success: true, user: toPublicUser(user), token };
  }

  /** Trả user từ header Authorization: Bearer ... hoặc null. */
  userFromRequest(req: any): DbUser | null {
    const h: string = req.headers?.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return null;
    const payload = verifyToken(m[1], this.db.jwtSecret);
    if (!payload) return null;
    const user = this.db.get<DbUser>('SELECT * FROM users WHERE id = ?', payload.sub);
    if (!user || user.disabled) return null;
    if (payload.pv !== pwFingerprint(user.password_hash)) return null;
    return user;
  }

  async register(body: any, ip: string) {
    if (this.registerLimiter.isBlocked(ip)) throw new HttpException('Bạn tạo tài khoản quá nhiều lần. Vui lòng thử lại sau.', 429);
    const username = String(body?.username ?? '').trim().toLowerCase();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const name = String(body?.name ?? '').trim() || username;

    if (!USERNAME_RE.test(username)) throw new BadRequestException('Tên đăng nhập gồm 3-30 ký tự: chữ thường, số, dấu . _ -');
    if (!EMAIL_RE.test(email) || email.length > 120) throw new BadRequestException('Email không hợp lệ.');
    if (password.length < 8) throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự.');
    if (password.length > 128) throw new BadRequestException('Mật khẩu quá dài (tối đa 128 ký tự).');
    if (name.length > 60) throw new BadRequestException('Họ tên quá dài (tối đa 60 ký tự).');

    if (this.db.get('SELECT 1 FROM users WHERE username = ?', username)) throw new BadRequestException('Tên đăng nhập đã tồn tại.');
    if (this.db.get('SELECT 1 FROM users WHERE email = ?', email)) throw new BadRequestException('Email này đã được đăng ký.');

    this.registerLimiter.fail(ip);
    const r = this.db.run(
      `INSERT INTO users (username, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)`,
      username, email, name, hashPassword(password), Date.now(),
    );
    const user = this.db.get<DbUser>('SELECT * FROM users WHERE id = ?', r.lastInsertRowid)!;
    return { ...this.issue(user), message: 'Đăng ký tài khoản thành công!' };
  }

  async login(body: any, ip: string) {
    const ident = String(body?.username ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    if (!ident || !password) throw new BadRequestException('Vui lòng nhập tên đăng nhập và mật khẩu.');

    const key = `${ip}|${ident}`;
    if (this.loginLimiter.isBlocked(key)) throw new HttpException('Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429);

    const user = this.db.get<DbUser>('SELECT * FROM users WHERE username = ? OR email = ?', ident, ident);
    // Luôn chạy verify để thời gian phản hồi không lộ tài khoản có tồn tại hay không.
    const ok = verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) {
      this.loginLimiter.fail(key);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
    if (user.disabled) throw new ForbiddenException('Tài khoản đã bị khoá. Vui lòng liên hệ hỗ trợ.');
    this.loginLimiter.reset(key);
    return { ...this.issue(user), message: user.role === 'admin' ? 'Chào mừng quản trị viên!' : 'Đăng nhập thành công!' };
  }

  async changePassword(user: DbUser, body: any) {
    const current = String(body?.currentPassword ?? '');
    const next = String(body?.newPassword ?? '');
    if (!verifyPassword(current, user.password_hash)) throw new BadRequestException('Mật khẩu hiện tại không đúng.');
    if (next.length < 8 || next.length > 128) throw new BadRequestException('Mật khẩu mới phải từ 8 đến 128 ký tự.');
    this.db.run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(next), user.id);
    const fresh = this.db.get<DbUser>('SELECT * FROM users WHERE id = ?', user.id)!;
    return { ...this.issue(fresh), message: 'Đã đổi mật khẩu.' };
  }
}

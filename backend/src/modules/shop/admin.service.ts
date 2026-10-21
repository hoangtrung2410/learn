import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { DbService } from '../db/db.service.ts';
import { EntitlementsService } from './entitlements.service.ts';
import { CatalogService } from './catalog.service.ts';
import { hashPassword } from '../../common/security.ts';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DbService) private readonly db: DbService,
    @Inject(EntitlementsService) private readonly ents: EntitlementsService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  stats() {
    const now = Date.now();
    const rev = (since: number) =>
      this.db.get<{ s: number | null }>(`SELECT SUM(amount) AS s FROM orders WHERE status = 'paid' AND paid_at >= ?`, since)?.s ?? 0;
    const byStatus = this.db.all<{ status: string; n: number }>('SELECT status, COUNT(*) AS n FROM orders GROUP BY status');
    const daily = this.db.all<{ d: string; revenue: number; orders: number }>(
      `SELECT strftime('%Y-%m-%d', (paid_at + 25200000) / 1000, 'unixepoch') AS d, SUM(amount) AS revenue, COUNT(*) AS orders
         FROM orders WHERE status = 'paid' AND paid_at >= ? GROUP BY d ORDER BY d`,
      now - 30 * 86400000,
    );
    const top = this.db.all(
      `SELECT p.id, p.name, COUNT(*) AS sold, SUM(o.amount) AS revenue FROM orders o JOIN products p ON p.id = o.product_id
        WHERE o.status = 'paid' GROUP BY p.id ORDER BY revenue DESC LIMIT 5`,
    );
    return {
      revenueTotal: rev(0),
      revenue30d: rev(now - 30 * 86400000),
      revenue7d: rev(now - 7 * 86400000),
      users: this.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'user'")!.n,
      activePremium: this.db.get<{ n: number }>(
        `SELECT COUNT(DISTINCT e.user_id) AS n FROM entitlements e JOIN products p ON p.id = e.product_id
          WHERE p.kind = 'plan' AND e.revoked = 0 AND e.starts_at <= ? AND (e.expires_at IS NULL OR e.expires_at > ?)`,
        now, now,
      )!.n,
      ordersByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r.n])),
      daily,
      topProducts: top,
    };
  }

  users(q: { q?: string; page?: number; pageSize?: number }) {
    const pageSize = Math.min(100, Math.max(1, q.pageSize || 20));
    const page = Math.max(1, q.page || 1);
    const like = `%${(q.q || '').trim()}%`;
    const total = this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users WHERE username LIKE ? OR email LIKE ? OR name LIKE ?', like, like, like)!.n;
    const rows = this.db.all<any>(
      `SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid') AS paid_orders,
              (SELECT COALESCE(SUM(amount), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid') AS spent
         FROM users u WHERE u.username LIKE ? OR u.email LIKE ? OR u.name LIKE ? ORDER BY u.id DESC LIMIT ? OFFSET ?`,
      like, like, like, pageSize, (page - 1) * pageSize,
    );
    const items = rows.map((u) => {
      const a = this.ents.access(u.id);
      return {
        id: String(u.id),
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        disabled: !!u.disabled,
        createdAt: u.created_at,
        paidOrders: u.paid_orders,
        spent: u.spent,
        tier: a.tier,
        entitlements: a.entitlements.map((e) => ({ id: e.id, productId: e.productId, name: e.name, expiresAt: e.expiresAt, source: e.source })),
      };
    });
    return { total, page, pageSize, items };
  }

  private user(id: number) {
    const u = this.db.get<any>('SELECT * FROM users WHERE id = ?', id);
    if (!u) throw new NotFoundException('Không tìm thấy người dùng.');
    return u;
  }

  grant(userId: number, body: any, adminId: number) {
    this.user(userId);
    const productId = String(body?.productId ?? '');
    if (!this.catalog.get(productId)) throw new BadRequestException('Sản phẩm không tồn tại.');
    const days = body?.days === undefined || body.days === '' || body.days === null ? undefined : Number(body.days);
    if (days !== undefined && (!Number.isInteger(days) || days < 1 || days > 3650)) throw new BadRequestException('Số ngày không hợp lệ (1-3650).');
    return this.ents.grant(userId, productId, { source: `admin-${adminId}`, days });
  }

  revoke(userId: number, entitlementId: number) {
    this.user(userId);
    const owned = this.db.get('SELECT 1 FROM entitlements WHERE id = ? AND user_id = ?', entitlementId, userId);
    if (!owned) throw new NotFoundException('Không tìm thấy quyền học.');
    this.ents.revoke(entitlementId);
    return { success: true };
  }

  setDisabled(userId: number, disabled: boolean, adminId: number) {
    const u = this.user(userId);
    if (u.id === adminId) throw new BadRequestException('Không thể tự khoá tài khoản của chính mình.');
    if (u.role === 'admin') throw new BadRequestException('Không thể khoá tài khoản quản trị.');
    this.db.run('UPDATE users SET disabled = ? WHERE id = ?', disabled ? 1 : 0, userId);
    return { success: true, disabled };
  }

  resetPassword(userId: number) {
    this.user(userId);
    const temp = crypto.randomBytes(9).toString('base64url');
    this.db.run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(temp), userId);
    return { success: true, temporaryPassword: temp };
  }
}

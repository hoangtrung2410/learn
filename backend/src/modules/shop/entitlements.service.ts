import { Inject, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service.ts';
import { config } from '../../common/config.ts';
import { FREE_SCOPES } from '../db/catalog.ts';

export type Tier = 'free' | 'paid' | 'premium';

export interface ActiveEntitlement {
  id: number;
  productId: string;
  name: string;
  kind: 'plan' | 'course';
  scopes: string[];
  startsAt: number;
  expiresAt: number | null;
  source: string;
}

const DAY = 86400000;

@Injectable()
export class EntitlementsService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  active(userId: number, now = Date.now()): ActiveEntitlement[] {
    const rows = this.db.all(
      `SELECT e.id, e.product_id, e.starts_at, e.expires_at, e.source, p.name, p.kind, p.scopes
         FROM entitlements e JOIN products p ON p.id = e.product_id
        WHERE e.user_id = ? AND e.revoked = 0 AND e.starts_at <= ? AND (e.expires_at IS NULL OR e.expires_at > ?)
        ORDER BY e.id DESC`,
      userId, now, now,
    );
    return rows.map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      name: r.name,
      kind: r.kind,
      scopes: JSON.parse(r.scopes),
      startsAt: r.starts_at,
      expiresAt: r.expires_at,
      source: r.source,
    }));
  }

  access(userId: number) {
    const list = this.active(userId);
    const scopes = new Set<string>(FREE_SCOPES);
    for (const e of list) e.scopes.forEach((s) => scopes.add(s));
    const tier: Tier = list.some((e) => e.kind === 'plan') ? 'premium' : list.length ? 'paid' : 'free';
    // Hạn gói Premium tính cả các lần gia hạn đã mua nhưng chưa tới kỳ bắt đầu.
    const until = this.db.get<{ m: number | null }>(
      `SELECT MAX(e.expires_at) AS m FROM entitlements e JOIN products p ON p.id = e.product_id
        WHERE e.user_id = ? AND p.kind = 'plan' AND e.revoked = 0 AND e.expires_at IS NOT NULL AND e.expires_at > ?`,
      userId, Date.now(),
    );
    return { scopes: [...scopes], entitlements: list, tier, planUntil: until?.m ?? null };
  }

  hasScope(userId: number, scope: string): boolean {
    return this.access(userId).scopes.includes(scope);
  }

  aiLimit(tier: Tier): number {
    const l = config.aiLimits();
    return tier === 'premium' ? l.premium : tier === 'paid' ? l.paid : l.free;
  }

  /** Cấp quyền. Gói có thời hạn mà đang còn hạn thì cộng dồn vào cuối kỳ hiện tại. */
  grant(userId: number, productId: string, opts: { orderId?: number; source?: string; days?: number } = {}) {
    const product = this.db.get<any>('SELECT * FROM products WHERE id = ?', productId);
    if (!product) throw new Error('Sản phẩm không tồn tại');
    const now = Date.now();
    const days = opts.days ?? product.duration_days;
    let expiresAt: number | null = null;
    let startsAt = now;
    if (days != null) {
      const last = this.db.get<{ m: number | null }>(
        `SELECT MAX(expires_at) AS m FROM entitlements WHERE user_id = ? AND product_id = ? AND revoked = 0 AND expires_at IS NOT NULL AND expires_at > ?`,
        userId, productId, now,
      );
      startsAt = Math.max(now, last?.m ?? 0);
      expiresAt = startsAt + days * DAY;
    }
    const r = this.db.run(
      `INSERT INTO entitlements (user_id, product_id, order_id, source, starts_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
      userId, productId, opts.orderId ?? null, opts.source ?? 'order', startsAt, expiresAt,
    );
    return { id: Number(r.lastInsertRowid), startsAt, expiresAt };
  }

  revokeByOrder(orderId: number) {
    this.db.run('UPDATE entitlements SET revoked = 1 WHERE order_id = ?', orderId);
  }

  revoke(id: number) {
    return this.db.run('UPDATE entitlements SET revoked = 1 WHERE id = ?', id).changes > 0;
  }

  /** Đã sở hữu vĩnh viễn sản phẩm này chưa? */
  ownsLifetime(userId: number, productId: string): boolean {
    return !!this.db.get(
      `SELECT 1 FROM entitlements WHERE user_id = ? AND product_id = ? AND revoked = 0 AND expires_at IS NULL`,
      userId, productId,
    );
  }

  // ---- Hạn mức AI theo ngày
  private day(): string {
    return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10); // theo giờ Việt Nam
  }

  usage(userId: number, kind: 'ai' | 'tts'): number {
    return this.db.get<{ count: number }>('SELECT count FROM ai_usage WHERE user_id = ? AND day = ? AND kind = ?', userId, this.day(), kind)?.count ?? 0;
  }

  /** Tăng bộ đếm nếu còn hạn mức. Trả về false nếu đã hết. */
  consume(userId: number, kind: 'ai' | 'tts', limit: number): boolean {
    return this.db.tx(() => {
      const used = this.usage(userId, kind);
      if (used >= limit) return false;
      this.db.run(
        `INSERT INTO ai_usage (user_id, day, kind, count) VALUES (?, ?, ?, 1)
         ON CONFLICT(user_id, day, kind) DO UPDATE SET count = count + 1`,
        userId, this.day(), kind,
      );
      return true;
    });
  }
}

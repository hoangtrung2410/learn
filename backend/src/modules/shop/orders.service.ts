import { Inject, Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../db/db.service.ts';
import { CatalogService } from './catalog.service.ts';
import { CouponsService } from './coupons.service.ts';
import { EntitlementsService } from './entitlements.service.ts';
import { PaymentsService } from './payments.service.ts';
import { randomCode } from '../../common/security.ts';
import type { DbUser } from '../auth/auth.service.ts';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';
const PENDING_TTL = 24 * 3600 * 1000;

export interface OrderView {
  code: string;
  productId: string;
  productName: string;
  listAmount: number;
  discount: number;
  amount: number;
  couponCode: string | null;
  status: OrderStatus;
  provider: string;
  createdAt: number;
  paidAt: number | null;
  userId?: string;
  username?: string;
  email?: string;
  note?: string | null;
}

const view = (r: any): OrderView => ({
  code: r.code,
  productId: r.product_id,
  productName: r.product_name,
  listAmount: r.list_amount,
  discount: r.discount,
  amount: r.amount,
  couponCode: r.coupon_code,
  status: r.status,
  provider: r.provider,
  createdAt: r.created_at,
  paidAt: r.paid_at,
  userId: r.user_id != null ? String(r.user_id) : undefined,
  username: r.username,
  email: r.email,
  note: r.note,
});

const SELECT = `SELECT o.*, p.name AS product_name, u.username, u.email
                  FROM orders o JOIN products p ON p.id = o.product_id JOIN users u ON u.id = o.user_id`;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DbService) private readonly db: DbService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(CouponsService) private readonly coupons: CouponsService,
    @Inject(EntitlementsService) private readonly ents: EntitlementsService,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
  ) {}

  /** Đơn pending quá 24 giờ chuyển thành hết hạn. */
  private expireStale() {
    this.db.run(`UPDATE orders SET status = 'expired' WHERE status = 'pending' AND created_at < ?`, Date.now() - PENDING_TTL);
  }

  private row(code: string) {
    this.expireStale();
    return this.db.get(`${SELECT} WHERE o.code = ?`, code);
  }

  quote(productId: string, couponCode?: string) {
    const product = this.catalog.get(productId);
    if (!product || !product.active) throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng bán.');
    let discount = 0;
    let coupon: string | null = null;
    if (couponCode && String(couponCode).trim()) {
      const r = this.coupons.evaluate(couponCode, product.priceVnd);
      discount = r.discount;
      coupon = r.coupon.code;
    }
    const amount = product.priceVnd - discount;
    if (amount > 0 && amount < 5000) throw new BadRequestException('Số tiền thanh toán sau giảm giá phải từ 5.000đ trở lên (hoặc miễn phí).');
    return { product, listAmount: product.priceVnd, discount, amount, coupon };
  }

  async create(user: DbUser, body: any, ip: string) {
    const productId = String(body?.productId ?? '');
    const q = this.quote(productId, body?.coupon);
    if (q.product.durationDays == null && this.ents.ownsLifetime(user.id, productId)) {
      throw new BadRequestException('Bạn đã sở hữu khoá học này.');
    }
    const code = 'LP' + randomCode(8);
    const free = q.amount === 0;
    const provider = free ? 'free' : this.payments.provider();
    const r = this.db.run(
      `INSERT INTO orders (code, user_id, product_id, list_amount, discount, amount, coupon_code, status, provider, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      code, user.id, productId, q.listAmount, q.discount, q.amount, q.coupon, provider, Date.now(),
    );
    void r;

    if (free) {
      this.markPaid(code, { providerRef: 'free', amount: 0 });
      return { order: view(this.row(code)), payUrl: null };
    }
    const pay = this.payments.createPayment({ code, amount: q.amount }, ip);
    return { order: view(this.row(code)), payUrl: pay.payUrl };
  }

  /**
   * Xác nhận đơn đã thanh toán. An toàn khi gọi lặp (IPN + Return URL):
   * lần sau chỉ trả về trạng thái hiện có, không cấp quyền lần nữa.
   */
  markPaid(code: string, opts: { providerRef?: string; amount: number; source?: string }): { ok: boolean; reason?: string; alreadyPaid?: boolean } {
    return this.db.tx(() => {
      const o: any = this.db.get('SELECT * FROM orders WHERE code = ?', code);
      if (!o) return { ok: false, reason: 'not_found' };
      if (o.status === 'paid') return { ok: true, alreadyPaid: true };
      if (o.status === 'refunded') return { ok: false, reason: 'refunded' };
      if (o.amount !== opts.amount) return { ok: false, reason: 'amount_mismatch' };
      this.db.run(`UPDATE orders SET status = 'paid', paid_at = ?, provider_ref = ? WHERE code = ?`, Date.now(), opts.providerRef ?? null, code);
      this.ents.grant(o.user_id, o.product_id, { orderId: o.id, source: opts.source ?? 'order' });
      if (o.coupon_code) this.coupons.consume(o.coupon_code);
      return { ok: true };
    });
  }

  markFailed(code: string, ref?: string) {
    this.db.run(`UPDATE orders SET status = 'failed', provider_ref = COALESCE(?, provider_ref) WHERE code = ? AND status = 'pending'`, ref ?? null, code);
  }

  mine(user: DbUser): OrderView[] {
    this.expireStale();
    return this.db.all(`${SELECT} WHERE o.user_id = ? ORDER BY o.id DESC LIMIT 100`, user.id).map(view);
  }

  getFor(user: DbUser, code: string): OrderView {
    const r: any = this.row(code);
    if (!r || (r.user_id !== user.id && user.role !== 'admin')) throw new NotFoundException('Không tìm thấy đơn hàng.');
    return view(r);
  }

  raw(code: string): any {
    return this.row(code);
  }

  cancel(user: DbUser, code: string): OrderView {
    const r: any = this.row(code);
    if (!r || r.user_id !== user.id) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (r.status !== 'pending') throw new BadRequestException('Chỉ huỷ được đơn đang chờ thanh toán.');
    this.db.run(`UPDATE orders SET status = 'cancelled' WHERE code = ?`, code);
    return view(this.row(code));
  }

  // ---- Quản trị
  adminList(q: { status?: string; q?: string; page?: number; pageSize?: number }) {
    this.expireStale();
    const where: string[] = [];
    const params: any[] = [];
    if (q.status && q.status !== 'all') {
      where.push('o.status = ?');
      params.push(q.status);
    }
    if (q.q && q.q.trim()) {
      where.push('(o.code LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
      const like = `%${q.q.trim()}%`;
      params.push(like, like, like);
    }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const pageSize = Math.min(100, Math.max(1, q.pageSize || 20));
    const page = Math.max(1, q.page || 1);
    const total = this.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM orders o JOIN users u ON u.id = o.user_id ${w}`, ...params)!.n;
    const rows = this.db.all(`${SELECT} ${w} ORDER BY o.id DESC LIMIT ? OFFSET ?`, ...params, pageSize, (page - 1) * pageSize);
    return { total, page, pageSize, items: rows.map(view) };
  }

  adminMarkPaid(code: string, adminId: number) {
    const o: any = this.row(code);
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (o.status === 'paid') throw new BadRequestException('Đơn hàng đã được thanh toán.');
    if (o.status === 'refunded') throw new BadRequestException('Đơn đã hoàn tiền.');
    const r = this.markPaid(code, { providerRef: `manual-by-${adminId}`, amount: o.amount, source: 'manual' });
    if (!r.ok) throw new BadRequestException('Không thể xác nhận đơn: ' + r.reason);
    this.db.run('UPDATE orders SET note = ? WHERE code = ?', `Admin #${adminId} xác nhận thủ công`, code);
    return view(this.row(code));
  }

  adminRefund(code: string, adminId: number) {
    const o: any = this.row(code);
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (o.status !== 'paid') throw new BadRequestException('Chỉ hoàn tiền được đơn đã thanh toán.');
    this.db.tx(() => {
      this.db.run(`UPDATE orders SET status = 'refunded', note = ? WHERE code = ?`, `Admin #${adminId} hoàn tiền (thu hồi quyền học)`, code);
      this.ents.revokeByOrder(o.id);
    });
    return view(this.row(code));
  }

  assertOwner(user: DbUser, code: string) {
    const r: any = this.row(code);
    if (!r || r.user_id !== user.id) throw new ForbiddenException('Đơn hàng không thuộc về bạn.');
    return r;
  }
}

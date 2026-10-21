import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.ts';

export interface Coupon {
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: number | null;
  active: boolean;
  createdAt: number;
}

const map = (r: any): Coupon => ({
  code: r.code,
  percentOff: r.percent_off,
  amountOff: r.amount_off,
  maxUses: r.max_uses,
  usedCount: r.used_count,
  expiresAt: r.expires_at,
  active: !!r.active,
  createdAt: r.created_at,
});

@Injectable()
export class CouponsService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  normalize(code: unknown): string {
    return String(code ?? '').trim().toUpperCase();
  }

  /** Kiểm tra mã và tính số tiền giảm trên giá niêm yết. */
  evaluate(codeRaw: unknown, price: number): { coupon: Coupon; discount: number } {
    const code = this.normalize(codeRaw);
    const row = this.db.get('SELECT * FROM coupons WHERE code = ?', code);
    if (!row) throw new BadRequestException('Mã giảm giá không tồn tại.');
    const c = map(row);
    if (!c.active) throw new BadRequestException('Mã giảm giá đã bị vô hiệu.');
    if (c.expiresAt && c.expiresAt < Date.now()) throw new BadRequestException('Mã giảm giá đã hết hạn.');
    if (c.maxUses != null && c.usedCount >= c.maxUses) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng.');
    let discount = c.percentOff != null ? Math.floor((price * c.percentOff) / 100) : (c.amountOff ?? 0);
    discount = Math.max(0, Math.min(price, discount));
    return { coupon: c, discount };
  }

  consume(code: string): boolean {
    const r = this.db.run(
      `UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND (max_uses IS NULL OR used_count < max_uses)`,
      code,
    );
    return r.changes > 0;
  }

  list(): Coupon[] {
    return this.db.all('SELECT * FROM coupons ORDER BY created_at DESC').map(map);
  }

  create(body: any): Coupon {
    const code = this.normalize(body?.code);
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new BadRequestException('Mã gồm 3-24 ký tự: chữ, số, - hoặc _.');
    const percent = body.percentOff === '' || body.percentOff == null ? null : Number(body.percentOff);
    const amount = body.amountOff === '' || body.amountOff == null ? null : Number(body.amountOff);
    if ((percent == null) === (amount == null)) throw new BadRequestException('Chọn đúng một loại giảm: phần trăm hoặc số tiền.');
    if (percent != null && (!Number.isInteger(percent) || percent < 1 || percent > 100)) throw new BadRequestException('Phần trăm giảm phải từ 1 đến 100.');
    if (amount != null && (!Number.isInteger(amount) || amount < 1000)) throw new BadRequestException('Số tiền giảm tối thiểu 1.000đ.');
    const maxUses = body.maxUses === '' || body.maxUses == null ? null : Number(body.maxUses);
    if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) throw new BadRequestException('Số lượt dùng không hợp lệ.');
    const expiresAt = body.expiresAt ? Number(body.expiresAt) : null;
    if (this.db.get('SELECT 1 FROM coupons WHERE code = ?', code)) throw new BadRequestException('Mã này đã tồn tại.');
    this.db.run(
      `INSERT INTO coupons (code, percent_off, amount_off, max_uses, expires_at, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`,
      code, percent, amount, maxUses, expiresAt, Date.now(),
    );
    return map(this.db.get('SELECT * FROM coupons WHERE code = ?', code));
  }

  setActive(codeRaw: string, active: boolean): Coupon {
    const code = this.normalize(codeRaw);
    const r = this.db.run('UPDATE coupons SET active = ? WHERE code = ?', active ? 1 : 0, code);
    if (!r.changes) throw new NotFoundException('Không tìm thấy mã giảm giá.');
    return map(this.db.get('SELECT * FROM coupons WHERE code = ?', code));
  }
}

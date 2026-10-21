import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import crypto from 'crypto';
import { config } from '../../common/config.ts';

export interface PayableOrder {
  code: string;
  amount: number;
}

// VNPay yêu cầu sắp xếp khoá, mã hoá giá trị và đổi %20 thành '+'.
function vnpEncode(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
}

const vnpSign = (data: string, secret: string) => crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');

// Giờ Việt Nam (GMT+7) dạng yyyyMMddHHmmss.
function vnpDate(d: Date): string {
  const t = new Date(d.getTime() + 7 * 3600000).toISOString();
  return t.replace(/[-:T]/g, '').slice(0, 14);
}

@Injectable()
export class PaymentsService {
  provider(): 'mock' | 'vnpay' {
    const p = config.paymentProvider();
    return p === 'vnpay' ? 'vnpay' : 'mock';
  }

  mockEnabled(): boolean {
    return this.provider() === 'mock' && !config.isProd();
  }

  /** Tạo đường dẫn thanh toán cho đơn hàng. */
  createPayment(order: PayableOrder, ip: string): { provider: string; payUrl: string } {
    if (this.provider() === 'mock') {
      if (!this.mockEnabled()) throw new ServiceUnavailableException('Cổng thanh toán chưa được cấu hình.');
      return { provider: 'mock', payUrl: `${config.appUrl()}/?mockpay=${order.code}` };
    }
    const v = config.vnpay();
    if (!v.tmnCode || !v.hashSecret) throw new ServiceUnavailableException('Cổng thanh toán VNPay chưa được cấu hình.');
    const now = new Date();
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: v.tmnCode,
      vnp_Amount: String(order.amount * 100),
      vnp_CreateDate: vnpDate(now),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ip === '::1' ? '127.0.0.1' : ip.replace(/^::ffff:/, ''),
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: `${config.apiUrl()}/api/payments/vnpay/return`,
      vnp_TxnRef: order.code,
      vnp_ExpireDate: vnpDate(new Date(now.getTime() + 30 * 60000)),
    };
    const signData = vnpEncode(params);
    const hash = vnpSign(signData, v.hashSecret);
    return { provider: 'vnpay', payUrl: `${v.payUrl}?${signData}&vnp_SecureHash=${hash}` };
  }

  /** Kiểm tra chữ ký VNPay trên query trả về (Return URL hoặc IPN). */
  verifyVnpay(query: Record<string, any>): boolean {
    const v = config.vnpay();
    if (!v.hashSecret) return false;
    const given = String(query?.vnp_SecureHash ?? '');
    if (!given) return false;
    const params: Record<string, string> = {};
    for (const [k, val] of Object.entries(query)) {
      if (k === 'vnp_SecureHash' || k === 'vnp_SecureHashType') continue;
      if (!k.startsWith('vnp_')) continue;
      params[k] = String(Array.isArray(val) ? val[0] : val);
    }
    const expected = vnpSign(vnpEncode(params), v.hashSecret);
    const a = Buffer.from(expected, 'utf-8');
    const b = Buffer.from(given.toLowerCase(), 'utf-8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  /** Dùng trong test: ký 1 bộ tham số như VNPay sẽ làm. */
  signVnpayForTest(params: Record<string, string>): Record<string, string> {
    const v = config.vnpay();
    return { ...params, vnp_SecureHash: vnpSign(vnpEncode(params), v.hashSecret) };
  }

  assertMock() {
    if (!this.mockEnabled()) throw new BadRequestException('Cổng thanh toán thử nghiệm đang tắt.');
  }
}

import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Đọc env mỗi lần gọi để test có thể đổi cấu hình giữa các lần khởi tạo app.
export const config = {
  isProd: () => process.env.NODE_ENV === 'production',
  dbPath: () => process.env.DB_PATH || path.resolve(here, '../../data/linguapulse.db'),
  apiUrl: () => (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, ''),
  appUrl: () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, ''),
  jwtSecret: () => process.env.JWT_SECRET || '',
  tokenTtlDays: () => Number(process.env.TOKEN_TTL_DAYS || 30),
  adminUsername: () => (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase(),
  adminPassword: () => process.env.ADMIN_PASSWORD || '',
  adminEmail: () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  // mock = cổng thanh toán giả lập (chỉ để chạy thử); vnpay = VNPay thật/sandbox.
  paymentProvider: () => (process.env.PAYMENT_PROVIDER || (process.env.NODE_ENV === 'production' ? 'vnpay' : 'mock')).toLowerCase(),
  vnpay: () => ({
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    payUrl: process.env.VNPAY_PAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  }),
  // Hạn mức AI mỗi ngày (Gemini tốn tiền thật).
  aiLimits: () => ({
    free: Number(process.env.AI_LIMIT_FREE || 10),
    paid: Number(process.env.AI_LIMIT_PAID || 60),
    premium: Number(process.env.AI_LIMIT_PREMIUM || 300),
    tts: Number(process.env.TTS_LIMIT_DAILY || 300),
  }),
  supportEmail: () => process.env.SUPPORT_EMAIL || 'support@example.com',
  supportPhone: () => process.env.SUPPORT_PHONE || '',
};

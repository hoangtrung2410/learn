import crypto from 'crypto';

// ---- Mật khẩu: scrypt + salt ngẫu nhiên, so sánh hằng thời gian.
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [kind, saltHex, keyHex] = stored.split('$');
  if (kind !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// ---- Token dạng JWT HS256 tối giản (không cần thư viện ngoài).
const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function signToken(payload: Record<string, unknown>, secret: string, ttlSeconds: number): string {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string, secret: string): Record<string, any> | null {
  const parts = (token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const h = JSON.parse(Buffer.from(header, 'base64url').toString());
    if (h.alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- Giới hạn số lần thử (chống dò mật khẩu), lưu trong bộ nhớ.
export class AttemptLimiter {
  private hits = new Map<string, { count: number; first: number }>();
  constructor(private max: number, private windowMs: number) {}

  isBlocked(key: string): boolean {
    const h = this.hits.get(key);
    if (!h) return false;
    if (Date.now() - h.first > this.windowMs) {
      this.hits.delete(key);
      return false;
    }
    return h.count >= this.max;
  }
  fail(key: string) {
    const h = this.hits.get(key);
    if (!h || Date.now() - h.first > this.windowMs) this.hits.set(key, { count: 1, first: Date.now() });
    else h.count++;
  }
  reset(key: string) {
    this.hits.delete(key);
  }
}

export function randomCode(len: number, alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

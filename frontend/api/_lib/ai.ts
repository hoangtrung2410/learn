// Dùng chung cho các hàm AI chạy trên Vercel (bản miễn phí, không có backend riêng).
// Khoá Gemini chỉ nằm ở biến môi trường máy chủ GEMINI_API_KEY, không bao giờ gửi xuống trình duyệt.
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Hạn mức mỗi tài khoản mỗi ngày (quản trị viên không giới hạn). Có thể đổi bằng biến môi trường.
const LIMITS = {
  ai: Number(process.env.AI_LIMIT_FREE || 30),
  tts: Number(process.env.TTS_LIMIT_DAILY || 300),
};

let client: GoogleGenAI | null = null;
export const gemini = (): GoogleGenAI => {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return client;
};

const fail = (res: any, status: number, message: string) => res.status(status).json({ message });

/** Gọi Supabase bằng chính token của người dùng (RLS và auth.uid() áp dụng như ở trình duyệt). */
async function supabase(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

/**
 * Kiểm tra trước khi gọi Gemini: đúng phương thức, máy chủ đã cấu hình, người dùng đã đăng nhập và còn lượt.
 * Trả về body đã đọc; trả về null nếu đã tự trả lỗi cho trình duyệt.
 */
export async function guard(req: any, res: any, kind: 'ai' | 'tts' | 'none'): Promise<any | null> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Chỉ hỗ trợ POST.'), null;
  }
  if (!process.env.GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    return fail(res, 503, 'Máy chủ chưa cấu hình AI (thiếu GEMINI_API_KEY hoặc Supabase).'), null;
  }
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(res, 401, 'Vui lòng đăng nhập để dùng tính năng AI.'), null;

  const who = await supabase('/auth/v1/user', token);
  if (!who.ok) return fail(res, 401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'), null;

  if (kind !== 'none') {
    const r = await supabase('/rest/v1/rpc/consume_ai', token, {
      method: 'POST',
      body: JSON.stringify({ p_kind: kind, p_limit: LIMITS[kind] }),
    });
    if (!r.ok) return fail(res, 500, 'Không kiểm tra được lượt AI. Vui lòng thử lại.'), null;
    if ((await r.json()) !== true) {
      return fail(res, 429, kind === 'tts' ? 'Bạn đã dùng hết lượt giọng đọc AI hôm nay.' : `Bạn đã dùng hết ${LIMITS.ai} lượt AI hôm nay. Quay lại vào ngày mai nhé.`), null;
    }
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  return body;
}

/** Chạy một lời gọi Gemini với thời hạn; hết hạn thì huỷ để chuyển sang model khác. */
export async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await run(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

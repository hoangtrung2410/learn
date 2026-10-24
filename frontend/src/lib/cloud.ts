import type { User } from '../types';
import { FREE_MODE } from './api';

// Đăng nhập + đồng bộ tiến độ cho bản miễn phí (không có backend riêng): dùng Supabase.
// Bản thử trên máy (npm run dev -- --mode free, đặt VITE_FAKE_AUTH=1) dùng đăng nhập giả lưu trong trình duyệt.
const env = import.meta.env as Record<string, any>;
const SUPABASE_URL: string | undefined = env.VITE_SUPABASE_URL;
const SUPABASE_KEY: string | undefined = env.VITE_SUPABASE_ANON_KEY;

export const CLOUD_REAL = FREE_MODE && !!SUPABASE_URL && !!SUPABASE_KEY;
// Đăng nhập giả chỉ tồn tại ở bản dev, không bao giờ vào bản build production.
export const CLOUD_FAKE = FREE_MODE && !!env.DEV && env.VITE_FAKE_AUTH === '1';
export const CLOUD_AUTH = CLOUD_REAL || CLOUD_FAKE;
/** Bắt buộc đăng nhập mới được học: luôn đúng ở bản có backend; ở bản miễn phí khi đã cấu hình Supabase. */
export const AUTH_REQUIRED = !FREE_MODE || CLOUD_AUTH;

export interface Progress {
  data: Record<string, string>;
  updatedAt: string;
}

interface CloudProvider {
  getUser(): Promise<User | null>;
  signUp(email: string, password: string, name: string): Promise<{ user: User | null; needsConfirm: boolean }>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  onChange(cb: (u: User | null) => void): () => void;
  loadProgress(userId: string): Promise<Progress | null>;
  saveProgress(userId: string, data: Record<string, string>): Promise<string>;
}

const avatarOf = (seed: string) => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
const toUser = (id: string, email: string, name?: string): User => ({
  id,
  username: email,
  name: name || email.split('@')[0],
  email,
  role: 'user',
  avatar: avatarOf(email),
  isSuperAdmin: false,
  provider: 'local',
});

/** Dịch thông báo lỗi của Supabase sang tiếng Việt dễ hiểu. */
export function cloudErrorMessage(e: any): string {
  const m = String(e?.message || e || '');
  if (/invalid login credentials/i.test(m)) return 'Email hoặc mật khẩu không đúng.';
  if (/already registered|already been registered/i.test(m)) return 'Email này đã được đăng ký. Hãy đăng nhập.';
  if (/email not confirmed/i.test(m)) return 'Bạn chưa xác nhận email. Mở email và bấm vào liên kết xác nhận, rồi đăng nhập lại.';
  if (/password should be at least/i.test(m)) return 'Mật khẩu quá ngắn (tối thiểu 6 ký tự).';
  if (/rate limit|too many/i.test(m)) return 'Thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.';
  if (/invalid.*email|unable to validate email/i.test(m)) return 'Email không hợp lệ.';
  if (/failed to fetch|network/i.test(m)) return 'Không kết nối được máy chủ đăng nhập. Kiểm tra mạng và thử lại.';
  return m || 'Có lỗi xảy ra. Vui lòng thử lại.';
}

// ---------------------------------------------------------------- Supabase (thật)
async function makeSupabase(): Promise<CloudProvider> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const map = (u: any): User => toUser(u.id, u.email || '', u.user_metadata?.name);
  return {
    async getUser() {
      const { data } = await sb.auth.getSession();
      return data.session?.user ? map(data.session.user) : null;
    },
    async signUp(email, password, name) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      return { user: data.session?.user ? map(data.session.user) : null, needsConfirm: !data.session };
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return map(data.user);
    },
    async signOut() {
      await sb.auth.signOut();
    },
    onChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_evt, session) => cb(session?.user ? map(session.user) : null));
      return () => data.subscription.unsubscribe();
    },
    async loadProgress(userId) {
      const { data, error } = await sb.from('user_progress').select('data, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data ? { data: data.data || {}, updatedAt: data.updated_at } : null;
    },
    async saveProgress(userId, payload) {
      const updated_at = new Date().toISOString();
      const { error } = await sb.from('user_progress').upsert({ user_id: userId, data: payload, updated_at });
      if (error) throw error;
      return updated_at;
    },
  };
}

// ---------------------------------------------------------------- Đăng nhập giả (chỉ bản dev)
function makeFake(): CloudProvider {
  const read = <T,>(k: string, d: T): T => {
    try {
      return JSON.parse(localStorage.getItem(k) || 'null') ?? d;
    } catch {
      return d;
    }
  };
  const listeners = new Set<(u: User | null) => void>();
  const notify = (u: User | null) => listeners.forEach((f) => f(u));
  const users = () => read<Record<string, { id: string; password: string; name: string }>>('fake_users', {});
  const current = (): User | null => {
    const s = read<{ id: string; email: string; name: string } | null>('fake_session', null);
    return s ? toUser(s.id, s.email, s.name) : null;
  };
  return {
    async getUser() {
      return current();
    },
    async signUp(email, password, name) {
      if (password.length < 6) throw new Error('Password should be at least 6 characters');
      const all = users();
      if (all[email]) throw new Error('User already registered');
      const id = 'fake-' + Math.random().toString(36).slice(2, 10);
      all[email] = { id, password, name };
      localStorage.setItem('fake_users', JSON.stringify(all));
      localStorage.setItem('fake_session', JSON.stringify({ id, email, name }));
      const u = toUser(id, email, name);
      notify(u);
      return { user: u, needsConfirm: false };
    },
    async signIn(email, password) {
      const rec = users()[email];
      if (!rec || rec.password !== password) throw new Error('Invalid login credentials');
      localStorage.setItem('fake_session', JSON.stringify({ id: rec.id, email, name: rec.name }));
      const u = toUser(rec.id, email, rec.name);
      notify(u);
      return u;
    },
    async signOut() {
      localStorage.removeItem('fake_session');
      notify(null);
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async loadProgress(userId) {
      return read<Progress | null>('fake_progress_' + userId, null);
    },
    async saveProgress(userId, data) {
      const updatedAt = new Date().toISOString();
      localStorage.setItem('fake_progress_' + userId, JSON.stringify({ data, updatedAt }));
      return updatedAt;
    },
  };
}

let providerPromise: Promise<CloudProvider> | null = null;
export const getCloud = (): Promise<CloudProvider> => {
  if (!providerPromise) providerPromise = CLOUD_FAKE ? Promise.resolve(makeFake()) : makeSupabase();
  return providerPromise;
};

// ---------------------------------------------------------------- Đồng bộ tiến độ
// Các khoá localStorage thuộc về tiến độ học của người dùng.
export const SYNC_KEYS = [
  'linguahub_stats', 'lp_daily_v1', 'lp_srs_zh', 'lp_srs_en', 'lp_wrong_zh', 'lp_wrong_en',
  'lp_hsk_mastered', 'linguahub_mastered_en_vocab', 'linguahub_current_lang',
  'linguahub_chinese_font', 'linguahub_app_font', 'linguahub_font_scale',
];
const META_USER = 'lp_sync_user';
const META_AT = 'lp_sync_at';

const snapshot = (): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const k of SYNC_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
};
const same = (a: Record<string, string>, b: Record<string, string>) => JSON.stringify(a) === JSON.stringify(b);

export function clearLocalProgress() {
  for (const k of [...SYNC_KEYS, META_USER, META_AT]) localStorage.removeItem(k);
}

/**
 * Chạy ngay sau khi đăng nhập. Trả về 'reload' nếu tiến độ từ máy chủ đã ghi đè máy này (cần tải lại trang để áp dụng).
 * - Tài khoản khác với lần trước trên máy này: xoá dữ liệu cũ, lấy dữ liệu của tài khoản mới.
 * - Máy chủ chưa có gì: đưa dữ liệu hiện có trên máy lên.
 * - Máy chủ đã đổi từ nơi khác: dữ liệu máy chủ thắng.
 */
export async function pullProgress(userId: string): Promise<'reload' | 'ok'> {
  const cloud = await getCloud();
  if (localStorage.getItem(META_USER) !== userId) {
    clearLocalProgress();
  }
  const remote = await cloud.loadProgress(userId);
  const local = snapshot();
  if (!remote) {
    const at = await cloud.saveProgress(userId, local);
    localStorage.setItem(META_USER, userId);
    localStorage.setItem(META_AT, at);
    return 'ok';
  }
  if (localStorage.getItem(META_AT) === remote.updatedAt) {
    localStorage.setItem(META_USER, userId);
    return 'ok'; // máy chủ không có gì mới hơn máy này
  }
  const changed = !same(local, remote.data);
  for (const k of SYNC_KEYS) {
    if (k in remote.data) localStorage.setItem(k, remote.data[k]);
    else localStorage.removeItem(k);
  }
  localStorage.setItem(META_USER, userId);
  localStorage.setItem(META_AT, remote.updatedAt);
  return changed ? 'reload' : 'ok';
}

let lastPushed = '';
let timer: number | null = null;

/** Đẩy tiến độ lên máy chủ khi có thay đổi: kiểm tra mỗi 8 giây và khi rời tab. */
export function startAutoSync(userId: string) {
  stopAutoSync();
  lastPushed = JSON.stringify(snapshot());
  const push = async () => {
    const snap = snapshot();
    const s = JSON.stringify(snap);
    if (s === lastPushed) return;
    try {
      const cloud = await getCloud();
      const at = await cloud.saveProgress(userId, snap);
      lastPushed = s;
      localStorage.setItem(META_AT, at);
    } catch {
      /* mất mạng: lần sau thử lại */
    }
  };
  timer = window.setInterval(push, 8000);
  const onHide = () => document.visibilityState === 'hidden' && void push();
  document.addEventListener('visibilitychange', onHide);
  (startAutoSync as any)._off = () => document.removeEventListener('visibilitychange', onHide);
  (startAutoSync as any)._push = push;
}

export async function flushProgress() {
  await (startAutoSync as any)._push?.();
}

export function stopAutoSync() {
  if (timer) window.clearInterval(timer);
  timer = null;
  (startAutoSync as any)._off?.();
}

// Lớp gọi API dùng chung: tự gắn token đăng nhập và chuẩn hoá thông báo lỗi.
const TOKEN_KEY = 'lp_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* bỏ qua: trình duyệt chặn lưu trữ */
  }
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Header Authorization cho các lệnh fetch viết tay (ví dụ luồng SSE). */
export const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const t = getToken();
  return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.', 0);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* phản hồi không phải JSON */
  }
  if (!res.ok) {
    const raw = data?.message;
    const msg = Array.isArray(raw) ? raw.join(', ') : raw;
    if (res.status === 401 && getToken()) window.dispatchEvent(new Event('lp:unauthorized'));
    throw new ApiError(msg || `Có lỗi xảy ra (mã ${res.status}).`, res.status);
  }
  return data as T;
}

export const formatVnd = (n: number): string => `${(n || 0).toLocaleString('vi-VN')}đ`;

export const formatDate = (ms: number | null | undefined): string =>
  ms ? new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const formatDateTime = (ms: number | null | undefined): string =>
  ms ? new Date(ms).toLocaleString('vi-VN', { hour12: false }) : '—';

/** Gọi API AI: tự gắn token; 401 mở khung đăng nhập, 429 báo hết lượt trong ngày. */
export async function aiFetch(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(path, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    signal,
  });
  if (res.status === 401) {
    if (getToken()) window.dispatchEvent(new Event('lp:unauthorized'));
    window.dispatchEvent(new CustomEvent('lp:auth', { detail: { tab: 'login', notice: 'Đăng nhập để dùng tính năng AI.' } }));
    throw new ApiError('Vui lòng đăng nhập để dùng tính năng AI.', 401);
  }
  if (res.status === 429) {
    let msg = 'Bạn đã hết lượt AI hôm nay.';
    try {
      msg = (await res.json()).message || msg;
    } catch {
      /* giữ thông báo mặc định */
    }
    window.dispatchEvent(new CustomEvent('lp:quota', { detail: { message: msg } }));
    throw new ApiError(msg, 429);
  }
  return res;
}

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, KeyRound, Loader2, Package, ReceiptText, Search, Tag, Users } from 'lucide-react';
import { api, formatVnd, formatDate, formatDateTime, ApiError } from '../lib/api';
import { useAccess } from '../lib/access';

type Tab = 'overview' | 'orders' | 'users' | 'products' | 'coupons';
type Status = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';

interface Stats {
  revenueTotal: number;
  revenue30d: number;
  revenue7d: number;
  users: number;
  activePremium: number;
  ordersByStatus: Record<Status, number>;
  daily: { d: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; sold: number; revenue: number }[];
}
interface Order {
  code: string;
  productId: string;
  productName: string;
  listAmount: number;
  discount: number;
  amount: number;
  couponCode: string | null;
  status: Status;
  provider: string;
  createdAt: number;
  paidAt: number | null;
  username: string;
  email: string;
  note: string | null;
}
interface AdminEnt {
  id: number;
  productId: string;
  name: string;
  expiresAt: number | null;
  source: string;
}
interface AdminUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  disabled: boolean;
  createdAt: number;
  paidOrders: number;
  spent: number;
  tier: 'free' | 'paid' | 'premium';
  entitlements: AdminEnt[];
}
interface AdminProduct {
  id: string;
  kind: string;
  name: string;
  tagline: string;
  description: string;
  priceVnd: number;
  listPriceVnd: number;
  durationDays: number | null;
  active: boolean;
  highlight: boolean;
}
interface Coupon {
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: number | null;
  active: boolean;
}
interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

const PAGE_SIZE = 20;
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.');

const STATUS_LABEL: Record<Status, { text: string; cls: string }> = {
  pending: { text: 'Chờ thanh toán', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  paid: { text: 'Đã thanh toán', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  failed: { text: 'Thất bại', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  cancelled: { text: 'Đã huỷ', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  expired: { text: 'Hết hạn', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  refunded: { text: 'Đã hoàn tiền', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
};
const STATUSES = Object.keys(STATUS_LABEL) as Status[];
const TIER_LABEL = { free: 'Miễn phí', paid: 'Đã mua', premium: 'Premium' };

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400';
const btnCls =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const btnNeutral = `${btnCls} bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700`;
const btnPrimary = `${btnCls} bg-amber-400 border-amber-400 text-slate-900 hover:bg-amber-300`;
const btnDanger = `${btnCls} bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20`;
const cardCls = 'bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5';

const useDebounced = <T,>(value: T, ms = 400): T => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, error, reload };
}

const Loading: React.FC = () => (
  <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
  </div>
);

const Notice: React.FC<{ kind: 'error' | 'ok'; children: React.ReactNode }> = ({ kind, children }) => (
  <div
    role={kind === 'error' ? 'alert' : 'status'}
    className={`rounded-xl border px-3 py-2 text-sm ${
      kind === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    }`}
  >
    {children}
  </div>
);

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const s = STATUS_LABEL[status] || { text: status, cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${s.cls}`}>{s.text}</span>;
};

const Pager: React.FC<{ page: number; total: number; onChange: (p: number) => void }> = ({ page, total, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-3 flex-wrap text-xs text-slate-400">
      <button type="button" aria-label="Trang trước" className={btnNeutral} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="w-4 h-4" /> Trước
      </button>
      <span>
        Trang {page} / {pages} ({total} mục)
      </span>
      <button type="button" aria-label="Trang sau" className={btnNeutral} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Sau <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => (
  <label className="relative block flex-1 min-w-[12rem]">
    <span className="sr-only">{label}</span>
    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} className={`${inputCls} pl-9`} />
  </label>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={cardCls}>
    <div className="text-xs text-slate-400">{label}</div>
    <div className="text-xl sm:text-2xl font-black text-white mt-1 break-words">{value}</div>
  </div>
);

const Overview: React.FC = () => {
  const { data, loading, error } = useLoad<Stats>('/api/admin/stats');
  if (loading && !data) return <Loading />;
  if (error) return <Notice kind="error">{error}</Notice>;
  if (!data) return null;
  // Luôn vẽ đủ 30 ngày (ngày không có doanh thu = 0) để cột có độ rộng hợp lý.
  const byDay = new Map(data.daily.map((x) => [x.d, x]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() + 7 * 3600000 - (29 - i) * 86400000).toISOString().slice(0, 10);
    return byDay.get(d) ?? { d, revenue: 0, orders: 0 };
  });
  const max = Math.max(1, ...series.map((x) => x.revenue));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Doanh thu tổng" value={formatVnd(data.revenueTotal)} />
        <StatCard label="Doanh thu 30 ngày" value={formatVnd(data.revenue30d)} />
        <StatCard label="Doanh thu 7 ngày" value={formatVnd(data.revenue7d)} />
        <StatCard label="Học viên" value={data.users.toLocaleString('vi-VN')} />
        <StatCard label="Premium đang hoạt động" value={data.activePremium.toLocaleString('vi-VN')} />
      </div>

      <section className={cardCls} aria-label="Biểu đồ doanh thu 30 ngày">
        <h3 className="font-bold text-white text-sm mb-3">Doanh thu 30 ngày gần nhất</h3>
        {data.daily.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
        ) : (
          <>
            <div className="flex items-end gap-[2px] sm:gap-1 h-40">
              {series.map((x) => (
                <div
                  key={x.d}
                  title={`${formatDate(Date.parse(x.d))}: ${formatVnd(x.revenue)} (${x.orders} đơn)`}
                  className="flex-1 min-w-0 h-full flex items-end"
                >
                  <div
                    className="w-full rounded-t bg-amber-400/80 hover:bg-amber-300"
                    style={{ height: `${Math.max(x.revenue > 0 ? 3 : 1, (x.revenue / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>{formatDate(Date.parse(series[0].d))}</span>
              <span>Cao nhất: {formatVnd(max)}</span>
              <span>{formatDate(Date.parse(series[series.length - 1].d))}</span>
            </div>
          </>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className={cardCls}>
          <h3 className="font-bold text-white text-sm mb-3">Đơn hàng theo trạng thái</h3>
          <ul className="space-y-2">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <span className="font-bold text-white">{data.ordersByStatus?.[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={cardCls}>
          <h3 className="font-bold text-white text-sm mb-3">Sản phẩm bán chạy</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có đơn nào.</p>
          ) : (
            <ul className="space-y-2">
              {data.topProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-200 truncate">{p.name}</span>
                  <span className="text-slate-400 text-xs whitespace-nowrap">
                    {p.sold} đơn · <b className="text-amber-300">{formatVnd(p.revenue)}</b>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

const Orders: React.FC = () => {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const path = `/api/admin/orders?status=${status}&q=${encodeURIComponent(dq.trim())}&page=${page}&pageSize=${PAGE_SIZE}`;
  const { data, loading, error, reload } = useLoad<Paged<Order>>(path);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  useEffect(() => setPage(1), [status, dq]);

  const act = async (o: Order, action: 'mark-paid' | 'refund') => {
    const text =
      action === 'mark-paid'
        ? `Xác nhận đơn ${o.code} đã được thanh toán và cấp quyền cho ${o.username}?`
        : `Hoàn tiền đơn ${o.code} (${formatVnd(o.amount)}) và thu hồi quyền đã cấp?`;
    if (!window.confirm(text)) return;
    setBusy(o.code);
    setMsg(null);
    try {
      await api(`/api/admin/orders/${encodeURIComponent(o.code)}/${action}`, { method: 'POST' });
      setMsg({ kind: 'ok', text: action === 'mark-paid' ? `Đã xác nhận thanh toán đơn ${o.code}.` : `Đã hoàn tiền đơn ${o.code}.` });
      await reload();
    } catch (e) {
      setMsg({ kind: 'error', text: errMsg(e) });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <SearchBox value={q} onChange={setQ} label="Tìm theo mã đơn, tài khoản, email" />
        <label className="block">
          <span className="sr-only">Lọc trạng thái</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} aria-label="Lọc trạng thái">
            <option value="all">Tất cả trạng thái</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s].text}
              </option>
            ))}
          </select>
        </label>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {loading && !data ? (
        <Loading />
      ) : (
        data && (
          <div className={`${cardCls} !p-0 overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  {['Mã đơn', 'Học viên', 'Sản phẩm', 'Số tiền', 'Trạng thái', 'Thời gian', ''].map((h, i) => (
                    <th key={i} className="px-3 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                      Không có đơn hàng nào.
                    </td>
                  </tr>
                )}
                {data.items.map((o) => (
                  <tr key={o.code} className="align-top">
                    <td className="px-3 py-3 font-mono text-xs text-slate-200 whitespace-nowrap">{o.code}</td>
                    <td className="px-3 py-3">
                      <div className="text-white">{o.username}</div>
                      <div className="text-xs text-slate-500 break-all">{o.email}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-200 min-w-[8rem]">{o.productName}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-bold text-amber-300">{formatVnd(o.amount)}</div>
                      {o.discount > 0 && (
                        <div className="text-xs text-slate-500">
                          Giảm {formatVnd(o.discount)}
                          {o.couponCode ? ` (${o.couponCode})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">
                      <div>Tạo: {formatDateTime(o.createdAt)}</div>
                      {o.paidAt && <div>Trả: {formatDateTime(o.paidAt)}</div>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {o.status === 'pending' && (
                        <button
                          type="button"
                          aria-label={`Xác nhận đã thanh toán đơn ${o.code}`}
                          className={btnPrimary}
                          disabled={busy === o.code}
                          onClick={() => act(o, 'mark-paid')}
                        >
                          {busy === o.code && <Loader2 className="w-3 h-3 animate-spin" />} Xác nhận đã thanh toán
                        </button>
                      )}
                      {o.status === 'paid' && (
                        <button
                          type="button"
                          aria-label={`Hoàn tiền đơn ${o.code}`}
                          className={btnDanger}
                          disabled={busy === o.code}
                          onClick={() => act(o, 'refund')}
                        >
                          {busy === o.code && <Loader2 className="w-3 h-3 animate-spin" />} Hoàn tiền
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {data && <Pager page={page} total={data.total} onChange={setPage} />}
    </div>
  );
};

const UserRow: React.FC<{
  u: AdminUser;
  products: AdminProduct[];
  onChanged: (text: string) => Promise<void>;
  onError: (text: string) => void;
}> = ({ u, products, onChanged, onError }) => {
  const [productId, setProductId] = useState('');
  const [days, setDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState('');

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    try {
      await fn();
      await onChanged(okText);
    } catch (e) {
      onError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const post = (path: string, body?: unknown) => api(`/api/admin/users/${u.id}/${path}`, { method: 'POST', body: body ?? {} });

  const grant = () => {
    if (!productId) return onError('Hãy chọn sản phẩm cần cấp quyền.');
    const n = days.trim() ? parseInt(days, 10) : undefined;
    if (n !== undefined && (Number.isNaN(n) || n <= 0)) return onError('Số ngày phải là số nguyên dương.');
    run(async () => {
      await post('grant', n ? { productId, days: n } : { productId });
      setProductId('');
      setDays('');
    }, `Đã cấp quyền cho ${u.username}.`);
  };

  return (
    <li className={`${cardCls} space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-white break-all">
            {u.username} {u.role === 'admin' && <span className="text-[11px] text-amber-300">(quản trị)</span>}
            {u.disabled && <span className="ml-2 text-[11px] text-rose-300">Đã khoá</span>}
          </div>
          <div className="text-xs text-slate-400 break-all">
            {u.name} · {u.email}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gói: <b className="text-slate-300">{TIER_LABEL[u.tier]}</b> · {u.paidOrders} đơn đã trả · {formatVnd(u.spent)} · Tham gia {formatDate(u.createdAt)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label={`${u.disabled ? 'Mở khoá' : 'Khoá'} tài khoản ${u.username}`}
            className={u.disabled ? btnNeutral : btnDanger}
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`${u.disabled ? 'Mở khoá' : 'Khoá'} tài khoản ${u.username}?`)) return;
              run(() => post('disable', { disabled: !u.disabled }), u.disabled ? 'Đã mở khoá tài khoản.' : 'Đã khoá tài khoản.');
            }}
          >
            {u.disabled ? 'Mở khoá' : 'Khoá tài khoản'}
          </button>
          <button
            type="button"
            aria-label={`Đặt lại mật khẩu cho ${u.username}`}
            className={btnNeutral}
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Đặt lại mật khẩu cho ${u.username}? Mật khẩu cũ sẽ không dùng được nữa.`)) return;
              run(async () => {
                const r = await post('reset-password');
                setTempPw(r.temporaryPassword);
              }, 'Đã đặt lại mật khẩu.');
            }}
          >
            <KeyRound className="w-3.5 h-3.5" /> Đặt lại mật khẩu
          </button>
        </div>
      </div>

      {tempPw && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Mật khẩu tạm thời (chỉ hiện 1 lần, hãy sao chép ngay):{' '}
          <input readOnly value={tempPw} aria-label="Mật khẩu tạm thời" onFocus={(e) => e.currentTarget.select()} className="ml-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono text-white" />
          <button type="button" className={`${btnNeutral} ml-2`} onClick={() => setTempPw('')}>
            Đã sao chép, ẩn đi
          </button>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold text-slate-400 mb-1">Quyền đang có</div>
        {u.entitlements.length === 0 ? (
          <div className="text-xs text-slate-500">Chưa có quyền nào.</div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {u.entitlements.map((e) => (
              <li key={e.id} className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-200">
                <span>
                  {e.name} · {e.expiresAt ? `đến ${formatDate(e.expiresAt)}` : 'vĩnh viễn'}
                </span>
                <button
                  type="button"
                  aria-label={`Thu hồi quyền ${e.name} của ${u.username}`}
                  className="px-2 py-0.5 rounded-full text-rose-300 hover:bg-rose-500/20 cursor-pointer disabled:opacity-40"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Thu hồi quyền "${e.name}" của ${u.username}?`)) return;
                    run(() => post('revoke', { entitlementId: e.id }), 'Đã thu hồi quyền.');
                  }}
                >
                  Thu hồi
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="block flex-1 min-w-[10rem]">
          <span className="block text-xs text-slate-400 mb-1">Sản phẩm cần cấp</span>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
            <option value="">— Chọn sản phẩm —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block w-32">
          <span className="block text-xs text-slate-400 mb-1">Số ngày (tuỳ chọn)</span>
          <input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Mặc định" className={inputCls} />
        </label>
        <button type="button" aria-label={`Cấp quyền cho ${u.username}`} className={btnPrimary} disabled={busy} onClick={grant}>
          {busy && <Loader2 className="w-3 h-3 animate-spin" />} Cấp quyền
        </button>
      </div>
    </li>
  );
};

const UsersTab: React.FC = () => {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, loading, error, reload } = useLoad<Paged<AdminUser>>(
    `/api/admin/users?q=${encodeURIComponent(dq.trim())}&page=${page}&pageSize=${PAGE_SIZE}`,
  );
  const prod = useLoad<{ products: AdminProduct[] }>('/api/admin/products');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  useEffect(() => setPage(1), [dq]);

  return (
    <div className="space-y-3">
      <div className="flex">
        <SearchBox value={q} onChange={setQ} label="Tìm theo tài khoản, email, tên" />
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {loading && !data ? (
        <Loading />
      ) : (
        data && (
          <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
            {data.items.length === 0 && <li className="text-center text-sm text-slate-400 py-8">Không tìm thấy học viên nào.</li>}
            {data.items.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                products={prod.data?.products ?? []}
                onChanged={async (text) => {
                  setMsg({ kind: 'ok', text });
                  await reload();
                }}
                onError={(text) => setMsg({ kind: 'error', text })}
              />
            ))}
          </ul>
        )
      )}
      {data && <Pager page={page} total={data.total} onChange={setPage} />}
    </div>
  );
};

interface Draft {
  name: string;
  priceVnd: string;
  listPriceVnd: string;
  active: boolean;
}

const ProductRow: React.FC<{ p: AdminProduct; onSaved: () => Promise<void> }> = ({ p, onSaved }) => {
  const [d, setD] = useState<Draft>({ name: p.name, priceVnd: String(p.priceVnd), listPriceVnd: String(p.listPriceVnd), active: p.active });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const save = async () => {
    const price = Number(d.priceVnd);
    const list = Number(d.listPriceVnd);
    if (!d.name.trim()) return setMsg({ kind: 'error', text: 'Tên sản phẩm không được để trống.' });
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(list) || list < 0)
      return setMsg({ kind: 'error', text: 'Giá phải là số không âm.' });
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/products/${encodeURIComponent(p.id)}`, {
        method: 'PUT',
        body: { name: d.name.trim(), priceVnd: Math.round(price), listPriceVnd: Math.round(list), active: d.active },
      });
      setMsg({ kind: 'ok', text: 'Đã lưu thay đổi.' });
      await onSaved();
    } catch (e) {
      setMsg({ kind: 'error', text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`${cardCls} space-y-3`}>
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-mono">
          {p.id} · {p.kind === 'plan' ? 'Gói' : 'Khoá học'}
          {p.durationDays ? ` · ${p.durationDays} ngày` : ''}
        </span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block sm:col-span-3">
          <span className="block text-xs text-slate-400 mb-1">Tên sản phẩm</span>
          <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Giá bán (đ)</span>
          <input type="number" min={0} value={d.priceVnd} onChange={(e) => setD({ ...d, priceVnd: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Giá gốc (đ)</span>
          <input type="number" min={0} value={d.listPriceVnd} onChange={(e) => setD({ ...d, listPriceVnd: e.target.value })} className={inputCls} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-200 sm:pt-6">
          <input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} className="w-4 h-4 accent-amber-400" />
          Đang mở bán
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-label={`Lưu sản phẩm ${p.name}`} className={btnPrimary} disabled={busy} onClick={save}>
          {busy && <Loader2 className="w-3 h-3 animate-spin" />} Lưu
        </button>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      </div>
    </li>
  );
};

const ProductsTab: React.FC = () => {
  const { data, loading, error, reload } = useLoad<{ products: AdminProduct[] }>('/api/admin/products');
  if (loading && !data) return <Loading />;
  return (
    <div className="space-y-3">
      {error && <Notice kind="error">{error}</Notice>}
      <ul className="space-y-3">
        {data?.products.map((p) => (
          <ProductRow key={`${p.id}:${p.name}:${p.priceVnd}:${p.listPriceVnd}:${p.active}`} p={p} onSaved={reload} />
        ))}
      </ul>
    </div>
  );
};

const CouponsTab: React.FC = () => {
  const { data, loading, error, reload } = useLoad<{ items: Coupon[] }>('/api/admin/coupons');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    if (!code.trim()) return setMsg({ kind: 'error', text: 'Hãy nhập mã giảm giá.' });
    if (!Number.isFinite(v) || v <= 0 || (type === 'percent' && v > 100))
      return setMsg({ kind: 'error', text: type === 'percent' ? 'Phần trăm giảm phải từ 1 đến 100.' : 'Số tiền giảm phải lớn hơn 0.' });
    const body: Record<string, unknown> = { code: code.trim().toUpperCase(), [type === 'percent' ? 'percentOff' : 'amountOff']: Math.round(v) };
    if (maxUses.trim()) body.maxUses = parseInt(maxUses, 10);
    if (expires) body.expiresAt = new Date(`${expires}T23:59:59`).getTime();
    setBusy('create');
    setMsg(null);
    try {
      await api('/api/admin/coupons', { method: 'POST', body });
      setMsg({ kind: 'ok', text: `Đã tạo mã ${body.code}.` });
      setCode('');
      setValue('');
      setMaxUses('');
      setExpires('');
      await reload();
    } catch (err) {
      setMsg({ kind: 'error', text: errMsg(err) });
    } finally {
      setBusy('');
    }
  };

  const toggle = async (c: Coupon) => {
    setBusy(c.code);
    setMsg(null);
    try {
      await api(`/api/admin/coupons/${encodeURIComponent(c.code)}/active`, { method: 'POST', body: { active: !c.active } });
      setMsg({ kind: 'ok', text: `Đã ${c.active ? 'tắt' : 'bật'} mã ${c.code}.` });
      await reload();
    } catch (err) {
      setMsg({ kind: 'error', text: errMsg(err) });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className={`${cardCls} space-y-3`} aria-label="Tạo mã giảm giá">
        <h3 className="font-bold text-white text-sm">Tạo mã giảm giá</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Mã</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: KHAITRUONG" className={`${inputCls} uppercase`} />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Loại giảm</span>
            <select value={type} onChange={(e) => setType(e.target.value as 'percent' | 'amount')} className={inputCls}>
              <option value="percent">Theo phần trăm (%)</option>
              <option value="amount">Theo số tiền (đ)</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">{type === 'percent' ? 'Giảm (%)' : 'Giảm (đ)'}</span>
            <input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Số lượt tối đa</span>
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Không giới hạn" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Hạn dùng</span>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={inputCls} />
          </label>
        </div>
        <button type="submit" className={btnPrimary} disabled={busy === 'create'}>
          {busy === 'create' && <Loader2 className="w-3 h-3 animate-spin" />} Tạo mã
        </button>
      </form>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {loading && !data ? (
        <Loading />
      ) : (
        data && (
          <div className={`${cardCls} !p-0 overflow-x-auto`}>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  {['Mã', 'Mức giảm', 'Đã dùng', 'Hạn dùng', 'Trạng thái', ''].map((h, i) => (
                    <th key={i} className="px-3 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                      Chưa có mã giảm giá nào.
                    </td>
                  </tr>
                )}
                {data.items.map((c) => (
                  <tr key={c.code}>
                    <td className="px-3 py-3 font-mono text-white">{c.code}</td>
                    <td className="px-3 py-3 text-slate-200 whitespace-nowrap">{c.percentOff ? `${c.percentOff}%` : formatVnd(c.amountOff || 0)}</td>
                    <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                      {c.usedCount}/{c.maxUses ?? '∞'}
                    </td>
                    <td className="px-3 py-3 text-slate-300 whitespace-nowrap">{c.expiresAt ? formatDate(c.expiresAt) : 'Không hết hạn'}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-bold ${c.active ? 'text-emerald-300' : 'text-slate-500'}`}>{c.active ? 'Đang bật' : 'Đã tắt'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-label={`${c.active ? 'Tắt' : 'Bật'} mã ${c.code}`}
                        className={c.active ? btnDanger : btnNeutral}
                        disabled={busy === c.code}
                        onClick={() => toggle(c)}
                      >
                        {busy === c.code && <Loader2 className="w-3 h-3 animate-spin" />} {c.active ? 'Tắt' : 'Bật'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'orders', label: 'Đơn hàng', icon: <ReceiptText className="w-4 h-4" /> },
  { id: 'users', label: 'Học viên', icon: <Users className="w-4 h-4" /> },
  { id: 'products', label: 'Sản phẩm', icon: <Package className="w-4 h-4" /> },
  { id: 'coupons', label: 'Mã giảm giá', icon: <Tag className="w-4 h-4" /> },
];

export const AdminView: React.FC = () => {
  const { isAdmin } = useAccess();
  const [tab, setTab] = useState<Tab>('overview');

  if (!isAdmin) {
    return <div className="max-w-md mx-auto text-center text-slate-300 py-16 px-4">Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 min-w-0">
      <h2 className="text-xl sm:text-2xl font-black text-white">Quản trị bán khoá học</h2>
      <div role="tablist" aria-label="Mục quản trị" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border whitespace-nowrap cursor-pointer transition-colors ${
              tab === t.id ? 'bg-amber-400 border-amber-400 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'overview' && <Overview />}
        {tab === 'orders' && <Orders />}
        {tab === 'users' && <UsersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'coupons' && <CouponsTab />}
      </div>
    </div>
  );
};

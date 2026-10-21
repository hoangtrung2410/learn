import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Crown, KeyRound, Receipt, Sparkles, UserRound, Loader2 } from 'lucide-react';
import { api, formatVnd, formatDate, formatDateTime } from '../lib/api';
import { SCOPE_LABEL, useAccess } from '../lib/access';
import { goPricing, openAuth } from '../lib/nav';

interface OrderRow {
  code: string;
  productName: string;
  amount: number;
  discount: number;
  couponCode: string | null;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';
  createdAt: number;
  paidAt: number | null;
}

const STATUS: Record<OrderRow['status'], { label: string; cls: string }> = {
  pending: { label: 'Chờ thanh toán', cls: 'bg-amber-500/15 text-amber-300' },
  paid: { label: 'Đã thanh toán', cls: 'bg-emerald-500/15 text-emerald-300' },
  failed: { label: 'Thất bại', cls: 'bg-rose-500/15 text-rose-300' },
  cancelled: { label: 'Đã huỷ', cls: 'bg-slate-700 text-slate-300' },
  expired: { label: 'Hết hạn', cls: 'bg-slate-700 text-slate-300' },
  refunded: { label: 'Đã hoàn tiền', cls: 'bg-sky-500/15 text-sky-300' },
};

export const AccountView: React.FC = () => {
  const { user, ready, tier, planUntil, entitlements, ai, refresh, setSession } = useAccess();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const loadOrders = useCallback(() => {
    api<{ items: OrderRow[] }>('/api/orders/mine').then((r) => setOrders(r.items)).catch((e) => setOrdersError(e.message));
  }, []);

  useEffect(() => {
    if (user) {
      loadOrders();
      refresh();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>;
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <UserRound className="w-12 h-12 text-slate-500 mx-auto" />
        <p className="text-slate-300">Bạn cần đăng nhập để xem tài khoản.</p>
        <button onClick={() => openAuth('login')} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold cursor-pointer">Đăng nhập</button>
      </div>
    );
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 8) return setPwMsg({ ok: false, text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    if (pw.next !== pw.again) return setPwMsg({ ok: false, text: 'Mật khẩu nhập lại không khớp.' });
    setPwBusy(true);
    try {
      const r = await api('/api/auth/change-password', { body: { currentPassword: pw.current, newPassword: pw.next } });
      setSession(r.user, r.token);
      setPw({ current: '', next: '', again: '' });
      setPwMsg({ ok: true, text: 'Đã đổi mật khẩu.' });
    } catch (err: any) {
      setPwMsg({ ok: false, text: err.message });
    } finally {
      setPwBusy(false);
    }
  };

  const cancel = async (code: string) => {
    if (!window.confirm('Huỷ đơn hàng này?')) return;
    try {
      await api(`/api/orders/${code}/cancel`, { body: {} });
      loadOrders();
    } catch (e: any) {
      setOrdersError(e.message);
    }
  };

  const input = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl bg-slate-800" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white truncate">{user.name}</h1>
          <p className="text-xs text-slate-400 font-mono truncate">@{user.username} · {user.email}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${tier === 'premium' ? 'bg-amber-400 text-slate-950' : tier === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
          {tier === 'premium' ? <Crown className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
          {tier === 'premium' ? 'Premium' : tier === 'paid' ? 'Đã mua khoá học' : 'Miễn phí'}
        </span>
      </section>

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4" aria-labelledby="my-courses">
        <div className="flex items-center justify-between gap-2">
          <h2 id="my-courses" className="text-lg font-black text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-400" /> Khoá học của tôi</h2>
          <button onClick={() => goPricing()} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer">{tier === 'free' ? 'Nâng cấp' : 'Mua thêm'}</button>
        </div>
        {planUntil && <p className="text-xs text-amber-200">Premium có hiệu lực đến {formatDate(planUntil)}.</p>}
        {entitlements.length === 0 ? (
          <p className="text-sm text-slate-400">Bạn đang dùng gói miễn phí (HSK 1-2 và tiếng Anh A1-A2). Nâng cấp để mở HSK 3-9, tiếng Anh B1-C1, TOEIC, IELTS.</p>
        ) : (
          <ul className="space-y-2">
            {entitlements.map((e) => (
              <li key={e.id} className="rounded-2xl bg-slate-800/60 p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{e.name}</p>
                  <p className="text-[11px] text-slate-400">{e.kind === 'plan' ? 'Gói thành viên' : e.scopes.map((s) => SCOPE_LABEL[s] || s).join(', ')}</p>
                </div>
                <span className="text-xs text-slate-300">{e.expiresAt ? `Hết hạn ${formatDate(e.expiresAt)}` : 'Vĩnh viễn'}</span>
              </li>
            ))}
          </ul>
        )}
        {ai && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Lượt AI hôm nay</span><span>{ai.used} / {ai.limit}</span></div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(100, (ai.used / Math.max(1, ai.limit)) * 100)}%` }} /></div>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4" aria-labelledby="my-orders">
        <h2 id="my-orders" className="text-lg font-black text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-sky-400" /> Lịch sử đơn hàng</h2>
        {ordersError && <p role="alert" className="text-xs text-rose-300">{ordersError}</p>}
        {!orders ? (
          <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-400">Bạn chưa có đơn hàng nào.</p>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs min-w-[520px]">
              <thead><tr className="text-left text-slate-500"><th className="py-2 pr-3 font-bold">Mã đơn</th><th className="pr-3 font-bold">Sản phẩm</th><th className="pr-3 font-bold">Số tiền</th><th className="pr-3 font-bold">Ngày tạo</th><th className="pr-3 font-bold">Trạng thái</th><th /></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.code} className="border-t border-slate-800 text-slate-300">
                    <td className="py-2.5 pr-3 font-mono">{o.code}</td>
                    <td className="pr-3">{o.productName}{o.couponCode && <span className="ml-1 text-emerald-300">({o.couponCode})</span>}</td>
                    <td className="pr-3">{formatVnd(o.amount)}</td>
                    <td className="pr-3">{formatDateTime(o.createdAt)}</td>
                    <td className="pr-3"><span className={`px-2 py-0.5 rounded-lg font-bold ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span></td>
                    <td>{o.status === 'pending' && <button onClick={() => cancel(o.code)} className="text-rose-300 hover:text-rose-200 underline cursor-pointer">Huỷ</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6" aria-labelledby="chg-pw">
        <h2 id="chg-pw" className="text-lg font-black text-white flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-purple-400" /> Đổi mật khẩu</h2>
        <form onSubmit={changePassword} className="grid sm:grid-cols-3 gap-3 items-end">
          <div><label htmlFor="pw-cur" className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu hiện tại</label><input id="pw-cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={input} /></div>
          <div><label htmlFor="pw-new" className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu mới</label><input id="pw-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={input} /></div>
          <div><label htmlFor="pw-again" className="block text-xs font-bold text-slate-300 mb-1.5">Nhập lại mật khẩu mới</label><input id="pw-again" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} className={input} /></div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={pwBusy || !pw.current || !pw.next} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold cursor-pointer">{pwBusy ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>
            {pwMsg && <span role="status" className={`text-xs ${pwMsg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{pwMsg.text}</span>}
          </div>
        </form>
      </section>
    </div>
  );
};

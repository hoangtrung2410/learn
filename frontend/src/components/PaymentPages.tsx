import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, FlaskConical, Loader2, AlertTriangle } from 'lucide-react';
import { api, formatVnd } from '../lib/api';
import { useAccess } from '../lib/access';
import { gotoTab, openAuth } from '../lib/nav';

interface OrderLite {
  code: string;
  productName: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';
  provider: string;
}

const clearQuery = () => window.history.replaceState({}, '', window.location.pathname);

/** Trang cổng thanh toán thử nghiệm (chỉ dùng khi PAYMENT_PROVIDER=mock). Hiện khi URL có ?mockpay=MÃ_ĐƠN. */
export const MockPayPage: React.FC<{ code: string; onDone: () => void }> = ({ code, onDone }) => {
  const { user, ready } = useAccess();
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    api<{ order: OrderLite }>(`/api/orders/${code}`).then((r) => setOrder(r.order)).catch((e) => setError(e.message));
  }, [ready, user, code]);

  const finish = async (result: 'success' | 'failed') => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/payments/mock/${code}/complete`, { body: { result } });
      window.location.replace(`/?payment=${result === 'success' ? 'success' : 'failed'}&order=${encodeURIComponent(code)}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-3xl bg-slate-900 border border-amber-500/40 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold"><FlaskConical className="w-4 h-4" /> CỔNG THANH TOÁN THỬ NGHIỆM, KHÔNG TRỪ TIỀN THẬT</div>
        {!ready ? (
          <p className="text-slate-400 text-sm">Đang tải…</p>
        ) : !user ? (
          <div className="space-y-3 text-center">
            <p className="text-slate-300 text-sm">Vui lòng đăng nhập để xem đơn hàng.</p>
            <button onClick={() => openAuth('login')} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold cursor-pointer">Đăng nhập</button>
          </div>
        ) : error && !order ? (
          <p role="alert" className="text-rose-300 text-sm">{error}</p>
        ) : !order ? (
          <p className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải đơn hàng…</p>
        ) : (
          <>
            <div>
              <p className="text-xs text-slate-400">Đơn hàng {order.code}</p>
              <h1 className="text-xl font-black text-white">{order.productName}</h1>
              <p className="text-3xl font-black text-emerald-300 mt-2">{formatVnd(order.amount)}</p>
            </div>
            {order.status !== 'pending' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">Đơn hàng này đang ở trạng thái: <b className="text-white">{order.status}</b>.</p>
                <button onClick={() => { clearQuery(); onDone(); }} className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer">Về trang chủ</button>
              </div>
            ) : (
              <div className="space-y-2">
                {error && <p role="alert" className="text-rose-300 text-xs">{error}</p>}
                <button onClick={() => finish('success')} disabled={busy} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-sm cursor-pointer">Giả lập thanh toán thành công</button>
                <button onClick={() => finish('failed')} disabled={busy} className="w-full py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-60 text-rose-200 font-bold text-sm cursor-pointer">Giả lập thanh toán thất bại</button>
                <button onClick={() => { clearQuery(); window.location.replace('/'); }} disabled={busy} className="w-full py-2 text-xs text-slate-400 hover:text-white cursor-pointer">Quay lại, thanh toán sau</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/** Hộp kết quả sau khi quay về từ cổng thanh toán (?payment=success|failed|invalid&order=MÃ). */
export const PaymentResultModal: React.FC<{ status: string; code: string | null; onClose: () => void }> = ({ status, code, onClose }) => {
  const { refresh, user, ready } = useAccess();
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [loading, setLoading] = useState(!!code);

  useEffect(() => {
    if (!code || !ready) return;
    if (!user) { setLoading(false); return; }
    let alive = true;
    let tries = 0;
    const load = async () => {
      try {
        const r = await api<{ order: OrderLite }>(`/api/orders/${code}`);
        if (!alive) return;
        setOrder(r.order);
        if (r.order.status === 'paid') await refresh();
        // Cổng thanh toán đôi khi báo về chậm vài giây: thử lại ngắn khi báo thành công mà đơn chưa kịp cập nhật.
        if (status === 'success' && r.order.status === 'pending' && tries++ < 6) setTimeout(load, 2000);
        else setLoading(false);
      } catch {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [code, ready, user, status, refresh]);

  const close = () => { clearQuery(); onClose(); };
  const paid = order?.status === 'paid';
  const failed = status === 'failed' || order?.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Kết quả thanh toán">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-8 text-center space-y-4">
        {loading ? (
          <>
            <Loader2 className="w-12 h-12 text-emerald-400 mx-auto animate-spin" />
            <p className="text-white font-bold">Đang xác nhận thanh toán…</p>
          </>
        ) : paid ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-black text-white">Thanh toán thành công!</h2>
            <p className="text-sm text-slate-300">Đã mở khoá <b>{order!.productName}</b> trên tài khoản của bạn.<br />Mã đơn: <span className="font-mono">{order!.code}</span></p>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={() => { close(); gotoTab({ tab: 'learn' }); }} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-black cursor-pointer">Bắt đầu học</button>
              <button onClick={() => { close(); gotoTab({ tab: 'account' }); }} className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer">Xem đơn hàng</button>
            </div>
          </>
        ) : failed ? (
          <>
            <XCircle className="w-16 h-16 text-rose-400 mx-auto" />
            <h2 className="text-2xl font-black text-white">Thanh toán chưa thành công</h2>
            <p className="text-sm text-slate-300">Giao dịch bị huỷ hoặc không hoàn tất. Bạn chưa bị trừ tiền cho đơn này.</p>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={() => { close(); gotoTab({ tab: 'pricing' }); }} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-black cursor-pointer">Thử lại</button>
              <button onClick={close} className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer">Đóng</button>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto" />
            <h2 className="text-2xl font-black text-white">{status === 'invalid' ? 'Không xác minh được giao dịch' : 'Đơn hàng đang chờ xác nhận'}</h2>
            <p className="text-sm text-slate-300">
              {!user ? 'Vui lòng đăng nhập để xem trạng thái đơn hàng.' : 'Nếu bạn đã bị trừ tiền, quyền học sẽ được mở trong ít phút. Nếu chưa thấy, hãy liên hệ hỗ trợ kèm mã đơn.'}
              {code && <><br />Mã đơn: <span className="font-mono">{code}</span></>}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              {!user && <button onClick={() => { close(); openAuth('login'); }} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold cursor-pointer">Đăng nhập</button>}
              <button onClick={close} className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer">Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

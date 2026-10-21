import React, { useEffect, useState } from 'react';
import { X, Tag, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { api, formatVnd } from '../lib/api';
import { Product, SCOPE_LABEL, useAccess } from '../lib/access';
import { gotoTab } from '../lib/nav';

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
}

interface Quote {
  code: string | null;
  listAmount: number;
  discount: number;
  amount: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, onClose }) => {
  const { refresh } = useAccess();
  const [coupon, setCoupon] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeDone, setFreeDone] = useState(false);

  useEffect(() => {
    setCoupon('');
    setQuote(null);
    setCouponError(null);
    setAgree(false);
    setError(null);
    setFreeDone(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !paying && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, paying, onClose]);

  if (!product) return null;

  const amount = quote ? quote.amount : product.priceVnd;
  const discount = quote?.discount ?? 0;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setChecking(true);
    setCouponError(null);
    try {
      setQuote(await api<Quote>('/api/coupons/validate', { body: { productId: product.id, code: coupon } }));
    } catch (e: any) {
      setQuote(null);
      setCouponError(e.message);
    } finally {
      setChecking(false);
    }
  };

  const pay = async () => {
    setPaying(true);
    setError(null);
    try {
      const r = await api<{ order: { code: string; status: string }; payUrl: string | null }>('/api/orders', {
        body: { productId: product.id, coupon: quote?.code || undefined },
      });
      if (r.payUrl) {
        window.location.href = r.payUrl;
        return;
      }
      await refresh();
      setFreeDone(true);
      setPaying(false);
    } catch (e: any) {
      setError(e.message);
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Thanh toán">
      <div className="w-full max-w-md max-h-[94vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Xác nhận đơn hàng</p>
            <h2 className="text-xl font-black text-white">{product.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{product.durationDays ? `Hiệu lực ${product.durationDays} ngày` : 'Học vĩnh viễn'}</p>
          </div>
          <button onClick={onClose} disabled={paying} aria-label="Đóng" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {freeDone ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <p className="text-white font-black text-lg">Đã mở khoá {product.name}!</p>
            <button onClick={() => { onClose(); gotoTab({ tab: 'learn' }); }} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-black cursor-pointer">Bắt đầu học</button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {product.scopes.map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">{SCOPE_LABEL[s] || s}</span>)}
            </div>

            <div>
              <label htmlFor="coupon" className="block text-xs font-bold text-slate-300 mb-1.5">Mã giảm giá (nếu có)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input id="coupon" value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setQuote(null); setCouponError(null); }} onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} placeholder="NHAPMA" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
                </div>
                <button onClick={applyCoupon} disabled={checking || !coupon.trim()} className="px-4 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                </button>
              </div>
              {couponError && <p role="alert" className="text-xs text-rose-300 mt-1.5">{couponError}</p>}
              {quote?.code && <p className="text-xs text-emerald-300 mt-1.5">Đã áp dụng mã {quote.code}: giảm {formatVnd(quote.discount)}.</p>}
            </div>

            <dl className="space-y-2 text-sm rounded-2xl bg-slate-800/60 p-4">
              <div className="flex justify-between text-slate-300"><dt>Giá niêm yết</dt><dd>{formatVnd(product.priceVnd)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-emerald-300"><dt>Giảm giá</dt><dd>-{formatVnd(discount)}</dd></div>}
              <div className="flex justify-between text-white font-black text-lg pt-2 border-t border-slate-700"><dt>Tổng thanh toán</dt><dd>{amount === 0 ? 'Miễn phí' : formatVnd(amount)}</dd></div>
            </dl>

            <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-emerald-500" />
              <span>Tôi đồng ý với <button type="button" onClick={() => { onClose(); gotoTab({ tab: 'legal', legal: 'terms' }); }} className="underline text-emerald-300 cursor-pointer">Điều khoản</button> và <button type="button" onClick={() => { onClose(); gotoTab({ tab: 'legal', legal: 'refund' }); }} className="underline text-emerald-300 cursor-pointer">Chính sách hoàn tiền</button>.</span>
            </label>

            {error && <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">{error}</div>}

            <button onClick={pay} disabled={!agree || paying} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer">
              {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo đơn…</> : amount === 0 ? 'Nhận khoá học miễn phí' : `Thanh toán ${formatVnd(amount)}`}
            </button>
            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Bạn sẽ được chuyển sang cổng thanh toán để hoàn tất.</p>
          </>
        )}
      </div>
    </div>
  );
};

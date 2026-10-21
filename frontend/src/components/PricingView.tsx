import React, { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Lock, Sparkles, BadgeCheck, ShieldCheck, FlaskConical, Infinity as InfinityIcon, Clock } from 'lucide-react';
import { api, formatVnd, formatDate } from '../lib/api';
import { Product, SCOPE_LABEL, useAccess } from '../lib/access';
import { gotoTab } from '../lib/nav';

interface Catalog {
  products: Product[];
  freeScopes: string[];
  paymentProvider: 'mock' | 'vnpay';
  aiLimits: { free: number; paid: number; premium: number };
  support: { email: string; phone: string };
}

interface PricingViewProps {
  onBuy: (p: Product) => void;
  highlight?: string;
}

const discountPct = (p: Product) => (p.listPriceVnd > p.priceVnd ? Math.round((1 - p.priceVnd / p.listPriceVnd) * 100) : 0);
const scopeGroup = (p: Product) => (p.scopes.some((s) => s.startsWith('zh')) ? 'zh' : 'en');

export const PricingView: React.FC<PricingViewProps> = ({ onBuy, highlight }) => {
  const { user, tier, planUntil, entitlements } = useAccess();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Catalog>('/api/catalog').then(setCatalog).catch((e) => setError(e.message));
  }, []);

  const plans = useMemo(() => catalog?.products.filter((p) => p.kind === 'plan') ?? [], [catalog]);
  const courses = useMemo(() => catalog?.products.filter((p) => p.kind === 'course') ?? [], [catalog]);
  const ownedLifetime = (p: Product) => entitlements.some((e) => e.productId === p.id && e.expiresAt === null);

  useEffect(() => {
    if (!highlight || !catalog) return;
    document.getElementById(`product-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight, catalog]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-rose-300 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer">Thử lại</button>
      </div>
    );
  }
  if (!catalog) return <div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải bảng giá…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      <header className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Chọn cách học phù hợp với bạn</h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Bắt đầu miễn phí với HSK 1-2 và tiếng Anh A1-A2. Nâng cấp khi bạn sẵn sàng đi xa hơn: mua trọn gói Premium hoặc chỉ mua từng khoá học, học vĩnh viễn.
        </p>
        {catalog.paymentProvider === 'mock' && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <FlaskConical className="w-4 h-4" /> Đang dùng cổng thanh toán THỬ NGHIỆM, không trừ tiền thật.
          </div>
        )}
        {tier !== 'free' && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">
            <BadgeCheck className="w-4 h-4" />
            {tier === 'premium' ? `Bạn đang dùng Premium${planUntil ? `, hạn đến ${formatDate(planUntil)}` : ''}.` : 'Bạn đã sở hữu một số khoá học.'}
          </div>
        )}
      </header>

      {/* Gói Premium */}
      <section className="space-y-4" aria-labelledby="plans-title">
        <h2 id="plans-title" className="text-xl font-black text-white flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> Gói Premium: mở toàn bộ nội dung</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black text-white">Miễn phí</h3>
              <p className="text-xs text-slate-400">Dùng thử không giới hạn thời gian</p>
            </div>
            <p className="text-3xl font-black text-white">0đ</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {['HSK 1-2 đầy đủ', 'Tiếng Anh A1-A2 đầy đủ', `${catalog.aiLimits.free} lượt AI mỗi ngày`, 'Flashcard và luyện đề cơ bản'].map((t) => (
                <li key={t} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
            <button onClick={() => gotoTab({ tab: 'learn' })} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold cursor-pointer">Học thử ngay</button>
          </div>

          {plans.map((p) => {
            const pct = discountPct(p);
            return (
              <div
                key={p.id}
                id={`product-${p.id}`}
                className={`relative rounded-3xl p-6 space-y-4 border ${p.highlight ? 'bg-gradient-to-b from-amber-500/10 to-slate-900 border-amber-500/50 shadow-xl shadow-amber-500/10' : 'bg-slate-900 border-slate-800'} ${highlight === p.id ? 'ring-2 ring-emerald-400' : ''}`}
              >
                {p.highlight && <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">Tiết kiệm nhất</span>}
                <div>
                  <h3 className="text-lg font-black text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.tagline}</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{formatVnd(p.priceVnd)}</p>
                  {pct > 0 && (
                    <p className="text-xs text-slate-400">
                      <span className="line-through">{formatVnd(p.listPriceVnd)}</span> <span className="text-emerald-300 font-bold">giảm {pct}%</span>
                    </p>
                  )}
                  {p.durationDays && <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Hiệu lực {p.durationDays} ngày, không tự gia hạn</p>}
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {['Toàn bộ HSK 3-9', 'Tiếng Anh B1-C1, TOEIC, IELTS', `${catalog.aiLimits.premium} lượt AI mỗi ngày`, 'Mọi nội dung cập nhật trong thời hạn'].map((t) => (
                    <li key={t} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{t}</li>
                  ))}
                </ul>
                <button
                  onClick={() => onBuy(p)}
                  className={`w-full py-2.5 rounded-xl text-sm font-black cursor-pointer ${p.highlight ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'}`}
                >
                  {tier === 'premium' ? 'Gia hạn thêm' : user ? 'Nâng cấp ngay' : 'Đăng nhập để mua'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Khoá lẻ */}
      {(['zh', 'en'] as const).map((g) => {
        const list = courses.filter((c) => scopeGroup(c) === g);
        if (!list.length) return null;
        return (
          <section key={g} className="space-y-4" aria-label={g === 'zh' ? 'Khoá tiếng Trung' : 'Khoá tiếng Anh'}>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> {g === 'zh' ? 'Khoá học tiếng Trung' : 'Khoá học tiếng Anh'}
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><InfinityIcon className="w-3.5 h-3.5" /> mua một lần, học vĩnh viễn</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((p) => {
                const pct = discountPct(p);
                const owned = ownedLifetime(p);
                const viaPlan = !owned && p.scopes.every((s) => entitlements.some((e) => e.kind === 'plan' && e.scopes.includes(s)));
                return (
                  <div key={p.id} id={`product-${p.id}`} className={`rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3 ${highlight === p.id ? 'ring-2 ring-emerald-400' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-white">{p.name}</h3>
                        <p className="text-xs text-slate-400">{p.tagline}</p>
                      </div>
                      {pct > 0 && <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-black shrink-0">-{pct}%</span>}
                    </div>
                    <p className="text-xs text-slate-400 flex-1">{p.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.scopes.map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">{SCOPE_LABEL[s] || s}</span>)}
                    </div>
                    <div className="flex items-end justify-between gap-2 pt-1">
                      <div>
                        <p className="text-xl font-black text-white">{formatVnd(p.priceVnd)}</p>
                        {pct > 0 && <p className="text-[11px] text-slate-500 line-through">{formatVnd(p.listPriceVnd)}</p>}
                      </div>
                      {owned ? (
                        <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-black flex items-center gap-1"><BadgeCheck className="w-4 h-4" /> Đã sở hữu</span>
                      ) : (
                        <button onClick={() => onBuy(p)} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer">
                          {viaPlan ? 'Mua vĩnh viễn' : user ? 'Mua khoá học' : 'Đăng nhập để mua'}
                        </button>
                      )}
                    </div>
                    {viaPlan && <p className="text-[11px] text-sky-300 flex items-center gap-1"><Lock className="w-3 h-3" /> Đang mở nhờ Premium; mua để học vĩnh viễn sau khi hết hạn.</p>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 grid sm:grid-cols-3 gap-5 text-sm">
        <div className="flex gap-3"><ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" /><div><p className="font-bold text-white">Thanh toán an toàn</p><p className="text-xs text-slate-400 mt-1">Giao dịch xử lý qua cổng thanh toán. Hệ thống không lưu số thẻ của bạn.</p></div></div>
        <div className="flex gap-3"><Sparkles className="w-6 h-6 text-amber-400 shrink-0" /><div><p className="font-bold text-white">Mở khoá tự động</p><p className="text-xs text-slate-400 mt-1">Thanh toán xong, quyền học được kích hoạt ngay trên tài khoản.</p></div></div>
        <div className="flex gap-3"><BadgeCheck className="w-6 h-6 text-sky-400 shrink-0" /><div><p className="font-bold text-white">Hoàn tiền trong 7 ngày</p><p className="text-xs text-slate-400 mt-1">Xem <button onClick={() => gotoTab({ tab: 'legal', legal: 'refund' })} className="underline text-sky-300 cursor-pointer">chính sách hoàn tiền</button>. Hỗ trợ: {catalog.support.email}.</p></div></div>
      </section>
    </div>
  );
};

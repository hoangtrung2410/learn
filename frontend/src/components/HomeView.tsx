import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Crown,
  Layers,
  Loader2,
  MessageCircle,
  Mic,
  Search,
  Sparkles,
  Timer,
  UserPlus,
  Map as MapIcon,
} from 'lucide-react';
import { useAccess } from '../lib/access';
import { api, formatVnd } from '../lib/api';

type Tab = 'learn' | 'pricing' | 'study' | 'speaking' | 'roleplay' | 'hsk-prep' | 'english-vocab';

interface HomeViewProps {
  onNavigate: (tab: Tab) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

interface CatalogProduct {
  id: string;
  kind: 'plan' | 'course';
  name: string;
  tagline: string;
  priceVnd: number;
  listPriceVnd: number;
  durationDays: number | null;
  highlight: boolean;
}

const STATS = [
  { value: '~6.700', label: 'từ vựng tiếng Trung HSK 1-9' },
  { value: '~4.100', label: 'từ vựng tiếng Anh A1-C1, TOEIC, IELTS' },
  { value: '250+', label: 'điểm ngữ pháp' },
  { value: 'AI', label: 'luyện đề, hội thoại, chấm phát âm' },
];

const FEATURES: { icon: React.ReactNode; title: string; desc: string; tab: Tab; cta: string }[] = [
  { icon: <Layers size={22} />, title: 'Flashcard ôn tập ngắt quãng', desc: 'Từ khó được nhắc lại đúng lúc sắp quên, giúp nhớ lâu mà không phải học dồn.', tab: 'study', cta: 'Mở flashcard' },
  { icon: <Timer size={22} />, title: 'Luyện đề thi thử tính giờ', desc: 'Làm đề có bấm giờ như thi thật, xem đáp án và giải thích sau khi nộp bài.', tab: 'hsk-prep', cta: 'Luyện đề' },
  { icon: <MessageCircle size={22} />, title: 'Hội thoại AI, 31 tình huống', desc: 'Nhập vai trò chuyện với AI trong các tình huống đời thường và công việc.', tab: 'roleplay', cta: 'Thử hội thoại' },
  { icon: <Mic size={22} />, title: 'Chấm phát âm bằng AI', desc: 'Đọc to một câu, nhận nhận xét về phát âm để sửa ngay tại chỗ.', tab: 'speaking', cta: 'Luyện nói' },
  { icon: <Search size={22} />, title: 'Tra từ bằng AI', desc: 'Hỏi nghĩa, cách dùng và ví dụ của bất kỳ từ nào, giải thích bằng tiếng Việt.', tab: 'english-vocab', cta: 'Tra từ' },
  { icon: <MapIcon size={22} />, title: 'Lộ trình HSK / CEFR', desc: 'Học từng cấp theo thứ tự rõ ràng, từ HSK 1 đến 9 và từ A1 đến C1.', tab: 'learn', cta: 'Xem lộ trình' },
];

const FREE_ITEMS = ['Tiếng Trung HSK 1-2', 'Tiếng Anh A1-A2', '5 lượt dùng AI mỗi ngày', 'Flashcard và luyện tập cơ bản'];
const PAID_ITEMS = ['Tiếng Trung HSK 3-9', 'Tiếng Anh B1-C1', 'Nội dung TOEIC và IELTS', 'Nhiều lượt dùng AI hơn mỗi ngày'];

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: 'Tôi có học được trên điện thoại không?', a: 'Có. Website hiển thị tốt trên điện thoại, máy tính bảng và máy tính, chỉ cần trình duyệt và kết nối Internet. Đăng nhập cùng một tài khoản trên thiết bị nào cũng học tiếp được.' },
  { q: 'Thanh toán bằng cách nào?', a: 'Thanh toán qua cổng VNPay, hỗ trợ thẻ ATM nội địa, quét mã QR và thẻ quốc tế. Hệ thống không lưu số thẻ của bạn.' },
  { q: 'Sau khi thanh toán bao lâu thì mở khoá?', a: 'Tự động ngay khi thanh toán thành công. Bạn không cần chờ duyệt thủ công; nếu chưa thấy, hãy tải lại trang hoặc liên hệ hỗ trợ.' },
  { q: 'Chính sách hoàn tiền thế nào?', a: 'Vui lòng xem trang Chính sách hoàn tiền ở chân trang để biết điều kiện và cách yêu cầu hoàn tiền.' },
  { q: 'Khoá vĩnh viễn khác gói Premium thế nào?', a: 'Khoá học vĩnh viễn mở một phạm vi nội dung cụ thể (ví dụ một cấp độ) và dùng được lâu dài. Gói Premium mở rộng quyền truy cập theo thời hạn đăng ký và có thêm lượt dùng AI. Chi tiết từng sản phẩm xem ở trang Khoá học & bảng giá.' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, tier } = useAccess();
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api<{ products: CatalogProduct[] }>('/api/catalog')
      .then((r) => { if (alive) setProducts(Array.isArray(r?.products) ? r.products : []); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-8 sm:space-y-12 pb-8 overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 p-5 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles size={14} /> LinguaHub AI
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight text-white">
            Học tiếng Trung và tiếng Anh <span className="text-emerald-400">có AI đồng hành</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Kho từ vựng đầy đủ, ngữ pháp có hệ thống, luyện đề tính giờ, hội thoại và chấm phát âm bằng AI. Học theo lộ trình HSK và CEFR, ôn đúng lúc để nhớ lâu.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={() => onNavigate('learn')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              {user ? 'Vào học tiếp' : 'Học thử miễn phí'} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Xem khoá học & bảng giá
            </button>
            {!user && (
              <button
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-5 py-3 font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              >
                <UserPlus size={18} /> Tạo tài khoản
              </button>
            )}
          </div>
          {user && (
            <p className="mt-4 text-sm text-slate-400">
              Xin chào, {user.name || user.username}.{' '}
              {tier === 'free' ? 'Bạn đang dùng gói miễn phí.' : tier === 'premium' ? 'Bạn đang dùng gói Premium.' : 'Bạn đã mở khoá nội dung trả phí.'}
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{s.value}</div>
            <div className="mt-1 text-xs sm:text-sm text-slate-400 leading-snug">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Bạn sẽ học được gì</h2>
        <p className="mt-1 text-slate-400">Bấm vào từng mục để dùng thử ngay.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.tab)}
              className="group text-left rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500/50 hover:bg-slate-900 transition-colors"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">{f.icon}</div>
              <h3 className="mt-3 font-bold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all">
                {f.cta} <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Free vs paid */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Miễn phí và trả phí</h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-white"><BookOpen size={20} className="text-slate-400" /> Miễn phí</div>
            <ul className="mt-4 space-y-2.5">
              {FREE_ITEMS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-slate-300"><Check size={18} className="mt-0.5 shrink-0 text-emerald-400" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-white"><Crown size={20} className="text-amber-400" /> Trả phí</div>
            <ul className="mt-4 space-y-2.5">
              {PAID_ITEMS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-slate-200"><Check size={18} className="mt-0.5 shrink-0 text-emerald-400" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Xem nhanh bảng giá</h2>
          <button onClick={() => onNavigate('pricing')} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
            Xem tất cả <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-5">
          {!products && !failed && (
            <div className="flex items-center gap-2 text-slate-400"><Loader2 size={18} className="animate-spin" /> Đang tải bảng giá...</div>
          )}
          {failed && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-400">
              Chưa tải được bảng giá lúc này. Bạn vẫn có thể{' '}
              <button onClick={() => onNavigate('pricing')} className="font-semibold text-emerald-400 underline">xem trang bảng giá</button>.
            </div>
          )}
          {products && products.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-400">Hiện chưa có sản phẩm nào.</div>
          )}
          {products && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {products.slice(0, 3).map((p) => (
                <div key={p.id} className={`flex flex-col rounded-2xl border p-5 ${p.highlight ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white">{p.name}</h3>
                    {p.highlight && <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-slate-950">Nổi bật</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-400 flex-1">{p.tagline}</p>
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-emerald-400">{formatVnd(p.priceVnd)}</span>
                    {p.listPriceVnd > p.priceVnd && <span className="ml-2 text-sm text-slate-500 line-through">{formatVnd(p.listPriceVnd)}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{p.durationDays ? `Thời hạn ${p.durationDays} ngày` : 'Dùng vĩnh viễn'}</div>
                  <button onClick={() => onNavigate('pricing')} className="mt-4 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 transition-colors">
                    Xem chi tiết
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Câu hỏi thường gặp</h2>
        <div className="mt-5 space-y-2.5 max-w-3xl">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-slate-800 bg-slate-900/60 open:border-emerald-500/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-slate-100 [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 text-center">
        <Brain size={28} className="mx-auto text-emerald-400" />
        <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white">Bắt đầu học ngay hôm nay</h2>
        <p className="mt-1 text-slate-400">Học thử miễn phí, nâng cấp khi bạn cần học sâu hơn.</p>
        <button onClick={() => onNavigate('learn')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition-colors">
          {user ? 'Vào học tiếp' : 'Học thử miễn phí'} <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
};

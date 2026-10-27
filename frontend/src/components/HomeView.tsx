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

const BENTO = ['lg:col-span-3', 'lg:col-span-3', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-6'];

const FEATURES: { icon: React.ReactNode; title: string; desc: string; tab: Tab; cta: string; tone: string }[] = [
  { icon: <Layers size={22} />, title: 'Flashcard ôn tập ngắt quãng', desc: 'Từ khó được nhắc lại đúng lúc sắp quên, giúp nhớ lâu mà không phải học dồn.', tab: 'study', cta: 'Mở flashcard', tone: 'from-emerald-500/25 to-emerald-900/10' },
  { icon: <Timer size={22} />, title: 'Luyện đề thi thử tính giờ', desc: 'Làm đề có bấm giờ như thi thật, xem đáp án và giải thích sau khi nộp bài.', tab: 'hsk-prep', cta: 'Luyện đề', tone: 'from-rose-500/25 to-rose-900/10' },
  { icon: <MessageCircle size={22} />, title: 'Hội thoại AI, 31 tình huống', desc: 'Nhập vai trò chuyện với AI trong các tình huống đời thường và công việc.', tab: 'roleplay', cta: 'Thử hội thoại', tone: 'from-violet-500/25 to-violet-900/10' },
  { icon: <Mic size={22} />, title: 'Chấm phát âm bằng AI', desc: 'Đọc to một câu, nhận nhận xét về phát âm để sửa ngay tại chỗ.', tab: 'speaking', cta: 'Luyện nói', tone: 'from-amber-500/25 to-amber-900/10' },
  { icon: <Search size={22} />, title: 'Tra từ bằng AI', desc: 'Hỏi nghĩa, cách dùng và ví dụ của bất kỳ từ nào, giải thích bằng tiếng Việt.', tab: 'english-vocab', cta: 'Tra từ', tone: 'from-sky-500/25 to-sky-900/10' },
  { icon: <MapIcon size={22} />, title: 'Lộ trình HSK / CEFR', desc: 'Học từng cấp theo thứ tự rõ ràng, từ HSK 1 đến 9 và từ A1 đến C1.', tab: 'learn', cta: 'Xem lộ trình', tone: 'from-teal-500/30 via-slate-900 to-indigo-900/40' },
];

const BOOKS = [
  { no: 1, lessons: 15, grad: 'from-emerald-500/40 to-emerald-900/30', samples: ['我叫李文', '我有两个孩子', '请给我一杯茶'] },
  { no: 2, lessons: 15, grad: 'from-amber-500/40 to-orange-900/30', samples: ['还是打车去北大吧', '虽然你忘了，但是我记得', '就要考试了'] },
  { no: 3, lessons: 18, grad: 'from-sky-500/40 to-indigo-900/40', samples: ['这个小区挺好的', '你明天再把书还给我', '我学会了包饺子'] },
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
    <div className="mx-auto w-full max-w-6xl space-y-14 px-4 pb-8 pt-4 sm:space-y-20 overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220] p-6 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute -top-40 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="pointer-events-none absolute -right-6 -top-10 select-none font-chinese text-[22rem] font-black leading-none text-white/[0.035]">学</div>
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles size={14} /> Học theo Giáo trình New HSK chuẩn
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl">
              Nói được tiếng Trung,
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">từng bài một.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              48 bài đúng giáo trình HSK 1–3, thêm flashcard nhắc lại đúng lúc, luyện đề tính giờ và AI chấm phát âm. Cả tiếng Anh cũng học ở đây.
            </p>
            <div className="mt-7 flex flex-col flex-wrap gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate('learn')}
                className="btn-tactile-green inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-extrabold text-slate-950"
              >
                {user ? 'Vào học tiếp' : 'Học thử miễn phí'} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur hover:bg-white/10 transition-colors"
              >
                Xem khoá học & bảng giá
              </button>
              {!user && (
                <button
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
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

          {/* Lesson card stack */}
          <div className="relative mx-auto hidden h-[26rem] w-full max-w-md sm:block">
            <div className="absolute left-6 top-14 w-[88%] rotate-[-6deg] rounded-3xl border border-white/10 bg-gradient-to-br from-amber-400/25 to-amber-600/10 p-5 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-200">New HSK 2 · Bài 7</div>
              <div className="mt-2 font-chinese text-2xl font-bold text-white">他篮球打得很好</div>
            </div>
            <div className="absolute right-0 top-4 w-[86%] rotate-[5deg] rounded-3xl border border-white/10 bg-gradient-to-br from-sky-400/25 to-indigo-600/15 p-5 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-200">New HSK 3 · Bài 14</div>
              <div className="mt-2 font-chinese text-2xl font-bold text-white">这本书被别人借走了</div>
            </div>
            <div className="absolute inset-x-2 bottom-4 rounded-3xl border border-emerald-300/30 bg-slate-900/90 p-6 shadow-[0_30px_80px_-20px_rgba(16,185,129,0.45)]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-300">
                <span>New HSK 1 · Bài 3</span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] normal-case tracking-normal">+20 XP</span>
              </div>
              <div className="mt-4 font-chinese text-4xl font-black text-white">我是中国人</div>
              <div className="mt-1 text-sm text-slate-400">Wǒ shì Zhōngguó rén</div>
              <div className="mt-3 text-sm font-semibold text-slate-200">Mình là người Trung Quốc</div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Câu 2/5</span>
                <span className="inline-flex items-center gap-1"><Mic size={12} /> Luyện nói với AI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-x-4 gap-y-6 px-2 sm:px-6 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div key={s.label} className={`${i > 0 ? 'lg:border-l lg:border-white/10 lg:pl-8' : ''}`}>
            <div className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">{s.value}</div>
            <div className="mt-1.5 text-xs leading-snug text-slate-400 sm:text-sm">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Path: 3 books */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Lộ trình đúng giáo trình</h2>
            <p className="mt-1 text-slate-400">Mỗi bài trong app là một bài của sách New HSK. Cứ học lần lượt là xong.</p>
          </div>
          <button onClick={() => onNavigate('learn')} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
            Mở lộ trình <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {BOOKS.map((bk) => (
            <button
              key={bk.no}
              onClick={() => onNavigate('learn')}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${bk.grad} p-6 text-left transition-transform hover:-translate-y-1`}
            >
              <div className="pointer-events-none absolute -right-3 -top-6 select-none font-chinese text-[9rem] font-black leading-none text-white/10">{bk.no}</div>
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-widest text-white/70">New HSK</div>
                <div className="mt-1 text-5xl font-black text-white">HSK {bk.no}</div>
                <div className="mt-1 text-sm font-semibold text-white/80">{bk.lessons} bài · {bk.lessons / 3} chặng</div>
                <ul className="mt-5 space-y-1.5">
                  {bk.samples.map((t) => (
                    <li key={t} className="font-chinese text-base font-semibold text-white/95">{t}</li>
                  ))}
                  <li className="text-sm text-white/60">…</li>
                </ul>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-white group-hover:gap-2 transition-all">
                  Bắt đầu cấp {bk.no} <ArrowRight size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Features: bento */}
      <section>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Học bằng cách nào</h2>
        <p className="mt-1 text-slate-400">Bấm vào từng mục để dùng thử ngay.</p>
        <div className="mt-6 grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.tab)}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${f.tone} p-6 text-left transition-all hover:-translate-y-1 hover:border-white/25 ${BENTO[i]}`}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">{f.icon}</div>
              <h3 className="mt-4 text-lg font-extrabold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300/90">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-white group-hover:gap-2 transition-all">
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

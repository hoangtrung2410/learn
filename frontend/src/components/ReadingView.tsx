import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Eye, EyeOff, Languages, Star, Volume2 } from 'lucide-react';
import { LanguageCode } from '../types';
import { READING_ARTICLES, ReadingArticle, ReadingNote } from '../data/readingData';
import { toPinyin } from '../data/newHskBuilder';
import { speakNativeText } from '../utils/audio';

type Mode = 'both' | 'orig' | 'vi';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tách đoạn văn thành các mảnh, đánh dấu những mảnh trùng với từ mới. */
const splitByNotes = (text: string, notes: ReadingNote[], lang: 'zh' | 'en') => {
  const words = [...notes].sort((a, b) => b.word.length - a.word.length).map((n) => esc(n.word));
  if (!words.length) return [{ t: text, note: null as ReadingNote | null }];
  const re = new RegExp(lang === 'en' ? `\\b(${words.join('|')})\\b` : `(${words.join('|')})`, 'gi');
  const out: { t: string; note: ReadingNote | null }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ t: text.slice(last, m.index), note: null });
    const note = notes.find((n) => n.word.toLowerCase() === m[0].toLowerCase()) ?? null;
    out.push({ t: m[0], note });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), note: null });
  return out;
};

const loadSaved = (): string[] => { try { return JSON.parse(localStorage.getItem('lp_reading_saved') || '[]'); } catch { return []; } };

const Reader: React.FC<{ article: ReadingArticle; onBack: () => void }> = ({ article, onBack }) => {
  const [mode, setMode] = useState<Mode>('both');
  const [showPy, setShowPy] = useState(article.lang === 'zh');
  const [active, setActive] = useState<ReadingNote | null>(null);
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const zh = article.lang === 'zh';
  const key = (n: ReadingNote) => `${article.id}:${n.word}`;
  const toggleSave = (n: ReadingNote) => {
    const next = saved.includes(key(n)) ? saved.filter((k) => k !== key(n)) : [...saved, key(n)];
    setSaved(next);
    try { localStorage.setItem('lp_reading_saved', JSON.stringify(next)); } catch { /* bỏ qua */ }
  };
  const say = (t: string) => void speakNativeText(t, article.lang);
  const reading = (n: ReadingNote) => (zh ? toPinyin(n.word) : n.ipa || '');

  const NoteCard: React.FC<{ n: ReadingNote; highlight?: boolean }> = ({ n, highlight }) => (
    <div id={`note-${n.word}`} className={`rounded-2xl border p-3 transition-colors ${highlight ? 'border-amber-400/70 bg-amber-400/10' : 'border-slate-800 bg-slate-950/50'}`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => { setActive(n); say(n.word); }} className="min-w-0 flex-1 text-left">
          <div className={`${zh ? 'font-chinese text-xl' : 'text-lg'} font-black text-white`}>{n.word}</div>
          <div className="text-xs font-semibold text-blue-300">{reading(n)} {n.pos && <span className="ml-1 font-normal text-slate-500">· {n.pos}</span>}</div>
          <div className="mt-0.5 text-sm text-slate-200">{n.meaning}</div>
        </button>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => say(n.word)} aria-label="Nghe" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-300"><Volume2 className="h-4 w-4" /></button>
          <button onClick={() => toggleSave(n)} aria-label="Lưu từ" className="rounded-lg p-1.5 hover:bg-slate-800"><Star className={`h-4 w-4 ${saved.includes(key(n)) ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Danh sách bài đọc</button>
      <div className="mb-4">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">{article.level}</span>
          <span className="text-slate-500">{article.topic}</span>
        </div>
        <h1 className={`${zh ? 'font-chinese' : ''} text-2xl font-black text-white sm:text-3xl`}>{article.title}</h1>
        <p className="text-sm text-slate-400">{article.titleVi}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs font-bold">
          {([['both', 'Song ngữ'], ['orig', zh ? 'Chỉ tiếng Trung' : 'Chỉ tiếng Anh'], ['vi', 'Chỉ tiếng Việt']] as [Mode, string][]).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 ${mode === m ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
        {zh && (
          <button onClick={() => setShowPy(!showPy)} className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300">
            {showPy ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Pinyin
          </button>
        )}
        <button onClick={() => say(article.paras.map((p) => p.text).join(zh ? '' : ' '))} className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"><Volume2 className="h-3.5 w-3.5" /> Nghe cả bài</button>
      </div>

      {active && (
        <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
          <div className="rounded-2xl border border-amber-400/60 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className={`${zh ? 'font-chinese text-2xl' : 'text-xl'} font-black text-white`}>{active.word}</div>
                <div className="text-xs font-semibold text-blue-300">{reading(active)}{active.pos ? ` · ${active.pos}` : ''}</div>
                <div className="mt-0.5 text-sm text-slate-100">{active.meaning}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => say(active.word)} aria-label="Nghe" className="rounded-lg p-2 text-emerald-300"><Volume2 className="h-5 w-5" /></button>
                <button onClick={() => toggleSave(active)} aria-label="Lưu từ" className="rounded-lg p-2"><Star className={`h-5 w-5 ${saved.includes(key(active)) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /></button>
                <button onClick={() => setActive(null)} aria-label="Đóng" className="rounded-lg p-2 text-slate-400">✕</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <article className="space-y-3">
          {article.paras.map((p, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 md:grid-cols-2" style={mode !== 'both' ? { gridTemplateColumns: '1fr' } : undefined}>
              {mode !== 'vi' && (
                <div>
                  <p className={`${zh ? 'font-chinese text-lg leading-[2.1]' : 'text-base leading-relaxed'} font-semibold text-white`}>
                    {splitByNotes(p.text, article.notes, article.lang).map((seg, k) => seg.note ? (
                      <button key={k} onClick={() => { setActive(seg.note); say(seg.note!.word); document.getElementById(`note-${seg.note!.word}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }}
                        className={`rounded px-0.5 underline decoration-amber-400 decoration-2 underline-offset-4 ${active?.word === seg.note.word ? 'bg-amber-400/25 text-amber-100' : 'bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'}`}>{seg.t}</button>
                    ) : <span key={k}>{seg.t}</span>)}
                  </p>
                  {zh && showPy && <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-300/90">{toPinyin(p.text)}</p>}
                </div>
              )}
              {mode !== 'orig' && <p className="border-slate-800 text-sm leading-relaxed text-slate-300 md:border-l md:pl-4" style={mode === 'both' ? undefined : { border: 0, paddingLeft: 0 }}>{p.vi}</p>}
            </div>
          ))}
        </article>

        {/* Cột ghi chú từ mới */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black text-amber-300"><Languages className="h-4 w-4" /> Từ mới ({article.notes.length})</h2>
              <span className="text-[11px] text-slate-500">★ {saved.filter((k) => k.startsWith(article.id + ':')).length} đã lưu</span>
            </div>
            <p className="mb-3 text-xs text-slate-500">Chạm vào từ được gạch chân trong bài để xem ghi chú và nghe đọc.</p>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {article.notes.map((n) => <NoteCard key={n.word} n={n} highlight={active?.word === n.word} />)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export const ReadingView: React.FC<{ currentLang: LanguageCode }> = ({ currentLang }) => {
  const lang: 'zh' | 'en' = currentLang === 'en' ? 'en' : 'zh';
  const list = useMemo(() => READING_ARTICLES.filter((a) => a.lang === lang), [lang]);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = list.find((a) => a.id === openId);
  if (open) return <Reader article={open} onBack={() => setOpenId(null)} />;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight text-white"><BookOpen className="h-7 w-7 text-emerald-400" /> Đọc báo song ngữ</h1>
      <p className="mb-6 mt-1 text-slate-400">Bài đọc ngắn {lang === 'zh' ? 'tiếng Trung' : 'tiếng Anh'} kèm bản dịch tiếng Việt. Từ mới được ghi chú ngay bên cạnh, chạm vào để nghe và lưu lại.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <button key={a.id} onClick={() => setOpenId(a.id)} className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-left transition-transform hover:-translate-y-1 hover:border-emerald-400/40">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">{a.level}</span>
              <span className="text-slate-500">{a.topic}</span>
            </div>
            <h3 className={`${lang === 'zh' ? 'font-chinese' : ''} text-xl font-black text-white`}>{a.title}</h3>
            <p className="text-xs text-slate-400">{a.titleVi}</p>
            <p className="mt-2 text-sm text-slate-300/90">{a.summary}</p>
            <div className="mt-3 text-xs font-bold text-amber-300">{a.paras.length >= 7 ? '📖 Bài dài · ' : ''}{a.paras.length} đoạn · {a.notes.length} từ mới →</div>
          </button>
        ))}
      </div>
    </div>
  );
};

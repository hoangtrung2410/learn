import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  ClipboardCheck,
  BookOpenText,
  Volume2,
  RotateCw,
  CheckCircle2,
  XCircle,
  Timer,
  Trophy,
  Search,
  Loader2,
  Repeat,
} from 'lucide-react';
import { LanguageCode } from '../types';
import {
  loadZhVocab,
  loadEnVocab,
  loadQuizBank,
  loadGrammar,
  QuizQuestion,
  GrammarEntry,
} from '../data/packLoader';
import { speakNativeText, playPopSound, playSuccessSound, playErrorSound } from '../utils/audio';
import { useAccess, zhLevelScope, enLevelScope } from '../lib/access';
import { LockedPanel } from './LockedPanel';

const levelScope = (lang: 'zh' | 'en', level: string, type?: string): string =>
  lang === 'zh' ? zhLevelScope(Number(level)) : enLevelScope(level, type === 'ielts' || type === 'toeic' ? type : undefined);
const chipLabel = (lang: 'zh' | 'en', l: string, locked: boolean) =>
  `${lang === 'zh' ? (l === '7' ? 'HSK 7-9' : `HSK ${l}`) : l}${locked ? ' 🔒' : ''}`;

interface Props {
  currentLang: LanguageCode;
  onAddXp: (amount: number) => void;
}

type SubTab = 'srs' | 'quiz' | 'grammar';

interface StudyCard {
  id: string;
  level: string;
  scope: string;
  front: string;
  reading?: string;
  meaning: string;
  extra?: string;
  example?: string;
  examplePron?: string;
  exampleVi?: string;
}

const DAY = 86400000;
const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bộ nhớ đầy hoặc bị chặn */
  }
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const StudyCenterView: React.FC<Props> = ({ currentLang, onAddXp }) => {
  const lang: 'zh' | 'en' = currentLang === 'en' ? 'en' : 'zh';
  const [tab, setTab] = useState<SubTab>('srs');
  const accent = lang === 'zh' ? 'amber' : 'emerald';

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="text-2xl font-black">
          {lang === 'zh' ? '🇨🇳 Ôn luyện HSK' : '🇬🇧 Ôn luyện Tiếng Anh (TOEIC / IELTS)'}
        </h1>
        <span className="text-xs text-slate-400">Học offline, tiến độ lưu ngay trên máy của bạn</span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            ['srs', 'Flashcard ghi nhớ', Brain],
            ['quiz', 'Luyện đề & Thi thử', ClipboardCheck],
            ['grammar', 'Ngữ pháp', BookOpenText],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => {
              playPopSound();
              setTab(id);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
              tab === id
                ? accent === 'amber'
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {currentLang !== 'zh' && currentLang !== 'en' && (
        <p className="text-sm text-slate-400 mb-4">Ngôn ngữ này chưa có ngân hàng ôn luyện, hiển thị tiếng Trung.</p>
      )}

      {tab === 'srs' && <SrsPanel key={lang} lang={lang} onAddXp={onAddXp} />}
      {tab === 'quiz' && <QuizPanel key={lang} lang={lang} onAddXp={onAddXp} />}
      {tab === 'grammar' && <GrammarPanel key={lang} lang={lang} />}
    </div>
  );
};

const Loading = () => (
  <div className="flex items-center gap-2 text-slate-400 py-10 justify-center">
    <Loader2 className="w-5 h-5 animate-spin" /> Đang tải dữ liệu...
  </div>
);

const LevelChips: React.FC<{
  levels: string[];
  value: string;
  onChange: (v: string) => void;
  labelOf?: (l: string) => string;
}> = ({ levels, value, onChange, labelOf }) => (
  <div className="flex gap-1.5 flex-wrap">
    {['all', ...levels].map((l) => (
      <button
        key={l}
        onClick={() => onChange(l)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
          value === l
            ? 'bg-sky-500 text-slate-950 border-sky-500'
            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
        }`}
      >
        {l === 'all' ? 'Tất cả' : labelOf ? labelOf(l) : l}
      </button>
    ))}
  </div>
);

/* ============================================================== SRS */
interface SrsState {
  box: number;
  due: number;
}

const SrsPanel: React.FC<{ lang: 'zh' | 'en'; onAddXp: (n: number) => void }> = ({ lang, onAddXp }) => {
  const { hasScope } = useAccess();
  const [cards, setCards] = useState<StudyCard[] | null>(null);
  const [level, setLevel] = useState('all');
  const [srs, setSrs] = useState<Record<string, SrsState>>(() => readLS(`lp_srs_${lang}`, {}));
  const [newPerSession, setNewPerSession] = useState(20);
  const [queue, setQueue] = useState<StudyCard[]>([]);
  const [started, setStarted] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (lang === 'zh') {
        const v = await loadZhVocab();
        if (!alive) return;
        setCards(
          v.map((w) => ({
            id: w.id,
            level: String(w.level),
            scope: zhLevelScope(w.level),
            front: w.hanzi,
            reading: w.pinyin,
            meaning: w.meaning,
            extra: [w.partOfSpeech, w.sinoViet ? `Hán Việt: ${w.sinoViet}` : ''].filter(Boolean).join(' · '),
            example: w.exampleHanzi,
            examplePron: w.examplePinyin,
            exampleVi: w.exampleVi,
          }))
        );
      } else {
        const v = await loadEnVocab();
        if (!alive) return;
        setCards(
          v.map((w) => ({
            id: w.id,
            level: w.level,
            scope: enLevelScope(w.level, w.pack === 'en-toeic' ? 'toeic' : w.pack === 'en-ielts' ? 'ielts' : undefined),
            front: w.word,
            reading: w.ipa,
            meaning: w.meaningVi,
            extra: [w.partOfSpeech, w.topic, w.collocation ? `Cụm: ${w.collocation}` : ''].filter(Boolean).join(' · '),
            example: w.exampleEn,
            exampleVi: w.exampleVi,
          }))
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  useEffect(() => {
    writeLS(`lp_srs_${lang}`, srs);
  }, [srs, lang]);

  const levels = lang === 'zh' ? ['1', '2', '3', '4', '5', '6', '7'] : ['A1', 'A2', 'B1', 'B2', 'C1'];

  const pool = useMemo(() => (cards || []).filter((c) => hasScope(c.scope) && (level === 'all' || c.level === level)), [cards, level, hasScope]);
  const lockedScope = level !== 'all' && !hasScope(levelScope(lang, level)) ? levelScope(lang, level) : null;
  const lockedTotal = (cards || []).filter((c) => !hasScope(c.scope)).length;
  const stats = useMemo(() => {
    const now = Date.now();
    let learned = 0,
      due = 0,
      mastered = 0;
    for (const c of pool) {
      const s = srs[c.id];
      if (!s) continue;
      learned++;
      if (s.due <= now) due++;
      if (s.box >= 5) mastered++;
    }
    return { total: pool.length, learned, due, mastered, fresh: pool.length - learned };
  }, [pool, srs]);

  const start = () => {
    const now = Date.now();
    const dueCards = pool.filter((c) => srs[c.id] && srs[c.id].due <= now);
    const fresh = pool.filter((c) => !srs[c.id]).slice(0, newPerSession);
    const q = shuffle([...dueCards.slice(0, 60), ...fresh]);
    setQueue(q);
    setDone(0);
    setFlipped(false);
    setStarted(true);
  };

  const current = queue[0];

  const rate = (grade: 0 | 1 | 2) => {
    if (!current) return;
    const prev = srs[current.id]?.box ?? 0;
    const box = grade === 0 ? 0 : grade === 1 ? Math.max(1, prev) : Math.min(INTERVALS.length - 1, prev + 1);
    const due = Date.now() + (grade === 0 ? 0 : INTERVALS[box] * DAY);
    setSrs((s) => ({ ...s, [current.id]: { box, due } }));
    setQueue((q) => {
      const [head, ...rest] = q;
      // Thẻ quên được xếp lại cuối hàng để ôn ngay trong phiên
      return grade === 0 ? [...rest.slice(0, 6), head, ...rest.slice(6)] : rest;
    });
    setDone((d) => d + 1);
    setFlipped(false);
    if (grade === 2) onAddXp(2);
    playPopSound();
  };

  if (!cards) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <LevelChips
          levels={levels}
          value={level}
          onChange={(l) => {
            setLevel(l);
            setStarted(false);
          }}
          labelOf={(l) => chipLabel(lang, l, !hasScope(levelScope(lang, l)))}
        />
      </div>

      {lockedScope ? (
        <LockedPanel scope={lockedScope} what={`Ôn tập ${chipLabel(lang, level, false)}`} />
      ) : (
      <>
      {level === 'all' && lockedTotal > 0 && (
        <p className="text-xs text-amber-300">{lockedTotal.toLocaleString('vi-VN')} thẻ nâng cao đang khoá. Mua khoá học để ôn thêm.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Tổng số từ', stats.total],
          ['Đã học', stats.learned],
          ['Cần ôn hôm nay', stats.due],
          ['Đã thuộc', stats.mastered],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-sky-300">{v}</div>
            <div className="text-xs text-slate-400">{k}</div>
          </div>
        ))}
      </div>

      {!started || (!current && started) ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center space-y-4">
          {started && !current ? (
            <>
              <Trophy className="w-10 h-10 mx-auto text-amber-400" />
              <p className="font-bold">Hoàn thành phiên ôn! Bạn đã xem {done} lượt thẻ.</p>
            </>
          ) : (
            <p className="text-slate-300">
              Hệ thống tự xếp lịch ôn theo độ nhớ (lặp lại ngắt quãng): từ cần ôn sẽ hiện trước, sau đó là từ mới.
            </p>
          )}
          <div className="flex items-center justify-center gap-3 text-sm">
            <label className="text-slate-400">Từ mới mỗi phiên</label>
            <select
              value={newPerSession}
              onChange={(e) => setNewPerSession(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <button
            onClick={start}
            disabled={pool.length === 0}
            className="px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-black hover:bg-sky-400 disabled:opacity-40"
          >
            {started ? 'Bắt đầu phiên mới' : 'Bắt đầu ôn tập'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 text-right">Còn {queue.length} thẻ · đã xem {done}</div>
          <div
            onClick={() => {
              setFlipped((f) => !f);
              playPopSound();
            }}
            className="cursor-pointer bg-slate-800/70 border border-slate-600 rounded-3xl p-8 min-h-[320px] flex flex-col items-center justify-center text-center gap-3 select-none"
          >
            <div className={`font-black ${lang === 'zh' ? 'text-6xl font-chinese' : 'text-5xl'}`}>{current.front}</div>
            {current.reading && <div className="text-lg text-sky-300">{current.reading}</div>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakNativeText(current.front, lang);
              }}
              className="p-2 rounded-full bg-slate-700 hover:bg-slate-600"
              aria-label="Phát âm"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            {flipped ? (
              <div className="space-y-2 mt-2">
                <div className="text-2xl font-bold text-emerald-300">{current.meaning}</div>
                {current.extra && <div className="text-xs text-slate-400">{current.extra}</div>}
                {current.example && (
                  <div className="text-sm text-slate-200 mt-2">
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakNativeText(current.example!, lang);
                      }}
                    >
                      {current.example} 🔊
                    </div>
                    {current.examplePron && <div className="text-sky-300/80 text-xs">{current.examplePron}</div>}
                    {current.exampleVi && <div className="text-slate-400 italic">{current.exampleVi}</div>}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Chạm để xem nghĩa
              </div>
            )}
          </div>
          {flipped && (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => rate(0)}
                className="py-3 rounded-xl bg-rose-500/90 text-white font-bold hover:bg-rose-500"
              >
                Quên
              </button>
              <button
                onClick={() => rate(1)}
                className="py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
              >
                Hơi khó
              </button>
              <button
                onClick={() => rate(2)}
                className="py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
              >
                Nhớ rồi
              </button>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
};

/* ============================================================== QUIZ */
const TYPE_LABEL: Record<string, string> = {
  vocab: 'Từ vựng',
  cloze: 'Điền từ',
  grammar: 'Ngữ pháp',
  reading: 'Đọc hiểu',
  listen: 'Nghe hiểu',
  toeic: 'TOEIC',
  ielts: 'IELTS',
};

// Đề thi thử có cấu trúc như đề thật: chia đều các phần, xếp theo thứ tự Nghe → Đọc → Ngữ pháp → Từ vựng.
const SECTION_ORDER = ['listen', 'reading', 'grammar', 'vocab', 'cloze', 'toeic', 'ielts'];
function buildExam(pool: QuizQuestion[], total = 40): QuizQuestion[] {
  const byType = new Map<string, QuizQuestion[]>();
  pool.forEach((q) => byType.set(q.type, [...(byType.get(q.type) || []), q]));
  const types = Array.from(byType.keys()).sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
  if (!types.length) return [];
  const picked: QuizQuestion[] = [];
  const quota = Math.ceil(total / types.length);
  types.forEach((t) => picked.push(...shuffle(byType.get(t)!).slice(0, quota)));
  // Thiếu thì bù từ phần còn dư để đủ số câu.
  if (picked.length < total) {
    const have = new Set(picked.map((q) => q.id));
    picked.push(...shuffle(pool.filter((q) => !have.has(q.id))).slice(0, total - picked.length));
  }
  const trimmed = picked.slice(0, Math.max(total, 0));
  return trimmed.sort((a, b) => SECTION_ORDER.indexOf(a.type) - SECTION_ORDER.indexOf(b.type));
}

// ---- Đề thi trọn bộ: số câu và thời gian bám theo đề thật (HSK 2.0 / CEFR / TOEIC / IELTS Reading).
// Phần Viết/Nói của đề thật chưa có trong app nên không tính vào đề.
type FullSpec = { label: string; filter: (q: QuizQuestion) => boolean; parts: { name: string; types: string[]; n: number }[]; minutes: number };
const ZH_FULL: Record<string, { listen: number; reading: number; lang: number; minutes: number }> = {
  '1': { listen: 20, reading: 10, lang: 10, minutes: 40 },
  '2': { listen: 30, reading: 15, lang: 15, minutes: 55 },
  '3': { listen: 40, reading: 20, lang: 20, minutes: 90 },
  '4': { listen: 45, reading: 25, lang: 30, minutes: 105 },
  '5': { listen: 45, reading: 30, lang: 25, minutes: 125 },
  '6': { listen: 50, reading: 30, lang: 20, minutes: 140 },
};
const EN_FULL: Record<string, { listen: number; reading: number; lang: number; minutes: number }> = {
  A1: { listen: 15, reading: 10, lang: 15, minutes: 40 },
  A2: { listen: 15, reading: 15, lang: 20, minutes: 50 },
  B1: { listen: 20, reading: 15, lang: 25, minutes: 60 },
  B2: { listen: 25, reading: 25, lang: 30, minutes: 80 },
  C1: { listen: 25, reading: 25, lang: 30, minutes: 80 },
};
function fullSpecs(lang: 'zh' | 'en', level: string): FullSpec[] {
  const out: FullSpec[] = [];
  const cfg = (lang === 'zh' ? ZH_FULL : EN_FULL)[level];
  if (cfg) {
    out.push({
      label: lang === 'zh' ? `HSK ${level}` : `CEFR ${level}`,
      filter: (q) => q.level === level && ['listen', 'reading', 'grammar', 'vocab', 'cloze'].includes(q.type),
      parts: [
        { name: 'Nghe hiểu', types: ['listen'], n: cfg.listen },
        { name: 'Đọc hiểu', types: ['reading'], n: cfg.reading },
        { name: 'Ngữ pháp & từ vựng', types: ['grammar', 'vocab', 'cloze'], n: cfg.lang },
      ],
      minutes: cfg.minutes,
    });
  }
  if (lang === 'en') {
    out.push({
      label: 'TOEIC (100 câu)',
      filter: (q) => q.type === 'toeic',
      parts: [{ name: 'Reading — Part 5/6/7', types: ['toeic'], n: 100 }],
      minutes: 75,
    });
    out.push({
      label: 'IELTS Reading (40 câu)',
      filter: (q) => q.type === 'ielts',
      parts: [{ name: 'Reading & Language', types: ['ielts'], n: 40 }],
      minutes: 60,
    });
  }
  return out;
}
function buildFullExam(bank: QuizQuestion[], spec: FullSpec): { qs: QuizQuestion[]; minutes: number } {
  const pool = bank.filter(spec.filter);
  const used = new Set<string>();
  const qs: QuizQuestion[] = [];
  const total = spec.parts.reduce((a, p) => a + p.n, 0);
  for (const part of spec.parts) {
    let cands = shuffle(pool.filter((q) => part.types.includes(q.type) && !used.has(q.id)));
    // Phần "Ngữ pháp & từ vựng": ưu tiên câu soạn tay (grammar), phần còn lại là từ vựng/điền từ.
    if (part.types.includes('grammar')) {
      const hand = cands.filter((q) => q.type === 'grammar');
      const rest = cands.filter((q) => q.type !== 'grammar');
      cands = [...hand.slice(0, Math.ceil(part.n / 2)), ...rest, ...hand.slice(Math.ceil(part.n / 2))];
    }
    cands.slice(0, part.n).forEach((q) => {
      used.add(q.id);
      qs.push(q);
    });
  }
  if (qs.length < total) {
    shuffle(pool.filter((q) => !used.has(q.id)))
      .slice(0, total - qs.length)
      .forEach((q) => qs.push(q));
  }
  // Giữ thứ tự phần như đề thật; thời gian co theo tỷ lệ nếu ngân hàng không đủ câu.
  const minutes = Math.max(5, Math.round((spec.minutes * qs.length) / Math.max(total, 1)));
  return { qs, minutes };
}

const QuizPanel: React.FC<{ lang: 'zh' | 'en'; onAddXp: (n: number) => void }> = ({ lang, onAddXp }) => {
  const { hasScope } = useAccess();
  const [rawBank, setBank] = useState<QuizQuestion[] | null>(null);
  // Chỉ dùng câu hỏi thuộc phần đã mở khoá.
  const bank = useMemo(() => (rawBank ? rawBank.filter((q) => hasScope(levelScope(lang, q.level, q.type))) : null), [rawBank, hasScope, lang]);
  const lockedQuestions = rawBank && bank ? rawBank.length - bank.length : 0;
  const [level, setLevel] = useState('all');
  const [type, setType] = useState('all');
  const [mode, setMode] = useState<'practice' | 'exam' | 'wrong'>('practice');
  const [wrongIds, setWrongIds] = useState<string[]>(() => readLS(`lp_wrong_${lang}`, []));
  const [session, setSession] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    loadQuizBank(lang).then(setBank);
  }, [lang]);

  useEffect(() => {
    writeLS(`lp_wrong_${lang}`, wrongIds);
  }, [wrongIds, lang]);

  const levels = lang === 'zh' ? ['1', '2', '3', '4', '5', '6', '7'] : ['A1', 'A2', 'B1', 'B2', 'C1'];
  const lockedScope = level !== 'all' && !hasScope(levelScope(lang, level)) ? levelScope(lang, level) : null;
  const types = useMemo(() => Array.from(new Set((bank || []).map((q) => q.type))), [bank]);

  const filtered = useMemo(
    () => (bank || []).filter((q) => (level === 'all' || q.level === level) && (type === 'all' || q.type === type)),
    [bank, level, type]
  );

  const finish = (qs: QuizQuestion[], answers: Record<number, number>) => {
    if (timer.current) window.clearInterval(timer.current);
    setFinished(true);
    let right = 0;
    const newWrong = new Set(wrongIds);
    qs.forEach((q, i) => {
      if (answers[i] === q.answer) {
        right++;
        newWrong.delete(q.id);
      } else if (answers[i] !== undefined || mode === 'exam') {
        newWrong.add(q.id);
      }
    });
    setWrongIds(Array.from(newWrong));
    onAddXp(right * 3);
    if (right / Math.max(1, qs.length) >= 0.6) playSuccessSound();
  };

  const start = (m: 'practice' | 'exam' | 'wrong', custom?: { qs: QuizQuestion[]; minutes: number }) => {
    if (!bank) return;
    let qs: QuizQuestion[];
    if (custom) {
      qs = custom.qs;
    } else if (m === 'wrong') {
      const set = new Set(wrongIds);
      qs = shuffle(bank.filter((q) => set.has(q.id))).slice(0, 30);
    } else {
      qs = m === 'exam' ? buildExam(filtered, 40) : shuffle(filtered).slice(0, 10);
    }
    if (qs.length === 0) return;
    setMode(m);
    setSession(qs);
    setIdx(0);
    setPicked({});
    setFinished(false);
    if (timer.current) window.clearInterval(timer.current);
    if (m === 'exam') {
      setSecondsLeft(custom ? custom.minutes * 60 : qs.length * (lang === 'zh' && Number(level) >= 4 ? 60 : 45));
      timer.current = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    }
  };

  useEffect(() => {
    if (mode === 'exam' && session && !finished && secondsLeft <= 0 && timer.current) {
      finish(session, picked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  if (!bank) return <Loading />;

  if (!session) {
    return (
      <div className="space-y-5">
        <LevelChips
          levels={levels}
          value={level}
          onChange={setLevel}
          labelOf={(l) => chipLabel(lang, l, !hasScope(levelScope(lang, l)))}
        />
        {lockedScope && <LockedPanel scope={lockedScope} what={`Đề luyện ${chipLabel(lang, level, false)}`} />}
        {!lockedScope && lockedQuestions > 0 && level === 'all' && (
          <p className="text-xs text-amber-300">{lockedQuestions.toLocaleString('vi-VN')} câu hỏi nâng cao đang khoá. Mua khoá học để luyện thêm.</p>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...types].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                type === t
                  ? 'bg-violet-500 text-white border-violet-500'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t === 'all' ? 'Mọi dạng' : TYPE_LABEL[t] || t}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          Ngân hàng: {bank.length} câu · phù hợp bộ lọc: <b className="text-slate-200">{filtered.length}</b> câu · câu
          làm sai cần ôn: <b className="text-rose-300">{wrongIds.length}</b>
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            onClick={() => start('practice')}
            disabled={!filtered.length}
            className="p-4 rounded-2xl bg-sky-500/90 text-slate-950 font-black text-left disabled:opacity-40"
          >
            <Repeat className="w-5 h-5 mb-1" />
            Luyện tập nhanh
            <div className="text-xs font-medium">10 câu, có đáp án ngay</div>
          </button>
          <button
            onClick={() => start('exam')}
            disabled={!filtered.length}
            className="p-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-left disabled:opacity-40"
          >
            <Timer className="w-5 h-5 mb-1" />
            Thi thử tính giờ
            <div className="text-xs font-medium">40 câu, chấm điểm cuối bài</div>
          </button>
          <button
            onClick={() => start('wrong')}
            disabled={!wrongIds.length}
            className="p-4 rounded-2xl bg-rose-500 text-white font-black text-left disabled:opacity-40"
          >
            <XCircle className="w-5 h-5 mb-1" />
            Ôn lại câu sai
            <div className="text-xs font-medium">{wrongIds.length} câu đã làm sai</div>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
          <div className="font-black text-slate-100">Đề thi trọn bộ (số câu & thời gian theo đề thật)</div>
          <p className="text-xs text-slate-400">
            Chọn một cấp ở trên rồi bấm đề tương ứng. Chưa gồm phần Viết và Nói của đề thật.
          </p>
          <div className="grid sm:grid-cols-3 gap-2">
            {fullSpecs(lang, level).map((spec) => {
              const total = spec.parts.reduce((a, p) => a + p.n, 0);
              return (
                <button
                  key={spec.label}
                  onClick={() => start('exam', buildFullExam(bank, spec))}
                  className="p-3 rounded-xl bg-violet-500 text-white font-bold text-left"
                >
                  {spec.label}
                  <div className="text-xs font-medium opacity-90">
                    {total} câu · {spec.minutes} phút
                  </div>
                </button>
              );
            })}
            {fullSpecs(lang, level).length === 0 && (
              <div className="text-xs text-amber-300">Hãy chọn một cấp cụ thể (không chọn "Tất cả") để thi trọn bộ.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const q = session[idx];
  const answered = picked[idx] !== undefined;
  const reveal = mode !== 'exam' && answered;
  const isListen = q.type === 'listen';
  const mm = String(Math.max(0, Math.floor(secondsLeft / 60))).padStart(2, '0');
  const ss = String(Math.max(0, secondsLeft % 60)).padStart(2, '0');

  if (finished) {
    const right = session.filter((s, i) => picked[i] === s.answer).length;
    const pct = Math.round((right / session.length) * 100);
    return (
      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center">
          <Trophy className="w-10 h-10 mx-auto text-amber-400 mb-2" />
          <div className="text-4xl font-black">
            {right}/{session.length} <span className="text-lg text-slate-400">({pct}%)</span>
          </div>
          <p className="text-slate-300 mt-1">
            {pct >= 80 ? 'Xuất sắc! Sẵn sàng thi.' : pct >= 60 ? 'Đạt. Ôn thêm câu sai để lên điểm.' : 'Chưa đạt, hãy xem lại giải thích bên dưới.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            {Array.from(new Set(session.map((x) => x.type))).map((t) => {
              const all = session.filter((x) => x.type === t);
              const ok = all.filter((x) => picked[session.indexOf(x)] === x.answer).length;
              return (
                <span key={t} className="px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700">
                  {TYPE_LABEL[t] || t}: <b className={ok / all.length >= 0.6 ? 'text-emerald-300' : 'text-rose-300'}>{ok}/{all.length}</b>
                </span>
              );
            })}
          </div>
          <button
            onClick={() => setSession(null)}
            className="mt-4 px-5 py-2 rounded-xl bg-sky-500 text-slate-950 font-black"
          >
            Làm bài khác
          </button>
        </div>
        <div className="space-y-3">
          {session.map((s, i) => {
            const ok = picked[i] === s.answer;
            return (
              <div
                key={s.id}
                className={`rounded-xl border p-4 text-sm ${ok ? 'border-emerald-600/50 bg-emerald-950/20' : 'border-rose-600/50 bg-rose-950/20'}`}
              >
                <div className="font-bold mb-1 whitespace-pre-line">
                  {i + 1}. {s.type === 'listen' ? '🔊 ' : ''}
                  {s.question.replace(/¶/g, '\n')}
                </div>
                <div>
                  Đáp án đúng: <b>{'ABCD'[s.answer]}. {s.options[s.answer]}</b>
                  {!ok && (
                    <span className="text-rose-300">
                      {' '}
                      · Bạn chọn: {picked[i] !== undefined ? `${'ABCD'[picked[i]]}. ${s.options[picked[i]]}` : 'chưa trả lời'}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 mt-1">{s.explanation}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const choose = (i: number) => {
    if (answered && mode !== 'exam') return;
    setPicked((p) => ({ ...p, [idx]: i }));
    if (mode !== 'exam') {
      if (i === q.answer) playSuccessSound();
      else playErrorSound();
    } else playPopSound();
  };

  const next = () => {
    if (idx + 1 >= session.length) finish(session, picked);
    else setIdx(idx + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Câu {idx + 1}/{session.length} · {TYPE_LABEL[q.type] || q.type} · {lang === 'zh' ? `HSK ${q.level}` : q.level}
        </span>
        {mode === 'exam' && (
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            <Timer className="w-4 h-4" /> {mm}:{ss}
          </span>
        )}
        <button onClick={() => (mode === 'exam' ? finish(session, picked) : setSession(null))} className="underline">
          {mode === 'exam' ? 'Nộp bài' : 'Thoát'}
        </button>
      </div>

      {mode === 'exam' && (
        <div className="flex flex-wrap gap-1.5">
          {session.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold border ${
                i === idx
                  ? 'border-sky-400 bg-sky-500/30 text-white'
                  : picked[i] !== undefined
                    ? 'border-emerald-600/60 bg-emerald-500/15 text-emerald-200'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        {isListen && (
          <button
            onClick={() => speakNativeText(q.question.replace(/¶/g, '. '), lang)}
            className="mb-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold"
          >
            <Volume2 className="w-4 h-4" /> Nghe đoạn ghi âm
          </button>
        )}
        {(!isListen || reveal) && (
          <div className={`whitespace-pre-line text-lg font-semibold ${lang === 'zh' ? 'font-chinese' : ''}`}>
            {q.question.replace(/¶/g, '\n')}
          </div>
        )}
        {isListen && !reveal && <div className="text-xs text-slate-500">Nội dung hiện sau khi bạn trả lời.</div>}
      </div>

      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const chosen = picked[idx] === i;
          const correct = reveal && i === q.answer;
          const wrong = reveal && chosen && i !== q.answer;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`text-left px-4 py-3 rounded-xl border transition ${
                correct
                  ? 'border-emerald-500 bg-emerald-500/15'
                  : wrong
                    ? 'border-rose-500 bg-rose-500/15'
                    : chosen
                      ? 'border-sky-500 bg-sky-500/15'
                      : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <span className="font-black mr-2">{'ABCD'[i]}.</span>
              <span className={lang === 'zh' ? 'font-chinese' : ''}>{opt}</span>
            </button>
          );
        })}
      </div>

      {reveal && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
          <div className="flex items-center gap-2 font-bold mb-1">
            {picked[idx] === q.answer ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Chính xác!
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" /> Đáp án đúng: {'ABCD'[q.answer]}
              </>
            )}
          </div>
          <div className="text-slate-300">{q.explanation}</div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          disabled={idx === 0 || mode !== 'exam'}
          onClick={() => setIdx(idx - 1)}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 disabled:opacity-30"
        >
          ← Trước
        </button>
        <button
          disabled={mode !== 'exam' && !answered}
          onClick={next}
          className="px-5 py-2 rounded-xl bg-sky-500 text-slate-950 font-black disabled:opacity-40"
        >
          {idx + 1 >= session.length ? 'Hoàn thành' : 'Câu tiếp →'}
        </button>
      </div>
    </div>
  );
};

/* ============================================================== GRAMMAR */
const GrammarPanel: React.FC<{ lang: 'zh' | 'en' }> = ({ lang }) => {
  const { hasScope } = useAccess();
  const [rawItems, setItems] = useState<GrammarEntry[] | null>(null);
  const items = useMemo(() => (rawItems ? rawItems.filter((g) => hasScope(levelScope(lang, g.level))) : null), [rawItems, hasScope, lang]);
  const lockedGrammar = rawItems && items ? rawItems.length - items.length : 0;
  const [level, setLevel] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    loadGrammar(lang).then(setItems);
  }, [lang]);

  const levels = lang === 'zh' ? ['1', '2', '3', '4', '5', '6'] : ['A1', 'A2', 'B1', 'B2', 'C1'];
  const lockedScope = level !== 'all' && !hasScope(levelScope(lang, level)) ? levelScope(lang, level) : null;
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter(
      (g) =>
        (level === 'all' || g.level === level) &&
        (!s || g.title.toLowerCase().includes(s) || g.explanation.toLowerCase().includes(s) || g.formula.toLowerCase().includes(s))
    );
  }, [items, level, q]);

  if (!items) return <Loading />;

  return (
    <div className="space-y-4">
      <LevelChips
        levels={levels}
        value={level}
        onChange={setLevel}
        labelOf={(l) => chipLabel(lang, l, !hasScope(levelScope(lang, l)))}
      />
      {lockedScope && <LockedPanel scope={lockedScope} what={`Ngữ pháp ${chipLabel(lang, level, false)}`} />}
      {!lockedScope && lockedGrammar > 0 && level === 'all' && (
        <p className="text-xs text-amber-300">{lockedGrammar} điểm ngữ pháp nâng cao đang khoá. Mua khoá học để mở thêm.</p>
      )}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm điểm ngữ pháp..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm"
        />
      </div>
      <p className="text-xs text-slate-400">{list.length} điểm ngữ pháp</p>
      <div className="space-y-2">
        {list.map((g, i) => (
          <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/50">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-4 py-3 flex gap-3">
              <span className="text-xs font-black px-2 py-1 rounded bg-sky-500/20 text-sky-300 shrink-0">
                {lang === 'zh' ? `HSK ${g.level}` : g.level}
              </span>
              <span className="font-bold">{g.title}</span>
            </button>
            {open === i && (
              <div className="px-4 pb-4 space-y-3 text-sm">
                <div className="font-mono text-amber-300 bg-slate-900/70 rounded-lg px-3 py-2">{g.formula}</div>
                <p className="text-slate-200">{g.explanation}</p>
                {g.trap && <p className="text-rose-300">⚠ {g.trap}</p>}
                <div className="space-y-2">
                  {g.examples.map((e, k) => (
                    <div key={k} className="border-l-2 border-sky-500/50 pl-3">
                      <div
                        className={`cursor-pointer ${lang === 'zh' ? 'font-chinese text-base' : ''}`}
                        onClick={() => speakNativeText(e.text, lang)}
                      >
                        {e.text} 🔊
                      </div>
                      {e.pinyin && <div className="text-sky-300/80 text-xs">{e.pinyin}</div>}
                      <div className="text-slate-400 italic">{e.vi}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

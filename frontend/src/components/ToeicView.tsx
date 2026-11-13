import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, ChevronDown, Clock, Eye, EyeOff, Headphones, Lightbulb, Loader2, Lock, Square, Trophy, Volume2,
} from 'lucide-react';
import { useAccess, scopeProductId } from '../lib/access';
import { goPricing } from '../lib/nav';
import { EnglishVocabHubView } from './EnglishVocabHubView';
import { playPopSound, playSuccessSound, playErrorSound } from '../utils/audio';
import {
  loadToeic, buildTest, scaleScore, TEST_COUNT,
  type ToeicData, type ToeicTest, type ToeicQ, type ToeicGraphic, type ToeicPart2, type ToeicPart3, type ToeicPart4, type ToeicPart5, type ToeicPart6, type ToeicPart7,
} from '../data/toeic';

// Luyện thi TOEIC Listening & Reading: luyện theo từng Part, đề thi thử đủ cấu trúc (trừ Part 1), quy đổi điểm 990.

// ---------------------------------------------------------------- Giọng đọc (giọng có sẵn của trình duyệt)
const NOVELTY = /Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Albert|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Rocko|Shelley|Eddy|Flo|Reed|Sandy/;
const FEMALE = /Samantha|Karen|Moira|Tessa|Victoria|Allison|Ava|Susan|Zira|Serena|Kate|Fiona|Female|Google US English|Jenny|Aria|Libby|Sonia/i;
const MALE = /Daniel|Alex|Aaron|Tom|Oliver|Rishi|David|Mark|Arthur|Gordon|Lee|Male|Guy|Ryan|Thomas/i;

type Seg = { text: string; gender: 'M' | 'W' };

function pickVoice(gender: 'M' | 'W'): SpeechSynthesisVoice | undefined {
  const en = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en') && !NOVELTY.test(v.name));
  const re = gender === 'W' ? FEMALE : MALE;
  return en.find((v) => re.test(v.name) && v.lang === 'en-US') || en.find((v) => re.test(v.name)) || en[0];
}

let playToken = 0;
function stopAudio() {
  playToken++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
/** Đọc lần lượt các đoạn, mỗi đoạn một giọng; trả về khi đọc xong hoặc bị dừng. */
async function playSegments(segs: Seg[], rate: number, onIndex?: (i: number) => void) {
  if (!('speechSynthesis' in window)) return;
  stopAudio();
  const token = playToken;
  // Chrome bỏ qua câu nói nếu speak() chạy ngay sau cancel().
  await new Promise((r) => setTimeout(r, 80));
  for (let i = 0; i < segs.length; i++) {
    if (token !== playToken) return;
    onIndex?.(i);
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(segs[i].text);
      u.lang = 'en-US';
      u.rate = rate;
      const v = pickVoice(segs[i].gender);
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
    await new Promise((r) => setTimeout(r, 250));
  }
  onIndex?.(-1);
}

const LETTERS = 'ABCD';

const part2Segs = (it: ToeicPart2, idx: number): Seg[] => {
  const a: 'M' | 'W' = idx % 2 ? 'M' : 'W';
  const b: 'M' | 'W' = a === 'M' ? 'W' : 'M';
  return [{ text: it.prompt, gender: a }, ...it.options.map((o, i) => ({ text: `${LETTERS[i]}. ${o}`, gender: b }))];
};
const part3Segs = (it: ToeicPart3): Seg[] => it.lines.map((l) => ({ text: l.text, gender: it.speakers[l.s]?.gender || 'W' }));
const part4Segs = (it: ToeicPart4): Seg[] =>
  it.text.split(/(?<=[.!?])\s+/).reduce<Seg[]>((acc, s) => {
    // Gộp câu thành đoạn ~200 ký tự để giọng đọc liền mạch mà vẫn dừng được.
    const last = acc[acc.length - 1];
    if (last && last.text.length + s.length < 200) last.text += ' ' + s;
    else acc.push({ text: s, gender: it.gender });
    return acc;
  }, []);

// ---------------------------------------------------------------- Đơn vị bài (một mục có 1 hoặc nhiều câu hỏi)
type Part = 2 | 3 | 4 | 5 | 6 | 7;
type Unit =
  | { part: 2; key: string; item: ToeicPart2; idx: number }
  | { part: 3; key: string; item: ToeicPart3 }
  | { part: 4; key: string; item: ToeicPart4 }
  | { part: 5; key: string; item: ToeicPart5 }
  | { part: 6; key: string; item: ToeicPart6 }
  | { part: 7; key: string; item: ToeicPart7 };

/** Danh sách câu hỏi (số lựa chọn, đáp án, giải thích) của một đơn vị. */
function unitQuestions(u: Unit): { id: string; n: number; answer: number; explain: string; q?: string; options?: string[] }[] {
  switch (u.part) {
    case 2:
      return [{ id: u.key, n: 3, answer: u.item.answer, explain: u.item.explain }];
    case 5:
      return [{ id: u.key, n: 4, answer: u.item.answer, explain: u.item.explain, q: u.item.q, options: u.item.options }];
    default:
      return (u.item.questions as ToeicQ[]).map((q, i) => ({ id: `${u.key}#${i}`, n: 4, answer: q.answer, explain: q.explain, q: q.q, options: q.options }));
  }
}

function testUnits(t: ToeicTest): Unit[] {
  return [
    ...t.part2.map((item, idx): Unit => ({ part: 2, key: item.id, item, idx })),
    ...t.part3.map((item): Unit => ({ part: 3, key: item.id, item })),
    ...t.part4.map((item): Unit => ({ part: 4, key: item.id, item })),
    ...t.part5.map((item): Unit => ({ part: 5, key: item.id, item })),
    ...t.part6.map((item): Unit => ({ part: 6, key: item.id, item })),
    ...t.part7.map((item): Unit => ({ part: 7, key: item.id, item })),
  ];
}

function partUnits(d: ToeicData, part: Part): Unit[] {
  switch (part) {
    case 2: return d.part2.map((item, idx) => ({ part: 2, key: item.id, item, idx }));
    case 3: return d.part3.map((item) => ({ part: 3, key: item.id, item }));
    case 4: return d.part4.map((item) => ({ part: 4, key: item.id, item }));
    case 5: return d.part5.map((item) => ({ part: 5, key: item.id, item }));
    case 6: return d.part6.map((item) => ({ part: 6, key: item.id, item }));
    case 7: return d.part7.map((item) => ({ part: 7, key: item.id, item }));
  }
}

const isListening = (p: Part) => p <= 4;

// ---------------------------------------------------------------- Mô tả và mẹo từng Part
const PARTS: { part: Part; name: string; desc: string; tips: string[] }[] = [
  {
    part: 2, name: 'Hỏi – Đáp', desc: 'Nghe 1 câu hỏi và 3 câu đáp, chọn câu đáp hợp lý nhất.',
    tips: [
      'Nghe thật kỹ TỪ ĐẦU câu hỏi (Who/When/Where/Why/How...) — đáp án phải trả lời đúng loại câu hỏi đó.',
      'Cẩn thận bẫy lặp từ hoặc từ phát âm gần giống câu hỏi: lựa chọn nhắc lại đúng từ trong câu hỏi thường là SAI.',
      'Đáp án đúng hay là câu trả lời gián tiếp: "Let me check", "I haven\'t heard yet", "Ask Mr. Kim".',
      'Câu Yes/No không nhất thiết có Yes/No ở đáp án đúng.',
    ],
  },
  {
    part: 3, name: 'Hội thoại', desc: 'Nghe hội thoại 2–3 người, trả lời 3 câu hỏi in sẵn.',
    tips: [
      'Đọc lướt 3 câu hỏi TRƯỚC khi nghe, gạch chân từ khoá (woman/man, problem, next).',
      'Câu hỏi thường theo thứ tự lời thoại: câu 1 ở đầu, câu 3 ở cuối hội thoại.',
      'Đáp án đúng thường DIỄN ĐẠT LẠI (paraphrase) lời thoại, không lặp nguyên văn.',
      'Câu "Look at the graphic": nghe thông tin cần đối chiếu với bảng, đáp án là dòng KHÁC với thông tin được nói ra.',
    ],
  },
  {
    part: 4, name: 'Bài nói ngắn', desc: 'Nghe thông báo, tin nhắn thoại, quảng cáo..., trả lời 3 câu hỏi.',
    tips: [
      'Câu đầu bài nói thường cho biết người nói là ai, nói ở đâu, mục đích gì.',
      'Cuối bài thường có yêu cầu hoặc việc sắp làm ("Please...", "Next, we will...").',
      'Câu hỏi hàm ý ("What does the speaker imply...") — nghĩ về NGỮ CẢNH, không dịch từng chữ.',
    ],
  },
  {
    part: 5, name: 'Điền từ vào câu', desc: 'Chọn từ/cụm từ đúng để hoàn thành câu.',
    tips: [
      'Xem 4 lựa chọn trước: cùng gốc khác đuôi → câu hỏi từ loại; khác nghĩa → câu hỏi từ vựng.',
      'Câu từ loại làm nhanh trong 10–15 giây: nhìn chỗ trống đứng sau/trước gì (mạo từ → danh từ, động từ → trạng từ...).',
      'Không quá 30 giây mỗi câu để dành thời gian cho Part 7.',
    ],
  },
  {
    part: 6, name: 'Điền vào đoạn văn', desc: 'Đoạn văn có 4 chỗ trống, có 1 câu chọn câu phù hợp để chèn.',
    tips: [
      'Đọc cả câu trước và sau chỗ trống — thì của động từ và từ nối phụ thuộc vào ngữ cảnh cả đoạn.',
      'Câu chèn câu: chọn câu nối logic với câu trước (đại từ this/these/they phải có chỗ để chỉ tới).',
    ],
  },
  {
    part: 7, name: 'Đọc hiểu', desc: 'Đọc 1, 2 hoặc 3 văn bản (email, quảng cáo, tin nhắn...) và trả lời câu hỏi.',
    tips: [
      'Đọc câu hỏi trước, rồi tìm thông tin trong bài (scan) thay vì đọc kỹ toàn bộ.',
      'Câu NOT TRUE: loại dần 3 phương án có trong bài.',
      'Bài 2–3 văn bản: ít nhất 1 câu cần kết hợp thông tin từ 2 văn bản (ví dụ giá ở quảng cáo + số lượng ở email).',
      'Câu hỏi từ vựng "closest in meaning": thay thử vào câu gốc xem có giữ đúng nghĩa không.',
    ],
  },
];

const cardCls = 'rounded-2xl bg-slate-900 border border-slate-800';

// ---------------------------------------------------------------- Thành phần hiển thị
const Graphic: React.FC<{ g: ToeicGraphic }> = ({ g }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 overflow-x-auto">
    <div className="text-xs font-black text-amber-300 mb-2">{g.title}</div>
    <table className="text-xs text-slate-200 min-w-[240px]">
      <tbody>
        {g.rows.map((r, i) => (
          <tr key={i} className={i === 0 ? 'font-bold text-slate-400' : 'border-t border-slate-800'}>
            {r.map((c, j) => <td key={j} className="py-1 pr-4 whitespace-nowrap">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Choice: React.FC<{
  letter: string; text?: string; chosen: boolean; reveal: boolean; correct: boolean; onClick: () => void;
}> = ({ letter, text, chosen, reveal, correct, onClick }) => {
  const state = reveal ? (correct ? 'right' : chosen ? 'wrong' : 'idle') : chosen ? 'chosen' : 'idle';
  const cls = {
    right: 'border-emerald-500 bg-emerald-500/15 text-emerald-200',
    wrong: 'border-rose-500 bg-rose-500/15 text-rose-200',
    chosen: 'border-sky-400 bg-sky-500/15 text-white',
    idle: 'border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500',
  }[state];
  return (
    <button type="button" onClick={onClick} disabled={reveal} className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl border text-sm transition-colors cursor-pointer disabled:cursor-default ${cls}`}>
      <span className="w-6 h-6 shrink-0 rounded-lg bg-slate-950/60 flex items-center justify-center text-xs font-black">{letter}</span>
      {text && <span className="pt-0.5">{text}</span>}
    </button>
  );
};

/** Nút nghe + lời thoại (ẩn đến khi người học chọn hiện). */
const AudioBox: React.FC<{ segs: Seg[]; transcript: React.ReactNode; allowTranscript: boolean }> = ({ segs, transcript, allowTranscript }) => {
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => () => stopAudio(), []);
  useEffect(() => {
    setShow(false);
    setPlaying(false);
    stopAudio();
  }, [segs]);
  const play = async () => {
    if (playing) {
      stopAudio();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    await playSegments(segs, slow ? 0.8 : 0.95);
    setPlaying(false);
  };
  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={play} className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-black flex items-center gap-2 cursor-pointer">
          {playing ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} {playing ? 'Dừng' : 'Nghe'}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} className="accent-sky-400" /> Đọc chậm
        </label>
        {allowTranscript && (
          <button type="button" onClick={() => setShow((v) => !v)} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 flex items-center gap-1.5 cursor-pointer">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {show ? 'Ẩn lời thoại' : 'Hiện lời thoại'}
          </button>
        )}
      </div>
      {allowTranscript && show && <div className="text-sm text-slate-300 leading-relaxed">{transcript}</div>}
    </div>
  );
};

const QuestionBlock: React.FC<{
  label: string; q?: string; options?: string[]; n: number; chosen: number | undefined; reveal: boolean; answer: number; explain: string; onPick: (i: number) => void;
}> = ({ label, q, options, n, chosen, reveal, answer, explain, onPick }) => (
  <div className="space-y-2">
    <div className="text-sm text-white font-semibold"><span className="text-sky-300 font-black mr-1.5">{label}</span>{q}</div>
    <div className={`grid gap-1.5 ${options ? '' : 'grid-cols-3'}`}>
      {Array.from({ length: n }, (_, i) => (
        <Choice key={i} letter={LETTERS[i]} text={options?.[i]} chosen={chosen === i} reveal={reveal} correct={answer === i} onClick={() => onPick(i)} />
      ))}
    </div>
    {reveal && (
      <div className={`text-xs rounded-xl px-3 py-2 border ${chosen === answer ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
        <b>{chosen === answer ? 'Đúng.' : `Đáp án: ${LETTERS[answer]}.`}</b> {explain}
      </div>
    )}
  </div>
);

const Passage: React.FC<{ title?: string; type?: string; text: string }> = ({ title, type, text }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
    {(type || title) && (
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        {type && <span className="text-[10px] uppercase tracking-wider font-black text-amber-300">{type}</span>}
        {title && <span className="text-sm font-bold text-white">{title}</span>}
      </div>
    )}
    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{text}</div>
  </div>
);

/** Hiển thị một đơn vị bài với các câu hỏi của nó. */
const UnitView: React.FC<{
  unit: Unit; numberFrom: number; answers: Record<string, number>; reveal: boolean; examMode: boolean; onPick: (qid: string, i: number) => void;
}> = ({ unit, numberFrom, answers, reveal, examMode, onPick }) => {
  const qs = unitQuestions(unit);
  // Trong lúc làm đề không cho xem lời thoại; luyện tập thì xem sau khi đã chấm.
  const allowTranscript = !examMode || reveal;
  const segs = useMemo(
    () => (unit.part === 2 ? part2Segs(unit.item, unit.idx) : unit.part === 3 ? part3Segs(unit.item) : unit.part === 4 ? part4Segs(unit.item) : []),
    [unit],
  );

  let top: React.ReactNode = null;
  if (unit.part === 2) {
    top = (
      <AudioBox segs={segs} allowTranscript={allowTranscript} transcript={
        <div className="space-y-1">
          <p className="font-semibold text-white">{unit.item.prompt}</p>
          {unit.item.options.map((o, i) => <p key={i}>{LETTERS[i]}. {o}</p>)}
        </div>
      } />
    );
  } else if (unit.part === 3) {
    top = (
      <div className="space-y-2">
        <AudioBox segs={segs} allowTranscript={allowTranscript} transcript={
          <div className="space-y-1">
            {unit.item.lines.map((l, i) => (
              <p key={i}><b className="text-sky-300">{unit.item.speakers[l.s]?.name}:</b> {l.text}</p>
            ))}
          </div>
        } />
        {unit.item.graphic && <Graphic g={unit.item.graphic} />}
      </div>
    );
  } else if (unit.part === 4) {
    top = (
      <div className="space-y-2">
        <div className="text-xs text-slate-400">Loại bài: <b className="text-slate-200">{unit.item.kind}</b></div>
        <AudioBox segs={segs} allowTranscript={allowTranscript} transcript={<p>{unit.item.text}</p>} />
        {unit.item.graphic && <Graphic g={unit.item.graphic} />}
      </div>
    );
  } else if (unit.part === 6) {
    top = <Passage type={unit.item.kind} title={unit.item.title} text={unit.item.text} />;
  } else if (unit.part === 7) {
    top = (
      <div className={`grid gap-3 ${unit.item.docs.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {unit.item.docs.map((d, i) => <Passage key={i} type={d.type} title={d.title} text={d.text} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {top}
      {qs.map((q, i) => (
        <QuestionBlock
          key={q.id}
          label={`${numberFrom + i}.`}
          q={unit.part === 2 ? 'Chọn câu đáp phù hợp nhất.' : q.q}
          options={q.options}
          n={q.n}
          chosen={answers[q.id]}
          reveal={reveal}
          answer={q.answer}
          explain={q.explain}
          onPick={(c) => onPick(q.id, c)}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- Luyện theo Part
const Practice: React.FC<{ data: ToeicData; part: Part; onBack: () => void; onAddXp: (n: number) => void }> = ({ data, part, onBack, onAddXp }) => {
  const units = useMemo(() => {
    const arr = partUnits(data, part);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [data, part]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const unit = units[pos];
  const qs = unit ? unitQuestions(unit) : [];
  const allPicked = qs.every((q) => answers[q.id] !== undefined);

  const check = () => {
    const right = qs.filter((q) => answers[q.id] === q.answer).length;
    setScore((s) => ({ right: s.right + right, total: s.total + qs.length }));
    setChecked(true);
    if (right === qs.length) {
      playSuccessSound();
      onAddXp(5 * qs.length);
    } else playErrorSound();
  };
  const next = () => {
    stopAudio();
    setChecked(false);
    setPos((p) => (p + 1) % units.length);
  };
  const info = PARTS.find((p) => p.part === part)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { stopAudio(); onBack(); }} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Quay lại</button>
        <h2 className="text-lg font-black text-white">Part {part}: {info.name}</h2>
        <span className="ml-auto text-xs text-slate-400">Mục {pos + 1}/{units.length} · Đúng {score.right}/{score.total}</span>
      </div>
      <div className={`${cardCls} p-4 sm:p-5`}>
        {unit ? (
          <UnitView unit={unit} numberFrom={1} answers={answers} reveal={checked} examMode={false} onPick={(id, i) => !checked && setAnswers((a) => ({ ...a, [id]: i }))} />
        ) : (
          <p className="text-sm text-slate-400">Chưa có dữ liệu cho phần này.</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {!checked ? (
            <button type="button" disabled={!allPicked} onClick={check} className="px-5 py-2.5 rounded-xl bg-emerald-500 disabled:opacity-40 text-slate-950 text-sm font-black cursor-pointer">Kiểm tra</button>
          ) : (
            <button type="button" onClick={next} className="px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 text-sm font-black flex items-center gap-1.5 cursor-pointer">Tiếp <ArrowRight className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Đề thi thử
const TEST_MINUTES = 120;

const MockTest: React.FC<{ data: ToeicData; k: number; onBack: () => void; onAddXp: (n: number) => void }> = ({ data, k, onBack, onAddXp }) => {
  const test = useMemo(() => buildTest(data, k), [data, k]);
  const units = useMemo(() => testUnits(test), [test]);
  // Số thứ tự câu đầu tiên của mỗi đơn vị (Part 2 bắt đầu từ câu 7 như đề thật vì bỏ Part 1).
  const starts = useMemo(() => {
    const out: number[] = [];
    let n = 7;
    for (const u of units) {
      out.push(n);
      n += unitQuestions(u).length;
    }
    return out;
  }, [units]);
  const allQs = useMemo(() => units.flatMap((u) => unitQuestions(u).map((q) => ({ ...q, part: u.part }))), [units]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(TEST_MINUTES * 60);

  const submit = useCallback(() => {
    stopAudio();
    setDone(true);
    setPos(0);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setInterval(() => setLeft((s) => {
      if (s <= 1) {
        window.clearInterval(t);
        submit();
        return 0;
      }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(t);
  }, [done, submit]);

  const result = useMemo(() => {
    if (!done) return null;
    const by: Record<number, { right: number; total: number }> = {};
    for (const q of allQs) {
      by[q.part] = by[q.part] || { right: 0, total: 0 };
      by[q.part].total++;
      if (answers[q.id] === q.answer) by[q.part].right++;
    }
    const sum = (ps: number[]) => ps.reduce((a, p) => ({ right: a.right + (by[p]?.right || 0), total: a.total + (by[p]?.total || 0) }), { right: 0, total: 0 });
    const lc = sum([2, 3, 4]);
    const rc = sum([5, 6, 7]);
    const lcScore = scaleScore(lc.right, lc.total);
    const rcScore = scaleScore(rc.right, rc.total);
    return { by, lc, rc, lcScore, rcScore, total: lcScore + rcScore };
  }, [done, allQs, answers]);

  useEffect(() => {
    if (result) onAddXp(Math.round((result.lc.right + result.rc.right) / 2));
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = allQs.filter((q) => answers[q.id] !== undefined).length;
  const unit = units[pos];
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { if (done || window.confirm('Thoát đề thi? Bài làm sẽ không được lưu.')) { stopAudio(); onBack(); } }} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Thoát</button>
        <h2 className="text-lg font-black text-white">Đề thi thử TOEIC số {k + 1}</h2>
        {!done && (
          <span className={`ml-auto px-3 py-1.5 rounded-xl text-sm font-black flex items-center gap-1.5 ${left < 600 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-200'}`}>
            <Clock className="w-4 h-4" /> {mm}:{ss}
          </span>
        )}
      </div>

      {result && (
        <div className={`${cardCls} p-5 space-y-4`}>
          <div className="flex flex-wrap items-center gap-4">
            <Trophy className="w-10 h-10 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400">Điểm ước lượng</div>
              <div className="text-4xl font-black text-white">{result.total}<span className="text-lg text-slate-500"> / 990</span></div>
            </div>
            <div className="flex gap-3 ml-auto">
              <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 px-4 py-2 text-center">
                <div className="text-[11px] text-sky-300 font-bold">Listening</div>
                <div className="text-xl font-black text-white">{result.lcScore}</div>
                <div className="text-[11px] text-slate-400">{result.lc.right}/{result.lc.total} câu</div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-center">
                <div className="text-[11px] text-emerald-300 font-bold">Reading</div>
                <div className="text-xl font-black text-white">{result.rcScore}</div>
                <div className="text-[11px] text-slate-400">{result.rc.right}/{result.rc.total} câu</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([2, 3, 4, 5, 6, 7] as Part[]).map((p) => {
              const r = result.by[p] || { right: 0, total: 0 };
              const pct = r.total ? Math.round((r.right / r.total) * 100) : 0;
              return (
                <div key={p} className="rounded-xl bg-slate-800/60 p-2 text-center">
                  <div className="text-[11px] text-slate-400 font-bold">Part {p}</div>
                  <div className={`text-lg font-black ${pct >= 75 ? 'text-emerald-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>{pct}%</div>
                  <div className="text-[10px] text-slate-500">{r.right}/{r.total}</div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            Điểm được quy đổi tuyến tính từ tỉ lệ đúng, chỉ để tham khảo — ETS dùng bảng quy đổi riêng cho từng đề. Đề này không có Part 1 (tả ảnh), nên phần Listening tính trên {result.lc.total} câu. Xem lại từng câu và lời giải bên dưới.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start">
        <div className={`${cardCls} p-4 sm:p-5`}>
          <div className="mb-3 flex items-center gap-2 text-xs font-black">
            <span className={`px-2 py-1 rounded-lg ${isListening(unit.part) ? 'bg-sky-500/15 text-sky-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
              {isListening(unit.part) ? 'LISTENING' : 'READING'} · PART {unit.part}
            </span>
            <span className="text-slate-500 font-semibold">{PARTS.find((p) => p.part === unit.part)?.desc}</span>
          </div>
          <UnitView unit={unit} numberFrom={starts[pos]} answers={answers} reveal={done} examMode onPick={(id, i) => !done && setAnswers((a) => ({ ...a, [id]: i }))} />
          <div className="mt-5 flex items-center gap-2">
            <button type="button" disabled={pos === 0} onClick={() => { stopAudio(); setPos(pos - 1); }} className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-slate-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Trước</button>
            <button type="button" disabled={pos === units.length - 1} onClick={() => { stopAudio(); setPos(pos + 1); }} className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-slate-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer">Sau <ArrowRight className="w-4 h-4" /></button>
            {!done && (
              <button type="button" onClick={() => { if (answered === allQs.length || window.confirm(`Còn ${allQs.length - answered} câu chưa làm. Nộp bài?`)) submit(); }} className="ml-auto px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-sm font-black cursor-pointer">Nộp bài</button>
            )}
          </div>
        </div>

        <div className={`${cardCls} p-3 lg:sticky lg:top-24`}>
          <div className="text-xs text-slate-400 mb-2">Đã làm <b className="text-white">{answered}</b>/{allQs.length} câu</div>
          <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
            {([2, 3, 4, 5, 6, 7] as Part[]).map((p) => (
              <div key={p}>
                <div className="text-[10px] font-black text-slate-500 mb-1">PART {p}</div>
                <div className="flex flex-wrap gap-1">
                  {units.map((u, ui) => u.part !== p ? null : unitQuestions(u).map((q, qi) => {
                    const a = answers[q.id];
                    const color = done
                      ? a === q.answer ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500/80 text-white'
                      : a !== undefined ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400';
                    return (
                      <button key={q.id} type="button" onClick={() => { stopAudio(); setPos(ui); }} className={`w-8 h-7 rounded-md text-[11px] font-bold cursor-pointer ${color} ${ui === pos ? 'ring-2 ring-white/70' : ''}`}>
                        {starts[ui] + qi}
                      </button>
                    );
                  }))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Trang chính
export const ToeicView: React.FC<{ onAddXp: (n: number) => void }> = ({ onAddXp }) => {
  const { hasScope } = useAccess();
  const [data, setData] = useState<ToeicData | null>(null);
  const [error, setError] = useState('');
  // Mặc định vào học từ vựng TOEIC trước; luyện đề ở mục bên cạnh.
  const [mode, setMode] = useState<{ kind: 'vocab' } | { kind: 'home' } | { kind: 'part'; part: Part } | { kind: 'test'; k: number }>({ kind: 'vocab' });
  const [openTips, setOpenTips] = useState<Part | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadToeic().then(setData).catch(() => setError('Không tải được dữ liệu TOEIC. Vui lòng tải lại trang.'));
    return () => stopAudio();
  }, []);
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [mode]);

  if (!hasScope('toeic')) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-amber-400 mx-auto" />
        <p className="text-slate-300">Luyện thi TOEIC nằm trong khoá TOEIC.</p>
        <button type="button" onClick={() => goPricing(scopeProductId('toeic'))} className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-sm font-black cursor-pointer">Xem khoá học</button>
      </div>
    );
  }

  const counts = data && {
    2: data.part2.length,
    3: data.part3.reduce((a, s) => a + s.questions.length, 0),
    4: data.part4.reduce((a, s) => a + s.questions.length, 0),
    5: data.part5.length,
    6: data.part6.reduce((a, s) => a + s.questions.length, 0),
    7: data.part7.reduce((a, s) => a + s.questions.length, 0),
  } as Record<Part, number>;

  return (
    <div ref={topRef} className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 scroll-mt-28">
      {error && mode.kind !== 'vocab' && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
      {!data && !error && mode.kind !== 'vocab' && (
        <div role="status" className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải đề TOEIC…</div>
      )}

      {(mode.kind === 'vocab' || mode.kind === 'home') && (
        <div role="tablist" aria-label="Mục luyện thi TOEIC" className="flex gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
          {([['vocab', 'Từ vựng TOEIC'], ['home', 'Luyện đề & đề thi thử']] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={mode.kind === k} onClick={() => { playPopSound(); setMode({ kind: k }); }}
              className={`px-4 py-2 rounded-xl text-sm font-black cursor-pointer transition-colors ${mode.kind === k ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      {mode.kind === 'vocab' && <EnglishVocabHubView pack="en-toeic" onAddXp={onAddXp} />}
      {data && mode.kind === 'part' && <Practice data={data} part={mode.part} onBack={() => setMode({ kind: 'home' })} onAddXp={onAddXp} />}
      {data && mode.kind === 'test' && <MockTest data={data} k={mode.k} onBack={() => setMode({ kind: 'home' })} onAddXp={onAddXp} />}

      {data && mode.kind === 'home' && (
        <>
          <section className={`${cardCls} p-5 sm:p-7 relative overflow-hidden`}>
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-sky-500/10 blur-2xl" />
            <div className="relative space-y-2">
              <span className="inline-flex px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 text-[11px] font-black">TOEIC LISTENING & READING</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Luyện thi TOEIC</h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Đề thật gồm 200 câu trong 120 phút: Listening (Part 1–4, 45 phút) và Reading (Part 5–7, 75 phút), thang điểm 990.
                Toàn bộ bài ở đây do LinguaHub tự soạn theo đúng dạng đề; phần nghe dùng giọng đọc của trình duyệt.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Đề thi thử đủ cấu trúc</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: TEST_COUNT }, (_, k) => {
                const t = buildTest(data, k);
                const n = testUnits(t).reduce((a, u) => a + unitQuestions(u).length, 0);
                return (
                  <button key={k} type="button" onClick={() => { playPopSound(); setMode({ kind: 'test', k }); }} className={`${cardCls} p-4 text-left hover:border-amber-400/60 transition-colors cursor-pointer`}>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-white">Đề số {k + 1}</span>
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {TEST_MINUTES} phút</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{n} câu · Part 2–7 · chấm điểm và quy đổi thang 990</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">Chưa có Part 1 (tả ảnh) vì cần ảnh chụp thật; đề bắt đầu từ câu 7 như đề thật.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2"><BookOpenCheck className="w-5 h-5 text-emerald-400" /> Luyện theo từng Part</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PARTS.map((p) => (
                <div key={p.part} className={`${cardCls} p-4 flex flex-col gap-2`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isListening(p.part) ? 'bg-sky-500/15 text-sky-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                      {isListening(p.part) ? <Headphones className="w-3 h-3 inline mr-1" /> : null}PART {p.part}
                    </span>
                    <span className="font-black text-white text-sm">{p.name}</span>
                    <span className="ml-auto text-[11px] text-slate-500">{counts?.[p.part]} câu</span>
                  </div>
                  <p className="text-xs text-slate-400 flex-1">{p.desc}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { playPopSound(); setMode({ kind: 'part', part: p.part }); }} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer">Luyện ngay</button>
                    <button type="button" onClick={() => setOpenTips(openTips === p.part ? null : p.part)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> Mẹo <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openTips === p.part ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {openTips === p.part && (
                    <ul className="mt-1 space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                      {p.tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={`${cardCls} p-4 text-xs text-slate-400 flex items-start gap-2`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Chưa vững từ vựng? Học 1.200 từ TOEIC theo 12 chủ đề ở mục <button type="button" onClick={() => setMode({ kind: 'vocab' })} className="font-bold text-amber-300 underline cursor-pointer">Từ vựng TOEIC</button> trước khi làm đề.</span>
          </section>
        </>
      )}
    </div>
  );
};

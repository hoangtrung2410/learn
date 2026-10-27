import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Headphones, Pause, Play, RotateCcw, XCircle } from 'lucide-react';
import { LessonSbt, SbtQuestion } from '../types';
import { toPinyin } from '../data/newHskBuilder';

const KIND_LABEL: Record<SbtQuestion['kind'], string> = {
  pic: 'Chọn hình phù hợp với câu',
  match: 'Nối câu',
  cloze: 'Chọn từ điền chỗ trống',
  read: 'Đọc hiểu',
  write: 'Viết chữ Hán',
};

const SbtAudio: React.FC<{ src: string; label: string }> = ({ src, label }) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-sky-300"><Headphones className="h-3.5 w-3.5" /> {label}</div>
      <audio ref={ref} src={src} controls preload="none" className="h-9 w-full" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <span className="sr-only">{playing ? <Pause /> : <Play />}</span>
    </div>
  );
};

interface Props {
  sbt: LessonSbt;
}

export const SbtPractice: React.FC<Props> = ({ sbt }) => {
  const qs = sbt.questions;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const done = Object.keys(checked).length;
  const correct = useMemo(
    () => qs.reduce((n, q, i) => (checked[i] && answers[i]?.trim() === q.answer ? n + 1 : n), 0),
    [qs, answers, checked],
  );
  const reset = () => { setAnswers({}); setChecked({}); };

  return (
    <div className="space-y-5">
      {sbt.audio.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-black text-sky-300">Audio nghe của Sổ tay</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {sbt.audio.map((a) => <SbtAudio key={a.src} src={a.src} label={a.label} />)}
          </div>
          <p className="mt-2 text-xs text-slate-500">Phần nghe trong sách không có đáp án in sẵn nên app không chấm; hãy nghe và làm trong sách rồi tự đối chiếu với giáo viên.</p>
        </section>
      )}

      {qs.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-emerald-300">Bài tập đọc – viết ({qs.length} câu)</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="rounded-lg bg-slate-800 px-2 py-1">Đúng {correct}/{done}</span>
              <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"><RotateCcw className="h-3 w-3" /> Làm lại</button>
            </div>
          </div>
          <ol className="space-y-3">
            {qs.map((q, i) => {
              const isChecked = !!checked[i];
              const user = answers[i] ?? '';
              const ok = isChecked && user.trim() === q.answer;
              const lines = q.prompt.split('\n');
              return (
                <li key={i} className={`rounded-2xl border p-4 ${isChecked ? (ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5') : 'border-slate-800 bg-slate-950/50'}`}>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{i + 1}. {KIND_LABEL[q.kind]}</div>
                  {q.image && qs[i - 1]?.image !== q.image && <img src={q.image} alt="Hình minh hoạ của sách" loading="lazy" className="mb-2 w-full rounded-xl border border-slate-800 bg-white object-contain" />}
                  <div className="font-chinese space-y-1 text-base font-bold leading-relaxed text-white">
                    {lines.map((l, k) => <p key={k} className={q.kind === 'read' && k === lines.length - 1 ? 'text-emerald-200' : ''}>{l}</p>)}
                  </div>
                  {q.kind === 'write' ? (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={user}
                        maxLength={2}
                        disabled={isChecked}
                        onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                        placeholder="汉"
                        className="font-chinese w-20 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xl text-white outline-none focus:border-emerald-400"
                      />
                      <span className="text-xs text-slate-500">Gợi ý Pinyin: <b className="text-blue-300">{toPinyin(q.answer)}</b></span>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options.map((o, k) => {
                        const sel = user === o;
                        const right = isChecked && o === q.answer;
                        const wrong = isChecked && sel && o !== q.answer;
                        return (
                          <button
                            key={k}
                            disabled={isChecked}
                            onClick={() => setAnswers({ ...answers, [i]: o })}
                            className={`font-chinese rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                              right ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                              : wrong ? 'border-rose-400 bg-rose-500/15 text-rose-100'
                              : sel ? 'border-blue-400 bg-blue-500/15 text-white'
                              : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            {q.kind === 'pic' ? <span className="font-black">Hình {o}</span> : <><span className="mr-2 text-xs text-slate-500">{String.fromCharCode(65 + k)}</span>{o}</>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    {!isChecked ? (
                      <button
                        disabled={!user.trim()}
                        onClick={() => setChecked({ ...checked, [i]: true })}
                        className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-extrabold text-slate-950 disabled:opacity-40"
                      >Kiểm tra</button>
                    ) : ok ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Chính xác</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300"><XCircle className="h-4 w-4" /> Đáp án đúng: <span className="font-chinese">{q.answer}</span></span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
};

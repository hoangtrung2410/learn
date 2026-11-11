import React, { useEffect, useMemo, useState } from 'react';
import { GameSentence, joinTokens, pick, shuffle } from './types';
import { playErrorSound, playPopSound, playSuccessSound, speakNativeText } from '../../utils/audio';

const TOTAL = 8;
const SECS = 30;

export const SentenceGame: React.FC<{ sentences: GameSentence[]; onWin: (xp: number) => void }> = ({ sentences, onWin }) => {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => pick(sentences, Math.min(TOTAL, sentences.length)), [sentences, round]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(SECS);
  const [chosen, setChosen] = useState<number[]>([]);
  const [state, setState] = useState<'play' | 'ok' | 'bad'>('play');
  const q = qs[i];
  const bank = useMemo(() => (q ? shuffle(q.tokens.map((t, k) => ({ t, k }))) : []), [q]);
  const over = i >= qs.length;

  useEffect(() => { setI(0); setScore(0); setChosen([]); setState('play'); setLeft(SECS); }, [round, sentences]);
  useEffect(() => { setLeft(SECS); setChosen([]); setState('play'); }, [i]);
  useEffect(() => {
    if (over || state !== 'play') return;
    if (left <= 0) { setState('bad'); playErrorSound(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, state, over]);
  useEffect(() => { if (over && score > 0) onWin(score * 4); }, [over]); // eslint-disable-line
  useEffect(() => { if (state === 'bad' || state === 'ok') { const t = setTimeout(() => setI((n) => n + 1), 1600); return () => clearTimeout(t); } }, [state]);

  if (qs.length < 2) return <p className="text-sm text-slate-400">Chưa đủ câu để chơi trong phạm vi này.</p>;

  const tap = (k: number) => {
    if (state !== 'play' || chosen.includes(k)) return;
    playPopSound();
    const next = [...chosen, k];
    setChosen(next);
    if (next.length === q.tokens.length) {
      const built = joinTokens(next.map((x) => bank.find((b) => b.k === x)!.t), q.lang);
      if (built === joinTokens(q.tokens, q.lang)) { setState('ok'); setScore((s) => s + 1); playSuccessSound(); void speakNativeText(q.text, q.lang); }
      else { setState('bad'); playErrorSound(); }
    }
  };

  if (over) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-6 text-center">
        <div className="text-lg font-black text-white">Xong rồi!</div>
        <div className="mt-1 text-sm text-slate-300">Đúng {score}/{qs.length} câu · +{score * 4} XP</div>
        <button onClick={() => setRound((r) => r + 1)} className="btn-tactile-green mt-4 rounded-2xl px-5 py-2 text-sm font-extrabold text-slate-950">Chơi lại</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-300">
        <span>Câu {i + 1}/{qs.length}</span>
        <span className={left <= 8 ? 'text-rose-300' : ''}>⏱ {left}s</span>
        <span>Điểm {score}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: `${(left / SECS) * 100}%` }} /></div>
      <p className="mb-3 text-center text-base font-bold text-white">“{q.vi}”</p>
      <div className={`font-chinese mb-4 flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 ${state === 'ok' ? 'border-emerald-400' : state === 'bad' ? 'border-rose-400' : 'border-slate-700'}`}>
        {chosen.length === 0 && <span className="font-sans text-xs text-slate-500">Chạm các từ bên dưới theo đúng thứ tự…</span>}
        {chosen.map((k) => <span key={k} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-lg font-bold text-white">{bank.find((b) => b.k === k)!.t}</span>)}
      </div>
      <div className="font-chinese flex flex-wrap gap-2">
        {bank.map((b) => (
          <button key={b.k} disabled={chosen.includes(b.k) || state !== 'play'} onClick={() => tap(b.k)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-lg font-bold text-white disabled:opacity-30">{b.t}</button>
        ))}
      </div>
      {state !== 'play' && (
        <div className={`mt-4 rounded-xl p-3 text-center text-sm ${state === 'ok' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200'}`}>
          <div className="font-chinese text-lg font-black text-white">{q.text}</div>
          {q.sub && <div className="text-xs text-blue-300">{q.sub}</div>}
        </div>
      )}
      {state === 'play' && chosen.length > 0 && <button onClick={() => setChosen([])} className="mt-3 text-xs font-bold text-slate-400 underline">Xếp lại</button>}
    </div>
  );
};

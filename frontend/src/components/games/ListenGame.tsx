import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Volume2 } from 'lucide-react';
import { GameItem, pick, shuffle } from './types';
import { playErrorSound, playSuccessSound, speakNativeText } from '../../utils/audio';

const TOTAL = 10;

export const ListenGame: React.FC<{ words: GameItem[]; onWin: (xp: number) => void }> = ({ words, onWin }) => {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => pick(words, Math.min(TOTAL, words.length)).map((w) => ({
    w,
    options: shuffle([w, ...pick(words.filter((x) => x.id !== w.id), 3)]),
  })), [words, round]);
  const [i, setI] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const over = hearts === 0 || i >= qs.length;
  const q = qs[i];

  useEffect(() => { setI(0); setHearts(3); setScore(0); setPicked(null); }, [round, words]);
  useEffect(() => { if (q && !over) void speakNativeText(q.w.front, q.w.lang); }, [i, round, over]); // eslint-disable-line
  useEffect(() => { if (over && score > 0) onWin(score * 3); }, [over]); // eslint-disable-line

  if (qs.length < 4) return <p className="text-sm text-slate-400">Chưa đủ từ để chơi trong phạm vi này.</p>;

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    const ok = id === q.w.id;
    if (ok) { setScore((s) => s + 1); playSuccessSound(); } else { setHearts((h) => h - 1); playErrorSound(); }
    setTimeout(() => { setPicked(null); setI((n) => n + 1); }, 900);
  };

  if (over) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-6 text-center">
        <div className="text-lg font-black text-white">{hearts === 0 ? 'Hết tim rồi!' : 'Xong lượt chơi!'}</div>
        <div className="mt-1 text-sm text-slate-300">Đúng {score}/{qs.length} từ · +{score * 3} XP</div>
        <button onClick={() => setRound((r) => r + 1)} className="btn-tactile-green mt-4 rounded-2xl px-5 py-2 text-sm font-extrabold text-slate-950">Chơi lại</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-300">
        <span>Câu {i + 1}/{qs.length}</span>
        <span className="flex gap-1">{[0, 1, 2].map((k) => <Heart key={k} className={`h-4 w-4 ${k < hearts ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`} />)}</span>
        <span>Điểm {score}</span>
      </div>
      <button onClick={() => void speakNativeText(q.w.front, q.w.lang)} className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-sky-500/20 ring-2 ring-sky-400/50 hover:bg-sky-500/30">
        <Volume2 className="h-10 w-10 text-sky-300" />
      </button>
      <p className="mb-3 text-center text-sm text-slate-400">Nghe và chọn đúng từ</p>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((o) => {
          const right = picked && o.id === q.w.id;
          const wrong = picked === o.id && o.id !== q.w.id;
          return (
            <button key={o.id} onClick={() => choose(o.id)} className={`rounded-2xl border px-3 py-4 text-center transition-colors ${right ? 'border-emerald-400 bg-emerald-500/20' : wrong ? 'border-rose-400 bg-rose-500/20' : 'border-slate-700 bg-slate-800/70 hover:bg-slate-800'}`}>
              <div className={`${o.lang === 'zh' ? 'font-chinese text-3xl' : 'text-xl'} font-black text-white`}>{o.front}</div>
              {picked && <div className="mt-1 text-xs text-slate-300">{o.sub ? `${o.sub} · ` : ''}{o.back}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GameItem, pick, shuffle } from './types';
import { playErrorSound, playPopSound, playSuccessSound } from '../../utils/audio';

interface Card { id: string; pair: number; text: string; kind: 'zh' | 'vi'; sub?: string }

export const MemoryGame: React.FC<{ words: GameItem[]; onWin: (xp: number) => void }> = ({ words, onWin }) => {
  const PAIRS = Math.min(6, words.length);
  const [round, setRound] = useState(0);
  const cards = useMemo<Card[]>(() => {
    const chosen = pick(words, PAIRS);
    return shuffle(chosen.flatMap((w, i) => [
      { id: `z${i}`, pair: i, text: w.front, kind: 'zh' as const, sub: w.sub },
      { id: `v${i}`, pair: i, text: w.back, kind: 'vi' as const },
    ]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, round]);
  const [open, setOpen] = useState<string[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const finished = done.length === PAIRS;

  useEffect(() => { setOpen([]); setDone([]); setMoves(0); setSecs(0); }, [round, words]);
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished, round]);
  useEffect(() => {
    if (finished && PAIRS > 0) { playSuccessSound(); onWin(Math.max(10, 30 - moves)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const flip = (c: Card) => {
    if (open.length === 2 || open.includes(c.id) || done.includes(c.pair)) return;
    playPopSound();
    const next = [...open, c.id];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
      if (a.pair === b.pair && a.kind !== b.kind) {
        setTimeout(() => { setDone((d) => [...d, a.pair]); setOpen([]); playSuccessSound(); }, 350);
      } else {
        setTimeout(() => { setOpen([]); playErrorSound(); }, 750);
      }
    }
  };

  if (PAIRS < 2) return <p className="text-sm text-slate-400">Chưa đủ từ để chơi trong phạm vi này.</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-300">
        <span className="rounded-lg bg-slate-800 px-2 py-1">Lượt: {moves}</span>
        <span className="rounded-lg bg-slate-800 px-2 py-1">Cặp: {done.length}/{PAIRS}</span>
        <span className="rounded-lg bg-slate-800 px-2 py-1">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {cards.map((c) => {
          const shown = open.includes(c.id) || done.includes(c.pair);
          const matched = done.includes(c.pair);
          return (
            <button
              key={c.id}
              onClick={() => flip(c)}
              className={`flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border p-1.5 text-center transition-all sm:aspect-square ${
                matched ? 'border-emerald-400/60 bg-emerald-500/15 opacity-70'
                : shown ? 'border-sky-400 bg-sky-500/15'
                : 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-slate-500'
              }`}
            >
              {shown ? (
                c.kind === 'zh' ? (
                  <>
                    <span className={`${words[0]?.lang === 'zh' ? 'font-chinese text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} font-black leading-tight text-white`}>{c.text}</span>
                    <span className="mt-0.5 text-[10px] font-semibold text-blue-300 sm:text-xs">{c.sub}</span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold leading-tight text-slate-100 sm:text-sm">{c.text}</span>
                )
              ) : (
                <span className="font-chinese text-3xl font-black text-slate-600">{words[0]?.lang === 'en' ? 'A' : '学'}</span>
              )}
            </button>
          );
        })}
      </div>
      {finished && (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-center">
          <div className="text-lg font-black text-emerald-300">Hoàn thành! 🎉</div>
          <div className="text-sm text-slate-300">{moves} lượt · {secs} giây · +{Math.max(10, 30 - moves)} XP</div>
          <button onClick={() => setRound((r) => r + 1)} className="btn-tactile-green mt-3 inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-extrabold text-slate-950"><RotateCcw className="h-4 w-4" /> Chơi ván mới</button>
        </div>
      )}
    </div>
  );
};

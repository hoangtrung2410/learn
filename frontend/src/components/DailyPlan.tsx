import React, { useEffect, useState } from 'react';
import { Flame, Check, Target, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getMissions, getStreak, lastDays, getGoalLevel, setGoalLevel, completedCount, isMissionDone,
  GOAL_LABEL, GoalLevel, Mission,
} from '../lib/daily';
import { gotoTab } from '../lib/nav';

interface DailyPlanProps {
  /** Mở bài học kế tiếp chưa làm. */
  onStartLesson: () => void;
}

const GOALS: GoalLevel[] = ['light', 'normal', 'hard'];

const Ring: React.FC<{ done: number; total: number }> = ({ done, total }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0" role="img" aria-label={`Đã xong ${done} trên ${total} nhiệm vụ`}>
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-slate-700/70" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          className="stroke-emerald-400 transition-all duration-500"
          strokeDasharray={c} strokeDashoffset={c * (1 - done / total)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{done}/{total}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">nhiệm vụ</span>
      </div>
    </div>
  );
};

export const DailyPlan: React.FC<DailyPlanProps> = ({ onStartLesson }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const on = () => tick((n) => n + 1);
    window.addEventListener('lp:daily', on);
    return () => window.removeEventListener('lp:daily', on);
  }, []);

  const goal = getGoalLevel();
  const missions = getMissions();
  const done = completedCount();
  const streak = getStreak();
  const week = lastDays(7);
  const allDone = done === missions.length;

  // Pháo hoa một lần trong ngày khi hoàn thành cả 3 nhiệm vụ.
  useEffect(() => {
    if (!allDone) return;
    const k = 'lp_daily_cheer_' + week[week.length - 1].key;
    try {
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, '1');
    } catch {
      return;
    }
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (m: Mission) => {
    if (m.id === 'learn') onStartLesson();
    else gotoTab({ tab: 'study' });
  };

  return (
    <section aria-labelledby="daily-title" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Ring done={done} total={missions.length} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="daily-title" className="text-xl font-black text-white">Học mỗi ngày</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Learn every day</span>
          </div>
          <p className="text-sm text-slate-400">
            {allDone
              ? 'Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay. Mai gặp lại nhé.'
              : done > 0
                ? 'Đã có tiến bộ rồi, làm nốt các nhiệm vụ còn lại để giữ nhịp học.'
                : 'Chỉ cần vài phút mỗi ngày. Hoàn thành 1 nhiệm vụ là giữ được chuỗi ngày học.'}
          </p>
          <div className="flex items-center gap-2 text-sm font-bold">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-400 fill-orange-500' : 'text-slate-600'}`} />
            <span className="text-white">{streak}</span>
            <span className="text-slate-400 font-medium">ngày liên tiếp</span>
          </div>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" /> Mục tiêu mỗi ngày</p>
          <div role="radiogroup" aria-label="Mục tiêu mỗi ngày" className="flex gap-1 p-1 rounded-xl bg-slate-800">
            {GOALS.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={goal === g}
                onClick={() => setGoalLevel(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${goal === g ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                {GOAL_LABEL[g]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
        {missions.map((m) => {
          const ok = isMissionDone(m);
          const pct = Math.min(100, Math.round((m.done / m.target) * 100));
          return (
            <li key={m.id} className={`flex items-center gap-3 min-w-0 rounded-2xl p-3.5 border ${ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700/70'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                {ok ? <Check className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-white truncate">{m.title}</p>
                  <p className="text-xs text-slate-400 shrink-0">{Math.min(m.done, m.target)}/{m.target}</p>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{m.hint}</p>
                <div className="h-1.5 rounded-full bg-slate-700 mt-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {!ok && (
                <button onClick={() => go(m)} className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shrink-0 cursor-pointer">
                  Bắt đầu
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-1" aria-label="7 ngày gần nhất">
        {week.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${d.done ? 'bg-orange-500/20 border-orange-400 text-orange-300' : d.today ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-600'}`}>
              {d.done ? <Flame className="w-4 h-4 fill-orange-500 text-orange-400" /> : ''}
            </div>
            <span className={`text-[11px] ${d.today ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>{d.today ? 'Hôm nay' : d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

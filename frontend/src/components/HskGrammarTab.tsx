import React, { useState } from 'react';
import { HSK_GRAMMAR_GUIDE, HskGrammarPoint } from '../data/hskVocabData';
import { speakNativeText, playPopSound, playSuccessSound } from '../utils/audio';
import {
  Zap,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAccess, zhLevelScope } from '../lib/access';
import { LockedPanel, LockIcon } from './LockedPanel';
import { logActivity } from '../lib/daily';

interface HskGrammarTabProps {
  onAddXp: (amount: number) => void;
}

export const HskGrammarTab: React.FC<HskGrammarTabProps> = ({ onAddXp }) => {
  const { hasScope } = useAccess();
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const locked = !hasScope(zhLevelScope(selectedLevel));
  const [masteredGrammarIds, setMasteredGrammarIds] = useState<Record<string, boolean>>({});

  const filteredGrammar = HSK_GRAMMAR_GUIDE.filter(
    (item) => item.level === selectedLevel
  );

  const handlePlayAudio = async (text: string) => {
    playPopSound();
    await speakNativeText(text, 'zh', false);
  };

  const handleMasterGrammar = (id: string) => {
    playSuccessSound();
    setMasteredGrammarIds((prev) => ({ ...prev, [id]: true }));
    logActivity('grammar');
    onAddXp(15);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Bí Kíp Ngữ Pháp Trọng Tâm HSK 1 - 6
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Phân tích công thức chuẩn, giải thích cặn kẽ và bóc tách các bẫy đề thi hay gặp nhất.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 border border-slate-700 shrink-0">
            Khung Ngữ Pháp Chuẩn HSK 3.0
          </span>
        </div>

        {/* Level Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/80">
          <span className="text-xs font-bold text-slate-400 mr-2">Cấp độ HSK:</span>
          {[1, 2, 3, 4, 5, 6].map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const count = HSK_GRAMMAR_GUIDE.filter((g) => g.level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => {
                  playPopSound();
                  setSelectedLevel(lvl);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                    : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>HSK {lvl}</span>
                {!hasScope(zhLevelScope(lvl)) && <LockIcon />}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count} điểm
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {locked && (
        <LockedPanel scope={zhLevelScope(selectedLevel)} what={`Ngữ pháp HSK ${selectedLevel}`}>
          <ul className="text-left max-w-md mx-auto rounded-2xl bg-slate-800/60 p-4 space-y-1.5 text-sm text-slate-300">
            {filteredGrammar.slice(0, 4).map((g) => <li key={g.id}>• {g.title}</li>)}
            {filteredGrammar.length > 4 && <li className="text-slate-500">… và {filteredGrammar.length - 4} điểm ngữ pháp khác</li>}
          </ul>
        </LockedPanel>
      )}

      {/* Grammar Cards List */}
      <div className="space-y-6">
        {(locked ? [] : filteredGrammar).map((gm, idx) => {
          const isMastered = masteredGrammarIds[gm.id];
          return (
            <div
              key={gm.id}
              className="p-6 sm:p-7 rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/40 transition-all shadow-xl space-y-5"
            >
              {/* Header Title & Mastery Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      Ngữ pháp HSK {gm.level}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {gm.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => handleMasterGrammar(gm.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0 ${
                    isMastered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isMastered ? 'Đã Nắm Vững (+15 XP)' : 'Đánh dấu đã hiểu'}
                </button>
              </div>

              {/* Formula Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Công thức cấu trúc:
                </span>
                <p className="text-sm font-black text-cyan-300 font-mono tracking-wide">
                  {gm.formula}
                </p>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">Cách sử dụng & Ý nghĩa:</span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {gm.explanation}
                </p>
              </div>

              {/* Exam Trap Warning Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase tracking-wider text-amber-400 text-[11px] block">
                    Bẫy Đề Thi HSK Thường Gặp (Lưu ý đặc biệt):
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {gm.examTrap}
                  </p>
                </div>
              </div>

              {/* Bilingual Examples with Audio */}
              <div className="space-y-2 pt-2 border-t border-slate-700/60">
                <span className="text-xs font-bold text-slate-400">Câu ví dụ chuẩn đề thi:</span>
                <div className="space-y-2">
                  {gm.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white font-chinese">
                          {ex.hanzi}
                        </p>
                        <p className="text-xs text-cyan-300 font-mono">
                          {ex.pinyin}
                        </p>
                        <p className="text-xs text-slate-300">
                          {ex.vi}
                        </p>
                      </div>

                      <button
                        onClick={() => handlePlayAudio(ex.hanzi)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 transition-all cursor-pointer shrink-0"
                        title="Nghe câu này"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

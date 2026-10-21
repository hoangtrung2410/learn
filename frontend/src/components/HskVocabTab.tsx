import React, { useState, useMemo, useEffect } from 'react';
import { HSK_VOCABULARY_LIST, HskVocabItem } from '../data/hskVocabData';
import { loadZhVocab } from '../data/packLoader';
import { VocabPager, VOCAB_PAGE_SIZE } from './VocabPager';
import { useAccess, zhLevelScope } from '../lib/access';
import { LockedPanel, LockIcon } from './LockedPanel';
import { speakNativeText, playPopSound, playSuccessSound } from '../utils/audio';
import {
  Search,
  Volume2,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  BookMarked,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HskVocabTabProps {
  onAddXp: (amount: number) => void;
}

export const HskVocabTab: React.FC<HskVocabTabProps> = ({ onAddXp }) => {
  const { hasScope } = useAccess();
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const locked = !hasScope(zhLevelScope(selectedLevel));
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [allVocab, setAllVocab] = useState<HskVocabItem[]>(HSK_VOCABULARY_LIST);
  const [page, setPage] = useState(0);
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('lp_hsk_mastered') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadZhVocab().then(setAllVocab);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lp_hsk_mastered', JSON.stringify(masteredIds));
    } catch {}
  }, [masteredIds]);

  useEffect(() => setPage(0), [selectedLevel, searchQuery]);

  // Filtered vocabulary list
  const filteredList = useMemo(() => {
    return allVocab.filter((item) => {
      const matchLevel = item.level === selectedLevel;
      if (!searchQuery.trim()) return matchLevel;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        item.hanzi.includes(q) ||
        item.pinyin.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.sinoViet && item.sinoViet.toLowerCase().includes(q));
      return matchLevel && matchSearch;
    });
  }, [selectedLevel, searchQuery, allVocab]);

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playPopSound();
    await speakNativeText(text, 'zh', false);
  };

  const handleNextFlashcard = () => {
    playPopSound();
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev + 1) % (filteredList.length || 1));
  };

  const handlePrevFlashcard = () => {
    playPopSound();
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev - 1 + (filteredList.length || 1)) % (filteredList.length || 1));
  };

  const handleMarkMastered = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSuccessSound();
    setMasteredIds((prev) => ({ ...prev, [id]: true }));
    onAddXp(10);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const currentFlashcard = filteredList[flashcardIdx] || filteredList[0];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Controls: Level Switcher & Search Bar */}
      <div className="p-6 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-amber-400" />
              Kho Từ Vựng HSK 1 - 9 Chuẩn Quốc Tế
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tra cứu phát âm, chữ Hán, Pinyin, Hán Việt và ví dụ câu thực tế chuẩn đề thi.
            </p>
          </div>

          {/* Mode Switcher: List vs Flashcard */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shrink-0">
            <button
              onClick={() => {
                playPopSound();
                setViewMode('list');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Danh Sách
            </button>
            <button
              onClick={() => {
                playPopSound();
                setViewMode('flashcard');
                setIsFlipped(false);
                setFlashcardIdx(0);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'flashcard'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Lật Thẻ Flashcard
            </button>
          </div>
        </div>

        {/* Level Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/80">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            Cấp độ HSK:
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const count = allVocab.filter((item) => item.level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => {
                  playPopSound();
                  setSelectedLevel(lvl);
                  setFlashcardIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                    : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{lvl === 7 ? 'HSK 7-9' : `HSK ${lvl}`}</span>
                {!hasScope(zhLevelScope(lvl)) && <LockIcon />}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count} từ
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFlashcardIdx(0);
            }}
            placeholder="Tìm kiếm theo chữ Hán, Pinyin (ví dụ: ni hao), nghĩa tiếng Việt hoặc Hán Việt..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* ================= MODE 1: FLASHCARD VIEW ================= */}
      {locked && (
        <LockedPanel scope={zhLevelScope(selectedLevel)} what={`Từ vựng ${selectedLevel === 7 ? 'HSK 7-9' : `HSK ${selectedLevel}`}`}>
          {filteredList.length > 0 && (
            <div className="text-left max-w-md mx-auto rounded-2xl bg-slate-800/60 p-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Xem trước {Math.min(5, filteredList.length)} từ đầu · tổng {filteredList.length} từ</p>
              {filteredList.slice(0, 5).map((w) => (
                <div key={w.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-black text-white text-lg">{w.hanzi}</span>
                  <span className="text-slate-400 truncate">{w.pinyin} · {w.meaning}</span>
                </div>
              ))}
            </div>
          )}
        </LockedPanel>
      )}

      {!locked && viewMode === 'flashcard' && (
        <div className="max-w-xl mx-auto space-y-6">
          {filteredList.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-800 text-center text-slate-400 text-sm">
              Không tìm thấy từ vựng phù hợp với tìm kiếm.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span>
                  Thẻ <strong>{flashcardIdx + 1}</strong> / {filteredList.length} ({selectedLevel === 7 ? 'HSK 7-9' : `HSK ${selectedLevel}`})
                </span>
                <span>Bấm vào thẻ để lật mặt sau</span>
              </div>

              {/* Interactive Flip Card */}
              <div
                onClick={() => {
                  playPopSound();
                  setIsFlipped(!isFlipped);
                }}
                className={`min-h-[300px] p-8 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between select-none shadow-2xl relative overflow-hidden ${
                  isFlipped
                    ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/50'
                    : 'bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/40'
                }`}
              >
                {/* Level badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] border border-amber-500/30">
                    HSK {currentFlashcard.level}
                  </span>
                  <button
                    onClick={(e) => handlePlayAudio(currentFlashcard.hanzi, e)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition-all cursor-pointer shadow"
                    title="Phát âm từ này"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Card Front vs Back */}
                {!isFlipped ? (
                  <div className="text-center my-auto space-y-3">
                    <h3 className="text-5xl sm:text-6xl font-black text-white font-chinese tracking-wide">
                      {currentFlashcard.hanzi}
                    </h3>
                    <p className="text-base font-bold text-amber-400 font-mono">
                      {currentFlashcard.pinyin}
                    </p>
                    {currentFlashcard.sinoViet && (
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">
                        Hán Việt: {currentFlashcard.sinoViet}
                      </span>
                    )}
                    <span className="inline-block text-[11px] font-bold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                      {currentFlashcard.partOfSpeech}
                    </span>
                  </div>
                ) : (
                  <div className="my-auto space-y-4 text-center">
                    <div>
                      <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                        Ý nghĩa tiếng Việt:
                      </span>
                      <h4 className="text-2xl font-black text-white mt-1">
                        {currentFlashcard.meaning}
                      </h4>
                    </div>

                    {/* Example sentence */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-amber-400 uppercase">
                          Ví dụ câu ứng dụng:
                        </span>
                        <button
                          onClick={(e) => handlePlayAudio(currentFlashcard.exampleHanzi, e)}
                          className="p-1 text-purple-300 hover:text-white"
                          title="Nghe câu ví dụ"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white font-chinese">
                        {currentFlashcard.exampleHanzi}
                      </p>
                      <p className="text-xs text-cyan-300 font-mono font-medium">
                        {currentFlashcard.examplePinyin}
                      </p>
                      <p className="text-xs text-slate-300">
                        {currentFlashcard.exampleVi}
                      </p>
                    </div>
                  </div>
                )}

                {/* Flip indicator */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <RotateCw className="w-3 h-3" /> {isFlipped ? 'Bấm để xem lại chữ Hán' : 'Bấm để lật xem nghĩa'}
                  </span>
                  <button
                    onClick={(e) => handleMarkMastered(currentFlashcard.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      masteredIds[currentFlashcard.id]
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {masteredIds[currentFlashcard.id] ? 'Đã nhớ (+10 XP)' : 'Đánh dấu đã thuộc'}
                  </button>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevFlashcard}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Thẻ Trước
                </button>
                <button
                  onClick={handleNextFlashcard}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
                >
                  Thẻ Tiếp Theo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODE 2: DETAILED LIST VIEW ================= */}
      {!locked && viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Hiển thị <strong>{filteredList.length}</strong> từ vựng ({selectedLevel === 7 ? 'HSK 7-9' : `HSK ${selectedLevel}`})
            </span>
            <span>Bấm biểu tượng loa để nghe phát âm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.slice(page * VOCAB_PAGE_SIZE, (page + 1) * VOCAB_PAGE_SIZE).map((item) => {
              const isMastered = masteredIds[item.id];
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 transition-all shadow-md space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-black text-white font-chinese">
                            {item.hanzi}
                          </h3>
                          <span className="text-sm font-bold text-amber-400 font-mono">
                            {item.pinyin}
                          </span>
                        </div>
                        {item.sinoViet && (
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mt-0.5">
                            Hán Việt: {item.sinoViet}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handlePlayAudio(item.hanzi)}
                          className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-amber-400 transition-all cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                          {item.partOfSpeech}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-700/60">
                      <p className="text-sm font-extrabold text-emerald-400">
                        {item.meaning}
                      </p>
                    </div>

                    {/* Example sentence */}
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Câu ví dụ:
                        </span>
                        <button
                          onClick={() => handlePlayAudio(item.exampleHanzi)}
                          className="p-0.5 text-purple-300 hover:text-white"
                          title="Nghe câu này"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-white font-chinese">
                        {item.exampleHanzi}
                      </p>
                      <p className="text-[11px] text-cyan-300 font-mono">
                        {item.examplePinyin}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {item.exampleVi}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-bold">
                      Chuẩn HSK {item.level}
                    </span>
                    <button
                      onClick={() => handleMarkMastered(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isMastered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {isMastered ? 'Đã thuộc' : 'Thuộc từ này'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <VocabPager page={page} total={filteredList.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

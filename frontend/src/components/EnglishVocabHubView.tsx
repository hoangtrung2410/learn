import React, { useState, useMemo, useEffect } from 'react';
import { ENGLISH_VOCABULARY_1000, EnglishVocabItem } from '../data/englishVocab1000Data';
import { loadEnVocab } from '../data/packLoader';
import { useAccess, enLevelScope, SCOPE_LABEL, scopeProductId } from '../lib/access';
import { LockedPanel } from './LockedPanel';
import { goPricing } from '../lib/nav';
import { speakNativeText, playPopSound, playSuccessSound, playErrorSound } from '../utils/audio';
import {
  Search,
  Volume2,
  Sparkles,
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  HelpCircle,
  Award,
  Layers,
  GraduationCap,
  Flame,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabPager, VOCAB_PAGE_SIZE } from './VocabPager';

interface EnglishVocabHubViewProps {
  onAddXp: (amount: number) => void;
}

const LEVELS = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;

export const EnglishVocabHubView: React.FC<EnglishVocabHubViewProps> = ({ onAddXp }) => {
  const [allVocab, setAllVocab] = useState<EnglishVocabItem[]>(ENGLISH_VOCABULARY_1000);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    loadEnVocab()
      .then((v) => { if (alive) setAllVocab(v); })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    allVocab.forEach((w) => counts.set(w.topic, (counts.get(w.topic) || 0) + 1));
    return ['Tất cả', ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)];
  }, [allVocab]);
  const total = allVocab.length;
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'flashcard' | 'quiz'>('list');

  // Flashcard state
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Mastered words tracking in localStorage
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('linguahub_mastered_en_vocab');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Quiz state
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);

  // Filtered vocabulary list
  const filteredList = useMemo(() => {
    return allVocab.filter((item) => {
      const matchTopic = selectedTopic === 'Tất cả' || item.topic === selectedTopic;
      const matchLevel = selectedLevel === 'Tất cả' || item.level === selectedLevel;
      if (!searchQuery.trim()) return matchTopic && matchLevel;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        item.word.toLowerCase().includes(q) ||
        item.meaningVi.toLowerCase().includes(q) ||
        item.collocation.toLowerCase().includes(q) ||
        item.ipa.toLowerCase().includes(q);

      return matchTopic && matchLevel && matchSearch;
    });
  }, [allVocab, selectedTopic, selectedLevel, searchQuery]);

  const { hasScope } = useAccess();
  const scopeOf = (w: EnglishVocabItem) => enLevelScope(w.level, w.pack === 'en-toeic' ? 'toeic' : w.pack === 'en-ielts' ? 'ielts' : undefined);
  const isUnlocked = (w: EnglishVocabItem) => hasScope(scopeOf(w));
  // Flashcard và trắc nghiệm chỉ dùng phần đã mở khoá.
  const studyList = useMemo(() => filteredList.filter(isUnlocked), [filteredList, hasScope]); // eslint-disable-line react-hooks/exhaustive-deps
  const lockedCount = filteredList.length - studyList.length;
  const firstLockedScope = filteredList.find((w) => !isUnlocked(w));
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [selectedTopic, selectedLevel, searchQuery]);
  const pageList = useMemo(
    () => filteredList.slice(page * VOCAB_PAGE_SIZE, (page + 1) * VOCAB_PAGE_SIZE),
    [filteredList, page]
  );

  const masteredCount = Object.keys(masteredIds).length;

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playPopSound();
    await speakNativeText(text, 'en', false);
  };

  const handleMarkMastered = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSuccessSound();
    const updated = { ...masteredIds, [id]: true };
    setMasteredIds(updated);
    try {
      localStorage.setItem('linguahub_mastered_en_vocab', JSON.stringify(updated));
    } catch {}

    onAddXp(10);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  // Flashcard navigation
  const currentFlashcard = studyList[flashcardIdx] || studyList[0];

  const handleNextFlashcard = () => {
    playPopSound();
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev + 1) % (studyList.length || 1));
  };

  const handlePrevFlashcard = () => {
    playPopSound();
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev - 1 + (studyList.length || 1)) % (studyList.length || 1));
  };

  // Quiz generation for current flashcard / question
  const currentQuizWord = studyList[quizQuestionIdx % (studyList.length || 1)] || studyList[0];
  const quizOptions = useMemo(() => {
    if (!currentQuizWord) return [];
    const wrongPool = allVocab.filter((w) => w.id !== currentQuizWord.id);
    const shuffledWrong = [...wrongPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [currentQuizWord, ...shuffledWrong];
    return combined.sort(() => 0.5 - Math.random());
  }, [currentQuizWord]);

  const handleSelectQuizOption = (optionMeaning: string) => {
    if (isQuizAnswered || !currentQuizWord) return;
    setSelectedOption(optionMeaning);
    setIsQuizAnswered(true);

    if (optionMeaning === currentQuizWord.meaningVi) {
      playSuccessSound();
      setQuizScore((prev) => prev + 1);
      onAddXp(15);
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
    } else {
      playErrorSound();
    }
  };

  const handleNextQuizQuestion = () => {
    playPopSound();
    setIsQuizAnswered(false);
    setSelectedOption(null);
    setQuizQuestionIdx((prev) => prev + 1);
  };

  if (!loaded) {
    return <div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải kho từ vựng…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Top Banner & Overview */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kho {total.toLocaleString('vi-VN')} Từ Vựng Tiếng Anh (A1 - C1)
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">{topics.length - 1} chủ đề</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Phiên âm IPA chuẩn quốc tế</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Collocations & câu ví dụ song ngữ</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Luyện thi IELTS & TOEIC</span>
            </div>
          </div>

          {/* Mastered Progress Widget & View Switcher */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Đã thành thạo:</span>
                  <span className="font-mono text-xs font-black text-amber-400">
                    {masteredCount} / {total.toLocaleString('vi-VN')} từ
                  </span>
                </div>
                <div className="w-32 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (masteredCount / (total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setViewMode('list');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Danh Sách
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setViewMode('flashcard');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewMode === 'flashcard'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flashcard 3D
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setViewMode('quiz');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewMode === 'quiz'
                    ? 'bg-slate-800 text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Trắc Nghiệm
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="pt-6 border-t border-slate-800/80 mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tra cứu từ tiếng Anh, nghĩa tiếng Việt, cụm từ..."
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* CEFR Level Filter */}
            <div className="md:col-span-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Cấp độ:</span>
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setSelectedLevel(lvl);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Chủ đề:</span>
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  playPopSound();
                  setSelectedTopic(topic);
                  setFlashcardIdx(0);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTopic === topic
                    ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-950'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VIEW MODE 1: LIST VIEW */}
      {viewMode === 'list' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-400 px-1">
            <span>Hiển thị <strong>{filteredList.length}</strong> từ vựng phù hợp{lockedCount > 0 && <span className="text-amber-300"> ({lockedCount} từ cần mở khoá)</span>}</span>
            <span>Mẹo: Bấm biểu tượng loa để nghe phát âm giọng bản xứ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pageList.map((item) => {
              const isMastered = !!masteredIds[item.id];
              if (!isUnlocked(item)) {
                const sc = scopeOf(item);
                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white tracking-tight truncate">{item.word}</h3>
                      <p className="text-xs text-slate-500 mt-1 blur-[3px] select-none" aria-hidden="true">[{item.partOfSpeech}] nghĩa tiếng Việt của từ này</p>
                    </div>
                    <button onClick={() => goPricing(scopeProductId(sc))} className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] font-black flex items-center gap-1 cursor-pointer">
                      🔒 {SCOPE_LABEL[sc]}
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isMastered
                      ? 'bg-slate-900/60 border-slate-800/80 opacity-90'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white tracking-tight">{item.word}</h3>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {item.ipa}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                          {item.level}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold mt-1">
                        [{item.partOfSpeech}] {item.meaningVi}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handlePlayAudio(item.word, e)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleMarkMastered(item.id, e)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isMastered
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-slate-300'
                        }`}
                        title={isMastered ? 'Đã thành thạo' : 'Đánh dấu đã thuộc (+10 XP)'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Collocation & Example */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                    {item.collocation && (
                      <p className="text-slate-400">
                        <span className="text-slate-500 font-medium">Cụm hay dùng:</span>{' '}
                        <span className="text-slate-200 font-semibold">{item.collocation}</span>
                      </p>
                    )}
                    <div className="text-slate-300 leading-relaxed">
                      <p className="italic font-serif">"{item.exampleEn}"</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.exampleVi}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <VocabPager page={page} total={filteredList.length} onChange={setPage} />

          {filteredList.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-white">Không tìm thấy từ vựng phù hợp</p>
              <p className="text-xs">Hãy thử đổi từ khóa tìm kiếm hoặc chọn cấp độ khác.</p>
            </div>
          )}
        </section>
      )}

      {/* VIEW MODE 2: FLASHCARD 3D */}
      {viewMode !== 'list' && studyList.length === 0 && filteredList.length > 0 && firstLockedScope && (
        <LockedPanel scope={scopeOf(firstLockedScope)} what="Bộ từ đang chọn" />
      )}

      {viewMode === 'flashcard' && currentFlashcard && (
        <section className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>
              Thẻ {flashcardIdx + 1} / {studyList.length} ({currentFlashcard.topic})
            </span>
            <span className="font-bold text-amber-400">Trình độ: {currentFlashcard.level}</span>
          </div>

          {/* Flashcard Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[300px] bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 flex flex-col justify-between shadow-2xl transition-all relative group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="uppercase font-bold tracking-wider">{currentFlashcard.partOfSpeech}</span>
              <span className="text-[11px] text-slate-400 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <RotateCw className="w-3.5 h-3.5" /> Bấm để lật thẻ
              </span>
            </div>

            {!isFlipped ? (
              /* Front of card */
              <div className="text-center py-8 space-y-3">
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {currentFlashcard.word}
                </h2>
                <p className="text-sm font-mono text-cyan-300 font-semibold">{currentFlashcard.ipa}</p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => handlePlayAudio(currentFlashcard.word, e)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Nghe phát âm</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Back of card */
              <div className="py-4 space-y-4 animate-in fade-in">
                <div>
                  <span className="text-xs text-slate-500 block">Nghĩa tiếng Việt:</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{currentFlashcard.meaningVi}</p>
                </div>

                {currentFlashcard.collocation && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <span className="text-slate-500 font-medium">Cụm thường gặp:</span>{' '}
                    <span className="text-white font-bold">{currentFlashcard.collocation}</span>
                  </div>
                )}

                <div className="pt-1 text-xs text-slate-300 leading-relaxed">
                  <p className="italic font-serif">"{currentFlashcard.exampleEn}"</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{currentFlashcard.exampleVi}</p>
                </div>
              </div>
            )}

            {/* Bottom Actions on Card */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-500">{currentFlashcard.topic}</span>
              <button
                type="button"
                onClick={(e) => handleMarkMastered(currentFlashcard.id, e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  masteredIds[currentFlashcard.id]
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{masteredIds[currentFlashcard.id] ? 'Đã thuộc' : 'Thuộc từ này (+10 XP)'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrevFlashcard}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow"
            >
              <ChevronLeft className="w-4 h-4" /> Từ trước
            </button>
            <button
              type="button"
              onClick={handleNextFlashcard}
              className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Từ tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* VIEW MODE 3: QUIZ MODE */}
      {viewMode === 'quiz' && currentQuizWord && (
        <section className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-4 h-4" /> Điểm đúng: {quizScore}
                </span>
                <span aria-hidden="true">·</span>
                <span>Câu số {quizQuestionIdx + 1}</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                {currentQuizWord.level}
              </span>
            </div>

            {/* Prompt Word */}
            <div className="text-center py-6 space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                Chọn nghĩa tiếng Việt chính xác của:
              </span>
              <h2 className="text-4xl font-black text-white">{currentQuizWord.word}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-mono text-cyan-300">{currentQuizWord.ipa}</span>
                <button
                  type="button"
                  onClick={() => handlePlayAudio(currentQuizWord.word)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {quizOptions.map((opt, idx) => {
                const isSelected = selectedOption === opt.meaningVi;
                const isCorrect = opt.meaningVi === currentQuizWord.meaningVi;

                let btnStyle = 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200';
                if (isQuizAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                  } else {
                    btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-600';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuizOption(opt.meaningVi)}
                    disabled={isQuizAnswered}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-sm ${btnStyle}`}
                  >
                    <span>{opt.meaningVi}</span>
                    {isQuizAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Next Question CTA */}
            {isQuizAnswered && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <p className="text-slate-400">Ví dụ: <span className="text-white italic">"{currentQuizWord.exampleEn}"</span></p>
                </div>
                <button
                  type="button"
                  onClick={handleNextQuizQuestion}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Câu tiếp theo →
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

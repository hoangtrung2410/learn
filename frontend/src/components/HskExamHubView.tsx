import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  HSK_LEVELS_ROADMAP,
  HSK_MOCK_EXAMS,
  HskLevelInfo,
  HskMockExam,
  ExamQuestion,
} from '../data/hskExamData';
import { speakNativeText, playPopSound, playSuccessSound, playErrorSound } from '../utils/audio';
import { useAccess, zhLevelScope, scopeProductId } from '../lib/access';
import { goPricing } from '../lib/nav';
import { logActivity } from '../lib/daily';
import {
  GraduationCap,
  BookOpen,
  FileCheck2,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  ChevronRight,
  Sliders,
  Check,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
const HskVocabTab = lazy(() => import('./HskVocabTab').then((m) => ({ default: m.HskVocabTab })));
const HskGrammarTab = lazy(() => import('./HskGrammarTab').then((m) => ({ default: m.HskGrammarTab })));
const HskBooksLibraryTab = lazy(() => import('./HskBooksLibraryTab').then((m) => ({ default: m.HskBooksLibraryTab })));

interface HskExamHubViewProps {
  onAddXp: (amount: number) => void;
}

export const HskExamHubView: React.FC<HskExamHubViewProps> = ({ onAddXp }) => {
  const [hubTab, setHubTab] = useState<'roadmap' | 'mock-exam' | 'books' | 'vocabulary' | 'grammar'>('roadmap');
  const [examFilterLevel, setExamFilterLevel] = useState<number | 'all'>('all');

  // Selected level for roadmap detail
  const { hasScope } = useAccess();
  const [selectedLevel, setSelectedLevel] = useState<HskLevelInfo>(HSK_LEVELS_ROADMAP[0]);

  // Exam simulation state
  const [currentExam, setCurrentExam] = useState<HskMockExam | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Audio playing status for listening questions
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Word reordering draft state for current question
  const [reorderDraft, setReorderDraft] = useState<string[]>([]);

  const timerRef = useRef<any>(null);

  // Handle countdown timer
  useEffect(() => {
    if (isTimerRunning && examTimeRemaining > 0 && !examSubmitted) {
      timerRef.current = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, examTimeRemaining, examSubmitted]);

  // Initialize reorder words draft when switching questions
  useEffect(() => {
    if (currentExam && currentExam.questions[currentQuestionIdx]) {
      const q = currentExam.questions[currentQuestionIdx];
      if (q.type === 'reorder' && q.wordsToReorder) {
        // If already answered, parse or reset
        const existing = userAnswers[q.id];
        if (existing) {
          // keep existing
        } else {
          setReorderDraft([]);
        }
      }
    }
  }, [currentQuestionIdx, currentExam]);

  const handleStartExam = (exam: HskMockExam) => {
    const scope = zhLevelScope(exam.hskLevel);
    if (!hasScope(scope)) {
      goPricing(scopeProductId(scope));
      return;
    }
    playPopSound();
    setCurrentExam(exam);
    setHubTab('mock-exam');
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setExamSubmitted(false);
    setExamTimeRemaining(exam.durationMinutes * 60);
    setIsTimerRunning(true);
    setReorderDraft([]);
  };

  const handleSelectAnswer = (questionId: string, answerKey: string) => {
    if (examSubmitted) return;
    playPopSound();
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerKey,
    }));
  };

  const handleAddWordToReorder = (word: string, questionId: string) => {
    if (examSubmitted) return;
    playPopSound();
    const updated = [...reorderDraft, word];
    setReorderDraft(updated);
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: updated.join(''),
    }));
  };

  const handleRemoveWordFromReorder = (index: number, questionId: string) => {
    if (examSubmitted) return;
    playPopSound();
    const updated = reorderDraft.filter((_, idx) => idx !== index);
    setReorderDraft(updated);
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: updated.join(''),
    }));
  };

  const handlePlayAudio = async (text: string, slow = false) => {
    playPopSound();
    setIsPlayingAudio(true);
    await speakNativeText(text, 'zh', slow);
    setIsPlayingAudio(false);
  };

  const handleSubmitExam = () => {
    if (examSubmitted || !currentExam) return;
    setIsTimerRunning(false);
    setExamSubmitted(true);
    logActivity('quiz', Object.keys(userAnswers).length);

    // Calculate score
    let correctCount = 0;
    currentExam.questions.forEach((q) => {
      const userAns = userAnswers[q.id];
      if (userAns && userAns.trim() === q.correctAnswer.trim()) {
        correctCount += 1;
      }
    });

    const earnedScore = Math.round((correctCount / currentExam.questions.length) * currentExam.maxScore);
    const passed = earnedScore >= currentExam.passScore;

    if (passed) {
      playSuccessSound();
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
      });
      onAddXp(50);
    } else {
      playErrorSound();
      onAddXp(20);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate results if submitted
  const calculateResultStats = () => {
    if (!currentExam) return { correctCount: 0, total: 0, score: 0, passed: false };
    let correctCount = 0;
    currentExam.questions.forEach((q) => {
      if (userAnswers[q.id] && userAnswers[q.id].trim() === q.correctAnswer.trim()) {
        correctCount += 1;
      }
    });
    const total = currentExam.questions.length;
    const score = Math.round((correctCount / total) * currentExam.maxScore);
    const passed = score >= currentExam.passScore;
    return { correctCount, total, score, passed };
  };

  const examStats = calculateResultStats();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-gradient-to-r from-red-900/40 via-amber-900/30 to-purple-900/40 p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10">
            🎓
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Trung Tâm Ôn Thi HSK & Luyện Đề Chuẩn
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                HSK 3.0 Standard
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Lộ trình toàn diện từ HSK 1 đến HSK 6, hệ thống phòng thi thử đếm ngược thời gian thực, audio bản xứ và chấm điểm chi tiết từng câu.
            </p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 w-full xl:w-auto">
          <button
            onClick={() => {
              playPopSound();
              setHubTab('roadmap');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hubTab === 'roadmap'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lộ Trình HSK 1 - 6</span>
          </button>
          <button
            onClick={() => {
              playPopSound();
              setHubTab('mock-exam');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hubTab === 'mock-exam'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Luyện Đề ({HSK_MOCK_EXAMS.length} Đề)</span>
          </button>
          <button
            onClick={() => {
              playPopSound();
              setHubTab('books');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hubTab === 'books'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sách & Giáo Trình</span>
          </button>
          <button
            onClick={() => {
              playPopSound();
              setHubTab('vocabulary');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hubTab === 'vocabulary'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Kho Từ Vựng HSK</span>
          </button>
          <button
            onClick={() => {
              playPopSound();
              setHubTab('grammar');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hubTab === 'grammar'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Bí Kíp Ngữ Pháp</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: LỘ TRÌNH HSK 1 - 6 ================= */}
      {hubTab === 'roadmap' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Level Selector Grid (HSK 1 - 6) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Chọn Cấp Độ HSK Để Xem Chi Tiết
              </h2>
              <span className="text-xs text-amber-400 font-bold">Khung tham chiếu HSK 3.0 quốc tế</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {HSK_LEVELS_ROADMAP.map((lvl) => {
                const isSelected = selectedLevel.level === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    onClick={() => {
                      playPopSound();
                      setSelectedLevel(lvl);
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 text-white shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 block">{lvl.badge}</span>
                    <span className="text-2xl font-black block mt-1 font-chinese">HSK {lvl.level}</span>
                    <span className="text-[11px] font-bold text-amber-400 block mt-1">
                      {lvl.vocabCount} từ vựng
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">CEFR {lvl.targetCefr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Level Deep-Dive Card */}
          <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-700/80">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs">
                    {selectedLevel.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {selectedLevel.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                  {selectedLevel.targetDescription}
                </p>
              </div>

              {/* Action Buttons for this Level */}
              <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                {HSK_MOCK_EXAMS.find((m) => m.hskLevel === selectedLevel.level) && (
                  <button
                    onClick={() => {
                      const match = HSK_MOCK_EXAMS.find((m) => m.hskLevel === selectedLevel.level);
                      if (match) handleStartExam(match);
                    }}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>{hasScope(zhLevelScope(selectedLevel.level)) ? `Thi Thử HSK ${selectedLevel.level} Ngay` : `🔒 Thi thử HSK ${selectedLevel.level} (cần mở khoá)`}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    playPopSound();
                    setHubTab('vocabulary');
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>Tra Từ Vựng</span>
                </button>

                <button
                  onClick={() => {
                    playPopSound();
                    setHubTab('grammar');
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Ôn Ngữ Pháp</span>
                </button>

                <button
                  onClick={() => {
                    playPopSound();
                    setHubTab('books');
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Sách Giáo Trình</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics (Vocab, Duration, Passing Score, Grammar) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Khối Lượng Từ Vựng</span>
                <p className="text-2xl font-black text-amber-400 mt-1">{selectedLevel.vocabCount}</p>
                <span className="text-[10px] text-slate-500">Từ vựng cốt lõi</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Điểm Chuẩn Đỗ</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">{selectedLevel.passingScore}</p>
                <span className="text-[10px] text-slate-500">Đạt chuẩn 合格</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Thời Lượng Bài Thi</span>
                <p className="text-xl font-black text-blue-400 mt-1">{selectedLevel.examDuration.split('(')[0]}</p>
                <span className="text-[10px] text-slate-500">Thời gian quy định</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Ngữ Pháp Trọng Tâm</span>
                <p className="text-2xl font-black text-purple-400 mt-1">{selectedLevel.grammarPoints}+</p>
                <span className="text-[10px] text-slate-500">Điểm ngữ pháp</span>
              </div>
            </div>

            {/* Core Grammar & Exam Structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left: Core Grammar Points */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                <h4 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Điểm Ngữ Pháp & Cấu Trúc Bắt Buộc:
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedLevel.coreGrammar.map((gm, gIdx) => (
                    <li key={gIdx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {gIdx + 1}
                      </span>
                      <span>{gm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Structure & Tips */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                <h4 className="text-sm font-extrabold text-blue-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Cấu Trúc Các Phần Thi & Mẹo Làm Bài:
                </h4>
                <div className="space-y-2">
                  {selectedLevel.examStructure.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white">{st.section}</span>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>{st.questionsCount} câu</span>
                        <span>•</span>
                        <span>{st.duration}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{st.maxScore}đ</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Mẹo thi đạt điểm cao:</span>
                  {selectedLevel.tips.map((tip, tIdx) => (
                    <p key={tIdx} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span>💡</span>
                      <span>{tip}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: PHÒNG LUYỆN ĐỀ THI THỬ ================= */}
      {hubTab === 'mock-exam' && (
        <div className="space-y-8 animate-in fade-in">
          {/* If no exam is currently open: Display Exam Catalog */}
          {!currentExam ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white">Danh Sách Đề Thi Thử HSK Chuẩn Đề Thực Tế</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Chọn một đề thi để bước vào phòng thi có bấm giờ & chấm điểm chi tiết</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 self-start sm:self-auto">
                  {HSK_MOCK_EXAMS.length} Đề thi thực chiến
                </span>
              </div>

              {/* Exam Level Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-700/80">
                <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
                  Lọc cấp độ:
                </span>
                <button
                  onClick={() => {
                    playPopSound();
                    setExamFilterLevel('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    examFilterLevel === 'all'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Tất Cả ({HSK_MOCK_EXAMS.length})
                </button>
                {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const count = HSK_MOCK_EXAMS.filter((m) => m.hskLevel === lvl).length;
                  const isSelected = examFilterLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => {
                        playPopSound();
                        setExamFilterLevel(lvl);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>HSK {lvl}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count} đề
                      </span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const displayedExams =
                  examFilterLevel === 'all'
                    ? HSK_MOCK_EXAMS
                    : HSK_MOCK_EXAMS.filter((m) => m.hskLevel === examFilterLevel);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="p-6 rounded-3xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                              HSK {exam.hskLevel}
                            </span>
                            <span className="text-xs font-mono text-slate-400">Mã đề: {exam.code}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-white">{exam.title}</h3>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{exam.description}</p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-700">
                          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-400" /> {exam.durationMinutes} phút
                            </span>
                            <span>{exam.totalQuestions} câu hỏi</span>
                            <span className="text-emerald-400">{exam.passScore}/{exam.maxScore}đ Đạt</span>
                          </div>

                          <button
                            onClick={() => handleStartExam(exam)}
                            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span>{hasScope(zhLevelScope(exam.hskLevel)) ? 'Bắt Đầu Làm Bài Thi' : '🔒 Mở khoá để làm đề này'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Inside Mock Exam Simulator */
            <div className="space-y-6">
              {/* Exam Top Bar (Title, Timer, Exit Button) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs">
                    HSK {currentExam.hskLevel}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentExam.title}</h3>
                    <span className="text-[11px] text-slate-400">Mã đề: {currentExam.code}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Timer */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-extrabold border ${
                      examTimeRemaining < 120
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-amber-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(examTimeRemaining)}</span>
                  </div>

                  {/* Submit / Exit */}
                  {!examSubmitted ? (
                    <button
                      onClick={handleSubmitExam}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow cursor-pointer"
                    >
                      Nộp Bài Thi
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playPopSound();
                        setCurrentExam(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      Thoát Về Danh Sách Đề
                    </button>
                  )}
                </div>
              </div>

              {/* Exam Submission Summary Card if Submitted */}
              {examSubmitted && (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl">
                        {examStats.passed ? '🎉' : '📖'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-2xl font-black text-white">
                            {examStats.passed ? 'Chúc Mừng Bạn Đã Đạt Chuẩn HSK!' : 'Cố Lên! Cần Ôn Luyện Thêm'}
                          </h4>
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                              examStats.passed
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {examStats.passed ? '合格 (ĐẠT)' : '未合格 (CHƯA ĐẠT)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Điểm số của bạn: <strong className="text-amber-400 text-base">{examStats.score}</strong> /{' '}
                          {currentExam.maxScore} điểm (Điểm chuẩn qua môn: {currentExam.passScore} điểm).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStartExam(currentExam)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Thi Lại Đề Này</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {currentExam.questions.map((q, idx) => {
                  const isAnswered = !!userAnswers[q.id];
                  const isCurrent = currentQuestionIdx === idx;
                  const isCorrect = userAnswers[q.id]?.trim() === q.correctAnswer.trim();

                  let bubbleStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (examSubmitted) {
                    bubbleStyle = isCorrect
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500 text-rose-300';
                  } else if (isCurrent) {
                    bubbleStyle = 'bg-amber-500 border-amber-400 text-slate-950 font-black';
                  } else if (isAnswered) {
                    bubbleStyle = 'bg-blue-600/30 border-blue-500 text-blue-300';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        playPopSound();
                        setCurrentQuestionIdx(idx);
                      }}
                      className={`w-10 h-10 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${bubbleStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question Body */}
              {(() => {
                const question = currentExam.questions[currentQuestionIdx];
                if (!question) return null;

                const isCurrentCorrect = userAnswers[question.id]?.trim() === question.correctAnswer.trim();

                return (
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl space-y-6">
                    {/* Question Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xl bg-slate-700 text-amber-300 font-extrabold text-xs">
                          Câu {question.questionNumber} / {currentExam.questions.length}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{question.partNameVi}</span>
                      </div>

                      {/* TTS Listening Button if audio exists */}
                      {question.audioPrompt && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePlayAudio(question.audioPrompt!, false)}
                            disabled={isPlayingAudio}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe Audio Chuẩn</span>
                          </button>
                          <button
                            onClick={() => handlePlayAudio(question.audioPrompt!, true)}
                            disabled={isPlayingAudio}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold text-xs transition-all cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Chậm 0.7x</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg font-bold text-white">{question.promptText}</p>
                      {question.pinyin && (
                        <p className="text-sm font-mono text-blue-400 font-medium">{question.pinyin}</p>
                      )}
                      {question.promptVi && (
                        <p className="text-sm text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          {question.promptVi}
                        </p>
                      )}
                    </div>

                    {/* Options: True/False or Multiple Choice */}
                    {question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {question.options.map((opt) => {
                          const isSelected = userAnswers[question.id] === opt.key;
                          let optStyle =
                            'bg-slate-900/70 hover:bg-slate-900 border-slate-700 text-slate-200';

                          if (examSubmitted) {
                            if (opt.key === question.correctAnswer) {
                              optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                            } else if (isSelected) {
                              optStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 line-through';
                            }
                          } else if (isSelected) {
                            optStyle =
                              'bg-amber-500/20 border-amber-400 text-white font-bold ring-2 ring-amber-400/30';
                          }

                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleSelectAnswer(question.id, opt.key)}
                              disabled={examSubmitted}
                              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {opt.key === 'true' ? '✓' : opt.key === 'false' ? '✗' : opt.key}
                                </span>
                                <div>
                                  <p className="text-sm font-bold font-chinese">{opt.text}</p>
                                  {opt.meaningVi && (
                                    <p className="text-xs text-slate-400 mt-0.5">{opt.meaningVi}</p>
                                  )}
                                </div>
                              </div>
                              {isSelected && !examSubmitted && (
                                <Check className="w-5 h-5 text-amber-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Reorder Interactive Builder (Sắp xếp câu) */}
                    {question.type === 'reorder' && question.wordsToReorder && (
                      <div className="space-y-4 pt-2">
                        {/* Word bank buttons */}
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-2">
                            Bấm vào các từ bên dưới để ghép vào câu:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {question.wordsToReorder.map((word, wIdx) => {
                              const alreadyUsedCount = reorderDraft.filter((w) => w === word).length;
                              const availableCount = question.wordsToReorder!.filter((w) => w === word).length;
                              const isFullyUsed = alreadyUsedCount >= availableCount;

                              return (
                                <button
                                  key={wIdx}
                                  onClick={() => handleAddWordToReorder(word, question.id)}
                                  disabled={isFullyUsed || examSubmitted}
                                  className={`px-4 py-2.5 rounded-xl border font-bold text-base font-chinese transition-all ${
                                    isFullyUsed
                                      ? 'opacity-30 bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300 hover:border-amber-400 cursor-pointer shadow'
                                  }`}
                                >
                                  {word}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Assembled sentence drop zone */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-dashed border-slate-700 min-h-[60px] flex items-center flex-wrap gap-2">
                          {reorderDraft.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">
                              Chưa có từ nào được chọn. Hãy bấm vào các từ ở trên.
                            </span>
                          ) : (
                            reorderDraft.map((word, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleRemoveWordFromReorder(idx, question.id)}
                                disabled={examSubmitted}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-sm font-chinese flex items-center gap-1.5 hover:bg-rose-500/20 hover:border-rose-500 hover:text-rose-300 transition-all cursor-pointer"
                                title="Bấm để xóa từ này"
                              >
                                <span>{word}</span>
                                {!examSubmitted && <span className="text-[10px]">✕</span>}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detailed Answer Key & Explanation if Exam is Submitted */}
                    {examSubmitted && (
                      <div
                        className={`p-5 rounded-2xl border space-y-3 animate-in fade-in ${
                          isCurrentCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-rose-950/30 border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCurrentCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                          <h5
                            className={`text-sm font-extrabold ${
                              isCurrentCorrect ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {isCurrentCorrect ? 'Bạn đã trả lời chính xác!' : 'Bạn chưa chọn đúng câu này!'}
                          </h5>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1">
                          <p>
                            👉 <strong>Đáp án đúng:</strong>{' '}
                            <span className="text-amber-400 font-bold font-chinese text-sm">
                              {question.correctAnswer}
                            </span>
                          </p>
                          <p>
                            📝 <strong>Giải thích chi tiết:</strong> {question.explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Next / Previous Question Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/80">
                      <button
                        onClick={() => {
                          playPopSound();
                          setCurrentQuestionIdx((prev) => Math.max(0, prev - 1));
                        }}
                        disabled={currentQuestionIdx === 0}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Câu Trước
                      </button>

                      <button
                        onClick={() => {
                          playPopSound();
                          setCurrentQuestionIdx((prev) =>
                            Math.min(currentExam.questions.length - 1, prev + 1)
                          );
                        }}
                        disabled={currentQuestionIdx === currentExam.questions.length - 1}
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all cursor-pointer"
                      >
                        Câu Kế Tiếp
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: THƯ VIỆN SÁCH & GIÁO TRÌNH HSK ================= */}
      {hubTab === 'books' && (<Suspense fallback={<div className="py-16 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>}><HskBooksLibraryTab onAddXp={onAddXp} /></Suspense>)}

      {/* ================= VIEW 4: KHO TỪ VỰNG HSK 1 - 6 ================= */}
      {hubTab === 'vocabulary' && (<Suspense fallback={<div className="py-16 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>}><HskVocabTab onAddXp={onAddXp} /></Suspense>)}

      {/* ================= VIEW 5: BÍ KÍP NGỮ PHÁP HSK 1 - 6 ================= */}
      {hubTab === 'grammar' && (<Suspense fallback={<div className="py-16 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>}><HskGrammarTab onAddXp={onAddXp} /></Suspense>)}
    </div>
  );
};

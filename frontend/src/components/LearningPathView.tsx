import React, { useState } from 'react';
import { CHINESE_UNITS, ENGLISH_UNITS } from '../data/curriculum';
import { LanguageCode, Lesson, Unit } from '../types';
import { LessonModal } from './LessonModal';
import { playPopSound } from '../utils/audio';
import {
  Check,
  Lock,
  Star,
  Award,
  BookOpen,
  Volume2,
  Sparkles,
  Flame,
  ChevronRight,
} from 'lucide-react';

interface LearningPathViewProps {
  currentLang: LanguageCode;
  completedLessonIds: string[];
  onFinishLesson: (xp: number, lessonId: string) => void;
  onOpenSpeakingLab: () => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  currentLang,
  completedLessonIds,
  onFinishLesson,
  onOpenSpeakingLab,
}) => {
  const units: Unit[] = currentLang === 'zh' ? CHINESE_UNITS : ENGLISH_UNITS;
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      {/* Duolingo Mascot Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/60 p-6 sm:p-8 rounded-3xl border border-emerald-500/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/20 animate-bounce duration-1000">
            🐼
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">
                Lộ Trình Học {currentLang === 'zh' ? 'Tiếng Trung HSK 3.0' : 'Tiếng Anh Giao Tiếp'}
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                {currentLang === 'zh' ? 'Chặng HSK' : 'Chuẩn CEFR'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
              {currentLang === 'zh'
                ? 'Chinh phục từng mốc kỹ năng, mở khóa thanh điệu Pinyin và luyện phát âm tương tác trực tiếp với Trợ lý AI.'
                : 'Làm chủ kỹ năng giao tiếp tiếng Anh đời sống, luyện nối âm, ngữ điệu bản ngữ và phản xạ nói 1-1 với Trợ lý AI.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSpeakingLab}
          className="px-5 py-3 rounded-2xl btn-tactile-blue text-white font-extrabold text-xs shadow-xl flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>Vào Phòng Luyện Phát Âm</span>
        </button>
      </div>

      {/* Units List */}
      <div className="space-y-16">
        {units.map((unit, uIdx) => {
          return (
            <div key={unit.id} className="space-y-8">
              {/* Unit Header Banner */}
              <div
                className="p-5 rounded-3xl text-white shadow-xl flex items-center justify-between"
                style={{ backgroundColor: unit.color }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                      Cửa ải {unit.unitNumber}
                    </span>
                    <span className="text-xs font-bold text-white/90">{unit.badge}</span>
                  </div>
                  <h2 className="text-xl font-black mt-1">{unit.title}</h2>
                  <p className="text-xs text-white/80 mt-0.5">{unit.description}</p>
                </div>
                <div className="text-3xl hidden sm:block">🏆</div>
              </div>

              {/* Duolingo Winding Nodes Path */}
              <div className="flex flex-col items-center space-y-6 py-4 relative">
                {unit.lessons.map((lesson, lIdx) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  // Calculate winding offset (center -> right -> center -> left -> center)
                  const offsets = [0, 48, 0, -48];
                  const currentOffset = offsets[lIdx % offsets.length];

                  return (
                    <div
                      key={lesson.id}
                      style={{ transform: `translateX(${currentOffset}px)` }}
                      className="transition-transform duration-300 flex flex-col items-center group"
                    >
                      <button
                        onClick={() => {
                          playPopSound();
                          setActiveLesson(lesson);
                        }}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl relative transition-transform active:translate-y-1.5 cursor-pointer ${
                          isCompleted
                            ? 'bg-amber-500 border-b-6 border-amber-700 hover:brightness-105'
                            : 'bg-emerald-500 border-b-6 border-emerald-700 hover:brightness-105 animate-pulse'
                        }`}
                        title={lesson.title}
                      >
                        <span>{lesson.icon}</span>

                        {/* Completion Badge Checkmark */}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900 shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        {/* XP Badge */}
                        <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-slate-900/90 text-amber-300 font-extrabold text-[10px] border border-slate-700 shadow">
                          +{lesson.xp} XP
                        </div>
                      </button>

                      {/* Lesson title tooltip beneath */}
                      <div className="mt-3 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center max-w-[180px] shadow-lg">
                        <p className="text-xs font-extrabold text-white truncate">{lesson.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{lesson.description}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Milestone Mystery Chest at end of each unit */}
                <div className="pt-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl shadow-lg">
                    🎁
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 mt-2">Rương thưởng 50 Kim Cương</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lesson Quiz Modal */}
      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          currentLang={currentLang}
          onClose={() => setActiveLesson(null)}
          onFinishLesson={(xp) => {
            onFinishLesson(xp, activeLesson.id);
            setActiveLesson(null);
          }}
        />
      )}
    </div>
  );
};

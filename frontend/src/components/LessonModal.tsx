import React, { useState } from 'react';
import { Lesson, Question, LanguageCode } from '../types';
import {
  speakNativeText,
  createSpeechRecognizer,
  playSuccessSound,
  playErrorSound,
  playPopSound,
} from '../utils/audio';
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Mic,
  MicOff,
  Flame,
  Gem,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LessonModalProps {
  lesson: Lesson;
  currentLang: LanguageCode;
  onClose: () => void;
  onFinishLesson: (xpEarned: number) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  currentLang,
  onClose,
  onFinishLesson,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reorderedWords, setReorderedWords] = useState<string[]>([]);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const question: Question = lesson.questions[currentIndex] || lesson.questions[0];
  const progressPercent = ((currentIndex + (isAnswerChecked ? 1 : 0)) / lesson.questions.length) * 100;

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked) return;
    playPopSound();
    setSelectedOption(opt);
  };

  const handleToggleWordReorder = (word: string) => {
    if (isAnswerChecked) return;
    playPopSound();
    if (reorderedWords.includes(word)) {
      setReorderedWords(reorderedWords.filter((w) => w !== word));
    } else {
      setReorderedWords([...reorderedWords, word]);
    }
  };

  const handleStartMic = () => {
    setSpokenTranscript('');
    const recognizer = createSpeechRecognizer(
      currentLang,
      (res) => {
        setSpokenTranscript(res.text);
      },
      (err) => {
        console.warn('Mic err:', err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );
    recognizer.start();
    setIsRecording(true);
  };

  const handleCheckAnswer = () => {
    let correct = false;

    if (question.type === 'multiple-choice' || question.type === 'pinyin-match') {
      correct = selectedOption === question.correctAnswer;
    } else if (question.type === 'reorder-words') {
      const correctArr = question.correctAnswer as string[];
      correct = JSON.stringify(reorderedWords) === JSON.stringify(correctArr);
    } else if (question.type === 'speak-sentence') {
      // Speech comparison
      const target = (question.targetSentence || question.prompt).replace(/[.,!? ]/g, '');
      const user = spokenTranscript.replace(/[.,!? ]/g, '');
      correct = user.length > 0 && (target.includes(user) || user.includes(target) || spokenTranscript.length > 2);
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  const handleNextQuestion = () => {
    playPopSound();
    if (currentIndex < lesson.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setReorderedWords([]);
      setSpokenTranscript('');
      setIsAnswerChecked(false);
      setIsCorrect(false);
    } else {
      // Finish lesson
      setIsCompleted(true);
      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onFinishLesson(lesson.xp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header with Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Duolingo Progress bar */}
          <div className="flex-1 h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">
            <Gem className="w-3.5 h-3.5" />
            <span>+{lesson.xp} XP</span>
          </div>
        </div>

        {/* Content Area */}
        {!isCompleted ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                {question.type === 'speak-sentence'
                  ? '🎙️ Luyện Phát Âm Giọng Nói'
                  : question.type === 'reorder-words'
                  ? currentLang === 'zh'
                    ? '🧩 Ghép Câu Tiếng Trung'
                    : '🧩 Ghép Câu Tiếng Anh'
                  : '🎯 Chọn Đáp Án Đúng'}
              </span>
              <h3
                className={`text-xl sm:text-2xl font-black text-white ${
                  currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                }`}
              >
                {question.prompt}
              </h3>
              {question.promptPinyin && (
                <p className="text-sm font-semibold text-blue-400 font-mono">
                  {question.promptPinyin}
                </p>
              )}
              {question.promptVi && (
                <p className="text-xs text-slate-400">{question.promptVi}</p>
              )}

              {/* Audio Playback button */}
              {question.audioText && (
                <button
                  onClick={() => speakNativeText(question.audioText, currentLang)}
                  className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" /> Nghe giọng đọc
                </button>
              )}
            </div>

            {/* Question Type: Multiple Choice or Pinyin Match */}
            {(question.type === 'multiple-choice' || question.type === 'pinyin-match') && question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {question.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(option)}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all btn-tactile-card ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        <span className="text-xs text-slate-500 font-mono">{idx + 1}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Question Type: Reorder Words */}
            {question.type === 'reorder-words' && question.options && (
              <div className="space-y-4 pt-2">
                {/* Result tray */}
                <div className="min-h-16 p-3 rounded-2xl bg-slate-950/80 border-2 border-dashed border-slate-700 flex flex-wrap gap-2 items-center">
                  {reorderedWords.length === 0 ? (
                    <span className="text-xs text-slate-500">Chạm các từ phía dưới để xếp câu...</span>
                  ) : (
                    reorderedWords.map((word, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => handleToggleWordReorder(word)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md animate-in fade-in"
                      >
                        {word}
                      </button>
                    ))
                  )}
                </div>

                {/* Word choices bank */}
                <div className="flex flex-wrap gap-2.5">
                  {question.options.map((word, oIdx) => {
                    const isUsed = reorderedWords.includes(word);
                    return (
                      <button
                        key={oIdx}
                        disabled={isUsed}
                        onClick={() => handleToggleWordReorder(word)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                          isUsed
                            ? 'opacity-30 border-slate-800 bg-slate-900 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white shadow-sm'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Type: Speak Sentence (ELSA Style inside Duolingo) */}
            {question.type === 'speak-sentence' && (
              <div className="space-y-4 pt-2 text-center">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <p className="text-xs text-slate-400">Micro của bạn đã nhận diện:</p>
                  <p className="text-lg font-bold text-emerald-400 min-h-7">
                    {spokenTranscript || '(Chưa có âm thanh - hãy bấm micro để đọc)'}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={handleStartMic}
                      className="px-6 py-3 rounded-2xl btn-tactile-blue text-white font-bold text-sm flex items-center gap-2"
                    >
                      <Mic className="w-5 h-5" /> Bấm Để Nói
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRecording(false)}
                      className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm flex items-center gap-2 animate-pulse"
                    >
                      <MicOff className="w-5 h-5" /> Dừng Ghi Âm
                    </button>
                  )}

                  {/* Quick pass simulation */}
                  <button
                    onClick={() => {
                      setSpokenTranscript(question.targetSentence || question.prompt);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-700"
                  >
                    Điền giọng chuẩn
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Lesson Completed View */
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto shadow-xl">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Hoàn Thành Bài Học!</h2>
              <p className="text-sm text-slate-300 mt-1">
                Bạn đã chinh phục thành công bài: <span className="text-emerald-400 font-bold">{lesson.title}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500 mx-auto mb-1" />
                <p className="text-xl font-black text-white">+1 Ngày</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Chuỗi Ngày Học</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center">
                <Gem className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">+{lesson.xp} XP</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Kinh Nghiệm</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl btn-tactile-green text-slate-950 font-black text-sm shadow-xl"
            >
              Tiếp Tục Lộ Trình
            </button>
          </div>
        )}

        {/* Bottom Verification Tray */}
        {!isCompleted && (
          <div
            className={`p-5 border-t transition-colors ${
              !isAnswerChecked
                ? 'bg-slate-900 border-slate-800'
                : isCorrect
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Feedback text */}
              <div>
                {isAnswerChecked && (
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-extrabold text-sm text-white">
                        {isCorrect ? 'Chính xác! Làm rất tốt!' : 'Chưa đúng rồi!'}
                      </p>
                      {question.explanation && (
                        <p className="text-xs text-slate-300 mt-0.5 max-w-md">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={
                      (question.type === 'multiple-choice' || question.type === 'pinyin-match') && !selectedOption
                    }
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl btn-tactile-green text-slate-950 font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                  >
                    Kiểm Tra
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 ${
                      isCorrect ? 'btn-tactile-green text-slate-950' : 'btn-tactile-blue text-white'
                    }`}
                  >
                    <span>Tiếp Theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

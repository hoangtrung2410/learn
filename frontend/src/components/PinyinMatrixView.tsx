import React, { useState } from 'react';
import { playToneFrequency, speakNativeText, playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';
import { Volume2, Sparkles, HelpCircle, Check, Award, ArrowRight } from 'lucide-react';

const TONES_DATA = [
  {
    tone: 1,
    name: 'Thanh 1 (Âm Bình - 阴平)',
    mark: 'mā',
    pitch: '55 (Cao & Ngang)',
    desc: 'Bắt đầu ở cao độ 5 và giữ nguyên cao độ, kéo dài đều hơi như khi hát nốt Sol.',
    example: '妈 (mā - Mẹ), 八 (bā - Tám), 天 (tiān - Trời)',
    color: '#3b82f6',
  },
  {
    tone: 2,
    name: 'Thanh 2 (Dương Bình - 阳平)',
    mark: 'má',
    pitch: '35 (Bổng Lên)',
    desc: 'Bắt đầu ở độ cao trung bình 3 rồi vút thẳng lên 5, tương tự như dấu hỏi ngạc nhiên trong tiếng Việt: "Hả?"',
    example: '麻 (má - Cây gai), 白 (bái - Trắng), 国 (guó - Đất nước)',
    color: '#10b981',
  },
  {
    tone: 3,
    name: 'Thanh 3 (Thượng Thanh - 上声)',
    mark: 'mǎ',
    pitch: '214 (Hạ Xuống Rồi Vút Nhẹ)',
    desc: 'Hạ giọng từ 2 xuống tận đáy 1 rồi mới đưa hơi lên 4. Gần giống dấu hỏi tiếng Việt nhưng trầm và uốn sâu hơn.',
    example: '马 (mǎ - Con ngựa), 好 (hǎo - Tốt), 水 (shuǐ - Nước)',
    color: '#f59e0b',
  },
  {
    tone: 4,
    name: 'Thanh 4 (Khứ Thanh - 去声)',
    mark: 'mà',
    pitch: '51 (Dứt Khoát Từ Cao Rơi Đáy)',
    desc: 'Hạ dứt khoát và mạnh mẽ từ đỉnh cao 5 rơi thẳng xuống đáy 1, như một mệnh lệnh dứt khoát!',
    example: '骂 (mà - Mắng), 看 (kàn - Nhìn), 去 (qù - Đi)',
    color: '#ef4444',
  },
];

const INITIALS_DIFFICULT_PAIRS = [
  {
    pair: 'z - c - s vs zh - ch - sh',
    label: 'Âm đầu lưỡi vs Âm uốn lưỡi',
    tip: 'z, c, s đầu lưỡi thẳng chạm chân răng trên. zh, ch, sh phải cong đầu lưỡi lên vòm họng cứng.',
    items: [
      { pinyin: 'zā', hanzi: '扎', meaning: 'buộc/cắm' },
      { pinyin: 'zhā', hanzi: '渣', meaning: 'cặn bã' },
      { pinyin: 'cì', hanzi: '刺', meaning: 'gai' },
      { pinyin: 'chì', hanzi: '赤', meaning: 'đỏ' },
      { pinyin: 'sān', hanzi: '三', meaning: 'số ba' },
      { pinyin: 'shān', hanzi: '山', meaning: 'núi non' },
    ],
  },
  {
    pair: 'j - q - x (Âm mặt lưỡi)',
    label: 'Nhóm âm mặt lưỡi cần chú ý hơi',
    tip: 'j không bật hơi (như ch nhẹ), q bật hơi mạnh mẽ, x xát nhẹ tựa như "sh" mềm.',
    items: [
      { pinyin: 'jī', hanzi: '鸡', meaning: 'con gà' },
      { pinyin: 'qī', hanzi: '七', meaning: 'số bảy' },
      { pinyin: 'xī', hanzi: '西', meaning: 'phía tây' },
    ],
  },
];

export const PinyinMatrixView: React.FC = () => {
  const [activeTone, setActiveTone] = useState<number>(1);
  const [quizQuestion, setQuizQuestion] = useState<{ sound: string; answer: number } | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const startQuiz = () => {
    const tones = [1, 2, 3, 4];
    const pickedTone = tones[Math.floor(Math.random() * tones.length)];
    const syllables = ['mā,má,mǎ,mà', 'bā,bá,bǎ,bà', 'shī,shí,shǐ,shì'];
    const syl = syllables[Math.floor(Math.random() * syllables.length)].split(',')[pickedTone - 1];

    setQuizQuestion({ sound: syl, answer: pickedTone });
    setQuizResult(null);

    // Speak it
    speakNativeText(syl, 'zh');
  };

  const checkQuiz = (selectedTone: number) => {
    if (!quizQuestion) return;
    if (selectedTone === quizQuestion.answer) {
      playSuccessSound();
      setQuizResult('Chính xác! Bạn nghe thanh điệu rất chuẩn!');
    } else {
      playErrorSound();
      setQuizResult(`Chưa đúng rồi! Đây là Thanh ${quizQuestion.answer}. Hãy nghe lại nhé!`);
      speakNativeText(quizQuestion.sound, 'zh');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-red-900/40 p-6 rounded-3xl border border-amber-500/20 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Bảng Pinyin & 4 Thanh Điệu Tiếng Trung</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Nền Tảng HSK
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Luyện phân biệt cao độ 4 thanh điệu chuẩn Bắc Kinh và các cặp âm uốn lưỡi hay nhầm lẫn
          </p>
        </div>
        <div className="text-4xl hidden sm:block">🇨🇳</div>
      </div>

      {/* 4 Tones Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TONES_DATA.map((t) => {
          const isSelected = activeTone === t.tone;
          return (
            <div
              key={t.tone}
              onClick={() => {
                playPopSound();
                setActiveTone(t.tone);
                speakNativeText(t.mark, 'zh');
                playToneFrequency(t.tone);
              }}
              className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-800 border-amber-500 shadow-xl shadow-amber-500/10'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-700 text-slate-300">
                  Thanh {t.tone}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakNativeText(t.mark, 'zh');
                  }}
                  className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-2">
                <h3 className="text-4xl font-black text-white font-chinese tracking-wide">{t.mark}</h3>
                <p className="text-xs font-bold text-amber-400 mt-1">{t.pitch}</p>
              </div>

              <p className="text-xs text-slate-300 mt-3 line-clamp-3">{t.desc}</p>

              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Ví dụ: </span>
                {t.example}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Tone Frequency & Ear Training */}
      <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Luyện Tai Nghe Thanh Điệu (Tone Ear Training)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bấm nghe âm thanh AI phát ra và đoán xem đó là Thanh mấy
            </p>
          </div>
          <button
            onClick={startQuiz}
            className="px-5 py-2.5 rounded-2xl btn-tactile-amber text-slate-900 font-extrabold text-xs shadow-lg flex items-center gap-2 self-start"
          >
            <Volume2 className="w-4 h-4" />
            <span>Phát Âm Đố Bạn</span>
          </button>
        </div>

        {quizQuestion && (
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700 text-center space-y-4">
            <p className="text-xs text-slate-400 font-semibold">
              Vừa phát âm một từ. Bạn hãy chọn thanh điệu tương ứng:
            </p>

            <button
              onClick={() => speakNativeText(quizQuestion.sound, 'zh')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700"
            >
              <Volume2 className="w-4 h-4" /> Nghe lại lần nữa
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => checkQuiz(num)}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 hover:border-amber-500 transition-all"
                >
                  Thanh {num}
                </button>
              ))}
            </div>

            {quizResult && (
              <p
                className={`text-xs font-bold ${
                  quizResult.includes('Chính xác') ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {quizResult}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confusing Sounds Matrix */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-white">
          Các cặp phụ âm khó nhằn nhất đối với người Việt:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INITIALS_DIFFICULT_PAIRS.map((pair, pIdx) => (
            <div
              key={pIdx}
              className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white text-base">{pair.pair}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {pair.label}
                </span>
              </div>
              <p className="text-xs text-slate-300">{pair.tip}</p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {pair.items.map((item, iIdx) => (
                  <button
                    key={iIdx}
                    onClick={() => speakNativeText(item.hanzi, 'zh')}
                    className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 text-center transition-all group"
                  >
                    <p className="text-xl font-bold font-chinese text-white group-hover:text-amber-400">
                      {item.hanzi}
                    </p>
                    <p className="text-xs font-mono text-cyan-400 font-semibold">{item.pinyin}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.meaning}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

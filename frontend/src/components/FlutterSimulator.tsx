import React, { useState } from 'react';
import { ARCHITECTURE_DATA } from '../data/architectureDocs';
import {
  Smartphone,
  Code2,
  Copy,
  Check,
  Play,
  Volume2,
  Mic,
  Flame,
  Gem,
  Heart,
  ChevronRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { speakNativeText, playSuccessSound, playPopSound } from '../utils/audio';

export const FlutterSimulator: React.FC = () => {
  const [mobileTab, setMobileTab] = useState<'learn' | 'speaking' | 'roleplay' | 'profile'>('speaking');
  const [isRecording, setIsRecording] = useState(false);
  const [mockScore, setMockScore] = useState<number | null>(92);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<number>(0);

  const flutterDocs = ARCHITECTURE_DATA.flutter;

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900/40 via-blue-900/30 to-indigo-900/40 p-6 rounded-3xl border border-sky-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Flutter Mobile App Architecture</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Flutter 3.x + BLoC + Native Audio
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Ứng dụng Mobile đa nền tảng iOS & Android với UI Duolingo mượt mà và phòng luyện âm ELSA Speak bằng micro native
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Target Platforms:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-sky-300 border border-slate-700">
            iOS & Android
          </span>
        </div>
      </div>

      {/* Main Grid: Left is Phone Mockup, Right is Flutter Dart Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Phone Frame Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-sky-400" />
            Mô phỏng Giao diện App Mobile (Flutter Engine):
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="w-[340px] sm:w-[360px] h-[680px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col ring-1 ring-slate-800">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            </div>

            {/* Screen Inner Viewport */}
            <div className="flex-1 bg-slate-900 rounded-[38px] overflow-hidden flex flex-col pt-8 text-slate-100 relative">
              {/* App Bar */}
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🐼</span>
                  <span className="font-extrabold text-sm text-white">LinguaPulse</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-orange-400 font-bold text-[11px]">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" /> 7
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400 font-bold text-[11px]">
                    <Gem className="w-3.5 h-3.5" /> 480
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" /> 5
                  </span>
                </div>
              </div>

              {/* Screen Body based on Flutter Mobile Tab */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mobileTab === 'speaking' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                        ELSA AI Coach
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        HSK 2
                      </span>
                    </div>

                    {/* Target Card */}
                    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center space-y-1.5 shadow-lg">
                      <h4 className="text-2xl font-black text-white font-chinese">
                        太贵了！能便宜一点儿吗？
                      </h4>
                      <p className="text-xs text-sky-400 font-mono font-semibold">
                        Tài guì le! Néng piányi yìdiǎnr ma?
                      </p>
                      <p className="text-[11px] text-slate-400">
                        "Đắt quá! Có thể bớt một chút được không?"
                      </p>
                      <button
                        onClick={() => speakNativeText('太贵了！能便宜一点儿吗？', 'zh')}
                        className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-bold mt-1 bg-sky-500/10 px-2.5 py-1 rounded-lg"
                      >
                        <Volume2 className="w-3 h-3" /> Nghe phát âm
                      </button>
                    </div>

                    {/* Score Gauge Result */}
                    {mockScore && (
                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 text-xl font-black">
                          {mockScore}%
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Xuất sắc! Chuẩn người Bắc Kinh</p>
                          <p className="text-[10px] text-slate-400">
                            Thanh 4 ở chữ 太 và 贵 dứt khoát rất chuẩn
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mic Button */}
                    <div className="pt-2 flex flex-col items-center">
                      <button
                        onClick={() => {
                          playPopSound();
                          setIsRecording(!isRecording);
                          if (!isRecording) {
                            setTimeout(() => {
                              setIsRecording(false);
                              setMockScore(95);
                              playSuccessSound();
                            }, 2500);
                          }
                        }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                          isRecording
                            ? 'bg-rose-500 animate-pulse text-white shadow-rose-500/40'
                            : 'bg-emerald-500 text-white shadow-emerald-500/40'
                        }`}
                      >
                        <Mic className="w-7 h-7" />
                      </button>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {isRecording ? 'Đang lắng nghe...' : 'Chạm để nói tiếng Trung'}
                      </p>
                    </div>
                  </div>
                )}

                {mobileTab === 'learn' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg">
                      <p className="text-[10px] font-bold uppercase opacity-80">Unit 1</p>
                      <h4 className="text-base font-black">Chào hỏi & Bính âm Pinyin</h4>
                    </div>

                    {/* Winding Duolingo Path Nodes */}
                    <div className="flex flex-col items-center space-y-4 py-2">
                      <div className="w-14 h-14 rounded-full bg-emerald-500 border-b-4 border-emerald-700 flex items-center justify-center text-white text-xl shadow-lg cursor-pointer">
                        👋
                      </div>
                      <div className="w-14 h-14 rounded-full bg-emerald-500 border-b-4 border-emerald-700 flex items-center justify-center text-white text-xl shadow-lg translate-x-6 cursor-pointer">
                        🙏
                      </div>
                      <div className="w-14 h-14 rounded-full bg-amber-500 border-b-4 border-amber-700 flex items-center justify-center text-white text-xl shadow-lg -translate-x-6 cursor-pointer">
                        🥟
                      </div>
                      <div className="w-14 h-14 rounded-full bg-slate-700 border-b-4 border-slate-800 flex items-center justify-center text-slate-400 text-xl shadow-lg cursor-pointer">
                        🔒
                      </div>
                    </div>
                  </div>
                )}

                {mobileTab === 'roleplay' && (
                  <div className="space-y-3">
                    <div className="bg-purple-600 p-3.5 rounded-2xl text-white">
                      <p className="text-[10px] font-bold uppercase opacity-80">Roleplay AI</p>
                      <h4 className="text-sm font-black">Tiệm Trà Sữa Thượng Hải 🧋</h4>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
                      <p className="font-bold text-purple-300">AI Thu ngân:</p>
                      <p className="font-chinese text-white">欢迎光临！今天想喝什么？</p>
                      <p className="text-[10px] text-slate-400">Hoan nghênh! Hôm nay muốn uống gì?</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Bottom Navigation Bar (Flutter BottomNavigationBar) */}
              <div className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-2 text-slate-400">
                <button
                  onClick={() => setMobileTab('learn')}
                  className={`flex flex-col items-center gap-0.5 ${
                    mobileTab === 'learn' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Lộ trình</span>
                </button>
                <button
                  onClick={() => setMobileTab('speaking')}
                  className={`flex flex-col items-center gap-0.5 ${
                    mobileTab === 'speaking' ? 'text-sky-400' : 'text-slate-500'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Luyện âm</span>
                </button>
                <button
                  onClick={() => setMobileTab('roleplay')}
                  className={`flex flex-col items-center gap-0.5 ${
                    mobileTab === 'roleplay' ? 'text-purple-400' : 'text-slate-500'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Hội thoại</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Production Flutter Code & Folder Hierarchy */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              Source Code Chuẩn Flutter (Clean Architecture + BLoC):
            </h2>
            <button
              onClick={() => handleCopyCode(flutterDocs.keyFiles[activeCodeTab].content)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300 border border-slate-700 transition-all"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Đã sao chép!' : 'Copy File'}</span>
            </button>
          </div>

          {/* File selector tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {flutterDocs.keyFiles.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setActiveCodeTab(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  activeCodeTab === idx
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {file.filename.split('/').pop()}
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300">
            {flutterDocs.keyFiles[activeCodeTab].description}
          </p>

          {/* Code Viewer */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre className="text-slate-200 leading-relaxed">
              <code>{flutterDocs.keyFiles[activeCodeTab].content}</code>
            </pre>
          </div>

          {/* Architecture Tree */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Cây thư mục chuẩn Mobile Flutter (lib/):
            </h3>
            <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
              {flutterDocs.folderStructure}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

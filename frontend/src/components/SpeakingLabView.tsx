import { aiFetch, ApiError } from '../lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, SpeechEvaluationResult } from '../types';
import { SPEAKING_SENTENCES_CATALOG } from '../data/curriculum';
import {
  speakNativeText,
  createSpeechRecognizer,
  playSuccessSound,
  playErrorSound,
  playPopSound,
} from '../utils/audio';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Flame,
  VolumeX,
  Radio,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpeakingLabViewProps {
  currentLang: LanguageCode;
  onAddXp: (amount: number) => void;
}

export const SpeakingLabView: React.FC<SpeakingLabViewProps> = ({ currentLang, onAddXp }) => {
  const sentences =
    SPEAKING_SENTENCES_CATALOG[currentLang as 'zh' | 'en'] ||
    SPEAKING_SENTENCES_CATALOG.zh;

  const [categoryFilter, setCategoryFilter] = useState<string>('Tất cả');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const categories = ['Tất cả', ...Array.from(new Set(sentences.map((s) => s.category)))];

  const filteredSentences =
    categoryFilter === 'Tất cả'
      ? sentences
      : sentences.filter((s) => s.category === categoryFilter);

  const currentSentence = filteredSentences[selectedIndex] || filteredSentences[0] || sentences[0];

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<SpeechEvaluationResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [speakingMicLang, setSpeakingMicLang] = useState<'zh-CN' | 'en-US' | 'vi-VN'>(
    currentLang === 'zh' ? 'zh-CN' : 'en-US'
  );

  // Audio recording playback for self-comparison (ELSA-style)
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [userAudioBase64, setUserAudioBase64] = useState<string | null>(null);
  const [userAudioMime, setUserAudioMime] = useState<string>('audio/webm');
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const recognizerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Reset evaluation when switching sentences
  useEffect(() => {
    setTranscript('');
    setEvaluationResult(null);
    setSelectedWordIndex(null);
    setMicErrorMessage(null);
    setUserAudioUrl(null);
    setUserAudioBase64(null);
  }, [selectedIndex, currentLang, categoryFilter]);

  // Sync mic language and reset category when currentLang changes
  useEffect(() => {
    setSpeakingMicLang(currentLang === 'zh' ? 'zh-CN' : 'en-US');
    setCategoryFilter('Tất cả');
    setSelectedIndex(0);
  }, [currentLang]);

  const handlePlayTargetAudio = async (slow = false) => {
    playPopSound();
    setIsPlayingAudio(true);
    await speakNativeText(currentSentence.sentence, currentLang, slow);
    setIsPlayingAudio(false);
  };

  const handlePlayUserAudio = () => {
    if (!userAudioUrl) return;
    playPopSound();
    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio(userAudioUrl);
    } else {
      userAudioPlayerRef.current.src = userAudioUrl;
    }

    setIsPlayingUserAudio(true);
    userAudioPlayerRef.current.play();
    userAudioPlayerRef.current.onended = () => {
      setIsPlayingUserAudio(false);
    };
  };

  const handleStartRecording = async () => {
    setTranscript('');
    setEvaluationResult(null);
    setMicErrorMessage(null);
    setSelectedWordIndex(null);
    setUserAudioUrl(null);
    setUserAudioBase64(null);
    audioChunksRef.current = [];

    // 1. Setup real MediaRecorder to capture audio for comparison & Gemini multimodal
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          setUserAudioMime(mimeType);
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          setUserAudioUrl(audioUrl);

          // Convert to base64 for multimodal acoustic AI evaluation
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              setUserAudioBase64(base64data);
              // Auto-evaluate with real voice audio
              handleEvaluateSpeech(undefined, base64data, mimeType);
            } else {
              handleEvaluateSpeech();
            }
          };

          // Stop all audio tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      }
    } catch (e: any) {
      console.warn('MediaRecorder not available, falling back to speech recognition', e);
    }

    // 2. Setup speech recognition for real-time text transcription
    const recognizer = createSpeechRecognizer(
      speakingMicLang,
      (result) => {
        setTranscript(result.text);
      },
      (error) => {
        if (!error || error.includes('aborted') || error.includes('no-speech')) return;
        setMicErrorMessage(error);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    recognizerRef.current = recognizer;
    recognizer.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleEvaluateSpeech = async (
    spokenTextToUse?: string,
    audioBase64Override?: string,
    mimeTypeOverride?: string
  ) => {
    const textToEvaluate = spokenTextToUse !== undefined ? spokenTextToUse : transcript;
    const audioData = audioBase64Override || userAudioBase64;
    const mime = mimeTypeOverride || userAudioMime;

    setIsEvaluating(true);
    setMicErrorMessage(null);

    try {
      const res = await aiFetch('/api/ai/speech-coach', {
        targetLanguage: currentLang,
        languageName: currentLang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh',
        targetSentence: currentSentence.sentence,
        userSpokenText: textToEvaluate || currentSentence.sentence,
        audioBase64: audioData,
        mimeType: mime,
      });

      if (!res.ok) {
        throw new Error('API chấm điểm thất bại');
      }

      const data: SpeechEvaluationResult = await res.json();
      setEvaluationResult(data);

      if (data.overallScore >= 80) {
        playSuccessSound();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
        onAddXp(25);
      } else {
        playErrorSound();
        onAddXp(10);
      }
    } catch (err: any) {
      console.error('Evaluate error', err);
      setMicErrorMessage(err instanceof ApiError ? err.message : 'Không thể kết nối AI chấm điểm. Vui lòng thử lại.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 p-6 sm:p-8 rounded-3xl border border-blue-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/10">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Phòng Luyện Phát Âm Trí Tuệ Nhân Tạo
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Acoustic Studio
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {currentLang === 'zh'
                ? 'Công nghệ nhận diện sóng âm & 4 thanh điệu tiếng Trung theo chuẩn ELSA Speak. So sánh trực tiếp giọng của bạn với giáo viên bản xứ.'
                : 'Công nghệ nhận diện sóng âm AI phân tích nối âm, nuốt âm, trọng âm từ và ngữ điệu chuẩn người Mỹ theo thang đo quốc tế.'}
            </p>
          </div>
        </div>

        {/* Quick Language Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 self-start md:self-auto shrink-0">
          <span className="text-xs text-slate-400">Ngôn ngữ:</span>
          <span className="font-extrabold text-blue-400 text-sm">
            {currentLang === 'zh' ? 'Tiếng Trung (HSK)' : 'Tiếng Anh (US Accent)'}
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playPopSound();
              setCategoryFilter(cat);
              setSelectedIndex(0);
            }}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sentences Catalog */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Danh Sách Câu ({filteredSentences.length})
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Bấm để chọn câu</span>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredSentences.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playPopSound();
                    setSelectedIndex(idx);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/15'
                      : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.difficulty === 'Dễ'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.difficulty === 'Trung bình'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.difficulty}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-100 line-clamp-1">{item.sentence}</p>
                  <p className="text-xs text-blue-300 font-mono mt-0.5 line-clamp-1">{item.pinyin}</p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.meaningVi}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Speaking Assessment Studio */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Target Sentence Card */}
          <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Câu Mục Tiêu Luyện Phát Âm
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayTargetAudio(false)}
                  disabled={isPlayingAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  title="Nghe giọng đọc người bản xứ tốc độ chuẩn"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  Nghe chuẩn 1.0x
                </button>
                <button
                  onClick={() => handlePlayTargetAudio(true)}
                  disabled={isPlayingAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-amber-300 transition-all cursor-pointer"
                  title="Nghe tốc độ chậm để bắt từng thanh điệu"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Chậm 0.7x
                </button>
              </div>
            </div>

            {/* Hanzi / Sentence Main Display */}
            <div className="text-center py-4">
              <h3
                className={`text-3xl sm:text-5xl font-black text-white tracking-wide mb-3 ${
                  currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                }`}
              >
                {currentSentence.sentence}
              </h3>
              <p className="text-lg sm:text-2xl font-bold text-blue-400 font-mono tracking-wider mb-2">
                {currentSentence.pinyin}
              </p>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                "{currentSentence.meaningVi}"
              </p>
            </div>

            {/* Audio Side-by-Side Comparison (User Voice vs Native Voice) */}
            {userAudioUrl && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    🎧
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">So sánh đối chiếu giọng đọc:</h5>
                    <p className="text-[11px] text-slate-400">Nghe lại giọng của bạn và so với giáo viên bản xứ</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayUserAudio}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow cursor-pointer"
                  >
                    {isPlayingUserAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Giọng bạn vừa đọc</span>
                  </button>

                  <button
                    onClick={() => handlePlayTargetAudio(false)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Giọng giáo viên</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Microphone Recording Area */}
            <div className="mt-6 pt-6 border-t border-slate-700/60 flex flex-col items-center justify-center">
              {/* Soundwaves if recording */}
              {isRecording && (
                <div className="flex items-center gap-1.5 h-12 mb-4">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-10 bg-rose-400 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-8 bg-rose-500 rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 h-11 bg-rose-400 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-7 bg-rose-500 rounded-full animate-bounce delay-200" />
                  <span className="text-xs font-bold text-rose-400 ml-3 animate-pulse">
                    Đang thu âm & phân tích sóng âm thanh thực tế...
                  </span>
                </div>
              )}

              {/* Transcript Display */}
              {transcript && (
                <div className="w-full mb-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-center">
                  <span className="text-xs text-slate-400">Micro nhận diện:</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">{transcript}</p>
                </div>
              )}

              {micErrorMessage && (
                <div className="mb-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{micErrorMessage}</span>
                </div>
              )}

              {/* Big Record Button */}
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={isEvaluating}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-black text-white text-base shadow-xl shadow-blue-600/30 group cursor-pointer transition-all hover:scale-105"
                  >
                    <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    <span>Bấm để Luyện Nói</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base shadow-xl shadow-rose-600/30 animate-pulse cursor-pointer"
                  >
                    <MicOff className="w-6 h-6 text-white" />
                    <span>Dừng & Chấm Điểm AI</span>
                  </button>
                )}

                {/* Instant simulation button for quick testing */}
                <button
                  onClick={() => handleEvaluateSpeech(currentSentence.sentence)}
                  disabled={isEvaluating || isRecording}
                  className="px-4 py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-all border border-slate-600 flex items-center gap-2 cursor-pointer"
                  title="Chấm điểm AI ngay lập tức"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Chấm Thử Mẫu</span>
                </button>
              </div>

              {/* Microphone Language Selector (Tiếng Trung, Tiếng Anh, Tiếng Việt) */}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> Ngôn ngữ Mic:
                </span>
                <div className="inline-flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setSpeakingMicLang('zh-CN');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      speakingMicLang === 'zh-CN'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇨🇳 Tiếng Trung
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setSpeakingMicLang('en-US');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      speakingMicLang === 'en-US'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 Tiếng Anh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setSpeakingMicLang('vi-VN');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      speakingMicLang === 'vi-VN'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                </div>
              </div>

              {isEvaluating && (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-400 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích cao độ thanh điệu, ngữ điệu & khẩu hình...</span>
                </div>
              )}
            </div>
          </div>

          {/* ELSA Speak Evaluation Results Card */}
          {evaluationResult && (
            <div className="bg-slate-800/95 rounded-3xl p-6 sm:p-8 border border-blue-500/30 shadow-2xl space-y-6 animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-700">
                {/* Big Overall Ring */}
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={
                          evaluationResult.overallScore >= 85
                            ? '#22c55e'
                            : evaluationResult.overallScore >= 70
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * evaluationResult.overallScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white">
                        {evaluationResult.overallScore}%
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Độ Chuẩn Âm</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-white">
                        {evaluationResult.overallScore >= 85
                          ? 'Xuất sắc! Chuẩn người bản xứ'
                          : evaluationResult.overallScore >= 70
                          ? 'Rất tốt! Cần chú ý chút thanh điệu'
                          : 'Cố gắng lên! Hãy nghe lại mẫu nhé'}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {evaluationResult.cefrLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      {evaluationResult.feedbackSummary}
                    </p>
                  </div>
                </div>

                {/* Sub-meters: Tone, Fluency, Pronunciation */}
                <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Thanh Điệu (Tone)</p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">
                      {evaluationResult.toneScore}%
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Trôi Chảy (Fluency)</p>
                    <p className="text-base font-black text-blue-400 mt-0.5">
                      {evaluationResult.fluencyScore}%
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Chuẩn Âm</p>
                    <p className="text-base font-black text-purple-400 mt-0.5">
                      {evaluationResult.pronunciationScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Syllable Color-Coded Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phân tích chi tiết từng âm tiết & thanh điệu (Bấm vào chữ để xem):
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Chuẩn (&gt;85%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Khá (65-84%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Cần sửa (&lt;65%)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {evaluationResult.wordsBreakdown?.map((wordItem, wIdx) => {
                    const isSelected = selectedWordIndex === wIdx;
                    const isGood = wordItem.score >= 85;
                    const isMedium = wordItem.score >= 65 && wordItem.score < 85;

                    return (
                      <button
                        key={wIdx}
                        onClick={() => {
                          playPopSound();
                          setSelectedWordIndex(isSelected ? null : wIdx);
                        }}
                        className={`px-3 py-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          isGood
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : isMedium
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                        } ${isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-102'}`}
                      >
                        <span
                          className={`text-base font-black block ${
                            currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                          }`}
                        >
                          {wordItem.word}
                        </span>
                        {wordItem.phonetic && (
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {wordItem.phonetic}
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold block mt-0.5">
                          {wordItem.score}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Word Details Popup */}
                {selectedWordIndex !== null && evaluationResult.wordsBreakdown[selectedWordIndex] && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-900 border border-slate-700 animate-in fade-in flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xl font-black text-white ${
                            currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                          }`}
                        >
                          {evaluationResult.wordsBreakdown[selectedWordIndex].word}
                        </span>
                        <span className="text-xs font-mono text-blue-400 font-bold">
                          {evaluationResult.wordsBreakdown[selectedWordIndex].phonetic}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                          Điểm: {evaluationResult.wordsBreakdown[selectedWordIndex].score}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        👉 {evaluationResult.wordsBreakdown[selectedWordIndex].comment}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        speakNativeText(
                          evaluationResult.wordsBreakdown[selectedWordIndex].word,
                          currentLang,
                          true
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Luyện riêng từ này
                    </button>
                  </div>
                )}
              </div>

              {/* Chinese Tone Reference Card (4 Thanh Điệu Chuẩn) */}
              {currentLang === 'zh' && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                  <h5 className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Sơ Đồ 4 Thanh Điệu Chuẩn Tiếng Trung:
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="font-bold text-emerald-400 block">Thanh 1 (55: —)</span>
                      <p className="text-[11px] text-slate-400">Cao và phẳng đều (mā)</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="font-bold text-blue-400 block">Thanh 2 (35: /)</span>
                      <p className="text-[11px] text-slate-400">Vút lên dốc (má)</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="font-bold text-purple-400 block">Thanh 3 (214: \/)</span>
                      <p className="text-[11px] text-slate-400">Uốn trầm rồi lên (mǎ)</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="font-bold text-rose-400 block">Thanh 4 (51: \)</span>
                      <p className="text-[11px] text-slate-400">Hạ dốc dứt khoát (mà)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pronunciation AI Coach Tips */}
              {evaluationResult.pronunciationTips && evaluationResult.pronunciationTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 space-y-2">
                  <h5 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Mẹo Luyện Âm Chuyên Sâu Từ Trợ Lý AI:
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {evaluationResult.pronunciationTips.map((tip, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

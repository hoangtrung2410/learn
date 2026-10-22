import { aiFetch, authHeaders, ApiError } from '../lib/api';
import React, { useState, useRef, useEffect } from 'react';
import { LanguageCode, RoleplayScenario, ChatMessage } from '../types';
import { CHINESE_ROLEPLAY_SCENARIOS, ENGLISH_ROLEPLAY_SCENARIOS } from '../data/curriculum';
import {
  speakNativeText,
  createSpeechRecognizer,
  playSuccessSound,
  playPopSound,
  stopSpeaking,
} from '../utils/audio';
import { toPinyin } from '../data/packLoader';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Lightbulb,
  Clock,
  Sliders,
  Check,
  Globe,
  RotateCcw,
  Plus,
  Compass,
  Headphones,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiRoleplayViewProps {
  currentLang: LanguageCode;
  onAddXp: (amount: number) => void;
}

const CONVERSATION_STAGES = [
  { stage: 1, name: 'Khởi động', fullTitle: 'Khởi động & Mở đầu', desc: 'Chào hỏi, nêu bối cảnh & làm quen' },
  { stage: 2, name: 'Đào sâu', fullTitle: 'Đào sâu chi tiết', desc: 'Phân tích số liệu, yêu cầu hoặc sở thích' },
  { stage: 3, name: 'Phản biện', fullTitle: 'Phản biện & Thử thách', desc: 'Giải trình vướng mắc hoặc tình huống phát sinh' },
  { stage: 4, name: 'Giải pháp', fullTitle: 'Đàm phán & Giải pháp', desc: 'Thương lượng phương án tối ưu đôi bên' },
  { stage: 5, name: 'Kết luận', fullTitle: 'Chốt lịch & Kết luận', desc: 'Thống nhất hành động, cảm ơn & dặn dò' },
];

export const AiRoleplayView: React.FC<AiRoleplayViewProps> = ({ currentLang, onAddXp }) => {
  const scenarios = currentLang === 'en' ? ENGLISH_ROLEPLAY_SCENARIOS : CHINESE_ROLEPLAY_SCENARIOS;
  const categories =
    currentLang === 'en'
      ? [
          'Tất cả',
          'Nói Chuyện Tự Do',
          'Cà phê & Đồ ăn',
          'Công sở & Phỏng vấn',
          'Sân bay & Du lịch',
          'Luyện thi IELTS',
          'Thương mại & Đàm phán',
        ]
      : [
          'Tất cả',
          'Nói Chuyện Tự Do',
          'Công sở & Đồng nghiệp',
          'Nhà hàng & Ăn uống',
          'Đi đường & Giao thông',
          'Đời thường & Sinh hoạt',
          'Mua sắm & Trả giá',
        ];

  const [activeTabMode, setActiveTabMode] = useState<'scenarios' | 'freetalk'>('scenarios');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const filteredScenarios =
    selectedCategory === 'Tất cả'
      ? scenarios
      : scenarios.filter((s) => s.category === selectedCategory);

  const [activeScenario, setActiveScenario] = useState<RoleplayScenario>(scenarios[0]);

  // Display toggles
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState<1.0 | 0.8>(1.0);

  // Sync active scenario and mic language whenever currentLang changes
  useEffect(() => {
    const nextScenarios = currentLang === 'en' ? ENGLISH_ROLEPLAY_SCENARIOS : CHINESE_ROLEPLAY_SCENARIOS;
    setSelectedCategory('Tất cả');
    setActiveScenario(nextScenarios[0]);
    setMicLanguage(currentLang === 'zh' ? 'zh-CN' : 'en-US');
  }, [currentLang]);

  // Custom Free Talk Topic state
  const [customTopicInput, setCustomTopicInput] = useState('');
  const popularTopics =
    currentLang === 'en'
      ? [
          'My Daily Life & Routine',
          'Job Interview Preparation',
          'Favorite Music & Hobbies',
          'Travel Plans & Culture',
          'Tech, AI & Future Trends',
        ]
      : [
          'Cuộc sống hàng ngày & Thói quen',
          'Kinh nghiệm phỏng vấn công sở',
          'Sở thích, Âm nhạc & Phim ảnh',
          'Kế hoạch du lịch & Văn hóa',
          'Công nghệ & Trí tuệ nhân tạo',
        ];

  const handleStartCustomFreeTalk = (topic: string) => {
    if (!topic.trim()) return;
    playPopSound();
    const isEn = currentLang === 'en';
    const customScenario: RoleplayScenario = {
      id: 'custom-topic-' + Date.now(),
      title: isEn ? `Free Talk: ${topic.trim()}` : `Tự Do: ${topic.trim()}`,
      category: 'Nói Chuyện Tự Do',
      description: isEn
        ? `Open, authentic English conversation on: "${topic.trim()}"`
        : `Cuộc trò chuyện mở không giới hạn về chủ đề: "${topic.trim()}"`,
      partnerRole: isEn
        ? 'Native English Companion (Alex Morgan)'
        : 'Bạn đối thoại AI bản xứ (Cô giáo Trương)',
      userRole: isEn ? 'English Communicator' : 'Người đàm đạo',
      difficulty: 'Cơ bản',
      initialPrompt: isEn
        ? `That sounds like a wonderful topic! I'd love to chat with you about "${topic.trim()}". Whether you want to share personal stories or practice natural speaking, I'm right here with you. What would you like to share first?`
        : `太棒了！关于“${topic.trim()}”这个话题，我非常感兴趣！不管是你的个人经历、想法还是疑问，我们都可以畅所欲言。你想从哪一点开始聊起呢？`,
      initialPinyin: isEn
        ? `/ðæt saʊndz laɪk ə ˈwʌndərfl ˈtɑːpɪk!/`
        : `Tài bàng le! Guānyú “${topic.trim()}” zhè ge huàtí, wǒ fēicháng gǎn xìngqù! Bùguǎn shì nǐ de gèrén jīnglì, xiǎngfǎ háishì yíwèn, wǒmen dōu kěyǐ chàngsuǒyùyán. Nǐ xiǎng cóng nǎ yì diǎn kāishǐ liáo qǐ ne?`,
      initialVi: isEn
        ? `Chủ đề này nghe thật tuyệt vời! Mình rất hào hứng được trò chuyện về "${topic.trim()}". Dù bạn muốn chia sẻ suy nghĩ cá nhân hay luyện phản xạ, mình luôn sẵn sàng. Bạn muốn bắt đầu từ đâu nào?`
        : `Tuyệt vời quá! Về chủ đề "${topic.trim()}", mình rất hào hứng! Dù là trải nghiệm cá nhân hay thắc mắc, chúng ta đều có thể thoải mái chia sẻ. Bạn muốn bắt đầu từ điểm nào trước?`,
      icon: '🎙️',
      suggestedStarters: isEn
        ? [
            `I'd like to share some of my personal thoughts on "${topic.trim()}". (Tôi muốn chia sẻ vài góc nhìn cá nhân của mình về chủ đề này)`,
            `What are some common perspectives people have regarding this topic? (Mọi người thường có những góc nhìn phổ biến nào về chủ đề này?)`,
            `From your point of view, what makes this topic particularly fascinating? (Từ góc nhìn của bạn, điều gì làm chủ đề này thú vị nhất?)`,
          ]
        : [
            `我想先聊聊我对“${topic.trim()}”的一些个人看法。(Mình muốn chia sẻ góc nhìn của mình về chủ đề này trước)`,
            `关于这个话题，在生活中有哪些比较普遍的现象呢？(Về chủ đề này, trong đời sống có những hiện tượng nào phổ biến?)`,
            `如果从你的角度来看，这个话题最有趣的地方是什么？(Nếu nhìn từ góc độ của bạn, điểm thú vị nhất của chủ đề này là gì?)`,
          ],
    };
    setActiveScenario(customScenario);
    setCustomTopicInput('');
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<
    Array<{ text: string; pinyin: string; meaning: string }>
  >([]);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const chatAbortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  // 5-Minute Conversation Stopwatch & Milestone Rewards
  const [conversationSeconds, setConversationSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasEarned5MinReward, setHasEarned5MinReward] = useState(false);

  const recognizerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const inputTextRef = useRef<string>('');

  const [micError, setMicError] = useState<string | null>(null);
  const [micLanguage, setMicLanguage] = useState<'zh-CN' | 'en-US' | 'vi-VN'>(
    currentLang === 'zh' ? 'zh-CN' : 'en-US'
  );

  // Calculate current stage based on user message count
  const userMessagesCount = messages.filter((m) => m.role === 'user').length;
  const currentStage = Math.min(5, Math.floor(userMessagesCount / 2) + 1);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerActive && !hasEarned5MinReward) {
      timerIntervalRef.current = setInterval(() => {
        setConversationSeconds((prev) => {
          const next = prev + 1;
          if (next >= 300 && !hasEarned5MinReward) {
            setHasEarned5MinReward(true);
            playSuccessSound();
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.7 },
            });
            onAddXp(50);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerActive, hasEarned5MinReward]);

  // Initialize scenario when changing
  useEffect(() => {
    chatAbortRef.current?.abort();
    stopSpeaking();
    setIsAiThinking(false);
    setIsLoadingSuggestions(false);
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setInputText('');
    inputTextRef.current = '';

    const initialMsg: ChatMessage = {
      id: 'init-msg',
      role: 'assistant',
      content: activeScenario.initialPrompt,
      pinyin: activeScenario.initialPinyin,
      vietnamese: activeScenario.initialVi,
      timestamp: Date.now(),
    };
    setMessages([initialMsg]);
    setMicError(null);
    setConversationSeconds(0);
    setIsTimerActive(false);
    setHasEarned5MinReward(false);
    setSuggestedResponses(
      activeScenario.suggestedStarters.map((starter) => {
        const parts = starter.split('(');
        return {
          text: parts[0].trim(),
          pinyin: '',
          meaning: parts[1] ? parts[1].replace(')', '').trim() : '',
        };
      })
    );
  }, [activeScenario]);

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
      stopSpeaking();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreamingRef.current ? 'auto' : 'smooth', block: 'end' });
  }, [messages, isAiThinking]);

  const handleSendMessage = async (textInput?: string) => {
    const textToSend = (textInput !== undefined ? textInput : (inputText || inputTextRef.current || '')).trim();
    if (!textToSend || isAiThinking) return;

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setMicError(null);
    inputTextRef.current = '';
    setInputText('');

    if (!isTimerActive) {
      setIsTimerActive(true);
    }

    playPopSound();
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    await requestAiReply(newHistory, textToSend);
  };

  // Gọi AI theo kiểu stream: chữ hiện ngay khi có, dịch + gợi ý nạp sau.
  const requestAiReply = async (history: ChatMessage[], userText: string) => {
    chatAbortRef.current?.abort();
    const ctrl = new AbortController();
    chatAbortRef.current = ctrl;

    const aiId = 'ai-' + Date.now();
    const ctx = {
      targetLanguage: currentLang,
      languageName: currentLang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh',
      scenarioTitle: activeScenario.title,
      scenarioRole: activeScenario.partnerRole,
      history: history.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
      userMessage: userText,
    };

    setMessages([...history]);
    setIsAiThinking(true);
    setSuggestedResponses([]);
    isStreamingRef.current = true;

    let reply = '';
    const patchAi = (patch: Partial<ChatMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, ...patch } : m)));

    try {
      const res = await aiFetch('/api/ai/conversation/stream', ctx, ctrl.signal);
      if (!res.ok || !res.body) throw new Error('stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let created = false;
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (!line.startsWith('data:')) continue;
          const evt = JSON.parse(line.slice(5).trim());
          if (evt.type === 'delta') {
            reply += evt.text;
            if (!created) {
              created = true;
              setMessages((prev) => [
                ...prev,
                { id: aiId, role: 'assistant', content: reply, timestamp: Date.now(), streaming: true },
              ]);
            } else {
              patchAi({ content: reply });
            }
          } else if (evt.type === 'error') {
            throw new Error(evt.message || 'AI error');
          } else if (evt.type === 'done') {
            finished = true;
          }
        }
      }

      reply = reply.trim();
      if (!reply) throw new Error('empty reply');
      patchAi({
        content: reply,
        pinyin: currentLang === 'zh' ? toPinyin(reply) : undefined,
        streaming: false,
      });
      isStreamingRef.current = false;
      playSuccessSound();
      onAddXp(15);
      setIsAiThinking(false);
      handlePlayAudio(aiId, reply, audioSpeed === 0.8);

      // Phần bổ sung (dịch, nhận xét, gợi ý) chạy sau, không chặn người dùng.
      setIsLoadingSuggestions(true);
      fetch('/api/ai/conversation/enrich', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...ctx, replyText: reply }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || ctrl.signal.aborted) return;
          patchAi({
            vietnamese: data.vietnameseTranslation || undefined,
            pinyin: currentLang === 'zh' ? toPinyin(reply) : data.pinyinOrPhonetic || undefined,
            feedback: data.speechFeedback || undefined,
          });
          if (Array.isArray(data.suggestedResponses)) {
            setSuggestedResponses(
              data.suggestedResponses
                .filter((x: any) => x && x.text)
                .map((x: any) => ({
                  text: x.text,
                  pinyin: currentLang === 'zh' ? toPinyin(x.text) : x.pinyin || '',
                  meaning: x.meaning || '',
                }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingSuggestions(false));
    } catch (err: any) {
      isStreamingRef.current = false;
      if (ctrl.signal.aborted) return;
      console.error(err);
      setIsAiThinking(false);
      // Giữ phần chữ đã nhận (nếu có) và cho phép thử lại, thay vì bịa câu trả lời giả.
      if (reply.trim()) {
        patchAi({ content: reply.trim(), streaming: false });
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== aiId),
          {
            id: aiId,
            role: 'assistant',
            content: err instanceof ApiError ? err.message : 'Xin lỗi, AI chưa phản hồi được. Bạn bấm "Thử lại" nhé.',
            timestamp: Date.now(),
            error: true,
          },
        ]);
      }
    }
  };

  const handleRetry = () => {
    if (isAiThinking) return;
    const base = messages.filter((m) => !m.error);
    const lastUser = [...base].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    playPopSound();
    requestAiReply(base, lastUser.content);
  };

  const handleStartSpeech = () => {
    setMicError(null);
    playPopSound();

    const existingText = inputText.trim();
    inputTextRef.current = existingText;

    const recognizer = createSpeechRecognizer(
      micLanguage,
      (result) => {
        inputTextRef.current = result.text;
        setInputText(result.text);
      },
      (error) => {
        if (!error) return;
        const errLower = error.toLowerCase();
        if (errLower.includes('aborted') || errLower.includes('no-speech')) return;
        setMicError(error);
        setIsRecording(false);
      },
      () => {},
      true
    );

    recognizerRef.current = recognizer;
    recognizer.start(existingText);
    setIsRecording(true);
  };

  const handlePauseSpeech = () => {
    playPopSound();
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const handleCancelSpeech = () => {
    playPopSound();
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setMicError(null);
    setInputText('');
    inputTextRef.current = '';
  };

  const handleToggleSpeech = () => {
    if (!isRecording) {
      handleStartSpeech();
    } else {
      handlePauseSpeech();
    }
  };

  const handlePlayAudio = async (msgId: string, text: string, slow = false) => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setPlayingMessageId(msgId);
    await speakNativeText(text, currentLang, slow);
    setPlayingMessageId(null);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Studio Top Control Panel */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentLang === 'zh'
                  ? 'Phòng Luyện Nói 1-1 Tiếng Trung Bản Xứ'
                  : 'AI Native English Voice Studio'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">
                {currentLang === 'zh' ? 'Giọng Bắc Kinh Chuẩn Phổ Thông' : 'Native US/UK Neutral Accent'}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Lộ trình phản xạ 5 giai đoạn</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Chấm điểm ngữ điệu & gợi ý phản xạ tức thì</span>
            </div>
          </div>

          {/* Time tracker & Studio Settings */}
          <div className="flex flex-wrap items-center gap-4">
            {/* 5-Min Challenge Bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                  conversationSeconds >= 300
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : isTimerActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Thời lượng nói:</span>
                  <span className="font-mono text-xs font-extrabold text-amber-400">
                    {formatTime(conversationSeconds)} / 05:00
                  </span>
                  {conversationSeconds >= 300 && (
                    <span className="text-[10px] font-bold text-amber-300">★ Đạt mốc (+50 XP)</span>
                  )}
                </div>
                <div className="w-32 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (conversationSeconds / 300) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Display Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setShowPinyin(!showPinyin);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  showPinyin
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={currentLang === 'zh' ? 'Bật/tắt Pinyin phiên âm' : 'Bật/tắt ký hiệu phát âm'}
              >
                {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{currentLang === 'zh' ? 'Pinyin' : 'Phát âm'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setShowTranslation(!showTranslation);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  showTranslation
                    ? 'bg-slate-800 text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bật/tắt bản dịch tiếng Việt"
              >
                <span>Dịch nghĩa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setAudioSpeed((prev) => (prev === 1.0 ? 0.8 : 1.0));
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  audioSpeed === 0.8
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tốc độ giọng đọc của AI"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{audioSpeed}x</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Scenario & Topic Selection (4 columns) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Studio Mode Selector (Scenarios vs Free Talk) */}
          <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setActiveTabMode('scenarios');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTabMode === 'scenarios'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tình Huống Kịch Bản</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPopSound();
                setActiveTabMode('freetalk');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTabMode === 'freetalk'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Nói Chuyện Tự Do</span>
            </button>
          </div>

          {activeTabMode === 'freetalk' ? (
            /* Free Talk Studio Builder */
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>🎙️</span>
                  <span>Tự Chọn Bất Kỳ Chủ Đề</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Không gò bó! Bạn có thể thoải mái tâm sự đời sống, luyện phản xạ phỏng vấn, hoặc trao đổi mọi sở thích với AI.
                </p>
              </div>

              {/* Quick Topic Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Gợi ý chủ đề thú vị:</span>
                <div className="flex flex-col gap-1.5">
                  {popularTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStartCustomFreeTalk(topic)}
                      className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="font-medium truncate">{topic}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Topic Input */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Hoặc tự nhập chủ đề theo ý muốn:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartCustomFreeTalk(customTopicInput);
                    }}
                    placeholder={
                      currentLang === 'zh'
                        ? 'Ví dụ: Nuôi mèo cưng, Phim Marvel, Đi du lịch...'
                        : 'e.g. Travel to Japan, Remote Work, Coffee culture...'
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleStartCustomFreeTalk(customTopicInput)}
                    disabled={!customTopicInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Bắt đầu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Scenarios Browser */
            <div className="space-y-3">
              {/* Category Segmented Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      playPopSound();
                      setSelectedCategory(cat);
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scenarios Scroll List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredScenarios.map((sc) => {
                  const isSelected = activeScenario.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        playPopSound();
                        setActiveScenario(sc);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{sc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                              {sc.title}
                            </h3>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {sc.difficulty}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {sc.partnerRole}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {sc.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Conversational Canvas (8 columns) */}
        <main className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[640px]">
          {/* Top Partner Persona & 5-Stage Journey Header */}
          <div className="p-5 bg-slate-950/80 border-b border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-md shrink-0">
                  {activeScenario.icon}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    {activeScenario.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-semibold">{activeScenario.partnerRole}</span>
                    <span aria-hidden="true">·</span>
                    <span>Lượt thoại: {userMessagesCount}</span>
                  </div>
                </div>
              </div>

              {/* Reset action */}
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  const initialMsg: ChatMessage = {
                    id: 'init-msg-' + Date.now(),
                    role: 'assistant',
                    content: activeScenario.initialPrompt,
                    pinyin: activeScenario.initialPinyin,
                    vietnamese: activeScenario.initialVi,
                    timestamp: Date.now(),
                  };
                  setMessages([initialMsg]);
                  setConversationSeconds(0);
                  setIsTimerActive(false);
                  setHasEarned5MinReward(false);
                }}
                className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Bắt đầu lại cuộc trò chuyện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Bắt đầu lại</span>
              </button>
            </div>

            {/* Stepped Journey Progress Bar (Clean connected roadmap) */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-5 gap-2">
                {CONVERSATION_STAGES.map((st) => {
                  const isCurrent = currentStage === st.stage;
                  const isCompleted = currentStage > st.stage;
                  return (
                    <div
                      key={st.stage}
                      className={`relative flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                          : isCompleted
                          ? 'bg-slate-900/40 border border-slate-800 text-slate-300'
                          : 'bg-slate-900/20 border border-transparent text-slate-600'
                      }`}
                      title={`${st.fullTitle}: ${st.desc}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950'
                              : isCompleted
                              ? 'bg-slate-700 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isCompleted ? <Check className="w-2.5 h-2.5" /> : st.stage}
                        </span>
                        <span className="text-[11px] font-bold truncate">{st.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 hidden md:block truncate max-w-full">
                        {st.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dialogue Message Canvas */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 min-h-[340px] max-h-[500px]">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`p-4 rounded-2xl ${
                        isAi
                          ? 'bg-slate-950/80 text-white border border-slate-800 shadow-md'
                          : 'bg-emerald-600 text-slate-950 font-medium shadow-md'
                      }`}
                    >
                      {/* Main Message Text */}
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-base leading-relaxed ${
                            isAi ? 'text-white' : 'text-slate-950 font-bold'
                          } ${currentLang === 'zh' ? 'font-chinese text-lg' : 'font-sans'}`}
                        >
                          {msg.content}
                        </p>

                        {isAi && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(msg.id, msg.content, audioSpeed === 0.8)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                              title="Nghe phát âm bản xứ"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(msg.id, msg.content, true)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer text-[10px] font-bold"
                              title="Nghe tốc độ chậm 0.7x"
                            >
                              0.7x
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Phonetics / Pinyin */}
                      {isAi && showPinyin && msg.pinyin && (
                        <p className="text-xs font-mono text-cyan-300 mt-2 font-medium tracking-wide">
                          {msg.pinyin}
                        </p>
                      )}

                      {/* Vietnamese Translation */}
                      {isAi && showTranslation && msg.vietnamese && (
                        <p className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-slate-800/80 leading-relaxed">
                          {msg.vietnamese}
                        </p>
                      )}
                    </div>

                    {/* AI Feedback on pronunciation or grammar */}
                    {msg.feedback && (
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/30 text-xs space-y-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Độ tự nhiên: {msg.feedback.naturalness}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{msg.feedback.tip}</p>
                        {msg.feedback.betterAlternative && (
                          <p className="text-emerald-400 font-semibold mt-1">
                            💡 Cách nói tự nhiên hơn: "{msg.feedback.betterAlternative}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!isAi && (
                    <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isAiThinking && !messages.some((m) => m.streaming) && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium py-2" aria-live="polite">
                <Bot className="w-4 h-4" />
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                </span>
                <span>Đối tác đang trả lời…</span>
              </div>
            )}

            {messages[messages.length - 1]?.error && !isAiThinking && (
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 cursor-pointer hover:bg-amber-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Thử lại
              </button>
            )}

            {micError && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{micError}</p>
                  <p className="text-slate-400 mt-0.5">
                    Mẹo: Bạn có thể chọn câu gợi ý bên dưới hoặc gõ trực tiếp vào ô tin nhắn.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Responses Shelf */}
          {isLoadingSuggestions && suggestedResponses.length === 0 && !isAiThinking && (
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 animate-pulse">Đang soạn gợi ý câu trả lời…</div>
          )}

          {suggestedResponses.length > 0 && !isAiThinking && (
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Gợi ý câu phản xạ kéo dài hội thoại:
                </span>
                <span className="text-slate-500">Bấm nghe thử hoặc gửi ngay</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                {suggestedResponses.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold text-white truncate ${
                          currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                        }`}
                      >
                        {item.text}
                      </p>
                      {item.meaning && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.meaning}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => speakNativeText(item.text, currentLang)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        title="Nghe phát âm thử"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage(item.text)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow"
                      >
                        Gửi câu này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Voice Waveform Bar */}
          {isRecording && (
            <div className="p-3 bg-emerald-950/40 border-t border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Đang lắng nghe giọng bạn...
                </span>

                {/* Animated Waveform */}
                <div className="flex items-center gap-1 h-5">
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms] h-3" />
                  <span className="w-1 bg-teal-400 rounded-full animate-bounce [animation-delay:150ms] h-5" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms] h-2" />
                  <span className="w-1 bg-teal-400 rounded-full animate-bounce [animation-delay:200ms] h-4" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelSpeech}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Hủy</span>
              </button>
            </div>
          )}

          {/* Voice Input & Controls Console */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartSpeech}
                  disabled={isAiThinking}
                  className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0 cursor-pointer disabled:opacity-40 font-bold"
                  title="Bấm để nói bằng giọng nói"
                >
                  <Mic className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg animate-pulse shrink-0 cursor-pointer"
                  title="Tạm dừng mic"
                >
                  <MicOff className="w-5 h-5" />
                </button>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  inputTextRef.current = e.target.value;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder={
                  isRecording
                    ? 'Đang nghe trực tiếp... Nói xong bấm Gửi (nút xanh) là xong!'
                    : 'Bấm micro để nói, hoặc nhập văn bản vào đây...'
                }
                className={`flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-sm ${
                  currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                }`}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={(!inputText.trim() && !inputTextRef.current.trim()) || isAiThinking}
                className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-transform hover:scale-105 shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20 font-bold"
                title="Gửi tin nhắn"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Mic Language Selector & Quick Help */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Ngôn ngữ Mic:
                </span>
                <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMicLanguage('zh-CN');
                      if (isRecording) handlePauseSpeech();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      micLanguage === 'zh-CN'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇨🇳 Tiếng Trung
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMicLanguage('en-US');
                      if (isRecording) handlePauseSpeech();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      micLanguage === 'en-US'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 Tiếng Anh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMicLanguage('vi-VN');
                      if (isRecording) handlePauseSpeech();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      micLanguage === 'vi-VN'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-500">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">Enter</kbd> để gửi nhanh
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

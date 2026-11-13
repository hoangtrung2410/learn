import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Phone, PhoneOff, X } from 'lucide-react';
import { aiFetch } from '../lib/api';
import { startLiveCall, type LiveCall, type LiveStatus } from '../lib/liveCall';

// Cửa sổ gọi thoại thời gian thực với AI (Gemini Live): nói qua micro, AI đáp bằng giọng nói, có phụ đề hai chiều.

interface Props {
  open: boolean;
  onClose: () => void;
  languageName: string;
  targetLanguage: string;
  scenarioTitle: string;
  scenarioRole: string;
  icon?: React.ReactNode;
  onAddXp?: (n: number) => void;
}

type Line = { role: 'user' | 'ai'; text: string; final: boolean };

const STATUS_TEXT: Record<LiveStatus | 'idle', string> = {
  idle: 'Sẵn sàng',
  connecting: 'Đang kết nối…',
  listening: 'Đang nghe bạn nói…',
  speaking: 'AI đang nói…',
  ended: 'Đã kết thúc cuộc gọi',
};

export const VoiceCallModal: React.FC<Props> = ({ open, onClose, languageName, targetLanguage, scenarioTitle, scenarioRole, icon, onAddXp }) => {
  const [status, setStatus] = useState<LiveStatus | 'idle'>('idle');
  const [voice, setVoice] = useState<'female' | 'male'>('female');
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState('');
  const [secs, setSecs] = useState(0);
  const [maxSecs, setMaxSecs] = useState(600);
  const callRef = useRef<LiveCall | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const live = status === 'connecting' || status === 'listening' || status === 'speaking';

  const hangUp = () => {
    callRef.current?.stop();
    callRef.current = null;
  };

  useEffect(() => () => hangUp(), []);
  useEffect(() => {
    if (!open) hangUp();
  }, [open]);

  // Đồng hồ cuộc gọi; hết giờ thì tự gác máy.
  useEffect(() => {
    if (status !== 'listening' && status !== 'speaking') return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [status]);
  useEffect(() => {
    if (secs >= maxSecs && live) hangUp();
  }, [secs, maxSecs, live]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  // Cộng XP theo thời lượng nói khi cuộc gọi kết thúc.
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== 'ended' && status === 'ended' && secs >= 30) onAddXp?.(Math.min(50, Math.round(secs / 12)));
    prevStatus.current = status;
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setError('');
    setLines([]);
    setSecs(0);
    setMuted(false);
    setStatus('connecting');
    const getToken = async () => {
      const res = await aiFetch('/api/ai/live-token', { languageName, targetLanguage, scenarioTitle, scenarioRole, voice });
      if (!res.ok) {
        let msg = 'Chưa mở được cuộc gọi AI, vui lòng thử lại.';
        try { msg = (await res.json()).message || msg; } catch { /* giữ thông báo mặc định */ }
        throw new Error(msg);
      }
      const { token, model, maxMinutes } = await res.json();
      if (maxMinutes) setMaxSecs(maxMinutes * 60);
      return { token, model };
    };
    try {
      // Gọi ngay trong lượt bấm: trình duyệt cho phát âm thanh, hỏi quyền micro trước rồi mới lấy token.
      callRef.current = await startLiveCall(getToken, {
        onStatus: setStatus,
        onError: setError,
        onTranscript: (role, text, final) =>
          setLines((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === role && !last.final) return [...prev.slice(0, -1), { role, text, final }];
            return [...prev, { role, text, final }];
          }),
      });
    } catch (e: any) {
      setError(e?.message || 'Chưa mở được cuộc gọi AI.');
      setStatus('idle');
    }
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    callRef.current?.setMuted(m);
  };

  if (!open) return null;
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Gọi thoại với AI">
      <div className="relative w-full max-w-lg max-h-[94vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="text-xl">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-white truncate">{scenarioTitle}</div>
            <div className="text-xs text-emerald-400 truncate">{scenarioRole}</div>
          </div>
          <button type="button" onClick={() => { hangUp(); onClose(); }} aria-label="Đóng" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-4">
          <div className={`relative w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-sky-500 ${status === 'speaking' ? 'animate-pulse' : ''}`}>
            {status === 'listening' && <span className="absolute inset-0 rounded-full border-4 border-emerald-300/60 animate-ping" />}
            {status === 'connecting' ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Phone className="w-10 h-10 text-white" />}
          </div>
          <div className="text-sm font-bold text-slate-200" role="status">{muted && live ? 'Đã tắt micro' : STATUS_TEXT[status]}</div>
          {live && <div className="text-xs font-mono text-slate-400">{mm}:{ss} / {String(maxSecs / 60).padStart(2, '0')}:00</div>}
        </div>

        <div ref={listRef} className="flex-1 min-h-[140px] max-h-[38vh] overflow-y-auto px-5 space-y-2">
          {lines.length === 0 && status === 'idle' && (
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Nói chuyện trực tiếp bằng giọng nói với AI bằng {languageName}. Bạn có thể chen lời bất cứ lúc nào, AI sẽ dừng lại để nghe.
              Nên dùng tai nghe để AI không nghe lại tiếng loa.
            </p>
          )}
          {lines.map((l, i) => (
            <div key={i} className={`flex ${l.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${l.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'} ${l.final ? '' : 'opacity-80'}`}>
                {l.text}
              </div>
            </div>
          ))}
        </div>

        {error && <div role="alert" className="mx-5 mt-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}

        <div className="flex items-center justify-center gap-3 px-5 py-5">
          {!live ? (
            <>
              <div className="flex rounded-xl bg-slate-800 p-1 text-xs font-bold">
                {(['female', 'male'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setVoice(v)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${voice === v ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
                    {v === 'female' ? 'Giọng nữ' : 'Giọng nam'}
                  </button>
                ))}
              </div>
              <button type="button" onClick={start} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-2 cursor-pointer">
                <Phone className="w-5 h-5" /> {status === 'ended' ? 'Gọi lại' : 'Bắt đầu gọi'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={toggleMute} disabled={status === 'connecting'} aria-label={muted ? 'Bật micro' : 'Tắt micro'} className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-40 ${muted ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-white'}`}>
                {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button type="button" onClick={hangUp} aria-label="Kết thúc cuộc gọi" className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center cursor-pointer">
                <PhoneOff className="w-7 h-7" />
              </button>
            </>
          )}
        </div>
        <p className="px-5 pb-4 -mt-2 text-[10px] text-slate-500 text-center">Mỗi cuộc gọi tính 1 lượt AI, tối đa {maxSecs / 60} phút.</p>
      </div>
    </div>
  );
};

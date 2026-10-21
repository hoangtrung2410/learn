import { LanguageCode } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Sound effects synthesized with Web Audio API for zero-latency instant feedback
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Melodic happy chime (C5 -> E5 -> G5 -> C6)
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.setValueAtTime(659.25, now + 0.08);
    osc1.frequency.setValueAtTime(783.99, now + 0.16);
    osc1.frequency.setValueAtTime(1046.50, now + 0.24);

    osc2.frequency.setValueAtTime(261.63, now);
    osc2.frequency.setValueAtTime(329.63, now + 0.08);
    osc2.frequency.setValueAtTime(392.00, now + 0.16);
    osc2.frequency.setValueAtTime(523.25, now + 0.24);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.error('Audio play error', e);
  }
}

export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.error('Audio error sound', e);
  }
}

export function playPopSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.error('Pop sound error', e);
  }
}

// Play Tone frequency simulation for Chinese 4 Tones (Tone 1: 5-5, Tone 2: 3-5, Tone 3: 2-1-4, Tone 4: 5-1)
export function playToneFrequency(tone: number) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.18, now);

    if (tone === 1) {
      // 5-5: High flat pitch
      osc.frequency.setValueAtTime(440, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (tone === 2) {
      // 3-5: Rising pitch
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (tone === 3) {
      // 2-1-4: Dipping pitch
      osc.frequency.setValueAtTime(290, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (tone === 4) {
      // 5-1: Falling sharp pitch
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Neutral light tone
      osc.frequency.setValueAtTime(320, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch (e) {
    console.error('Tone sound error', e);
  }
}

// Browser native Speech Synthesis
export function speakWithBrowser(text: string, lang: LanguageCode, rate = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<LanguageCode, string> = {
      zh: 'zh-CN',
      en: 'en-US',
      ja: 'ja-JP',
      ko: 'ko-KR',
    };
    utterance.lang = langMap[lang] || 'zh-CN';
    utterance.rate = rate; // 1.0 normal, 0.75 slow
    utterance.pitch = 1.0;

    // Pick best matching native voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang.startsWith(utterance.lang.slice(0, 2)) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Chinese') || v.name.includes('Siri'))
    ) || voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

// Try Gemini TTS first (studio quality), fallback to browser speech synthesis
const ttsCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

async function fetchTtsAudio(text: string, lang: LanguageCode): Promise<string | null> {
  const key = lang + '|' + text;
  const hit = ttsCache.get(key);
  if (hit) return hit;
  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: lang, voice: lang === 'zh' ? 'Kore' : 'Zephyr' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        if (ttsCache.size > 60) ttsCache.delete(ttsCache.keys().next().value as string);
        ttsCache.set(key, data.audioBase64);
        return data.audioBase64;
      }
    }
  } catch (err) {
    console.warn('Gemini TTS fallback to browser TTS:', err);
  }
  return null;
}

// Tải trước giọng đọc để lần bấm nghe sau phát ngay, không phải chờ vài giây.
export function prefetchSpeech(text: string, lang: LanguageCode) {
  void fetchTtsAudio(text, lang);
}

export function stopSpeaking() {
  try {
    currentAudio?.pause();
  } catch {}
  currentAudio = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// Try Gemini TTS first (studio quality, có cache), fallback to browser speech synthesis
export async function speakNativeText(text: string, lang: LanguageCode, slowRate = false): Promise<void> {
  stopSpeaking();
  const b64 = await fetchTtsAudio(text, lang);
  if (b64) {
    try {
      const audio = new Audio(`data:audio/wav;base64,${b64}`);
      if (slowRate) audio.playbackRate = 0.8;
      currentAudio = audio;
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.onpause = () => resolve();
      });
      return;
    } catch (err) {
      console.warn('Audio play blocked, fallback to browser TTS:', err);
    }
  }
  return speakWithBrowser(text, lang, slowRate ? 0.75 : 1.0);
}

// Speech recognition helper (Web Speech API)
export interface SpeechRecognitionResultHolder {
  text: string;
  isFinal: boolean;
}

export function createSpeechRecognizer(
  lang: LanguageCode | string,
  onResult: (result: SpeechRecognitionResultHolder) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  continuous = true
) {
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => onError('Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn có thể gõ nội dung vào ô để AI chấm điểm.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  const langMap: Record<string, string> = {
    zh: 'zh-CN',
    'zh-CN': 'zh-CN',
    vi: 'vi-VN',
    'vi-VN': 'vi-VN',
    en: 'en-US',
    'en-US': 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
  };

  recognition.lang = langMap[lang] || lang || 'zh-CN';
  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let isIntentionallyStopped = true;
  let isListening = false;
  let fullAccumulatedTranscript = '';
  let restartTimeout: any = null;

  recognition.onstart = () => {
    isListening = true;
  };

  recognition.onresult = (event: any) => {
    if (isIntentionallyStopped) return;
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        fullAccumulatedTranscript += transcriptPiece + ' ';
      } else {
        interimTranscript += transcriptPiece;
      }
    }

    const currentFullText = (fullAccumulatedTranscript + interimTranscript).trim();

    if (isIntentionallyStopped) return;

    onResult({
      text: currentFullText,
      isFinal: false,
    });
  };

  recognition.onerror = (event: any) => {
    const rawError = String(event?.error || event?.message || '').toLowerCase().trim();

    // Hoàn toàn bỏ qua các sự kiện vô hại:
    // 1. 'no-speech' (người dùng ngưng nghỉ lấy hơi)
    // 2. 'aborted' (mic ngắt / tạm dừng bình thường khi người dùng thao tác)
    // 3. Mọi sự kiện sau khi đã chủ động dừng
    if (
      isIntentionallyStopped ||
      rawError === 'aborted' ||
      rawError === 'no-speech' ||
      rawError.includes('aborted') ||
      rawError.includes('no-speech')
    ) {
      return;
    }

    console.warn('Speech recognition warning:', event.error);

    if (rawError === 'not-allowed' || rawError.includes('permission')) {
      onError('Vui lòng cấp quyền Microphone trên trình duyệt để sử dụng.');
    } else if (rawError === 'network') {
      // Sự cố mạng tạm thời với máy chủ nhận diện của trình duyệt
      console.warn('Trình duyệt gặp sự cố mạng khi nhận diện giọng nói.');
    } else if (!rawError.includes('abort')) {
      onError(`Lỗi nhận diện âm thanh: ${event.error || 'không xác định'}`);
    }
  };

  const attemptRestart = () => {
    if (isIntentionallyStopped || !continuous) return;
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
    restartTimeout = setTimeout(() => {
      if (isIntentionallyStopped || isListening) return;
      try {
        recognition.start();
      } catch (err) {
        // Trình duyệt đang chuyển đổi trạng thái, bỏ qua
      }
    }, 150);
  };

  recognition.onend = () => {
    isListening = false;
    if (isIntentionallyStopped) {
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
      onEnd();
      return;
    }

    // Nếu người học đang nói mà Web Speech tự ngắt giữa chừng, nối lại mượt mà
    if (continuous) {
      attemptRestart();
      return;
    }

    onEnd();
  };

  return {
    start: (initialText?: string) => {
      isIntentionallyStopped = false;
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
      if (initialText !== undefined) {
        fullAccumulatedTranscript = initialText ? initialText + ' ' : '';
      } else {
        fullAccumulatedTranscript = '';
      }
      try {
        recognition.start();
      } catch (err) {
        // Đã khởi chạy hoặc đang chạy
      }
    },
    stop: () => {
      isIntentionallyStopped = true;
      isListening = false;
      fullAccumulatedTranscript = '';
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
      try {
        // Dùng recognition.stop() để kết thúc êm dịu, không sinh mã lỗi 'aborted'
        recognition.stop();
      } catch (err) {
        try {
          recognition.abort();
        } catch (e) {}
      }
    },
    isSupported: true,
  };
}

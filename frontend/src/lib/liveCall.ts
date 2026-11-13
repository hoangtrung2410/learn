// Gọi thoại thời gian thực với Gemini Live ngay trong trình duyệt (dùng token tạm do máy chủ cấp).
// Micro → PCM 16 kHz gửi lên liên tục; giọng AI về dạng PCM 24 kHz, xếp lịch phát liền mạch, ngắt ngay khi người học chen lời.

export type LiveStatus = 'connecting' | 'listening' | 'speaking' | 'ended';

export interface LiveHandlers {
  onStatus: (s: LiveStatus) => void;
  /** Phụ đề: role 'user' là người học, 'ai' là AI; final = lượt đó đã xong. */
  onTranscript: (role: 'user' | 'ai', text: string, final: boolean) => void;
  onError: (message: string) => void;
}

export interface LiveCall {
  stop: () => void;
  setMuted: (muted: boolean) => void;
}

// Bộ thu âm chạy trong AudioWorklet: hạ mẫu về 16 kHz, gom ~100 ms rồi gửi về luồng chính dạng Int16.
const CAPTURE_WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.pos = 0; this.buf = []; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    let t = this.pos;
    for (; t < ch.length; t += this.ratio) this.buf.push(ch[Math.floor(t)]);
    this.pos = t - ch.length;
    if (this.buf.length >= 1600) {
      const out = new Int16Array(this.buf.length);
      for (let i = 0; i < this.buf.length; i++) {
        const s = Math.max(-1, Math.min(1, this.buf[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(out.buffer, [out.buffer]);
      this.buf = [];
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function pcm16ToFloat(b64: string): Float32Array<ArrayBuffer> {
  const bin = atob(b64);
  const n = bin.length >> 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
    out[i] = (v >= 0x8000 ? v - 0x10000 : v) / 0x8000;
  }
  return out;
}

/** Bắt đầu cuộc gọi. Gọi trong sự kiện bấm nút để trình duyệt cho phép phát âm thanh. */
/** getToken được gọi sau khi đã có quyền micro, để micro bị chặn thì không tốn lượt AI. */
export async function startLiveCall(getToken: () => Promise<{ token: string; model: string }>, h: LiveHandlers): Promise<LiveCall> {
  h.onStatus('connecting');
  // Tạo AudioContext ngay trong lượt bấm để không bị chặn tự phát.
  const outCtx = new AudioContext({ sampleRate: 24000 });
  const inCtx = new AudioContext();
  let mic: MediaStream | null = null;
  let session: any = null;
  let stopped = false;
  let muted = false;
  let nextTime = 0;
  const playing = new Set<AudioBufferSourceNode>();
  let userText = '';
  let aiText = '';

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    try { session?.close(); } catch { /* đã đóng */ }
    mic?.getTracks().forEach((t) => t.stop());
    playing.forEach((s) => { try { s.stop(); } catch { /* đã dừng */ } });
    playing.clear();
    void inCtx.close().catch(() => {});
    void outCtx.close().catch(() => {});
    h.onStatus('ended');
  };

  const stopPlayback = () => {
    playing.forEach((s) => { try { s.stop(); } catch { /* đã dừng */ } });
    playing.clear();
    nextTime = 0;
  };

  const finishUser = () => {
    if (userText.trim()) h.onTranscript('user', userText.trim(), true);
    userText = '';
  };
  const finishAi = () => {
    if (aiText.trim()) h.onTranscript('ai', aiText.trim(), true);
    aiText = '';
  };

  try {
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    cleanup();
    throw new Error('Chưa có quyền dùng micro. Hãy cho phép micro trong trình duyệt rồi thử lại.');
  }

  let token: string;
  let model: string;
  try {
    ({ token, model } = await getToken());
  } catch (e) {
    cleanup();
    throw e;
  }
  const { GoogleGenAI, Modality } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });

  const connecting: Promise<any> = ai.live.connect({
    model,
    config: { responseModalities: [Modality.AUDIO] },
    callbacks: {
      onmessage: (m: any) => {
        if (stopped) return;
        if (m.setupComplete) {
          h.onStatus('listening');
          // Để AI chào trước, đúng vai. Tin này có thể đến trước khi connect() trả về nên gửi qua promise.
          void connecting.then((sess: any) => sess.sendRealtimeInput({ text: '(Cuộc gọi vừa kết nối. Hãy chào người học thật ngắn gọn.)' }));
          return;
        }
        if (m.goAway) {
          h.onError('Cuộc gọi sắp hết thời lượng cho phép.');
        }
        const sc = m.serverContent;
        if (!sc) return;
        if (sc.interrupted) {
          // Người học chen lời: dừng giọng AI ngay.
          stopPlayback();
          finishAi();
          h.onStatus('listening');
        }
        if (sc.inputTranscription?.text) {
          userText += sc.inputTranscription.text;
          h.onTranscript('user', userText.trim(), false);
        }
        if (sc.outputTranscription?.text) {
          if (userText) finishUser();
          aiText += sc.outputTranscription.text;
          h.onTranscript('ai', aiText.trim(), false);
        }
        for (const p of sc.modelTurn?.parts || []) {
          const data = p.inlineData?.data;
          if (!data) continue;
          if (userText) finishUser();
          const samples = pcm16ToFloat(data);
          const buf = outCtx.createBuffer(1, samples.length, 24000);
          buf.copyToChannel(samples, 0);
          const src = outCtx.createBufferSource();
          src.buffer = buf;
          src.connect(outCtx.destination);
          const at = Math.max(nextTime, outCtx.currentTime + 0.03);
          src.start(at);
          nextTime = at + buf.duration;
          playing.add(src);
          h.onStatus('speaking');
          src.onended = () => {
            playing.delete(src);
            if (!playing.size && !stopped) h.onStatus('listening');
          };
        }
        if (sc.turnComplete) finishAi();
      },
      onerror: () => {
        if (!stopped) h.onError('Mất kết nối với AI.');
        cleanup();
      },
      onclose: () => cleanup(),
    },
  });
  session = await connecting;

  // Gửi micro lên liên tục (AI tự nhận biết khi người học nói xong).
  await inCtx.audioWorklet.addModule(URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' })));
  const node = new AudioWorkletNode(inCtx, 'pcm-capture');
  node.port.onmessage = (e) => {
    if (stopped || muted) return;
    session?.sendRealtimeInput({ audio: { data: toBase64(e.data as ArrayBuffer), mimeType: 'audio/pcm;rate=16000' } });
  };
  inCtx.createMediaStreamSource(mic).connect(node);
  void outCtx.resume();
  void inCtx.resume();

  return {
    stop: cleanup,
    setMuted: (m) => {
      muted = m;
      if (m) session?.sendRealtimeInput({ audioStreamEnd: true });
    },
  };
}

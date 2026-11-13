// POST /api/ai/live-token — cấp token tạm (dùng 1 lần) để trình duyệt gọi thoại thời gian thực với Gemini Live.
// Khoá Gemini thật không rời máy chủ; token khoá cứng model, vai diễn và giọng nên người dùng không đổi được.
import { GoogleGenAI, Modality } from '@google/genai';
import { guard } from '../_lib/ai.js';

export const config = { maxDuration: 30 };

const MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
// Một cuộc gọi tối đa 10 phút; token còn hạn thêm một chút để kết thúc êm.
const CALL_MINUTES = 10;

function systemPrompt(b: any): string {
  const lang = b.languageName || 'Tiếng Anh';
  return [
    `Bạn là đối tác luyện nói ${lang} qua điện thoại với một người Việt đang học. Hãy nói tự nhiên như người bản xứ thật.`,
    `Tình huống: "${String(b.scenarioTitle || 'Trò chuyện tự do').slice(0, 120)}". Vai của bạn: "${String(b.scenarioRole || 'Bạn bè bản xứ').slice(0, 120)}".`,
    'Quy tắc:',
    `- Luôn nói bằng ${lang}, câu ngắn (1-3 câu mỗi lượt), tốc độ vừa phải, từ ngữ vừa tầm người học.`,
    '- Nếu người học nói tiếng Việt hoặc bí từ, hãy gợi ý cách nói bằng ngôn ngữ đích rồi khuyến khích họ nói lại.',
    '- Khi người học nói sai rõ ràng, nhắc lại câu đúng một cách nhẹ nhàng (recast) rồi tiếp tục cuộc trò chuyện.',
    '- Kết thúc mỗi lượt bằng một câu hỏi để người học nói tiếp. Bắt đầu bằng một lời chào ngắn đúng vai.',
  ].join('\n');
}

export default async function handler(req: any, res: any) {
  const body = await guard(req, res, 'ai');
  if (!body) return;

  const voiceName = body.voice === 'male' ? 'Puck' : 'Kore';
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + (CALL_MINUTES + 2) * 60e3).toISOString(),
        newSessionExpireTime: new Date(now + 60e3).toISOString(),
        liveConnectConstraints: {
          model: MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemPrompt(body),
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        lockAdditionalFields: [],
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });
    res.status(200).json({ token: token.name, model: MODEL, maxMinutes: CALL_MINUTES });
  } catch (err: any) {
    console.warn('[live-token] failed:', String(err?.message || err).slice(0, 200));
    res.status(502).json({ message: 'Chưa mở được cuộc gọi AI, vui lòng thử lại.' });
  }
}

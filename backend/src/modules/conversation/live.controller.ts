import { UseGuards, Controller, Post, Body, BadGatewayException } from '@nestjs/common';
import { GoogleGenAI, Modality } from '@google/genai';
import { AiQuotaGuard } from '../shop/ai-quota.guard.ts';

// Cấp token tạm (dùng 1 lần) để trình duyệt gọi thoại thời gian thực với Gemini Live.
// Khoá Gemini thật không rời máy chủ; token khoá cứng model, vai diễn và giọng.
// Bản miễn phí dùng hàm tương ứng ở frontend/api/ai/live-token.ts.
const MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
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

@Controller('api/ai/live-token')
export class LiveController {
  @Post()
  @UseGuards(AiQuotaGuard)
  async token(@Body() body: any) {
    const b = body || {};
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
              systemInstruction: systemPrompt(b),
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: b.voice === 'male' ? 'Puck' : 'Kore' } } },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          },
          lockAdditionalFields: [],
          httpOptions: { apiVersion: 'v1alpha' },
        },
      });
      return { token: token.name, model: MODEL, maxMinutes: CALL_MINUTES };
    } catch (err: any) {
      console.warn('[live-token] failed:', String(err?.message || err).slice(0, 200));
      throw new BadGatewayException('Chưa mở được cuộc gọi AI, vui lòng thử lại.');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface ConversationParams {
  targetLanguage?: string;
  languageName?: string;
  scenarioTitle?: string;
  scenarioRole?: string;
  history?: Array<{ role: string; content: string }>;
  userMessage?: string;
}

export interface EnrichParams extends ConversationParams {
  replyText?: string;
}

// Chỉ dùng model lite: đo thực tế ~0.6-1s cho token đầu, đủ chính xác cho hội thoại. Các model flash đầy đủ mất 2-20s và lộ cả phần suy luận.
// Có thể ghi đè bằng GEMINI_CHAT_MODELS="model1,model2" trong backend/.env.
const DEFAULT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
const FIRST_TOKEN_TIMEOUT_MS = 8000;
const ENRICH_TIMEOUT_MS = 12000;

@Injectable()
export class ConversationService {
  private readonly ai: GoogleGenAI;
  private readonly models: string[];
  // Model gần nhất chạy thành công, thử trước ở lượt sau để khỏi mất thời gian dò lại.
  private lastGood: string | null = null;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const fromEnv = (process.env.GEMINI_CHAT_MODELS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.models = fromEnv.length ? fromEnv : DEFAULT_MODELS;
  }

  private orderedModels(): string[] {
    if (!this.lastGood || !this.models.includes(this.lastGood)) return this.models;
    return [this.lastGood, ...this.models.filter((m) => m !== this.lastGood)];
  }

  private systemPrompt(p: ConversationParams): string {
    const lang = p.languageName || 'Tiếng Trung';
    return [
      `Bạn là đối tác luyện nói ${lang} của một người Việt đang học. Hãy nhập vai tự nhiên, như người bản xứ thật.`,
      `Tình huống: "${p.scenarioTitle || 'Giao tiếp hàng ngày'}". Vai của bạn: "${p.scenarioRole || 'Bạn bè bản xứ'}".`,
      'Quy tắc:',
      `- Luôn trả lời bằng ${lang} (không kèm phiên âm hay dịch, phần đó hiển thị riêng).`,
      '- Câu đầu tiên phải trả lời TRỰC TIẾP điều người học vừa nói/hỏi. Người học có thể hỏi bằng tiếng Việt hoặc nói sai do nhận diện giọng nói: hãy đoán đúng ý và vẫn trả lời bằng ngôn ngữ đích.',
      '- Dài 2-4 câu, ngôn ngữ đời thường, độ khó vừa tầm người đang học; kết thúc bằng một câu hỏi mở để cuộc trò chuyện tiếp tục.',
      '- Không dùng markdown, không liệt kê, không tự xưng là AI trừ khi được hỏi.',
    ].join('\n');
  }

  private buildContents(p: ConversationParams) {
    const msgs = (p.history || []).slice(-14).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '') }],
    }));
    // Lịch sử gửi lên đã gồm cả tin nhắn mới nhất của người học; nếu thiếu thì bổ sung.
    const last = msgs[msgs.length - 1];
    if (p.userMessage && !(last && last.role === 'user' && last.parts[0].text === p.userMessage)) {
      msgs.push({ role: 'user', parts: [{ text: p.userMessage }] });
    }
    // Gemini yêu cầu lượt đầu là của user.
    if (!msgs.length || msgs[0].role !== 'user') {
      msgs.unshift({ role: 'user', parts: [{ text: '(Bắt đầu cuộc trò chuyện)' }] });
    }
    return msgs;
  }

  /** Stream từng đoạn chữ của câu trả lời. Thử lần lượt các model; lỗi trước token đầu thì chuyển model. */
  async *streamReply(p: ConversationParams): AsyncGenerator<string> {
    const contents = this.buildContents(p);
    let lastErr: any = null;

    for (const model of this.orderedModels()) {
      const ctrl = new AbortController();
      let timer: NodeJS.Timeout | null = setTimeout(() => ctrl.abort(), FIRST_TOKEN_TIMEOUT_MS);
      let gotToken = false;
      try {
        const stream = await this.ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: this.systemPrompt(p),
            temperature: 0.8,
            maxOutputTokens: 400,
            abortSignal: ctrl.signal,
          },
        });
        for await (const chunk of stream) {
          const t = chunk.text || '';
          if (!t) continue;
          if (!gotToken) {
            gotToken = true;
            if (timer) clearTimeout(timer);
            timer = null;
            this.lastGood = model;
          }
          yield t;
        }
        if (gotToken) return;
        lastErr = new Error('empty response');
      } catch (err: any) {
        lastErr = err;
        // Đã phát chữ cho người dùng rồi thì không thể đổi model giữa chừng.
        if (gotToken) throw err;
        console.warn(`[chat] model ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    throw lastErr || new Error('No model available');
  }

  /** Dịch, nhận xét và gợi ý câu trả lời tiếp theo; chạy riêng để không chặn việc hiển thị câu trả lời. */
  async enrich(p: EnrichParams) {
    const isZh = (p.targetLanguage || 'zh') === 'zh';
    const prompt = `Người học (${p.languageName || 'Tiếng Trung'}) đang luyện nói. Tình huống: "${p.scenarioTitle || ''}".
Người học vừa nói: "${p.userMessage || ''}"
Đối tác đã đáp: "${p.replyText || ''}"

Trả về DUY NHẤT JSON hợp lệ:
{
  "vietnameseTranslation": "dịch tự nhiên câu đối tác đã đáp sang tiếng Việt",
  ${isZh ? '' : '"pinyinOrPhonetic": "phiên âm IPA của câu đối tác đã đáp",'}
  "speechFeedback": {
    "naturalness": "Rất tự nhiên | Khá ổn | Cần điều chỉnh",
    "tip": "1 mẹo ngắn bằng tiếng Việt về ngữ pháp/cách dùng trong câu người học vừa nói",
    "betterAlternative": "cách nói chuẩn bản xứ hơn cho ý của người học (ngôn ngữ đích, kèm nghĩa Việt trong ngoặc)"
  },
  "suggestedResponses": [
    { "text": "câu người học có thể đáp tiếp #1 (ngôn ngữ đích, 1-2 câu)", "meaning": "nghĩa tiếng Việt" },
    { "text": "câu #2 (góc nhìn khác)", "meaning": "nghĩa tiếng Việt" },
    { "text": "câu #3 (hỏi lại hoặc mở rộng)", "meaning": "nghĩa tiếng Việt" }
  ]
}
Câu gợi ý phải đáp lại đúng câu hỏi cuối cùng của đối tác. Với tiếng Trung, viết liền các chữ Hán, KHÔNG chèn khoảng trắng giữa các từ.`;

    for (const model of this.orderedModels()) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ENRICH_TIMEOUT_MS);
      try {
        const res = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.6, abortSignal: ctrl.signal },
        });
        const parsed = JSON.parse(res.text || '{}');
        if (parsed.vietnameseTranslation) return parsed;
      } catch (err: any) {
        console.warn(`[chat/enrich] model ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
      } finally {
        clearTimeout(timer);
      }
    }
    return { vietnameseTranslation: '', speechFeedback: null, suggestedResponses: [] };
  }

  /** Endpoint cũ (không stream) cho app Flutter: ghép câu trả lời với phần bổ sung. */
  async handleConversation(p: ConversationParams) {
    let replyText = '';
    for await (const t of this.streamReply(p)) replyText += t;
    replyText = replyText.trim();
    const extra = await this.enrich({ ...p, replyText });
    return { replyText, pinyinOrPhonetic: extra.pinyinOrPhonetic || '', ...extra };
  }
}

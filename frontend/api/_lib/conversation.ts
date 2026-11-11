// Chuyển từ backend/src/modules/conversation/conversation.service.ts (giữ nguyên lời nhắc và thứ tự model).
import { gemini, withTimeout } from './ai.js';

export interface ConversationParams {
  targetLanguage?: string;
  languageName?: string;
  scenarioTitle?: string;
  scenarioRole?: string;
  history?: Array<{ role: string; content: string }>;
  userMessage?: string;
  replyText?: string;
}

const MODELS = (process.env.GEMINI_CHAT_MODELS || 'gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-lite-latest')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const FIRST_TOKEN_TIMEOUT_MS = 15000;
const ENRICH_TIMEOUT_MS = 25000;

function systemPrompt(p: ConversationParams): string {
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

function buildContents(p: ConversationParams) {
  const msgs = (p.history || []).slice(-14).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.content || '') }],
  }));
  const last = msgs[msgs.length - 1];
  if (p.userMessage && !(last && last.role === 'user' && last.parts[0].text === p.userMessage)) {
    msgs.push({ role: 'user', parts: [{ text: p.userMessage }] });
  }
  if (!msgs.length || msgs[0].role !== 'user') {
    msgs.unshift({ role: 'user', parts: [{ text: '(Bắt đầu cuộc trò chuyện)' }] });
  }
  return msgs;
}

/** Stream từng đoạn chữ của câu trả lời; lỗi trước token đầu thì chuyển model. */
export async function* streamReply(p: ConversationParams): AsyncGenerator<string> {
  const contents = buildContents(p);
  let lastErr: any = null;
  for (const model of MODELS) {
    const ctrl = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => ctrl.abort(), FIRST_TOKEN_TIMEOUT_MS);
    let gotToken = false;
    try {
      const stream = await gemini().models.generateContentStream({
        model,
        contents,
        config: { systemInstruction: systemPrompt(p), temperature: 0.8, maxOutputTokens: 400, abortSignal: ctrl.signal },
      });
      for await (const chunk of stream) {
        const t = chunk.text || '';
        if (!t) continue;
        if (!gotToken) {
          gotToken = true;
          if (timer) clearTimeout(timer);
          timer = null;
        }
        yield t;
      }
      if (gotToken) return;
      lastErr = new Error('empty response');
    } catch (err: any) {
      lastErr = err;
      if (gotToken) throw err;
      console.warn(`[chat] model ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastErr || new Error('No model available');
}

/** Dịch, nhận xét và gợi ý câu trả lời tiếp theo. */
export async function enrich(p: ConversationParams) {
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

  for (const model of MODELS) {
    try {
      const res = await withTimeout(ENRICH_TIMEOUT_MS, (abortSignal) =>
        gemini().models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.6, abortSignal },
        }),
      );
      const parsed = JSON.parse(res.text || '{}');
      if (parsed.vietnameseTranslation) return parsed;
    } catch (err: any) {
      console.warn(`[chat/enrich] model ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
    }
  }
  return { vietnameseTranslation: '', speechFeedback: null, suggestedResponses: [] };
}

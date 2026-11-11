// POST /api/ai/speech-coach — chấm phát âm (chuyển từ backend/src/modules/speech/speech.service.ts).
// Khác backend: hết model thì báo lỗi thật, không trả điểm dựng sẵn.
import { gemini, guard, withTimeout } from '../_lib/ai.js';

export const config = { maxDuration: 60 };

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

export default async function handler(req: any, res: any) {
  const body = await guard(req, res, 'ai');
  if (!body) return;
  const {
    targetLanguage = 'zh',
    targetSentence,
    userSpokenText,
    languageName = 'Tiếng Trung',
    audioBase64,
    mimeType = 'audio/webm',
  } = body;
  if (!targetSentence) return res.status(400).json({ message: 'targetSentence is required' });

  const promptText = `
Bạn là Chuyên gia Luyện Phát Âm Trí Tuệ Nhân Tạo (Acoustic AI Speech Coach) chuyên sâu cho môn ${languageName} (mã ngôn ngữ: ${targetLanguage}).
Nhiệm vụ của bạn là đánh giá cực kỳ chi tiết khả năng phát âm, thanh điệu (Tone), độ trôi chảy (Fluency) và cách nhả chữ của người học.

Câu mẫu chuẩn cần đọc: "${targetSentence}"
Văn bản người học đọc (hoặc hệ thống STT nhận diện): "${userSpokenText || '(Người học vừa ghi âm)'}"
${audioBase64 ? 'Người học ĐÃ GỬI BẢN GHI ÂM GIỌNG NÓI THỰC TẾ đính kèm. Bạn hãy lắng nghe kỹ âm sắc, cao độ, độ vang, các nguyên âm và phụ âm trong file âm thanh.' : ''}

Đối với TIẾNG TRUNG (nếu ${targetLanguage} === 'zh'):
- Đặc biệt phân tích 4 thanh điệu chuẩn quốc tế:
  * Thanh 1: 5-5 (Âm bằng, cao đều)
  * Thanh 2: 3-5 (Lên dốc, từ trung lên cao)
  * Thanh 3: 2-1-4 (Uốn lượn, xuống trầm rồi vút lên)
  * Thanh 4: 5-1 (Hạ dốc dứt khoát)
  * Khinh thanh: nhẹ và ngắn
- Phân biệt các cặp phụ âm khó đối với người Việt: z-c-s vs zh-ch-sh, j-q-x, r, âm mũi an-ang, en-eng, in-ing.
- Cung cấp Pinyin chuẩn kèm dấu thanh.

Đối với TIẾNG ANH (nếu ${targetLanguage} === 'en'):
- Phân tích âm cuối (ending sounds: /s/, /ed/, /t/, /d/, /θ/, /ð/), trọng âm từ, nối âm (linking sounds).

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc trong markdown codeblock, theo cấu trúc:
{
  "overallScore": 88,
  "pronunciationScore": 85,
  "fluencyScore": 90,
  "toneScore": 86,
  "cefrLevel": "B1",
  "pinyinOrIpa": "Pinyin hoặc phiên âm chuẩn của câu mẫu",
  "nativeMeaningVi": "Nghĩa tiếng Việt chuẩn",
  "feedbackSummary": "Nhận xét tổng quan súc tích, khích lệ và chỉ rõ điểm cần sửa",
  "wordsBreakdown": [
    {
      "word": "chữ/từ",
      "phonetic": "pinyin/ipa",
      "score": 92,
      "status": "perfect" | "good" | "needs-work",
      "comment": "Nhận xét cụ thể về cao độ thanh điệu hoặc khẩu hình"
    }
  ],
  "pronunciationTips": [
    "Mẹo 1 để cải thiện âm này",
    "Mẹo 2 về ngữ điệu hoặc nhịp thở"
  ],
  "soundAlikeWarning": "Lưu ý không nhầm với từ phát âm na ná nào khác (nếu có)"
}
`;

  const parts: any[] = [{ text: promptText }];
  if (audioBase64) {
    parts.push({ inlineData: { mimeType: String(mimeType).split(';')[0] || 'audio/webm', data: audioBase64 } });
  }

  for (const model of MODELS) {
    try {
      const response = await withTimeout(25000, (abortSignal) =>
        gemini().models.generateContent({ model, contents: parts, config: { responseMimeType: 'application/json', abortSignal } }),
      );
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.overallScore) return res.status(200).json(parsed);
    } catch (err: any) {
      console.warn(`[speech] model ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
    }
  }
  res.status(502).json({ message: 'AI chưa chấm được lúc này, vui lòng thử lại.' });
}

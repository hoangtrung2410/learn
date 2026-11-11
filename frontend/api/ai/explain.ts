// POST /api/ai/explain — giải thích từ (chuyển từ backend/src/modules/explain/explain.service.ts).
import { gemini, guard, withTimeout } from '../_lib/ai.js';

export const config = { maxDuration: 60 };

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

export default async function handler(req: any, res: any) {
  const body = await guard(req, res, 'ai');
  if (!body) return;
  const query = String(body.query || '').trim();
  const targetLanguage = body.targetLanguage || 'zh';
  const type = body.type || 'word';
  if (!query) return res.status(400).json({ message: 'query is required' });

  const prompt = `
Người học đang học ${targetLanguage === 'zh' ? 'Tiếng Trung (Mandarin)' : 'Tiếng Anh (English)'} và muốn giải thích chi tiết về: "${query}" (loại: ${type}).

Hãy phân tích cực kỳ trực quan, dễ hiểu và sinh động theo chuẩn quốc tế (${targetLanguage === 'zh' ? 'HSK 3.0' : 'CEFR / IELTS'}):
1. Từ vựng / Thuật ngữ: "${query}"
2. Phiên âm: ${targetLanguage === 'zh' ? 'Pinyin chuẩn kèm thanh điệu' : 'Phiên âm IPA chuẩn Anh - Mỹ'}
3. Nghĩa gốc & các nghĩa ứng dụng phổ biến trong đời sống
4. Nguồn gốc & cấu tạo:
   - Nếu là Tiếng Trung: Phân tích bộ thủ (Radical), chiết tự chữ Hán.
   - Nếu là Tiếng Anh: Phân tích nguồn gốc từ (Etymology), tiền tố/hậu tố (prefix/suffix), họ từ (word family).
5. Mẹo ghi nhớ siêu tốc: Mẹo nhớ bằng hình tượng, liên tưởng thực tế thú vị.
6. Cấp độ tương đương: ${targetLanguage === 'zh' ? 'HSK 1 đến HSK 6' : 'A1 đến C2 hoặc IELTS 5.0 - 8.5'}
7. 3 câu ví dụ thực tế phong phú kèm phiên âm (${targetLanguage === 'zh' ? 'Pinyin' : 'IPA'}) và dịch nghĩa tiếng Việt tự nhiên
8. Lỗi người Việt thường hay mắc phải khi dùng từ này (như phát âm nuốt âm cuối, sai trọng âm, hoặc nhầm ngữ cảnh).
9. Lưu ý quan trọng khi dùng (collocations, văn phong lịch sự hay thân mật).

Trả về định dạng JSON:
{
  "title": "${query}",
  "phonetic": "phiên âm pinyin hoặc ipa",
  "level": "${targetLanguage === 'zh' ? 'HSK 2' : 'B2'}",
  "radicalsOrOrigin": "Giải thích cấu tạo bộ thủ (Trung) hoặc nguồn gốc etymology (Anh)",
  "memoryTrick": "Mẹo nhớ từ cực thú vị",
  "vietnameseMeaning": "Nghĩa tiếng Việt rõ ràng, chuẩn xác",
  "examples": [
    {
      "sentence": "câu ví dụ tiếng bản xứ",
      "phonetic": "phiên âm",
      "translation": "dịch nghĩa tiếng Việt"
    }
  ],
  "commonMistakes": "Lỗi phổ biến người Việt hay mắc",
  "usageNotes": "Lưu ý quan trọng khi dùng"
}
`;

  for (const model of MODELS) {
    try {
      const response = await withTimeout(25000, (abortSignal) =>
        gemini().models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json', abortSignal } }),
      );
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.title || parsed.vietnameseMeaning) return res.status(200).json(parsed);
    } catch (err: any) {
      console.warn(`[explain] model ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
    }
  }
  res.status(502).json({ message: 'AI chưa giải thích được lúc này, vui lòng thử lại.' });
}

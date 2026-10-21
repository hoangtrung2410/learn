import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class ExplainService {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  async explainQuery(query: string, targetLanguage = 'zh', type = 'word') {
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

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Explain NestJS service error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

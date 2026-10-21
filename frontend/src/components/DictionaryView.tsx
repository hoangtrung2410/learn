import { aiFetch } from '../lib/api';
import React, { useState } from 'react';
import { LanguageCode } from '../types';
import { speakNativeText, playPopSound } from '../utils/audio';
import {
  Search,
  Sparkles,
  Volume2,
  BookOpen,
  Layers,
  HelpCircle,
  Lightbulb,
  Check,
  RefreshCw,
} from 'lucide-react';

interface VocabDetail {
  title: string;
  phonetic: string;
  level: string;
  radicalsOrOrigin: string;
  memoryTrick: string;
  vietnameseMeaning: string;
  examples: Array<{
    sentence: string;
    phonetic: string;
    translation: string;
  }>;
  commonMistakes: string;
  usageNotes: string;
}

const DEFAULT_CHINESE_WORDS: VocabDetail[] = [
  {
    title: '好',
    phonetic: 'hǎo / hào',
    level: 'HSK 1',
    radicalsOrOrigin: 'Bộ Nữ (女 - người phụ nữ) ghép với Bộ Tử (子 - đứa con trai).',
    memoryTrick: 'Người phụ nữ có đủ nếp đủ tẻ (con trai và con gái) là điều tuyệt vời, tốt đẹp nhất (Hảo - 好).',
    vietnameseMeaning: 'Tốt, đẹp, hay, được, khỏe (dùng trong chào hỏi và khen ngợi).',
    examples: [
      {
        sentence: '你好！很高兴认识你。',
        phonetic: 'Nǐ hǎo! Hěn gāoxìng rènshí nǐ.',
        translation: 'Xin chào! Rất vui được quen biết bạn.',
      },
      {
        sentence: '这个苹果很好吃。',
        phonetic: 'Zhè ge píngguǒ hěn hǎochī.',
        translation: 'Quả táo này rất ngon.',
      },
    ],
    commonMistakes: 'Khi ghép 2 thanh 3 (như 你好), chữ 你 phải biến điệu thành thanh 2: [Ní hǎo].',
    usageNotes: 'Có thể làm phó từ chỉ mức độ: 好大 (to quá), 好多 (nhiều thế).',
  },
  {
    title: '喝',
    phonetic: 'hē',
    level: 'HSK 1',
    radicalsOrOrigin: 'Gồm Bộ Khẩu (口 - cái miệng) ở bên trái, bên phải là chữ Hát (曷).',
    memoryTrick: 'Muốn uống nước thì nhất định phải mở miệng (Bộ Khẩu 口) ra để uống.',
    vietnameseMeaning: 'Uống (chất lỏng như nước, trà, cà phê, rượu).',
    examples: [
      {
        sentence: '我想喝一杯冰奶茶。',
        phonetic: 'Wǒ xiǎng hē yì bēi bīng nǎichá.',
        translation: 'Tôi muốn uống một ly trà sữa đá.',
      },
      {
        sentence: '你喝咖啡还是喝茶？',
        phonetic: 'Nǐ hē kāfēi háishì hē chá?',
        translation: 'Bạn uống cà phê hay uống trà?',
      },
    ],
    commonMistakes: 'Thanh 1 đọc cao và bằng phẳng (hē), không đọc nhấn mạnh như thanh 4.',
    usageNotes: 'Đi với các đồ uống: 喝水 (uống nước), 喝酒 (uống rượu).',
  },
  {
    title: '钱',
    phonetic: 'qián',
    level: 'HSK 1',
    radicalsOrOrigin: 'Bộ Kim (钅 - kim loại, vàng bạc) đứng trước.',
    memoryTrick: 'Tiền bạc thời xưa đúc bằng kim loại, vàng bạc quý giá (Bộ Kim 钅).',
    vietnameseMeaning: 'Tiền, tiền bạc, tài chính.',
    examples: [
      {
        sentence: '这个多少钱？',
        phonetic: 'Zhè ge duōshao qián?',
        translation: 'Cái này bao nhiêu tiền?',
      },
      {
        sentence: '太贵了，我没有那么多钱。',
        phonetic: 'Tài guì le, wǒ méiyǒu nàme duō qián.',
        translation: 'Đắt quá, tôi không có nhiều tiền như vậy.',
      },
    ],
    commonMistakes: 'Âm "q" là âm bật hơi mạnh ở mặt lưỡi, đọc là "qián" (bật luồng hơi rõ ràng).',
    usageNotes: 'Đơn vị tiền tệ khẩu ngữ thường dùng 块 (kuài) thay cho 元 (yuán).',
  },
];

const DEFAULT_ENGLISH_WORDS: VocabDetail[] = [
  {
    title: 'Resilient',
    phonetic: '/rɪˈzɪliənt/',
    level: 'B2 / IELTS 6.5+',
    radicalsOrOrigin: 'Nguồn gốc từ tiếng Latin "resilire" (nghĩa là bật trở lại, đàn hồi).',
    memoryTrick: 'Tưởng tượng quả bóng cao su khi ném xuống đất sẽ "bật nảy trở lại" mạnh mẽ hơn bao giờ hết.',
    vietnameseMeaning: 'Kiên cường, bất khuất, có khả năng phục hồi nhanh chóng sau thất bại hoặc nghịch cảnh.',
    examples: [
      {
        sentence: 'She remained resilient in the face of immense adversity.',
        phonetic: '/ʃiː rɪˈmeɪnd rɪˈzɪliənt ɪn ðə feɪs ʌv ɪˈmɛns ædˈvɜːrsəti/',
        translation: 'Cô ấy vẫn kiên cường khi đối mặt với vô vàn nghịch cảnh gian khó.',
      },
      {
        sentence: 'Our team needs to build a resilient cloud architecture.',
        phonetic: '/ˈaʊər tiːm niːdz tuː bɪld ə rɪˈzɪliənt klaʊd ˈɑːrkəˌtɛktʃər/',
        translation: 'Đội ngũ của chúng ta cần xây dựng một kiến trúc đám mây có khả năng tự phục hồi.',
      },
    ],
    commonMistakes: 'Chú ý phát âm âm "s" như âm /z/ chứ không phải /s/, và trọng âm rơi vào âm tiết thứ hai: re-ZI-lient.',
    usageNotes: 'Thường kết hợp với danh từ: resilient economy (nền kinh tế kiên cường), resilient system, resilient personality.',
  },
  {
    title: 'Serendipity',
    phonetic: '/ˌserənˈdɪpəti/',
    level: 'C1 / IELTS 7.5+',
    radicalsOrOrigin: 'Bắt nguồn từ câu chuyện cổ tích Ba hoàng tử xứ Serendip (tên cổ của Sri Lanka), những người luôn tình cờ phát hiện ra điều kỳ diệu.',
    memoryTrick: 'Một "duyên may bất ngờ" — khi bạn không chủ đích tìm kiếm mà lại tình cờ gặp được báu vật hoặc người tri kỷ.',
    vietnameseMeaning: 'Sự may mắn tình cờ, duyên may bất ngờ dẫn đến điều tốt đẹp.',
    examples: [
      {
        sentence: 'Meeting my co-founder in a coffee shop was pure serendipity.',
        phonetic: '/ˈmiːtɪŋ maɪ koʊ ˈfaʊndər ɪn ə ˈkɔːfi ʃɑːp wʌz pjʊr ˌserənˈdɪpəti/',
        translation: 'Gặp được người đồng sáng lập tại quán cà phê hoàn toàn là một duyên may kỳ diệu.',
      },
    ],
    commonMistakes: 'Trọng âm chính rơi vào âm tiết thứ 3: se-ren-DIP-i-ty (/ˈdɪp/).',
    usageNotes: 'Tính từ tương ứng là serendipitous (tình cờ may mắn).',
  },
  {
    title: 'Negotiate',
    phonetic: '/nəˈɡoʊʃieɪt/',
    level: 'B1 / TOEIC 700+',
    radicalsOrOrigin: 'Bắt nguồn từ gốc Latin "negotium" (kinh doanh, công việc thương mại).',
    memoryTrick: 'Hai bên ngồi lại với nhau bàn chuyện làm ăn "business", thương lượng để đạt mục tiêu chung.',
    vietnameseMeaning: 'Đàm phán, thương lượng, dàn xếp thỏa thuận.',
    examples: [
      {
        sentence: 'We managed to negotiate a fifteen percent discount on the software license.',
        phonetic: '/wiː ˈmænɪdʒd tuː nəˈɡoʊʃieɪt ə ˈfɪfˌtiːn pərˈsɛnt ˈdɪskaʊnt/',
        translation: 'Chúng tôi đã thương lượng thành công mức chiết khấu 15% cho bản quyền phần mềm.',
      },
    ],
    commonMistakes: 'Âm "ti" phát âm là /ʃ/ chứ không phải /t/, đọc là /nə-GOH-shee-ayt/.',
    usageNotes: 'Đi với giới từ "with" (người) hoặc "for/over" (điều khoản): negotiate with someone for a higher salary.',
  },
];

export const DictionaryView: React.FC<{ currentLang: LanguageCode }> = ({ currentLang }) => {
  const defaultWords = currentLang === 'en' ? DEFAULT_ENGLISH_WORDS : DEFAULT_CHINESE_WORDS;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWord, setActiveWord] = useState<VocabDetail>(defaultWords[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  React.useEffect(() => {
    const nextWords = currentLang === 'en' ? DEFAULT_ENGLISH_WORDS : DEFAULT_CHINESE_WORDS;
    setActiveWord(nextWords[0]);
    setSearchTerm('');
  }, [currentLang]);

  const handleSearch = async (termToSearch: string) => {
    const query = termToSearch || searchTerm;
    if (!query.trim()) return;

    playPopSound();
    setIsLoading(true);

    try {
      setLookupError(null);
      const res = await aiFetch('/api/ai/explain', {
        query: query.trim(),
        targetLanguage: currentLang,
        type: 'word',
      });

      if (res.ok) {
        const data = await res.json();
        setActiveWord(data);
        setIsFlipped(false);
      } else {
        setLookupError('Không tra được từ này lúc này. Vui lòng thử lại.');
      }
    } catch (e: any) {
      setLookupError(e?.message || 'Không kết nối được máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900/40 via-emerald-900/30 to-blue-900/40 p-6 sm:p-8 rounded-3xl border border-teal-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-3xl shrink-0">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">
                {currentLang === 'zh'
                  ? 'Tra Cứu Chữ Hán & Sổ Từ Thông Minh AI'
                  : 'Từ Điển Thông Minh & Giải Mã Từ Vựng Tiếng Anh AI'}
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                Deep Explainer
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {currentLang === 'zh'
                ? 'Phân tích chiết tự bộ thủ chữ Hán, mẹo nhớ từ bằng hình tượng, bính âm chuẩn và lỗi phát âm người Việt hay mắc.'
                : 'Phân tích nguồn gốc từ vựng (Etymology), phiên âm IPA chuẩn Mỹ, mẹo ghi nhớ siêu tốc, ví dụ thực tế và các lỗi người Việt hay mắc.'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
              placeholder={
                currentLang === 'zh'
                  ? 'Nhập chữ Hán hoặc từ vựng...'
                  : 'Nhập từ vựng tiếng Anh (VD: Resilient, Serendipity...)'
              }
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 pl-10 pr-3 py-2.5 rounded-2xl border border-slate-700 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => handleSearch(searchTerm)}
            disabled={isLoading || !searchTerm.trim()}
            className="px-4 py-2.5 rounded-2xl btn-tactile-green text-slate-950 font-bold text-xs disabled:opacity-40"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Tra'}
          </button>
        </div>
        {lookupError && <p role="alert" className="text-xs text-rose-300 mt-2">{lookupError}</p>}
      </div>

      {/* Suggested Quick Words */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Từ vựng tiêu biểu:
        </span>
        {defaultWords.map((w, idx) => (
          <button
            key={idx}
            onClick={() => {
              playPopSound();
              setActiveWord(w);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              currentLang === 'zh' ? 'font-chinese' : 'font-sans'
            } ${
              activeWord.title === w.title
                ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {w.title} ({w.phonetic})
          </button>
        ))}
      </div>

      {/* Detail Flashcard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Big Word Card */}
        <div className="lg:col-span-5 bg-slate-800/90 rounded-3xl p-8 border border-slate-700 shadow-2xl text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
            {activeWord.level || 'HSK'}
          </div>

          <h2
            className={`font-black text-white tracking-wide ${
              currentLang === 'zh' ? 'text-6xl sm:text-7xl font-chinese' : 'text-3xl sm:text-4xl font-sans'
            }`}
          >
            {activeWord.title}
          </h2>

          <p className="text-2xl font-bold text-teal-400 font-mono tracking-wider">
            {activeWord.phonetic}
          </p>

          <p className="text-base font-semibold text-slate-200">
            {activeWord.vietnameseMeaning}
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => speakNativeText(activeWord.title, currentLang, false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold transition-all"
            >
              <Volume2 className="w-4 h-4 text-teal-400" /> Nghe 1.0x
            </button>
            <button
              onClick={() => speakNativeText(activeWord.title, currentLang, true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs font-bold transition-all"
            >
              Nghe chậm 0.75x
            </button>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Radical & Origin */}
          {activeWord.radicalsOrOrigin && (
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                {currentLang === 'zh' ? 'Cấu Tạo Bộ Thủ (Radicals):' : 'Nguồn Gốc & Cấu Tạo Từ (Etymology):'}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {activeWord.radicalsOrOrigin}
              </p>
            </div>
          )}

          {/* Mnemonic Trick */}
          {activeWord.memoryTrick && (
            <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 rounded-2xl p-5 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                Mẹo Nhớ Từ Bằng Hình Tượng (Mnemonic):
              </div>
              <p className="text-sm text-emerald-100 leading-relaxed font-medium">
                {activeWord.memoryTrick}
              </p>
            </div>
          )}

          {/* Example Sentences */}
          {activeWord.examples && activeWord.examples.length > 0 && (
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Câu Ví Dụ Thực Tế:
                </span>
              </div>
              <div className="space-y-2.5">
                {activeWord.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p
                        className={`font-bold text-white text-sm ${
                          currentLang === 'zh' ? 'font-chinese' : 'font-sans'
                        }`}
                      >
                        {ex.sentence}
                      </p>
                      <p className="text-xs font-mono text-cyan-300 font-semibold">{ex.phonetic}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.translation}</p>
                    </div>
                    <button
                      onClick={() => speakNativeText(ex.sentence, currentLang)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {activeWord.commonMistakes && (
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-rose-500/30 text-xs space-y-1 text-slate-300">
              <span className="font-bold text-rose-400 uppercase">Lưu ý người Việt hay nhầm:</span>
              <p>{activeWord.commonMistakes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

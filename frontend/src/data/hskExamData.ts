import { HSK_EXTENDED_MOCK_EXAMS } from './hskAdvancedExams';

export interface HskLevelInfo {
  level: number;
  title: string;
  hanziTitle: string;
  vocabCount: number;
  grammarPoints: number;
  targetCefr: string;
  targetDescription: string;
  passingScore: string;
  examDuration: string;
  color: string;
  badge: string;
  coreGrammar: string[];
  examStructure: {
    section: string;
    questionsCount: number;
    duration: string;
    maxScore: number;
  }[];
  tips: string[];
}

export interface ExamQuestion {
  id: string;
  part: 'listening' | 'reading' | 'writing';
  partNameVi: string;
  questionNumber: number;
  type: 'true-false' | 'multiple-choice' | 'fill-blank' | 'reorder';
  audioPrompt?: string; // Text to be spoken natively by TTS
  pinyin?: string;
  promptText: string;
  promptVi?: string;
  imageIcon?: string;
  options?: { key: string; text: string; pinyin?: string; meaningVi?: string }[];
  wordsToReorder?: string[];
  correctAnswer: string;
  explanation: string;
  vocabularyTags: string[];
}

export interface HskMockExam {
  id: string;
  hskLevel: number;
  title: string;
  code: string;
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  passScore: number;
  description: string;
  questions: ExamQuestion[];
}

export const HSK_LEVELS_ROADMAP: HskLevelInfo[] = [
  {
    level: 1,
    title: 'HSK 1 - Nhập Môn Khởi Động',
    hanziTitle: '一级入门',
    vocabCount: 150,
    grammarPoints: 45,
    targetCefr: 'A1',
    targetDescription: 'Hiểu và sử dụng các từ ngữ, câu chào hỏi cực kỳ đơn giản; giao tiếp số đếm, gia đình, thời gian cơ bản.',
    passingScore: '120 / 200 điểm',
    examDuration: '40 phút (Nghe 20p + Đọc 17p + Điền thông tin 3p)',
    color: 'from-emerald-500 to-teal-600',
    badge: '🌱 Sơ Cấp 1',
    coreGrammar: [
      'Câu chữ "是" (shì - là) khẳng định và phủ định "不是"',
      'Trợ từ nghi vấn "吗" (ma) và "呢" (ne)',
      'Đại từ nghi vấn "什么" (gì), "谁" (ai), "哪儿" (ở đâu), "几/多少" (bao nhiêu)',
      'Trợ từ sở hữu "的" (de): 我的书 (Sách của tôi)',
      'Số đếm 1-100, cách nói ngày tháng năm, giờ giấc',
    ],
    examStructure: [
      { section: 'Nghe hiểu (听力)', questionsCount: 20, duration: '15 phút', maxScore: 100 },
      { section: 'Đọc hiểu (阅读)', questionsCount: 20, duration: '17 phút', maxScore: 100 },
    ],
    tips: [
      'HSK 1 đề bài có kèm toàn bộ Pinyin, hãy kết hợp nghe kỹ thanh điệu và đối chiếu mặt chữ.',
      'Chú ý các cặp số đếm và đại từ chỉ người: 我 (tôi), 你 (bạn), 他/她 (anh ấy/cô ấy).',
    ],
  },
  {
    level: 2,
    title: 'HSK 2 - Giao Tiếp Đời Sống',
    hanziTitle: '二级基础',
    vocabCount: 300,
    grammarPoints: 75,
    targetCefr: 'A2',
    targetDescription: 'Giao tiếp tốt các tình huống hàng ngày như mua sắm, gọi món, đi taxi, hỏi đường, đặt phòng khách sạn.',
    passingScore: '120 / 200 điểm',
    examDuration: '55 phút (Nghe 25p + Đọc 22p + Điền thông tin 5p)',
    color: 'from-blue-500 to-cyan-600',
    badge: '🌿 Sơ Cấp 2',
    coreGrammar: [
      'Câu so sánh chữ "比" (bǐ): 哥哥比我高 (Anh trai cao hơn tôi)',
      'Trợ động từ "能", "可以", "想", "要"',
      'Trợ từ trạng thái "了" (biến đổi/hoàn thành) và "过" (từng trải qua)',
      'Câu liên động chỉ mục đích: 去医院看病 (Đi bệnh viện khám bệnh)',
      'Cấu trúc "快要...了" (sắp... rồi) chỉ hành động sắp xảy ra',
    ],
    examStructure: [
      { section: 'Nghe hiểu (听力)', questionsCount: 35, duration: '25 phút', maxScore: 100 },
      { section: 'Đọc hiểu (阅读)', questionsCount: 25, duration: '22 phút', maxScore: 100 },
    ],
    tips: [
      'HSK 2 vẫn có Pinyin nhưng xuất hiện nhiều bẫy phủ định như "没/不", nghe kỹ từ khóa.',
      'Nắm chắc các phó từ chỉ mức độ: 很 (rất), 非常 (vô cùng), 太 (quá), 最 (nhất).',
    ],
  },
  {
    level: 3,
    title: 'HSK 3 - Tự Tin Giao Tiếp & Du Lịch',
    hanziTitle: '三级进阶',
    vocabCount: 600,
    grammarPoints: 120,
    targetCefr: 'B1',
    targetDescription: 'Có thể dùng tiếng Trung hoàn thành nhiệm vụ cơ bản trong học tập, công việc, du lịch khắp Trung Quốc.',
    passingScore: '180 / 300 điểm',
    examDuration: '90 phút (Nghe 35p + Đọc 30p + Viết 15p)',
    color: 'from-purple-500 to-indigo-600',
    badge: '🌲 Trung Cấp 1',
    coreGrammar: [
      'Câu chữ "把" (bǎ) xử lý tác động: 把门关上 (Đóng cửa lại)',
      'Câu chữ "被" (bèi) bị động: 钱包被偷了 (Ví tiền bị trộm rồi)',
      'Cấu trúc "越来越..." (càng ngày càng...) và "越...越..." (càng... càng...)',
      'Liên từ phức: 虽然...但是... (tuy... nhưng...), 不但...而且... (không những... mà còn...)',
      'Bổ ngữ kết quả (完, 懂, 到, 见) và bổ ngữ xu hướng (进, 出, 上, 下, 来, 去)',
    ],
    examStructure: [
      { section: 'Nghe hiểu (听力)', questionsCount: 40, duration: '35 phút', maxScore: 100 },
      { section: 'Đọc hiểu (阅读)', questionsCount: 30, duration: '30 phút', maxScore: 100 },
      { section: 'Viết (书写)', questionsCount: 10, duration: '15 phút', maxScore: 100 },
    ],
    tips: [
      'Từ HSK 3 đề bài HOÀN TOÀN KHÔNG CÒN PINYIN! Phải nhận diện mặt chữ Hán thuần thục.',
      'Phần viết có bài sắp xếp trật tự từ (连词成句), cần nắm vững cấu trúc Chủ - Vị - Tân.',
    ],
  },
  {
    level: 4,
    title: 'HSK 4 - Đàm Luận & Công Sở Trung Cấp',
    hanziTitle: '四级中级',
    vocabCount: 1200,
    grammarPoints: 180,
    targetCefr: 'B2',
    targetDescription: 'Có thể thảo luận lưu loát nhiều chủ đề rộng, đọc hiểu đoạn văn xã hội, giao tiếp tự nhiên với người bản ngữ.',
    passingScore: '180 / 300 điểm',
    examDuration: '105 phút (Nghe 30p + Đọc 40p + Viết 25p)',
    color: 'from-amber-500 to-orange-600',
    badge: '🔥 Trung Cấp 2',
    coreGrammar: [
      'Cấu trúc nhấn mạnh "连...也/都..." (ngay cả... cũng...)',
      'Phó từ nối logic cao cấp: 甚至 (thậm chí), 究竟 (rốt cuộc), 究竟 (rốt cuộc)',
      'Phân biệt các cặp từ gần nghĩa: 适合 vs 合适, 满足 vs 满意',
      'Viết đoạn văn ngắn 80-100 chữ miêu tả tranh ảnh và chủ đề tự luận',
    ],
    examStructure: [
      { section: 'Nghe hiểu (听力)', questionsCount: 45, duration: '30 phút', maxScore: 100 },
      { section: 'Đọc hiểu (阅读)', questionsCount: 40, duration: '40 phút', maxScore: 100 },
      { section: 'Viết (书写)', questionsCount: 15, duration: '25 phút', maxScore: 100 },
    ],
    tips: [
      'Tốc độ đọc phải đạt trên 80 chữ/phút để kịp thời gian phần Đọc hiểu 40 câu.',
      'Học thuộc các cụm thành ngữ 4 chữ thông dụng (成语) xuất hiện trong đề thi.',
    ],
  },
  {
    level: 5,
    title: 'HSK 5 - Đọc Báo & Đàm Phán Thương Mại',
    hanziTitle: '五级高级',
    vocabCount: 2500,
    grammarPoints: 240,
    targetCefr: 'C1',
    targetDescription: 'Đọc hiểu sách báo, tạp chí tiếng Trung, thưởng thức phim ảnh không cần phụ đề, viết bài luận văn chuyên nghiệp.',
    passingScore: '180 / 300 điểm',
    examDuration: '125 phút (Nghe 30p + Đọc 45p + Viết 40p)',
    color: 'from-rose-500 to-pink-600',
    badge: '👑 Cao Cấp 1',
    coreGrammar: [
      'Ngữ pháp văn viết (书面语) trang trọng thay cho khẩu ngữ',
      'Biểu đạt nguyên nhân, kết quả, giả thiết phức hợp: 既然...就..., 哪怕...也...',
      'Viết đoạn văn ngắn 80 chữ sử dụng 5 từ khóa cho sẵn đúng ngữ pháp',
    ],
    examStructure: [
      { section: 'Nghe hiểu (听力)', questionsCount: 45, duration: '30 phút', maxScore: 100 },
      { section: 'Đọc hiểu (阅读)', questionsCount: 45, duration: '45 phút', maxScore: 100 },
      { section: 'Viết (书写)', questionsCount: 10, duration: '40 phút', maxScore: 100 },
    ],
    tips: [
      'Bài nghe dài gồm các cuộc phỏng vấn và mẩu chuyện ngụ ngôn, vừa nghe vừa ghi chú từ khóa.',
      'Luyện kỹ năng Skimming (đọc lướt bắt ý chính) và Scanning (tìm chi tiết câu hỏi).',
    ],
  },
  {
    level: 6,
    title: 'HSK 6 - Bậc Thầy Ngôn Ngữ Bản Xứ',
    hanziTitle: '六级精通',
    vocabCount: 5000,
    grammarPoints: 320,
    targetCefr: 'C2',
    targetDescription: 'Dễ dàng hiểu và biểu đạt mọi thông tin bằng tiếng Trung cả văn nói và viết, diễn thuyết học thuật trôi chảy.',
    passingScore: '180 / 300 điểm',
    examDuration: '140 phút (Nghe 35p + Đọc 50p + Viết 45p)',
    color: 'from-yellow-400 to-amber-600',
    badge: '🏆 Bậc Thầy',
    coreGrammar: [
      'Phát hiện lỗi sai ngữ pháp câu (病句) - phần thi thử thách nhất',
      'Đọc nhanh văn bản 1.000 chữ trong 10 phút, sau đó tóm tắt lại 400 chữ từ trí nhớ',
      'Vận dụng thành thục thành ngữ cổ điển và điển tích văn hóa Trung Hoa',
    ],
    examStructure: [
      { section: 'Nghe hiểu (听力)', questionsCount: 50, duration: '35 phút', maxScore: 100 },
      { section: 'Đọc hiểu (阅读)', questionsCount: 50, duration: '50 phút', maxScore: 100 },
      { section: 'Viết (书写)', questionsCount: 1, duration: '45 phút', maxScore: 100 },
    ],
    tips: [
      'Phần tóm tắt văn bản 400 chữ: tuyệt đối ghi nhớ tên nhân vật, thời gian, biến cố và thông điệp.',
    ],
  },
];

export const HSK_MOCK_EXAMS: HskMockExam[] = [
  // --- ĐỀ THI THỬ HSK 1 ---
  {
    id: 'mock-hsk1-01',
    hskLevel: 1,
    title: 'Đề Thi Thử HSK 1 - Chuẩn Quốc Tế Đề Số 1',
    code: 'H11001',
    durationMinutes: 20,
    totalQuestions: 8,
    maxScore: 200,
    passScore: 120,
    description: 'Bộ đề thi thử HSK 1 mô phỏng đầy đủ 2 phần Nghe hiểu (听力) và Đọc hiểu (阅读) kèm audio bản xứ và giải thích chi tiết.',
    questions: [
      {
        id: 'h1-q1',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 1,
        type: 'true-false',
        audioPrompt: '他正在睡觉。',
        pinyin: 'Tā zhèngzài shuìjiào.',
        promptText: 'Nghe đoạn ghi âm và xác định câu sau là ĐÚNG (对) hay SAI (错) với ý nghĩa câu nói:',
        promptVi: 'Câu đối chiếu: "Anh ấy đang ngủ."',
        imageIcon: '😴',
        options: [
          { key: 'true', text: '对 (Đúng)', meaningVi: 'Khớp với nội dung ghi âm' },
          { key: 'false', text: '错 (Sai)', meaningVi: 'Không khớp với nội dung ghi âm' },
        ],
        correctAnswer: 'true',
        explanation: 'Audio đọc "他正在睡觉" (Tā zhèngzài shuìjiào - Anh ấy đang ngủ). Nghĩa hoàn toàn khớp với câu đối chiếu.',
        vocabularyTags: ['睡觉 (ngủ)', '正在 (đang)'],
      },
      {
        id: 'h1-q2',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 2,
        type: 'multiple-choice',
        audioPrompt: '我想喝一杯茶。',
        pinyin: 'Wǒ xiǎng hē yì bēi chá.',
        promptText: 'Nghe đoạn ghi âm và chọn hình ảnh/đồ vật người nói muốn dùng:',
        promptVi: 'Người nói muốn uống gì?',
        options: [
          { key: 'A', text: '🍵 茶 (Trà)', pinyin: 'Chá', meaningVi: 'Một chén trà thơm' },
          { key: 'B', text: '🍎 苹果 (Táo)', pinyin: 'Píngguǒ', meaningVi: 'Quả táo' },
          { key: 'C', text: '🍚 米饭 (Cơm)', pinyin: 'Mǐfàn', meaningVi: 'Bát cơm trắng' },
        ],
        correctAnswer: 'A',
        explanation: 'Audio nói: "我想喝一杯茶" (Wǒ xiǎng hē yì bēi chá - Tôi muốn uống một tách trà). Từ khóa là 茶 (chá - trà). Đáp án chính xác là A.',
        vocabularyTags: ['喝 (uống)', '茶 (trà)', '杯 (ly/cốc)'],
      },
      {
        id: 'h1-q3',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 3,
        type: 'multiple-choice',
        audioPrompt: '现在是下午三点十分。',
        pinyin: 'Xiànzài shì xiàwǔ sān diǎn shí fēn.',
        promptText: 'Nghe và xác định thời gian hiện tại được nhắc tới:',
        promptVi: 'Đồng hồ chỉ mấy giờ?',
        options: [
          { key: 'A', text: '03:10 PM', meaningVi: '3 giờ 10 phút chiều' },
          { key: 'B', text: '03:50 PM', meaningVi: '3 giờ 50 phút chiều' },
          { key: 'C', text: '10:03 AM', meaningVi: '10 giờ 3 phút sáng' },
        ],
        correctAnswer: 'A',
        explanation: '三点十分 (sān diǎn shí fēn) = 3 giờ 10 phút. 下午 (xiàwǔ) = buổi chiều. Đáp án A đúng.',
        vocabularyTags: ['现在 (bây giờ)', '点 (giờ)', '分 (phút)'],
      },
      {
        id: 'h1-q4',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 4,
        type: 'multiple-choice',
        promptText: 'Chọn từ thích hợp điền vào chỗ trống:',
        pinyin: 'Nǐ jīntiān xiàwǔ qù _____ ?',
        promptVi: '你今天下午去 _____ ？',
        options: [
          { key: 'A', text: '哪儿 (nǎr)', meaningVi: 'ở đâu / đâu' },
          { key: 'B', text: '谁 (shéi)', meaningVi: 'ai' },
          { key: 'C', text: '什么 (shénme)', meaningVi: 'cái gì' },
        ],
        correctAnswer: 'A',
        explanation: 'Động từ "去" (đi) chỉ phương hướng/địa điểm, nên đi cùng đại từ nghi vấn chỉ nơi chốn "哪儿" (nǎr): "你今天下午去哪儿？" (Chiều nay bạn đi đâu?).',
        vocabularyTags: ['去 (đi)', '哪儿 (ở đâu)'],
      },
      {
        id: 'h1-q5',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 5,
        type: 'true-false',
        promptText: 'Xác định hình ảnh và câu miêu tả có khớp nhau hay không:',
        pinyin: 'Tā men zài xuéxiào kàn shū.',
        promptVi: 'Họ đang đọc sách ở trường học: 📚 📖 (Hình: Hai học sinh đang mở sách)',
        options: [
          { key: 'true', text: '对 (Đúng)', meaningVi: 'Câu miêu tả chuẩn xác' },
          { key: 'false', text: '错 (Sai)', meaningVi: 'Câu miêu tả không đúng' },
        ],
        correctAnswer: 'true',
        explanation: '"看书" (kàn shū) có nghĩa là đọc sách. Hình ảnh minh họa việc đọc sách khớp 100% với câu văn.',
        vocabularyTags: ['看书 (đọc sách)', '学校 (trường học)'],
      },
      {
        id: 'h1-q6',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 6,
        type: 'multiple-choice',
        promptText: 'Chọn câu đáp lại hợp logic nhất cho câu hỏi:',
        pinyin: 'Qǐngwèn, zhè ge píngguǒ duōshao qián yì jīn?',
        promptVi: 'A: "请问，这个苹果多少钱一斤？" (Xin hỏi, táo này bao nhiêu tiền một cân?)',
        options: [
          { key: 'A', text: '五块钱。(Wǔ kuài qián.)', meaningVi: '5 tệ ạ.' },
          { key: 'B', text: '不客气。(Bú kèqi.)', meaningVi: 'Đừng khách sáo.' },
          { key: 'C', text: '我很好。(Wǒ hěn hǎo.)', meaningVi: 'Tôi rất khỏe.' },
        ],
        correctAnswer: 'A',
        explanation: 'Câu hỏi về giá tiền "多少钱" (duōshao qián - bao nhiêu tiền), đáp lại bằng đơn vị tiền tệ "五块钱" (5 tệ). Đáp án A chính xác.',
        vocabularyTags: ['多少钱 (bao nhiêu tiền)', '块 (tệ/đồng)'],
      },
      {
        id: 'h1-q7',
        part: 'writing',
        partNameVi: 'Phần 3: Luyện Câu (书写基础)',
        questionNumber: 7,
        type: 'reorder',
        promptText: 'Sắp xếp các từ xáo trộn thành câu hoàn chỉnh đúng ngữ pháp HSK 1:',
        promptVi: 'Ghép câu: [tôi] [là] [người Việt Nam]',
        wordsToReorder: ['是', '我', '越南人'],
        correctAnswer: '我是越南人',
        explanation: 'Trật tự câu cơ bản tiếng Trung: Chủ ngữ (我) + Vị ngữ (是) + Tân ngữ (越南人) ➔ "我是越南人" (Tôi là người Việt Nam).',
        vocabularyTags: ['我 (tôi)', '是 (là)', '越南人 (người Việt Nam)'],
      },
      {
        id: 'h1-q8',
        part: 'writing',
        partNameVi: 'Phần 3: Luyện Câu (书写基础)',
        questionNumber: 8,
        type: 'reorder',
        promptText: 'Sắp xếp các từ sau thành câu mời mọc lễ phép:',
        promptVi: 'Ghép câu: [mời] [bạn] [uống trà]',
        wordsToReorder: ['喝茶', '请', '你'],
        correctAnswer: '请你喝茶',
        explanation: 'Cấu trúc câu cầu khiến lịch sự: 请 (qǐng - mời) + Đối tượng (你) + Hành động (喝茶) ➔ "请你喝茶" (Mời bạn dùng trà).',
        vocabularyTags: ['请 (mời)', '喝茶 (uống trà)'],
      },
    ],
  },

  // --- ĐỀ THI THỬ HSK 2 ---
  {
    id: 'mock-hsk2-01',
    hskLevel: 2,
    title: 'Đề Thi Thử HSK 2 - Chuẩn Quốc Tế Đề Số 1',
    code: 'H21001',
    durationMinutes: 25,
    totalQuestions: 8,
    maxScore: 200,
    passScore: 120,
    description: 'Bộ đề thi thử HSK 2 gồm câu so sánh chữ 比, bổ ngữ kết quả, giao tiếp nhà hàng & mua sắm.',
    questions: [
      {
        id: 'h2-q1',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 1,
        type: 'true-false',
        audioPrompt: '今天天气很冷，外面正在下雪。',
        pinyin: 'Jīntiān tiānqì hěn lěng, wàimiàn zhèngzài xià xuě.',
        promptText: 'Nghe đoạn ghi âm và xác định câu đối chiếu sau là Đúng hay Sai:',
        promptVi: 'Câu đối chiếu: "Hôm nay trời ấm áp, có nắng."',
        imageIcon: '❄️',
        options: [
          { key: 'true', text: '对 (Đúng)', meaningVi: 'Đúng với audio' },
          { key: 'false', text: '错 (Sai)', meaningVi: 'Sai so với audio' },
        ],
        correctAnswer: 'false',
        explanation: 'Audio nói: "今天天气很冷，外面正在下雪" (Hôm nay trời rất lạnh, bên ngoài tuyết đang rơi). Câu đối chiếu bảo ấm áp có nắng là SAI (错).',
        vocabularyTags: ['下雪 (tuyết rơi)', '天气 (thời tiết)', '冷 (lạnh)'],
      },
      {
        id: 'h2-q2',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 2,
        type: 'multiple-choice',
        audioPrompt: '服务员，请给我拿两张纸巾，谢谢。',
        pinyin: 'Fúwùyuán, qǐng gěi wǒ ná liǎng zhāng zhǐjīn, xièxie.',
        promptText: 'Nghe và chọn đồ vật khách hàng cần người phục vụ mang đến:',
        promptVi: 'Khách hàng yêu cầu gì?',
        options: [
          { key: 'A', text: '🧻 纸巾 (Khăn giấy)', meaningVi: '2 tờ khăn giấy' },
          { key: 'B', text: '🥢 筷子 (Đũa)', meaningVi: 'Đôi đũa ăn' },
          { key: 'C', text: '🥤 水果汁 (Nước hoa quả)', meaningVi: 'Ly nước ép' },
        ],
        correctAnswer: 'A',
        explanation: '"纸巾" (zhǐjīn) là khăn giấy, lượng từ là "张" (zhāng). Đáp án A là đúng.',
        vocabularyTags: ['纸巾 (khăn giấy)', '服务员 (phục vụ)'],
      },
      {
        id: 'h2-q3',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 3,
        type: 'multiple-choice',
        promptText: 'Chọn từ so sánh đúng điền vào chỗ trống:',
        pinyin: 'Gēge _____ wǒ dà sān suì.',
        promptVi: '哥哥 _____ 我大三岁。 (Anh trai lớn hơn tôi 3 tuổi)',
        options: [
          { key: 'A', text: '比 (bǐ)', meaningVi: 'So với / hơn' },
          { key: 'B', text: '跟 (gēn)', meaningVi: 'Cùng với' },
          { key: 'C', text: '从 (cóng)', meaningVi: 'Từ (địa điểm)' },
        ],
        correctAnswer: 'A',
        explanation: 'Cấu trúc câu so sánh hơn trong tiếng Trung: A + 比 + B + Tính từ + Mức độ chênh lệch. ➔ 哥哥比我大三岁 (Anh trai lớn hơn tôi 3 tuổi).',
        vocabularyTags: ['比 (so sánh chữ bǐ)', '岁 (tuổi)'],
      },
      {
        id: 'h2-q4',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 4,
        type: 'multiple-choice',
        promptText: 'Chọn câu trả lời phù hợp cho đối thoại sau:',
        pinyin: 'A: Nǐ shēntǐ hǎo diǎnr le ma? B: _____',
        promptVi: 'A: "你身体好点儿了吗？" (Sức khỏe bạn đỡ hơn chút nào chưa?)',
        options: [
          { key: 'A', text: '好多了，吃了药已经不发烧了。(Hǎo duō le, chī le yào yǐjīng bù fāshāo le.)', meaningVi: 'Đỡ nhiều rồi, uống thuốc xong đã hết sốt.' },
          { key: 'B', text: '没关系，下次再来吧。(Méi guānxi, xià cì zài lái ba.)', meaningVi: 'Không sao, lần sau lại đến.' },
          { key: 'C', text: '太贵了，能不能便宜点？(Tài guì le, néng bu néng piányi diǎn?)', meaningVi: 'Đắt quá, bớt chút được không?' },
        ],
        correctAnswer: 'A',
        explanation: 'Hỏi thăm về sức khỏe ân cần, câu đáp lại hợp logic nhất là A: "Đỡ nhiều rồi, uống thuốc xong không còn sốt nữa".',
        vocabularyTags: ['身体 (sức khỏe)', '吃药 (uống thuốc)', '发烧 (sốt)'],
      },
      {
        id: 'h2-q5',
        part: 'writing',
        partNameVi: 'Phần 3: Sắp Xếp Câu (连词成句)',
        questionNumber: 5,
        type: 'reorder',
        promptText: 'Sắp xếp thành câu đúng cấu trúc câu chữ "比" (so sánh):',
        promptVi: 'Ghép câu: [Táo] [so với] [dưa hấu] [ngọt]',
        wordsToReorder: ['西瓜', '苹果', '甜', '比'],
        correctAnswer: '西瓜比苹果甜',
        explanation: 'Cấu trúc: A + 比 + B + Adj ➔ "西瓜比苹果甜" (Dưa hấu ngọt hơn táo) hoặc "苹果比西瓜甜".',
        vocabularyTags: ['比 (hơn)', '甜 (ngọt)', '西瓜 (dưa hấu)'],
      },
      {
        id: 'h2-q6',
        part: 'writing',
        partNameVi: 'Phần 3: Sắp Xếp Câu (连词成句)',
        questionNumber: 6,
        type: 'reorder',
        promptText: 'Sắp xếp thành câu hoàn chỉnh chỉ hành động đã từng xảy ra (chữ 过):',
        promptVi: 'Ghép câu: [Tôi] [chưa từng đi qua] [Bắc Kinh]',
        wordsToReorder: ['没去过', '我', '北京'],
        correctAnswer: '我没去过北京',
        explanation: 'Cấu trúc phủ định với trợ từ trạng thái "过": Chủ ngữ + 没 + Động từ + 过 + Tân ngữ ➔ "我没去过北京" (Tôi chưa từng đến Bắc Kinh).',
        vocabularyTags: ['过 (từng)', '没去过 (chưa từng đi)'],
      },
      {
        id: 'h2-q7',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 7,
        type: 'multiple-choice',
        promptText: 'Điền liên từ chỉ nguyên nhân kết quả thích hợp:',
        pinyin: '_____ jīntiān xiàyǔ, _____ wǒmen bú qù tī zúqiú le.',
        promptVi: '_____ 今天下雨，_____ 我们不去踢足球了。',
        options: [
          { key: 'A', text: '因为... 所以... (yīnwèi... suǒyǐ...)', meaningVi: 'Bởi vì... cho nên...' },
          { key: 'B', text: '虽然... 但是... (suīrán... dànshì...)', meaningVi: 'Mặc dù... nhưng mà...' },
          { key: 'C', text: '不但... 而且... (búdàn... érqiě...)', meaningVi: 'Không những... mà còn...' },
        ],
        correctAnswer: 'A',
        explanation: 'Quan hệ nguyên nhân - kết quả: "Bởi vì hôm nay trời mưa, cho nên chúng tôi không đi đá bóng nữa" ➔ dùng cặp liên từ "因为... 所以...".',
        vocabularyTags: ['因为 (bởi vì)', '所以 (cho nên)', '踢足球 (đá bóng)'],
      },
      {
        id: 'h2-q8',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 8,
        type: 'multiple-choice',
        audioPrompt: '火车站离这里不远，走路十分钟就到了。',
        pinyin: 'Huǒchēzhàn lí zhèlǐ bù yuǎn, zǒulù shí fēnzhōng jiù dào le.',
        promptText: 'Nghe và cho biết ga xe lửa cách đây bao xa:',
        promptVi: 'Phương thức và thời gian đến ga tàu?',
        options: [
          { key: 'A', text: 'Đi bộ khoảng 10 phút', meaningVi: '走路十分钟' },
          { key: 'B', text: 'Đi taxi mất 1 tiếng', meaningVi: '坐出租车一个小时' },
          { key: 'C', text: 'Rất xa, không thể đi bộ', meaningVi: '非常远' },
        ],
        correctAnswer: 'A',
        explanation: 'Audio đọc: "火车站离这里不远，走路十分钟就到了" (Ga xe lửa cách đây không xa, đi bộ 10 phút là tới rồi). Đáp án A chính xác.',
        vocabularyTags: ['火车站 (ga xe lửa)', '离 (cách)', '走路 (đi bộ)'],
      },
    ],
  },

  // --- ĐỀ THI THỬ HSK 3 ---
  {
    id: 'mock-hsk3-01',
    hskLevel: 3,
    title: 'Đề Thi Thử HSK 3 - Đột Phá Trung Cấp Đề Số 1',
    code: 'H31001',
    durationMinutes: 30,
    totalQuestions: 8,
    maxScore: 300,
    passScore: 180,
    description: 'Bộ đề thi HSK 3 loại bỏ Pinyin, rèn luyện cấu trúc câu chữ 把, chữ 被, liên từ kép và đọc hiểu đoạn văn.',
    questions: [
      {
        id: 'h3-q1',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 1,
        type: 'multiple-choice',
        audioPrompt: '小王，请把这份文件打印三份，下午开会要用。',
        pinyin: 'Xiǎo Wáng, qǐng bǎ zhè fèn wénjiàn dǎyìn sān fèn, xiàwǔ kāihuì yào yòng.',
        promptText: 'Nghe audio và trả lời câu hỏi: Người nói yêu cầu Tiểu Vương làm gì?',
        promptVi: 'Yêu cầu của người nói là gì?',
        options: [
          { key: 'A', text: 'In 3 bản tài liệu để chiều họp', meaningVi: '把文件打印三份' },
          { key: 'B', text: 'Gửi email cho khách hàng', meaningVi: '给客户发邮件' },
          { key: 'C', text: 'Hủy cuộc họp buổi chiều', meaningVi: '取消下午的会议' },
        ],
        correctAnswer: 'A',
        explanation: 'Audio đọc: "小王，请把这份文件打印三份，下午开会要用" (Tiểu Vương, hãy in tài liệu này làm 3 bản, buổi chiều họp cần dùng). Đáp án A đúng.',
        vocabularyTags: ['把 (câu chữ bǎ)', '打印 (in ấn)', '开会 (họp)'],
      },
      {
        id: 'h3-q2',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 2,
        type: 'multiple-choice',
        promptText: 'Chọn câu có cấu trúc chữ 把 (xử lý đối tượng) đúng ngữ pháp:',
        promptVi: 'Chọn câu đúng chuẩn ngữ pháp chữ 把:',
        options: [
          { key: 'A', text: '请你把门关上。(Qǐng nǐ bǎ mén guān shàng.)', meaningVi: 'Xin bạn hãy đóng cửa lại.' },
          { key: 'B', text: '请你关门把。(Qǐng nǐ guān mén bǎ.)', meaningVi: 'Sai vị trí chữ 把' },
          { key: 'C', text: '门把你关上。(Mén bǎ nǐ guān shàng.)', meaningVi: 'Cửa đóng bạn lại (vô nghĩa)' },
        ],
        correctAnswer: 'A',
        explanation: 'Cấu trúc câu chữ 把: Chủ ngữ + 把 + Tân ngữ tác động + Động từ + Thành phần khác/Bổ ngữ (关上) ➔ "请你把门关上". Đáp án A đúng.',
        vocabularyTags: ['把字句 (câu chữ bǎ)', '关上 (đóng lại)'],
      },
      {
        id: 'h3-q3',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 3,
        type: 'multiple-choice',
        promptText: 'Điền từ thích hợp vào chỗ trống trong đoạn văn:',
        promptVi: '他中文说得越来越流利，_____ 他每天都坚持练习一个小时。',
        options: [
          { key: 'A', text: '因为 (yīnwèi)', meaningVi: 'Bởi vì' },
          { key: 'B', text: '如果 (rúguǒ)', meaningVi: 'Nếu như' },
          { key: 'C', text: '虽然 (suīrán)', meaningVi: 'Mặc dù' },
        ],
        correctAnswer: 'A',
        explanation: 'Mệnh đề sau giải thích nguyên nhân cho việc nói tiếng Trung lưu loát ở mệnh đề trước, dùng "因为" (yīnwèi - bởi vì). Đáp án A đúng.',
        vocabularyTags: ['越来越 (càng ngày càng)', '坚持 (kiên trì)'],
      },
      {
        id: 'h3-q4',
        part: 'writing',
        partNameVi: 'Phần 3: Viết & Sắp Xếp (书写)',
        questionNumber: 4,
        type: 'reorder',
        promptText: 'Sắp xếp các từ thành câu bị động với chữ 被 (bèi):',
        promptVi: 'Ghép câu: [Táo] [bị] [em trai] [ăn hết rồi]',
        wordsToReorder: ['吃完了', '被', '苹果', '弟弟'],
        correctAnswer: '苹果被弟弟吃完了',
        explanation: 'Cấu trúc câu bị động chữ 被: Đối tượng chịu tác động (苹果) + 被 + Chủ thể gây ra (弟弟) + Động từ + Bổ ngữ (吃完了) ➔ "苹果被弟弟吃完了".',
        vocabularyTags: ['被字句 (câu chữ bèi)', '吃完 (ăn xong/hết)'],
      },
      {
        id: 'h3-q5',
        part: 'writing',
        partNameVi: 'Phần 3: Viết & Sắp Xếp (书写)',
        questionNumber: 5,
        type: 'reorder',
        promptText: 'Sắp xếp câu chứa cấu trúc "越来越..." (càng ngày càng...):',
        promptVi: 'Ghép câu: [Thời tiết] [càng ngày càng] [lạnh rồi]',
        wordsToReorder: ['冷了', '越来越', '天气'],
        correctAnswer: '天气越来越冷了',
        explanation: 'Chủ ngữ (天气) + 越来越 + Tính từ (冷了) ➔ "天气越来越冷了" (Thời tiết càng ngày càng lạnh rồi).',
        vocabularyTags: ['越来越 (càng ngày càng)', '冷 (lạnh)'],
      },
      {
        id: 'h3-q6',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 6,
        type: 'multiple-choice',
        promptText: 'Đọc đoạn văn ngắn và trả lời câu hỏi:',
        promptVi: '"张经理平时工作很忙，经常加班。但是不管多忙，他每个周末都会抽出时间陪家人去公园散步。"\n\nCâu hỏi: Trương kinh lý làm gì vào mỗi cuối tuần?',
        options: [
          { key: 'A', text: 'Dành thời gian đi dạo công viên cùng gia đình', meaningVi: '陪家人去公园散步' },
          { key: 'B', text: 'Tiếp tục ở công ty tăng ca suốt ngày đêm', meaningVi: '在公司加班' },
          { key: 'C', text: 'Đi công tác xa nhà', meaningVi: '去外地出差' },
        ],
        correctAnswer: 'A',
        explanation: 'Đoạn văn nói rõ: "每个周末都会抽出时间陪家人去公园散步" (Mỗi cuối tuần đều dành thời gian cùng gia đình đi dạo công viên). Đáp án A chính xác.',
        vocabularyTags: ['不管...都... (cho dù... đều...)', '加班 (tăng ca)', '陪 (đồng hành/cùng)'],
      },
      {
        id: 'h3-q7',
        part: 'listening',
        partNameVi: 'Phần 1: Nghe Hiểu (听力)',
        questionNumber: 7,
        type: 'multiple-choice',
        audioPrompt: '真奇怪，我的手机刚才还在桌子上，怎么一眨眼就不见了？',
        pinyin: 'Zhēn qíguài, wǒ de shǒujī gāngcái hái zài zhuōzi shàng, zěnme yì zhǎ yǎn jiù bú jiàn le?',
        promptText: 'Nghe đoạn ghi âm và cho biết người nói đang tìm đồ vật gì:',
        promptVi: 'Đồ vật bị thất lạc là gì?',
        options: [
          { key: 'A', text: '📱 手机 (Điện thoại)', meaningVi: 'Điện thoại di động' },
          { key: 'B', text: '🔑 钥匙 (Chìa khóa)', meaningVi: 'Chùm chìa khóa' },
          { key: 'C', text: '💳 钱包 (Ví tiền)', meaningVi: 'Cái ví tiền' },
        ],
        correctAnswer: 'A',
        explanation: 'Từ khóa trong audio: "我的手机刚才还在桌子上" (Điện thoại của tôi vừa nãy còn ở trên bàn). Đáp án A là điện thoại (手机).',
        vocabularyTags: ['手机 (điện thoại)', '刚才 (vừa nãy)', '奇怪 (kỳ lạ)'],
      },
      {
        id: 'h3-q8',
        part: 'reading',
        partNameVi: 'Phần 2: Đọc Hiểu (阅读)',
        questionNumber: 8,
        type: 'multiple-choice',
        promptText: 'Chọn từ điền vào chỗ trống thích hợp nhất:',
        promptVi: '这道数学题太难了，我做了半天也做不 _____。',
        options: [
          { key: 'A', text: '出来 (chūlai - ra kết quả)', meaningVi: 'Bổ ngữ khả năng làm không ra' },
          { key: 'B', text: '进去 (jìnqu - vào trong)', meaningVi: 'Vào trong' },
          { key: 'C', text: '起来 (qǐlai - đứng dậy)', meaningVi: 'Đứng dậy' },
        ],
        correctAnswer: 'A',
        explanation: 'Cụm bổ ngữ khả năng chỉ giải quyết bài toán ra kết quả: "做不出来" (làm không ra / không giải được). Đáp án A đúng.',
        vocabularyTags: ['做不出来 (không giải ra)', '数学题 (bài toán)'],
      },
    ],
  },
  ...HSK_EXTENDED_MOCK_EXAMS,
];

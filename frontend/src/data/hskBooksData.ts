export interface BookLessonUnit {
  unitNumber: number;
  title: string;
  chineseTitle: string;
  summaryVi: string;
  keyVocab: string[];
  keyGrammar: string[];
  readingText: {
    title: string;
    chinese: string;
    pinyin: string;
    vietnamese: string;
  };
}

export interface HskBookItem {
  id: string;
  title: string;
  chineseTitle: string;
  author: string;
  publisher: string;
  hskLevel: number | string; // 1, 2, 3, 4, 5, 6 or '1-6'
  badge: string;
  category: 'standard' | 'han-ngu' | 'exam-prep' | 'grammar' | 'business';
  categoryNameVi: string;
  coverGradient: string;
  coverIcon: string;
  rating: number;
  reviewsCount: number;
  description: string;
  targetAudience: string;
  totalLessons: number;
  keyHighlights: string[];
  units: BookLessonUnit[];
  studyTips: string[];
}

export const HSK_BOOKS_CATALOG: HskBookItem[] = [
  // ==========================================
  // SÁCH 1: GIÁO TRÌNH CHUẨN HSK 1 (HSK 1 标准教程)
  // ==========================================
  {
    id: 'book-hsk1-standard',
    title: 'Giáo Trình Chuẩn HSK 1 (Kèm Audio & Khóa Văn)',
    chineseTitle: 'HSK 1 标准教程 (HSK Standard Course 1)',
    author: 'Khương Lệ Bình (姜丽萍 - Jiang Liping)',
    publisher: 'NXB Đại học Ngôn ngữ Bắc Kinh (BLCU Press)',
    hskLevel: 1,
    badge: 'Giáo Trình Bộ GD Trung Quốc',
    category: 'standard',
    categoryNameVi: 'Giáo trình Chuẩn HSK',
    coverGradient: 'from-amber-600 via-orange-600 to-rose-700',
    coverIcon: '📘',
    rating: 4.9,
    reviewsCount: 1420,
    description: 'Bộ giáo trình chuẩn mực hàng đầu thế giới được xây dựng bám sát 100% định dạng đề thi HSK 1 thật. Kết hợp hài hòa giữa phát âm Pinyin, chữ Hán căn bản, ngữ pháp vỡ lòng và hội thoại sinh hoạt đời sống.',
    targetAudience: 'Người mới bắt đầu từ số 0, học viên chuẩn bị thi lấy chứng chỉ HSK 1.',
    totalLessons: 15,
    keyHighlights: [
      'Bám sát 150 từ vựng cốt lõi HSK 1 và 45 cấu trúc ngữ pháp bắt buộc.',
      'Toàn bộ bài học đều có phiên âm Pinyin, chữ Hán phông chữ chuẩn khảo thí.',
      'Khóa văn (bài đọc) đời sống: Chào hỏi, mua sắm hoa quả, hỏi giờ, gọi món ăn.',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Bài 1: Xin Chào',
        chineseTitle: '第1课：你好',
        summaryVi: 'Học cách chào hỏi cơ bản, ngôi nhân xưng và quy tắc thanh điệu tiếng Hán.',
        keyVocab: ['你 (nǐ - bạn)', '好 (hǎo - tốt/chào)', '您 (nín - ngài/ông)', '你们 (nǐmen - các bạn)'],
        keyGrammar: ['Câu chào hỏi: 你好！/ 您好！', 'Biến điệu thanh 3 (hai thanh 3 đi liền nhau)'],
        readingText: {
          title: 'Hội thoại chào hỏi lần đầu gặp gỡ',
          chinese: 'A: 你好！\nB: 你好！\nA: 您好，请问您贵姓？\nB: 我姓王，叫王小林。',
          pinyin: 'A: Nǐ hǎo!\nB: Nǐ hǎo!\nA: Nín hǎo, qǐngwèn nín guìxìng?\nB: Wǒ xìng Wáng, jiào Wáng Xiǎolín.',
          vietnamese: 'A: Xin chào bạn!\nB: Xin chào bạn!\nA: Chào ngài, xin hỏi ngài mang quý tính gì ạ?\nB: Tôi họ Vương, tên là Vương Tiểu Lâm.',
        },
      },
      {
        unitNumber: 2,
        title: 'Bài 2: Cảm Ơn Bạn',
        chineseTitle: '第2课：谢谢你',
        summaryVi: 'Cách cảm ơn, xin lỗi và đáp lại một cách lịch sự, nhã nhặn.',
        keyVocab: ['谢谢 (xièxie - cảm ơn)', '不客气 (bú kèqi - đừng khách khí)', '对不起 (duìbuqǐ - xin lỗi)', '没关系 (méi guānxi - không sao)'],
        keyGrammar: ['Cụm từ cảm ơn và hồi đáp: 谢谢 ➔ 不客气', 'Cụm từ xin lỗi và hồi đáp: 对不起 ➔ 没关系'],
        readingText: {
          title: 'Hội thoại cảm ơn và xin lỗi',
          chinese: 'A: 谢谢你帮助我！\nB: 不客气，这是我应该做的。\nA: 对不起，我迟到了。\nB: 没关系，请进！',
          pinyin: 'A: Xièxie nǐ bāngzhù wǒ!\nB: Bú kèqi, zhè shì wǒ yīnggāi zuò de.\nA: Duìbuqǐ, wǒ chídào le.\nB: Méi guānxi, qǐng jìn!',
          vietnamese: 'A: Cảm ơn bạn đã giúp đỡ tôi!\nB: Đừng khách sáo, đây là việc tôi nên làm mà.\nA: Xin lỗi, tôi đến muộn rồi.\nB: Không sao đâu, mời bạn vào!',
        },
      },
      {
        unitNumber: 3,
        title: 'Bài 3: Bạn Tên Là Gì?',
        chineseTitle: '第3课：你叫什么名字？',
        summaryVi: 'Hỏi tên họ, quốc tịch và làm quen với bạn bè quốc tế.',
        keyVocab: ['叫 (jiào - tên là)', '什么 (shénme - cái gì)', '名字 (míngzi - tên)', '国 (guó - nước/quốc gia)'],
        keyGrammar: ['Câu hỏi đại từ nghi vấn: 什么 + Danh từ?', 'Câu chữ 是: 我是越南人。'],
        readingText: {
          title: 'Hỏi tên và quốc tịch',
          chinese: 'A: 你好，你叫什么名字？\nB: 我叫李明。你呢？\nA: 我叫阮文安，我是越南人。你是中国人吗？\nB: 是的，我是北京人。',
          pinyin: 'A: Nǐ hǎo, nǐ jiào shénme míngzi?\nB: Wǒ jiào Lǐ Míng. Nǐ ne?\nA: Wǒ jiào Ruǎn Wén’ān, wǒ shì Yuènán rén. Nǐ shì Zhōngguó rén ma?\nB: Shì de, wǒ shì Běijīng rén.',
          vietnamese: 'A: Xin chào, bạn tên là gì?\nB: Tôi tên là Lý Minh. Còn bạn?\nA: Tôi tên là Nguyễn Văn An, tôi là người Việt Nam. Bạn là người Trung Quốc phải không?\nB: Đúng vậy, tôi là người Bắc Kinh.',
        },
      },
      {
        unitNumber: 4,
        title: 'Bài 4: Cô Ấy Là Giáo Viên Của Tôi',
        chineseTitle: '第4课：她是我的汉语老师',
        summaryVi: 'Diễn đạt quan hệ sở hữu bằng chữ 的, giới thiệu nghề nghiệp và tuổi tác.',
        keyVocab: ['她 (tā - cô ấy)', '谁 (shéi - ai)', '的 (de - của)', '老师 (lǎoshī - giáo viên)'],
        keyGrammar: ['Trợ từ kết cấu 的 biểu thị sở hữu: Định ngữ + 的 + Trung tâm ngữ', 'Đại từ nghi vấn 谁 (ai)'],
        readingText: {
          title: 'Giới thiệu cô giáo tiếng Hán',
          chinese: 'A: 那个高高的女老师是谁？\nB: 她是我的汉语老师，她姓陈。\nA: 她今年多大了？\nB: 她今年三十三岁，人非常温和。',
          pinyin: 'A: Nà ge gāogāo de nǚ lǎoshī shì shéi?\nB: Tā shì wǒ de hànyǔ lǎoshī, tā xìng Chén.\nA: Tā jīnnián duō dà le?\nB: Tā jīnnián sānshísān suì, rén fēicháng wēnhé.',
          vietnamese: 'A: Cô giáo dáng cao cao kia là ai vậy?\nB: Cô ấy là giáo viên dạy tiếng Trung của tôi, cô ấy họ Trần.\nA: Năm nay cô ấy bao nhiêu tuổi rồi?\nB: Năm nay cô ấy 33 tuổi, tính tình rất đỗi hiền hòa.',
        },
      },
    ],
    studyTips: [
      'Giai đoạn HSK 1 cần luyện chuẩn xác thanh mẫu, vận mẫu và 4 thanh điệu.',
      'Mỗi ngày nghe lặp lại audio khóa văn ít nhất 3 lần để tai nhạy bén với âm điệu bản xứ.',
      'Tập viết 150 chữ Hán căn bản theo đúng quy tắc thuận bút (trên trước dưới sau, trái trước phải sau).',
    ],
  },

  // ==========================================
  // SÁCH 2: GIÁO TRÌNH CHUẨN HSK 2 (HSK 2 标准教程)
  // ==========================================
  {
    id: 'book-hsk2-standard',
    title: 'Giáo Trình Chuẩn HSK 2 (Giao Tiếp Đời Sống Thực Tế)',
    chineseTitle: 'HSK 2 标准教程 (HSK Standard Course 2)',
    author: 'Khương Lệ Bình (姜丽萍 - Jiang Liping)',
    publisher: 'NXB Đại học Ngôn ngữ Bắc Kinh (BLCU Press)',
    hskLevel: 2,
    badge: 'Chuẩn Khảo Thí Quốc Tế',
    category: 'standard',
    categoryNameVi: 'Giáo trình Chuẩn HSK',
    coverGradient: 'from-orange-600 via-emerald-600 to-teal-700',
    coverIcon: '📗',
    rating: 4.9,
    reviewsCount: 1180,
    description: 'Nối tiếp HSK 1, giáo trình HSK 2 mở rộng giao tiếp đi lại bằng máy bay/tàu hỏa, mua sắm mặc cả, so sánh chữ 比 và các hoạt động thể thao giữ gìn sức khỏe.',
    targetAudience: 'Học viên đã hoàn thành HSK 1 hoặc tương đương 150 từ vựng.',
    totalLessons: 15,
    keyHighlights: [
      'Bổ sung 150 từ vựng mới nâng tổng số vốn từ lên 300 từ chuẩn HSK 2.',
      'Luyện sâu câu so sánh chữ 比, bổ ngữ kết quả, cấu trúc快要...了.',
      'Tình huống thực tế: Đi sân bay, kiểm tra sức khỏe ở bệnh viện, mua quần áo.',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Bài 1: Tháng 9 Đến Bắc Kinh Du Lịch Là Đẹp Nhất',
        chineseTitle: '第1课：九月去北京旅游最好',
        summaryVi: 'Học cách bày tỏ sở thích, mùa trong năm, khí hậu và dùng phó từ 最 (nhất).',
        keyVocab: ['旅游 (lǚyóu - du lịch)', '觉得 (juéde - cảm thấy)', '最 (zuì - nhất)', '为什么 (wèishénme - tại sao)'],
        keyGrammar: ['Phó từ chỉ mức độ cao nhất: 最 + Tính từ/Động từ tâm lý', 'Trợ từ cấu trúc 要...了 (sắp... rồi)'],
        readingText: {
          title: 'Bàn luận về thời điểm du lịch Bắc Kinh',
          chinese: 'A: 我想去北京旅游，你觉得几月去最好？\nB: 九月去北京最好。\nA: 为什么？\nB: 因为九月的北京天气不冷也不热，秋高气爽。',
          pinyin: 'A: Wǒ xiǎng qù Běijīng lǚyóu, nǐ juéde jǐ yuè qù zuì hǎo?\nB: Jiǔ yuè qù Běijīng zuì hǎo.\nA: Wèishénme?\nB: Yīnwèi jiǔ yuè de Běijīng tiānqì bù lěng yě bú rè, qiūgāo-qìshuǎng.',
          vietnamese: 'A: Tôi muốn đi Bắc Kinh du lịch, bạn thấy đi vào tháng mấy là tốt nhất?\nB: Tháng chín đến Bắc Kinh là đẹp nhất.\nA: Vì sao vậy?\nB: Bởi vì thời tiết Bắc Kinh tháng chín không lạnh cũng không nóng, trời thu trong xanh thoáng đãng.',
        },
      },
      {
        unitNumber: 2,
        title: 'Bài 2: Tôi Mỗi Ngày Đều 6 Giờ Thức Dậy',
        chineseTitle: '第2课：我每天六点起床',
        summaryVi: 'Nói về thói quen sinh hoạt hàng ngày, rèn luyện thân thể và dùng chữ 比 so sánh.',
        keyVocab: ['生病 (shēngbìng - ốm)', '跑步 (pǎobù - chạy bộ)', '起床 (qǐchuáng - thức dậy)', '药 (yào - thuốc)'],
        keyGrammar: ['Câu so sánh cơ bản: A 比 B + Tính từ', 'Trợ từ động thái 着 chỉ trạng thái tiếp diễn'],
        readingText: {
          title: 'Hỏi thăm sức khỏe và tập thể dục',
          chinese: 'A: 你生病了，好点儿了吗？\nB: 吃了药，现在感觉比昨天好多了。\nA: 以后要多运动，我每天早晨跑步半小时。\nB: 是啊，健康比什么都重要。',
          pinyin: 'A: Nǐ shēngbìng le, hǎo diǎnr le ma?\nB: Chī le yào, xiànzài gǎnjué bǐ zuótiān hǎo duō le.\nA: Yǐhòu yào duō yùndòng, wǒ měitiān zǎochén pǎobù bàn xiǎoshí.\nB: Shì a, jiànkāng bǐ shénme dōu zhòngyào.',
          vietnamese: 'A: Bạn bị ốm, đã đỡ hơn chút nào chưa?\nB: Đã uống thuốc rồi, bây giờ cảm thấy khỏe hơn hôm qua nhiều rồi.\nA: Sau này cần vận động nhiều hơn, mỗi sáng tôi đều chạy bộ nửa tiếng.\nB: Đúng vậy, sức khỏe quan trọng hơn bất cứ thứ gì.',
        },
      },
    ],
    studyTips: [
      'HSK 2 bắt đầu xuất hiện nhiều bẫy từ nối liên từ, chú ý cặp 因为...所以... và 虽然...但是...',
      'Luyện nghe phân biệt phản xạ các con số giờ giấc, giá tiền tệ (块/元).',
    ],
  },

  // ==========================================
  // SÁCH 3: GIÁO TRÌNH CHUẨN HSK 3 (HSK 3 标准教程)
  // ==========================================
  {
    id: 'book-hsk3-standard',
    title: 'Giáo Trình Chuẩn HSK 3 (Bước Đột Phá Bỏ Pinyin)',
    chineseTitle: 'HSK 3 标准教程 (HSK Standard Course 3)',
    author: 'Khương Lệ Bình (姜丽萍 - Jiang Liping)',
    publisher: 'NXB Đại học Ngôn ngữ Bắc Kinh (BLCU Press)',
    hskLevel: 3,
    badge: 'Chuyển Tiếp Trung Cấp',
    category: 'standard',
    categoryNameVi: 'Giáo trình Chuẩn HSK',
    coverGradient: 'from-emerald-700 via-teal-700 to-cyan-800',
    coverIcon: '📕',
    rating: 4.9,
    reviewsCount: 960,
    description: 'Cột mốc quan trọng nhất: Sách loại bỏ hoàn toàn phiên âm Pinyin trong đề thi, học viên rèn luyện nhận diện trực tiếp chữ Hán, câu chữ 把, câu chữ 被 và khả năng đọc hiểu đoạn văn phức hợp.',
    targetAudience: 'Học viên nắm vững 300 từ vựng HSK 2, hướng tới 600 từ vựng HSK 3.',
    totalLessons: 20,
    keyHighlights: [
      'Luyện đọc chữ Hán thuần túy, nâng cao tốc độ nhận diện mặt chữ.',
      'Làm chủ cấu trúc câu chữ 把 (xử lý) và chữ 被 (bị động) - 2 trọng điểm thi.',
      'Bổ ngữ xu hướng kép (跑出来, 走过去) và bổ ngữ khả năng (做不完, 听不懂).',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Bài 1: Cuối Tuần Bạn Có Kế Hoạch Gì?',
        chineseTitle: '第1课：周末你有什么打算？',
        summaryVi: 'Lên kế hoạch du lịch, bàn chuyện đi chơi và dùng cấu trúc liên từ kép.',
        keyVocab: ['打算 (dǎsuàn - dự định)', '一直 (yìzhí - luôn luôn)', '游戏 (yóuxì - trò chơi)', '作业 (zuòyè - bài tập)'],
        keyGrammar: ['Cấu trúc biểu thị dự tính: 打算 + Động từ', 'Phó từ 一直 chỉ hành động liên tục'],
        readingText: {
          title: 'Kế hoạch cuối tuần của Tiểu Cương và Tiểu Lệ',
          chinese: '小丽：周末你有什么打算？\n小刚：我早就想好了，请你吃饭、看电影、喝咖啡。\n小丽：请我？你不是说周末要在家复习考试吗？\n小刚：考试已经考完了，现在应该好好放松一下！',
          pinyin: 'Xiǎolì: Zhōumò nǐ yǒu shénme dǎsuàn?\nXiǎogāng: Wǒ zǎo jiù xiǎng hǎo le, qǐng nǐ chīfàn, kàn diànyǐng, hē kāfēi.\nXiǎolì: Qǐng wǒ? Nǐ bú shì shuō zhōumò yào zài jiā fùxí kǎoshì ma?\nXiǎogāng: Kǎoshì yǐjīng kǎo wán le, xiànzài yīnggāi hǎohāo fàngsōng yíxià!',
          vietnamese: 'Tiểu Lệ: Cuối tuần bạn có dự định gì chưa?\nTiểu Cương: Tôi đã tính sẵn từ sớm rồi, mời bạn đi ăn cơm, xem phim và uống cà phê.\nTiểu Lệ: Mời tôi á? Không phải bạn bảo cuối tuần phải ở nhà ôn thi sao?\nTiểu Cương: Thi cử đã thi xong xuôi rồi, giờ là lúc nên thư giãn một chút!',
        },
      },
      {
        unitNumber: 2,
        title: 'Bài 2: Hãy Đem Tài Liệu Này In Làm Ba Bản',
        chineseTitle: '第2课：请把这份文件打印三份',
        summaryVi: 'Luyện câu chữ 把 xử lý đối tượng công việc văn phòng.',
        keyVocab: ['把 (bǎ - câu chữ bǎ)', '打印 (dǎyìn - in ấn)', '复印 (fùyìn - photo)', '合同 (hétong - hợp đồng)'],
        keyGrammar: ['Cấu trúc câu chữ 把: Chủ ngữ + 把 + Tân ngữ + Động từ + Bổ ngữ'],
        readingText: {
          title: 'Phân công công việc văn phòng',
          chinese: '张经理：小王，请把这份新合同打印三份，下午开会要用。\n小王：好的经理，我已经检查过条款了，马上打印出来给您。\n张经理：还有，把桌子上的会议室钥匙交给李秘书。\n小王：明白，我这就去办。',
          pinyin: 'Zhāng jīnglǐ: Xiǎo Wáng, qǐng bǎ zhè fèn xīn hétong dǎyìn sān fèn, xiàwǔ kāihuì yào yòng.\nXiǎo Wáng: Hǎo de jīnglǐ, wǒ yǐjīng jiǎnchá guò tiáokuǎn le, mǎshàng dǎyìn chūlái gěi nín.\nZhāng jīnglǐ: Hái yǒu, bǎ zhuōzi shàng de huìyìshì yàoshi jiāogěi Lǐ mìshū.\nXiǎo Wáng: Míngbai, wǒ zhè jiù qù bàn.',
          vietnamese: 'Giám đốc Trương: Tiểu Vương, hãy đem bản hợp đồng mới này in làm 3 bản, buổi chiều họp cần dùng.\nTiểu Vương: Vâng thưa giám đốc, tôi đã kiểm tra các điều khoản rồi, in ra xong sẽ gửi giám đốc ngay ạ.\nGiám đốc Trương: Còn nữa, hãy đem chìa khóa phòng họp trên bàn giao cho thư ký Lý nhé.\nTiểu Vương: Tôi rõ rồi, tôi đi làm ngay đây ạ.',
        },
      },
    ],
    studyTips: [
      'Gặp chữ Hán mới cần tra cứu các bộ thủ để ghi nhớ theo logic hình thanh, hội ý.',
      'Luyện tập ghép câu đảo trật tự từ để thuần thục câu chữ 把 và chữ 被.',
    ],
  },

  // ==========================================
  // SÁCH 4: GIÁO TRÌNH CHUẨN HSK 4 (THƯỢNG & HẠ)
  // ==========================================
  {
    id: 'book-hsk4-standard',
    title: 'Giáo Trình Chuẩn HSK 4 (Thượng & Hạ - Giao Tiếp Trung Cấp)',
    chineseTitle: 'HSK 4 标准教程 上下册 (HSK Standard Course 4 Vol 1 & 2)',
    author: 'Khương Lệ Bình (姜丽萍 - Jiang Liping)',
    publisher: 'NXB Đại học Ngôn ngữ Bắc Kinh (BLCU Press)',
    hskLevel: 4,
    badge: 'Chìa Khóa Du Học & Việc Làm',
    category: 'standard',
    categoryNameVi: 'Giáo trình Chuẩn HSK',
    coverGradient: 'from-blue-700 via-indigo-700 to-purple-800',
    coverIcon: '📘',
    rating: 5.0,
    reviewsCount: 880,
    description: 'Bộ sách bản lề mở ra cánh cửa du học đại học Trung Quốc và làm việc tại các doanh nghiệp FDI. Nâng lượng từ vựng lên 1.200 từ, rèn luyện kỹ năng viết câu, nghị luận xã hội và phỏng vấn xin việc.',
    targetAudience: 'Học sinh, sinh viên chuẩn bị xin học bổng CSC/CIS, người đi làm công ty Trung Quốc.',
    totalLessons: 20,
    keyHighlights: [
      '1.200 từ vựng và các cấu trúc câu phức: 不但...而且..., 无论...都..., 对...来说.',
      'Phần thi Viết (书写) chuyên sâu: Sắp xếp câu hoàn chỉnh và viết câu miêu tả tranh.',
      'Các chủ đề công sở: Phỏng vấn xin việc, đàm phán hợp đồng, văn hóa doanh nghiệp.',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Bài 1: Tình Yêu Đơn Giản Mà Đẹp Đẽ',
        chineseTitle: '第1课：简单的爱情',
        summaryVi: 'Bàn luận về tình yêu, hôn nhân, sự thấu hiểu và sẻ chia trong cuộc sống.',
        keyVocab: ['法律 (fǎlǜ - pháp luật)', '俩 (liǎ - hai người)', '印象 (yìnxiàng - ấn tượng)', '熟悉 (shúxī - quen thuộc)'],
        keyGrammar: ['Cấu trúc biểu thị ấn tượng: 给...留下深刻的印象', 'Phó từ 不仅... 也...'],
        readingText: {
          title: 'Bí quyết hạnh phúc của cặp vợ chồng già',
          chinese: '真正的爱情并不需要轰轰烈烈，而是在平淡生活中的相互扶持。孙爷爷和老伴结婚五十多年了，他们很少吵架。孙爷爷说：“两个人在一起，最重要的不是谁赚的钱多，而是遇到困难时能共同面对，互相体谅。”',
          pinyin: 'Zhēnzhèng de àiqíng bìng bù xūyào hōnghōng-lièliè, ér shì zài píngdàn shēnghuó zhōng de xiānghù fúchí. Sūn yéye hé lǎobàn jiéhūn wǔshí duō nián le, tāmen hěn shǎo chǎojià. Sūn yéye shuō: “Liǎng ge rén zài yìqǐ, zuì zhòngyào de bú shì shéi zhuàn de qián duō, ér shì yùdào kùnnan shí néng gòngtóng miànduì, hùxiāng tǐliàng.”',
          vietnamese: 'Tình yêu đích thực vốn không cần phải kinh thiên động địa, mà là sự nâng đỡ lẫn nhau trong cuộc sống bình dị. Ông Tôn và vợ kết hôn đã hơn 50 năm, họ rất ít khi cãi vã. Ông Tôn nói: “Hai người ở bên nhau, điều quan trọng nhất không phải ai kiếm nhiều tiền hơn, mà là khi gặp khó khăn có thể cùng nhau đối mặt, thấu hiểu bao dung cho nhau.”',
        },
      },
      {
        unitNumber: 2,
        title: 'Bài 2: Bí Quyết Phỏng Vấn Tuyển Dụng',
        chineseTitle: '第2课：面试求职的技巧',
        summaryVi: 'Cách trả lời câu hỏi nhà tuyển dụng, thể hiện năng lực chuyên môn và sự tự tin.',
        keyVocab: ['招聘 (zhāopìn - tuyển dụng)', '提供 (tígōng - cung cấp)', '负责 (fùzé - phụ trách/trách nhiệm)', '应聘 (yìngpìn - ứng tuyển)'],
        keyGrammar: ['Cấu trúc: 哪怕... 也...', 'Liên từ: 按照 (căn cứ theo/chiếu theo)'],
        readingText: {
          title: 'Kinh nghiệm phỏng vấn tại tập đoàn quốc tế',
          chinese: '在面试过程中，除了扎实的专业能力之外，良好的心理素质和沟通技巧同样至关重要。面试官往往会提出一些突发情况，考察应聘者的临场应变能力。保持微笑、逻辑清晰、诚恳作答，往往能给面试官留下极佳的第一印象。',
          pinyin: 'Zài miànshì guòchéng zhōng, chúle zhāshi de zhuānyè nénglì zhīwài, liánghǎo de xīnlǐ sùzhì hé gōutōng jìqiǎo tóngyàng zhìguān zhòngyào. Miànshìguān wǎngwǎng huì tíchū yìxiē tūfā qíngkuàng, kǎochá yìngpìnzhě de línchǎng yìngbiàn nénglì. Bǎochí wēixiào, luóji qīngxī, chéngkěn zuòdá, wǎngwǎng néng gěi miànshìguān liúxià jí jiā de dì-yī yìnxiàng.',
          vietnamese: 'Trong quá trình phỏng vấn, bên cạnh năng lực chuyên môn vững vàng, tố chất tâm lý tốt và kỹ năng giao tiếp cũng quan trọng không kém. Người phỏng vấn thường đưa ra những tình huống phát sinh đột ngột nhằm kiểm tra khả năng ứng biến tại chỗ của ứng viên. Giữ nụ cười, tư duy mạch lạc logic, trả lời chân thành thường sẽ để lại ấn tượng đầu tiên cực kỳ xuất sắc.',
        },
      },
    ],
    studyTips: [
      'HSK 4 phần Đọc hiểu (阅读) có 40 câu trong 40 phút, phải luyện kỹ năng đọc lướt tìm từ khóa (Skimming/Scanning).',
      'Luyện viết câu mô tả tranh: luôn chú ý dùng câu chữ 把 hoặc câu so sánh để tối đa điểm ngữ pháp.',
    ],
  },

  // ==========================================
  // SÁCH 5: GIÁO TRÌNH CHUẨN HSK 5 (CAO CẤP THƯƠNG MẠI)
  // ==========================================
  {
    id: 'book-hsk5-standard',
    title: 'Giáo Trình Chuẩn HSK 5 (Đọc Báo, Văn Nghị Luận & Kinh Tế)',
    chineseTitle: 'HSK 5 标准教程 上下册 (HSK Standard Course 5 Vol 1 & 2)',
    author: 'Khương Lệ Bình (姜丽萍 - Jiang Liping)',
    publisher: 'NXB Đại học Ngôn ngữ Bắc Kinh (BLCU Press)',
    hskLevel: 5,
    badge: 'Chuẩn Thạc Sĩ & Đàm Phán',
    category: 'standard',
    categoryNameVi: 'Giáo trình Chuẩn HSK',
    coverGradient: 'from-purple-800 via-indigo-900 to-slate-900',
    coverIcon: '📙',
    rating: 4.9,
    reviewsCount: 740,
    description: 'Giáo trình HSK 5 trang bị vốn từ 2.500 từ vựng chuyên sâu giúp người học đọc báo chí Trung Quốc (Tân Hoa Xã, Nhân Dân Nhật Báo), đàm phán thương mại, xem thời sự truyền hình và viết bài luận 80 chữ.',
    targetAudience: 'Ứng viên học bổng Thạc sĩ/Tiến sĩ Trung Quốc, chuyên viên phiên dịch, quản lý cấp cao.',
    totalLessons: 36,
    keyHighlights: [
      '2.500 từ vựng và hệ thống thành ngữ 4 chữ (成语) thông dụng trong văn viết.',
      'Phần thi Viết luận 80 chữ: Viết đoạn văn theo 5 từ cho trước và miêu tả tranh nghị luận.',
      'Đọc hiểu các chủ đề khoa học, sinh thái, tâm lý học, lịch sử và triết học nhân sinh.',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Bài 1: Sức Mạnh Của Sự Kiên Trì',
        chineseTitle: '第1课：坚持的力量',
        summaryVi: 'Nghị luận về tâm lý vượt khó, tính tự kỷ luật và quy luật tích lũy lượng biến thành chất biến.',
        keyVocab: ['坚韧 (jiānrèn - kiên cường dẻo dai)', '挫折 (cuòzhé - trắc trở/thất bại)', '核心 (héxīn - cốt lõi)', '潜能 (qiánnéng - tiềm năng)'],
        keyGrammar: ['Cấu trúc nghị luận: 鉴于... 从而...', 'Liên từ: 哪怕... 也...'],
        readingText: {
          title: 'Triết lý cây tre và quy luật trưởng thành',
          chinese: '竹子用了四年时间，仅仅长了三厘米。但从第五年开始，以每天三十厘米的速度疯狂生长，仅仅用六周时间就能长到十五米。前面的四年，它在土壤深处把根扎了数百米。做人做事何尝不是如此？所谓的成功，不过是在无人问津时的默默积蓄与厚积薄发。',
          pinyin: 'Zhúzi yòng le sì nián shíjiān, jǐnjǐn zhǎng le sān límǐ. Dàn cóng dì-wǔ nián kāishǐ, yǐ měitiān sānshí límǐ de sùdù fēngkuáng shēngzhǎng, jǐnjǐn yòng liù zhōu shíjiān jiù néng zhǎng dào shíwǔ mǐ. Qiánmiàn de sì nián, tā zài tǔrǎng shēnchù bǎ gēn zhā le shù bǎi mǐ. Zuòrén zuòshì hécháng bù shì rúcǐ? Suǒwèi de chénggōng, búguò shì zài wú rén wènjīn shí de mòmò jīxù yǔ hòujī-bófā.',
          vietnamese: 'Cây tre phải mất bốn năm chỉ để nhú lên ba centimet. Nhưng bắt đầu từ năm thứ năm, nó sinh trưởng với tốc độ kinh ngạc ba mươi centimet mỗi ngày, chỉ mất sáu tuần đã cao tới mười lăm mét. Trong bốn năm đầu tiên, nó đã cắm bộ rễ sâu hàng trăm mét vào lòng đất. Con người làm việc há chẳng phải cũng như vậy sao? Cái gọi là thành công, chẳng qua là sự âm thầm tích lũy khi chưa ai biết tới để rồi tích đủ công phu thì bộc phát rực rỡ.',
        },
      },
    ],
    studyTips: [
      'Mỗi ngày học 5 thành ngữ HSK 5 và tra rõ điển cố ngữ cảnh sử dụng.',
      'Luyện viết đoạn văn 80 chữ: Phải liên kết chặt chẽ cả 5 từ đề bài cho thành một câu chuyện có mở - thân - kết.',
    ],
  },

  // ==========================================
  // SÁCH 6: BỘ GIÁO TRÌNH HÁN NGỮ 6 TẬP (MSUTONG / BLCU)
  // ==========================================
  {
    id: 'book-hanngu-6tap',
    title: 'Bộ Giáo Trình Hán Ngữ 6 Quyển (Kinh Điển ĐH Ngoại Ngữ)',
    chineseTitle: '汉语教程（修订本）共六册',
    author: 'Dương Ký Châu (杨寄洲 - Yang Jizhou)',
    publisher: 'NXB Đại học Ngôn ngữ Bắc Kinh (BLCU Press)',
    hskLevel: '1-6',
    badge: 'Giáo Trình Giảng Dạy Quốc Dân',
    category: 'han-ngu',
    categoryNameVi: 'Giáo trình Hán ngữ Kinh điển',
    coverGradient: 'from-rose-800 via-red-800 to-amber-900',
    coverIcon: '📚',
    rating: 4.8,
    reviewsCount: 3200,
    description: 'Bộ sách "gối đầu giường" của hàng triệu sinh viên chuyên ngành tiếng Trung tại các trường Đại học lớn tại Việt Nam (ĐH Hà Nội, ĐH KHXH&NV, ĐH Ngoại ngữ). Hệ thống bài bản từ ngữ âm, từ vựng, ngữ pháp chi tiết đến văn hóa Trung Hoa.',
    targetAudience: 'Người học tiếng Trung bài bản, học sinh sinh viên chuyên ngữ, người tự học dài hạn.',
    totalLessons: 100,
    keyHighlights: [
      'Gồm 6 tập: Quyển 1 (Thượng/Hạ), Quyển 2 (Thượng/Hạ), Quyển 3 (Thượng/Hạ).',
      'Hệ thống chú giải ngữ pháp tỉ mỉ, chi tiết nhất trong các bộ giáo trình tiếng Hán.',
      'Bài tập dịch Việt - Trung và Trung - Việt đa dạng rèn luyện dịch thuật thực chiến.',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Quyển 1 - Bài 1: Ngữ Âm Cơ Bản (Thanh Mẫu & Vận Mẫu)',
        chineseTitle: '第一册 第1课：语音基础',
        summaryVi: 'Hệ thống bảng chữ cái Pinyin, phân biệt b/p, d/t, g/k và các thanh điệu.',
        keyVocab: ['爸爸 (bàba - bố)', '妈妈 (māma - mẹ)', '哥哥 (gēge - anh trai)', '弟弟 (dìdi - em trai)'],
        keyGrammar: ['Quy tắc phát âm thanh nhẹ', 'Quy tắc viết dấu thanh điệu'],
        readingText: {
          title: 'Luyện âm thanh điệu gia đình',
          chinese: '这是我爸爸，那是妈妈。这是哥哥，那是弟弟。我们是一家人，大家都很幸福。',
          pinyin: 'Zhè shì wǒ bàba, nà shì māma. Zhè shì gēge, nà shì dìdi. Wǒmen shì yì jiā rén, dàjiā dōu hěn xìngfú.',
          vietnamese: 'Đây là bố tôi, kia là mẹ tôi. Đây là anh trai, kia là em trai. Chúng tôi là một gia đình, mọi người đều rất đỗi hạnh phúc.',
        },
      },
    ],
    studyTips: [
      'Học kỹ phần bài khóa và bài tập thay thế từ ngữ để tăng phản xạ nói trôi chảy.',
      'Kết hợp làm các bài tập dịch xuôi - dịch ngược trong sách bài tập.',
    ],
  },

  // ==========================================
  // SÁCH 7: 21 NGÀY CHINH PHỤC HSK (CHUYÊN ĐỀ ĐỀ THI)
  // ==========================================
  {
    id: 'book-21-days-hsk',
    title: '21 Ngày Chinh Phục HSK Cấp Tốc (Bí Kíp Đột Phá Điểm Số)',
    chineseTitle: '21天征服HSK专项突破系列',
    author: 'Trịnh Lệ Kiệt (郑丽杰 - Zheng Lijie)',
    publisher: 'NXB Đại học Bắc Kinh (Peking University Press)',
    hskLevel: '3-5',
    badge: 'Luyện Thi Cấp Tốc',
    category: 'exam-prep',
    categoryNameVi: 'Sách Luyện Thi Thực Chiến',
    coverGradient: 'from-red-700 via-rose-700 to-amber-700',
    coverIcon: '⚡',
    rating: 4.9,
    reviewsCount: 1650,
    description: 'Cuốn sách luyện thi "thần tốc" được thiết kế theo lộ trình 21 ngày biểu đồ khoa học: 7 ngày chinh phục Nghe hiểu (听力), 7 ngày đột phá Đọc hiểu (阅读), 7 ngày làm chủ Viết (书写) và luyện đề tổng hợp.',
    targetAudience: 'Người chuẩn bị thi HSK trong vòng 1-2 tháng cần tăng tốc điểm số tối đa.',
    totalLessons: 21,
    keyHighlights: [
      'Bóc trần 100% các bẫy thường gặp của hội đồng khảo thí HSK quốc tế.',
      'Mẹo bắt từ khóa (Keywords) trong bài nghe hiểu chỉ sau 3 giây đầu tiên.',
      'Chiến lược phân bổ thời gian làm bài thi chuẩn xác từng phút tránh bị thiếu giờ.',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Tuần 1: Nghệ Thuật Bắt Từ Khóa Nghe Hiểu (听力抓词)',
        chineseTitle: '第一周：听力核心抓词技巧',
        summaryVi: 'Phương pháp đọc trước 4 đáp án A, B, C, D để đoán trước chủ đề hội thoại.',
        keyVocab: ['抓关键词 (bắt từ khóa)', '排除法 (phương pháp loại trừ)', '转折连词 (liên từ chuyển ý)'],
        keyGrammar: ['Kỹ thuật nghe chuyển ý: Nhưng mà (但是/不过/其实) phía sau mới là đáp án thật!'],
        readingText: {
          title: 'Quy tắc nghe bẫy phủ định',
          chinese: '在听力考试中，说话人前半句往往肯定，后半句突然出现“其实”、“不过”或者“原本”，此时一定要集中注意力，因为真正的意图往往落在转折连词之后。',
          pinyin: 'Zài tīnglì kǎoshì zhōng, shuōhuàrén qián bàn jù wǎngwǎng kěndìng, hòu bàn jù tūrán chūxiàn “qíshí”, “búguò” huòzhě “yuánběn”, cǐshí yídìng yào jízhōng zhùyìlì, yīnwèi zhēnzhèng de yìtú wǎngwǎng luò zài zhuǎnzhé liáncí zhīhòu.',
          vietnamese: 'Trong bài thi nghe hiểu, người nói nửa câu đầu thường khẳng định, nhưng nửa câu sau đột ngột xuất hiện "kỳ thực", "có điều" hoặc "vốn dĩ", lúc này nhất định phải tập trung cao độ, bởi vì ý đồ thực sự luôn nằm ở phía sau liên từ chuyển ý.',
        },
      },
    ],
    studyTips: [
      'Tuyệt đối không dịch thầm sang tiếng Việt trong đầu khi làm bài nghe.',
      'Dành 30 giây thời gian nghỉ giữa các đoạn audio để quét nhanh đáp án của câu tiếp theo.',
    ],
  },
];

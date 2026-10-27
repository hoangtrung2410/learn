import { Unit } from '../types';
import { BookJson, BookLessonMeta, SbtJson, buildLesson, buildSbt } from './newHskBuilder';
import sbt1Json from './newHsk/sbt1.json';
import sbt2Json from './newHsk/sbt2.json';
import sbt3Json from './newHsk/sbt3.json';
import hsk1Json from './newHsk/hsk1.json';
import hsk2Json from './newHsk/hsk2.json';
import hsk3Json from './newHsk/hsk3.json';


// Lộ trình học bám sát mục lục "Giáo trình New HSK" (新HSK教程) cấp 1-3:
// HSK1 = 15 bài, HSK2 = 15 bài, HSK3 = 18 bài; mỗi 3 bài là một chặng (khớp phần "Tổng kết học tập" của sách).

type BookLesson = BookLessonMeta;

const L = (zh: string, py: string, vi: string, tokens: string[] | null, grammar: string[]): BookLesson => ({
  zh, py, vi, tokens, grammar,
});

const HSK1: BookLesson[] = [
  L('AI小语，你好！', 'AI Xiǎoyǔ, nǐ hǎo!', 'Xin chào AI Tiểu Ngữ!', null, ['Lời chào 你好 và xưng hô lịch sự 您']),
  L('我叫李文', 'Wǒ jiào Lǐ Wén', 'Mình tên là Lý Văn', ['我', '叫', '李文'], ['Trật tự từ cơ bản của câu tiếng Trung']),
  L('我是中国人', 'Wǒ shì Zhōngguó rén', 'Mình là người Trung Quốc', ['我', '是', '中国', '人'], ['Câu chữ 是', 'Trợ từ kết cấu 的', 'Câu hỏi với 吗']),
  L('我有两个孩子', 'Wǒ yǒu liǎng gè háizi', 'Chị có hai con', ['我', '有', '两个', '孩子'], ['Câu chữ 有 (1)', 'Cách diễn đạt các con số', 'Trợ từ ngữ khí 呢 (1)', 'Danh lượng từ và cấu trúc danh lượng']),
  L('今天我休息', 'Jīntiān wǒ xiūxi', 'Hôm nay anh được nghỉ', ['今天', '我', '休息'], ['Cách diễn đạt thời gian (1)', 'Câu vị ngữ danh từ', 'Động từ năng nguyện 会']),
  L('你的手机号是多少？', 'Nǐ de shǒujī hào shì duōshao?', 'Số điện thoại di động của bạn là bao nhiêu?', ['你的', '手机号', '是', '多少'], ['Động từ năng nguyện 想', 'Câu liên động (1)', 'Đại từ nghi vấn 怎么']),
  L('我晚上六点半下班', 'Wǒ wǎnshang liù diǎn bàn xiàbān', 'Em tan làm lúc 6 rưỡi tối', ['我', '晚上', '六点半', '下班'], ['Cách diễn đạt thời gian (2)', 'Trợ từ ngữ khí 吧 (1)', 'Vị trí của phó từ, từ chỉ thời gian làm trạng ngữ', 'Trợ từ ngữ khí 呢 (2)']),
  L('我爸爸也在医院工作', 'Wǒ bàba yě zài yīyuàn gōngzuò', 'Bố em cũng làm việc ở bệnh viện', ['我', '爸爸', '也', '在', '医院', '工作'], ['Phương vị từ', 'Giới từ 在', 'Động từ năng nguyện 能']),
  L('我明天上午在学校学习', 'Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí', 'Sáng mai mình học ở trường', ['我', '明天', '上午', '在', '学校', '学习'], ['Câu tồn hiện (1)', 'Trật tự trạng ngữ thời gian và nơi chốn', 'Số thứ tự 第']),
  L('这儿的苹果真便宜！', 'Zhèr de píngguǒ zhēn piányi!', 'Táo ở đây rẻ thật!', ['这儿的', '苹果', '真', '便宜'], ['Cách diễn đạt số tiền', 'Câu vị ngữ tính từ', 'Đại từ nghi vấn 怎么样']),
  L('我读大学呢', 'Wǒ dú dàxué ne', 'Em đang học đại học', ['我', '读', '大学', '呢'], ['Câu hỏi chính phản', 'Phó từ thời gian 在/正在', 'Động từ năng nguyện 要']),
  L('昨天下雪了', 'Zuótiān xià xuě le', 'Hôm qua tuyết rơi rồi', ['昨天', '下雪', '了'], ['Câu phi chủ vị', 'Trợ từ ngữ khí 了 (1)', 'Cấu trúc 太……了']),
  L('请给我一杯茶', 'Qǐng gěi wǒ yì bēi chá', 'Cho tôi một cốc trà', ['请', '给', '我', '一杯', '茶'], ['Động từ năng nguyện 可以', 'Cấu trúc động từ + 一下', 'Câu có hai tân ngữ (1)']),
  L('我看了一个电影', 'Wǒ kàn le yí gè diànyǐng', 'Mình đã xem một bộ phim', ['我', '看了', '一个', '电影'], ['Trợ từ động thái 了 (2)', 'Từ li hợp (1)', 'Phó từ chỉ phạm vi 都']),
  L('大兴机场见！', 'Dàxīng Jīchǎng jiàn!', 'Hẹn gặp ở sân bay Đại Hưng!', null, ['Câu ghép đẳng lập “……，还/也……”']),
];

const HSK2: BookLesson[] = [
  L('她请我们吃了北京烤鸭', 'Tā qǐng wǒmen chī le Běijīng kǎoyā', 'Chị ấy đã mời chúng em ăn vịt quay Bắc Kinh', ['她', '请', '我们', '吃了', '北京烤鸭'], ['Trợ từ ngữ khí 吧 (2)', 'Câu “是……的”', 'Câu kiêm ngữ']),
  L('还是打车去北大吧', 'Háishi dǎchē qù Běidà ba', 'Chúng ta vẫn nên gọi taxi đi Đại học Bắc Kinh nhé', ['还是', '打车', '去', '北大', '吧'], ['Cấu trúc cố định “还是……吧”', 'Dùng 多 để diễn đạt ước lượng', 'Động từ, cụm động từ, cụm chủ vị làm định ngữ']),
  L('我想去西安旅游', 'Wǒ xiǎng qù Xī’ān lǚyóu', 'Em muốn đi Tây An du lịch', ['我', '想', '去', '西安', '旅游'], ['Bổ ngữ kết quả', 'Động từ lặp lại (1)', 'Động từ lặp lại (2)']),
  L('你穿红色的很好看', 'Nǐ chuān hóngsè de hěn hǎokàn', 'Con mặc đồ màu đỏ rất đẹp', ['你', '穿', '红色的', '很', '好看'], ['Trợ từ động thái 过', 'Câu ghép nhân quả “因为……，所以……”', 'Cụm từ chữ 的']),
  L('第一次去中国朋友家', 'Dì-yī cì qù Zhōngguó péngyou jiā', 'Lần đầu đến thăm nhà bạn người Trung Quốc', ['第一次', '去', '中国', '朋友', '家'], ['Bổ ngữ xu hướng đơn (1)', 'Bổ ngữ xu hướng đơn (2)', 'Cấu trúc cố định “都……了”']),
  L('小雪，生日快乐！', 'Xiǎoxuě, shēngrì kuàilè!', 'Chúc mừng sinh nhật Tiểu Tuyết!', null, ['Tính từ lặp lại', 'Cụm từ cố định “什么的”', 'Trợ từ kết cấu 地']),
  L('他篮球打得很好', 'Tā lánqiú dǎ de hěn hǎo', 'Bạn ấy chơi bóng rổ rất hay', ['他', '篮球', '打得', '很好'], ['Câu ghép rút gọn “一……就……”', 'Bổ ngữ trạng thái (1)', 'Bổ ngữ trạng thái (2)']),
  L('虽然你忘了，但是我记得', 'Suīrán nǐ wàng le, dànshì wǒ jìde', 'Mặc dù em quên, nhưng anh vẫn nhớ', ['虽然', '你', '忘了', '但是', '我', '记得'], ['Câu so sánh (1)', 'Câu so sánh (2)', 'Câu ghép chuyển ý “虽然……，但是……”']),
  L('我去买杯奶茶', 'Wǒ qù mǎi bēi nǎichá', 'Em đi mua một cốc trà sữa', ['我', '去', '买', '杯', '奶茶'], ['Câu so sánh (3)', 'Động từ 离', 'Bổ ngữ thời lượng (1)']),
  L('就要考试了', 'Jiù yào kǎoshì le', 'Sắp thi rồi', ['就要', '考试', '了'], ['Câu có cụm chủ vị làm vị ngữ', 'Câu hỏi lựa chọn', 'Cấu trúc cố định “要/快/快要/就要……了”']),
  L('我最喜欢吃中国菜', 'Wǒ zuì xǐhuan chī Zhōngguó cài', 'Em thích ăn món Trung Quốc nhất', ['我', '最', '喜欢', '吃', '中国菜'], ['Trợ từ động thái 着 (1)', 'Trợ từ động thái 着 (2)', 'Phó từ chỉ mức độ 最']),
  L('这里比北京冷多了', 'Zhèlǐ bǐ Běijīng lěng duō le', 'Ở đây lạnh hơn Bắc Kinh nhiều', ['这里', '比', '北京', '冷', '多了'], ['Câu so sánh (4)', 'Câu so sánh (5)', 'Câu so sánh (6)']),
  L('我们爱上中文课', 'Wǒmen àishàng Zhōngwén kè', 'Chúng tôi yêu thích môn tiếng Trung Quốc', ['我们', '爱上', '中文', '课'], ['Câu có hai tân ngữ (2)', 'Câu so sánh (7)', 'Câu so sánh (8)']),
  L('一个人过年多没意思啊', 'Yí gè rén guònián duō méi yìsi a', 'Một mình đón năm mới thì thật vô vị', ['一个人', '过年', '多', '没意思', '啊'], ['Câu tồn hiện (2)', 'Phó từ chỉ mức độ 多', 'Bổ ngữ xu hướng kép']),
  L('我想再去一次中国', 'Wǒ xiǎng zài qù yí cì Zhōngguó', 'Em muốn đi Trung Quốc một lần nữa', ['我', '想', '再', '去', '一次', '中国'], ['Bổ ngữ động lượng (1)', 'Bổ ngữ động lượng (2)', 'Câu chữ 有 (2)']),
];

const HSK3: BookLesson[] = [
  L('我们去机场接你们', 'Wǒmen qù jīchǎng jiē nǐmen', 'Anh chị sẽ đến sân bay đón các em', ['我们', '去', '机场', '接', '你们'], ['Cụm từ cố định “看上去/看起来”', 'Cách dùng linh hoạt của đại từ nghi vấn (1)', 'Định ngữ đa tầng']),
  L('你们想吃什么就点什么', 'Nǐmen xiǎng chī shénme jiù diǎn shénme', 'Các em muốn ăn món gì thì gọi món đó', ['你们', '想吃什么', '就', '点什么'], ['Câu ghép đẳng lập “又……又……”', 'Cách dùng linh hoạt của đại từ nghi vấn (2)', 'Cách dùng linh hoạt của đại từ nghi vấn (3)']),
  L('这个小区挺好的', 'Zhège xiǎoqū tǐng hǎo de', 'Khu dân cư này khá tốt', ['这个', '小区', '挺', '好的'], ['Phó từ chỉ mức độ 挺', 'Bổ ngữ trình độ (1)', 'Phó từ 就 và 才']),
  L('这家宾馆跟别的都不一样', 'Zhè jiā bīnguǎn gēn bié de dōu bù yíyàng', 'Khách sạn này không giống như những khách sạn khác', ['这家', '宾馆', '跟', '别的', '都', '不一样'], ['Cấu trúc “一……也/都+不/没……”', 'Câu so sánh (9)', 'Cấu trúc “除了……(以外)，……都/还/也……”']),
  L('这样的照片才好看', 'Zhèyàng de zhàopiàn cái hǎokàn', 'Những bức ảnh như thế này mới đẹp', ['这样的', '照片', '才', '好看'], ['Bổ ngữ trình độ (2)', 'Lượng từ lặp lại', 'Câu tồn hiện (3)', 'Câu ghép rút gọn “……了……就……”']),
  L('高铁上还可以点外卖', 'Gāotiě shàng hái kěyǐ diǎn wàimài', 'Trên tàu cao tốc vẫn có thể đặt đồ ăn giao tận nơi', ['高铁上', '还', '可以', '点', '外卖'], ['Cấu trúc cố định “该……了”', 'Câu ghép giả định “如果……，就……”', 'Cụm từ cố định “越来越”']),
  L('那条裙子比短裤更好看', 'Nà tiáo qúnzi bǐ duǎnkù gèng hǎokàn', 'Chiếc váy đó đẹp hơn quần soóc', ['那条', '裙子', '比', '短裤', '更', '好看'], ['Câu liên động (2)', 'Câu so sánh (10)', 'Bổ ngữ trình độ (3)', 'Câu ghép tăng tiến “不但……，而且……”']),
  L('今天我出院了', 'Jīntiān wǒ chūyuàn le', 'Hôm nay tôi xuất viện rồi', ['今天', '我', '出院', '了'], ['Cách dùng mở rộng của bổ ngữ xu hướng (1)', 'Từ li hợp (2)', 'Bổ ngữ thời lượng (2)', 'Cấu trúc “……以前/以后/前/后”']),
  L('打不好没关系', 'Dǎ bu hǎo méi guānxi', 'Chơi không tốt cũng không sao', null, ['Câu ghép chỉ mục đích “为了……，……”', 'Bổ ngữ khả năng', 'Cấu trúc “越A越B”']),
  L('你明天再把书还给我', 'Nǐ míngtiān zài bǎ shū huán gěi wǒ', 'Ngày mai em trả lại sách cho cô nhé', ['你', '明天', '再', '把', '书', '还给', '我'], ['Câu chữ 把 (1)', 'Cấu trúc “在……上/中/下”', 'Câu chữ 把 (2)']),
  L('看来我没办法解决这个问题', 'Kànlái wǒ méi bànfǎ jiějué zhège wèntí', 'Xem ra em không thể giải quyết vấn đề này', ['看来', '我', '没办法', '解决', '这个', '问题'], ['“还是” và “或者”', 'Cụm từ cố định “看来”', 'Câu chữ 把 (3)', 'Cấu trúc “对……来说”']),
  L('这个季节天气变化很快', 'Zhège jìjié tiānqì biànhuà hěn kuài', 'Thời tiết thay đổi rất nhanh vào mùa này', ['这个', '季节', '天气', '变化', '很快'], ['Câu ghép lựa chọn “或者……，或者……”', 'Cách dùng mở rộng của bổ ngữ xu hướng (2)', 'Phó từ chỉ phạm vi 就', 'Cách dùng mở rộng của bổ ngữ xu hướng (3)']),
  L('我的新邻居来自英国', 'Wǒ de xīn línjū láizì Yīngguó', 'Hàng xóm mới của tôi đến từ Vương quốc Anh', ['我的', '新', '邻居', '来自', '英国'], ['Câu ghép giả định “……的话，就……”', 'Câu chữ 把 (4)', 'Câu ghép đẳng lập “一边……，一边……”']),
  L('这本书被别人借走了', 'Zhè běn shū bèi biéren jiè zǒu le', 'Quyển sách này đã bị người khác mượn rồi', ['这本书', '被', '别人', '借走', '了'], ['Câu bị động (1)', 'Câu ghép tiếp nối “先……，再/然后……”', 'Cấu trúc cố định “×什么(啊)”']),
  L('我是半个南京人', 'Wǒ shì bàn gè Nánjīng rén', 'Em cũng là một nửa người Nam Kinh', ['我', '是', '半个', '南京', '人'], ['Giới từ 根据', 'Cụm từ chỉ số lượng lặp lại', 'Cấu trúc cố định “在……看来”', 'Cụm từ cố định “不一会儿”']),
  L('我听说有的熊猫出国了', 'Wǒ tīngshuō yǒude xióngmāo chūguó le', 'Con nghe nói có một số con gấu trúc đã ra nước ngoài', ['我', '听说', '有的', '熊猫', '出国了'], ['Câu ghép đẳng lập “一会儿……，一会儿……”', 'Giới từ 关于', 'Cụm từ cố định “一般来说”', 'Câu so sánh (11)']),
  L('我要多向认真的人学习', 'Wǒ yào duō xiàng rènzhēn de rén xuéxí', 'Mình sẽ học hỏi từ những người cẩn thận', ['我', '要', '多', '向', '认真的', '人', '学习'], ['Giới từ 向', 'Câu phản vấn “不是……吗？”', 'Câu ghép tăng tiến “……，更……”', 'Câu ghép điều kiện “只有……，才……”']),
  L('我学会了包饺子', 'Wǒ xuéhuì le bāo jiǎozi', 'Cháu đã học được cách gói sủi cảo', ['我', '学会了', '包', '饺子'], ['Cách diễn đạt số ước lượng', '“刚才” và “刚刚”', 'Câu ghép điều kiện “只要……，就……”', 'Cấu trúc cố định “从……起”']),
];

const buildUnits = (book: BookLesson[], bookNo: number, color: string, startNumber: number, json?: BookJson, sbt?: SbtJson): Unit[] => {
  const units: Unit[] = [];
  for (let s = 0; s < book.length; s += 3) {
    const idxs = [s, s + 1, s + 2].filter((k) => k < book.length);
    units.push({
      id: `zh-unit-hsk${bookNo}-${s / 3 + 1}`,
      unitNumber: startNumber + s / 3,
      title: `New HSK ${bookNo} · Bài ${idxs[0] + 1}–${idxs[idxs.length - 1] + 1}`,
      description: idxs.map((k) => book[k].vi).join(' · '),
      badge: `HSK ${bookNo} · Giáo trình chuẩn`,
      color,
      lessons: idxs.map((k) => buildLesson(bookNo, k, book[k], book, json?.lessons.find((l) => l.no === k + 1), sbt)),
    });
  }
  // Đề thi mô phỏng cả cấp (Sổ tay) nằm cuối chặng cuối của mỗi cấp.
  const mock = buildSbt(bookNo, 0, sbt);
  if (mock && units.length) {
    units[units.length - 1].lessons.push({
      id: `zh-hsk${bookNo}-mock`,
      title: `Đề thi mô phỏng HSK ${bookNo}`,
      description: `Đề mô phỏng trong Sổ tay New HSK ${bookNo} · ${mock.questions.length} câu đọc hiểu kèm audio phần nghe`,
      xp: 50,
      icon: '🏁',
      questions: [],
      sbt: mock,
    });
  }
  return units;
};

export const NEW_HSK_UNITS: Unit[] = [
  ...buildUnits(HSK1, 1, '#10b981', 1, hsk1Json as unknown as BookJson, sbt1Json as unknown as SbtJson),
  ...buildUnits(HSK2, 2, '#f59e0b', 6, hsk2Json as unknown as BookJson, sbt2Json as unknown as SbtJson),
  ...buildUnits(HSK3, 3, '#3b82f6', 11, hsk3Json as unknown as BookJson, sbt3Json as unknown as SbtJson),
];

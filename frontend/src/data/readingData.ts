// Bài đọc song ngữ tự soạn (không trích từ báo có bản quyền), kèm ghi chú từ mới ở cột bên cạnh.
export interface ReadingNote { word: string; meaning: string; pos?: string; ipa?: string }
export interface ReadingPara { text: string; vi: string }
export interface ReadingArticle {
  id: string;
  lang: 'zh' | 'en';
  level: string; // HSK 1... hoặc A2/B1
  topic: string;
  title: string;
  titleVi: string;
  summary: string;
  paras: ReadingPara[];
  notes: ReadingNote[];
}

import { MORE_ARTICLES } from './readingMore';
import { LONG_ARTICLES } from './readingLong';

const BASE_ARTICLES: ReadingArticle[] = [
  {
    id: 'zh-weekend', lang: 'zh', level: 'HSK 1–2', topic: 'Đời sống',
    title: '我的周末', titleVi: 'Cuối tuần của tôi',
    summary: 'Nhật ký ngắn về một ngày cuối tuần: đi siêu thị, nấu ăn và xem phim.',
    paras: [
      { text: '今天是星期六，我不上班。早上八点，我起床了。', vi: 'Hôm nay là thứ Bảy, tôi không đi làm. Tám giờ sáng, tôi thức dậy.' },
      { text: '我先去超市买了一些水果和菜，苹果很便宜，我买了三斤。', vi: 'Trước tiên tôi đi siêu thị mua ít hoa quả và rau, táo rất rẻ nên tôi mua ba cân.' },
      { text: '中午我在家做饭。我会做饺子，妈妈说我做得很好吃。', vi: 'Buổi trưa tôi nấu cơm ở nhà. Tôi biết gói sủi cảo, mẹ nói tôi làm rất ngon.' },
      { text: '下午我和朋友去电影院看了一个电影，电影很有意思。', vi: 'Buổi chiều tôi cùng bạn đến rạp xem một bộ phim, phim rất thú vị.' },
      { text: '晚上我很高兴，因为周末的生活真快乐。', vi: 'Buổi tối tôi rất vui, vì cuộc sống cuối tuần thật vui vẻ.' },
    ],
    notes: [
      { word: '周末', meaning: 'cuối tuần', pos: 'danh từ' }, { word: '起床', meaning: 'thức dậy', pos: 'động từ' },
      { word: '超市', meaning: 'siêu thị', pos: 'danh từ' }, { word: '便宜', meaning: 'rẻ', pos: 'tính từ' },
      { word: '做饭', meaning: 'nấu cơm, nấu ăn', pos: 'động từ' }, { word: '饺子', meaning: 'sủi cảo', pos: 'danh từ' },
      { word: '电影院', meaning: 'rạp chiếu phim', pos: 'danh từ' }, { word: '有意思', meaning: 'thú vị', pos: 'tính từ' },
      { word: '快乐', meaning: 'vui vẻ', pos: 'tính từ' },
    ],
  },
  {
    id: 'zh-cafe', lang: 'zh', level: 'HSK 2', topic: 'Tin tức địa phương',
    title: '学校旁边开了一家新咖啡店', titleVi: 'Cạnh trường mới mở một quán cà phê',
    summary: 'Bản tin ngắn về quán cà phê mới mở, giá rẻ và được sinh viên yêu thích.',
    paras: [
      { text: '上个星期，学校旁边开了一家新咖啡店，很多学生都去那儿坐一坐。', vi: 'Tuần trước, cạnh trường mở một quán cà phê mới, rất nhiều sinh viên đến đó ngồi chơi.' },
      { text: '这家店不大，但是很干净。店里的咖啡比别的地方便宜一点儿，一杯只要十五块。', vi: 'Quán không lớn nhưng rất sạch sẽ. Cà phê ở đây rẻ hơn những nơi khác một chút, một ly chỉ 15 đồng.' },
      { text: '老板是一位年轻的女生，她从小就喜欢喝咖啡，所以决定自己开一家店。', vi: 'Chủ quán là một cô gái trẻ, từ nhỏ cô đã thích uống cà phê nên quyết định tự mở một quán.' },
      { text: '虽然天气有点儿冷，但是每天下课以后，店里都坐满了人。', vi: 'Tuy thời tiết hơi lạnh, nhưng mỗi ngày sau giờ học, quán đều kín chỗ.' },
      { text: '一位同学说：“这里很安静，我可以在这儿写作业、看书。”', vi: 'Một bạn học nói: “Ở đây rất yên tĩnh, mình có thể làm bài tập, đọc sách ở đây.”' },
    ],
    notes: [
      { word: '咖啡店', meaning: 'quán cà phê', pos: 'danh từ' }, { word: '干净', meaning: 'sạch sẽ', pos: 'tính từ' },
      { word: '老板', meaning: 'ông chủ, bà chủ', pos: 'danh từ' }, { word: '从小', meaning: 'từ nhỏ', pos: 'phó từ' },
      { word: '决定', meaning: 'quyết định', pos: 'động từ' }, { word: '虽然', meaning: 'tuy, mặc dù', pos: 'liên từ' },
      { word: '安静', meaning: 'yên tĩnh', pos: 'tính từ' }, { word: '作业', meaning: 'bài tập về nhà', pos: 'danh từ' },
    ],
  },
  {
    id: 'zh-train', lang: 'zh', level: 'HSK 3', topic: 'Xã hội',
    title: '高铁让旅行更方便', titleVi: 'Tàu cao tốc khiến việc đi lại thuận tiện hơn',
    summary: 'Vì sao ngày càng nhiều người chọn tàu cao tốc thay cho máy bay trên những chặng ngắn.',
    paras: [
      { text: '现在，越来越多的人喜欢坐高铁去旅游。从北京到上海，坐高铁只要四个多小时。', vi: 'Hiện nay ngày càng nhiều người thích đi tàu cao tốc để du lịch. Từ Bắc Kinh đến Thượng Hải, đi tàu cao tốc chỉ mất hơn bốn tiếng.' },
      { text: '买票也很方便，用手机就能买，上车的时候刷一下护照就可以进站。', vi: 'Mua vé cũng rất tiện, dùng điện thoại là mua được, lúc lên tàu chỉ cần quẹt hộ chiếu là vào ga.' },
      { text: '高铁上又安静又舒服，累了可以睡一会儿，饿了还可以点外卖。', vi: 'Trên tàu cao tốc vừa yên tĩnh vừa thoải mái, mệt có thể ngủ một lát, đói còn có thể đặt đồ ăn giao tận nơi.' },
      { text: '与坐飞机相比，高铁不容易晚点，而且车站大多在市里，去车站的路上花的时间也比较短。', vi: 'So với đi máy bay, tàu cao tốc ít bị trễ giờ, hơn nữa ga phần lớn nằm trong thành phố nên thời gian đi tới ga cũng ngắn hơn.' },
      { text: '因此，很多外国游客来中国以后，都会选择坐一次高铁，感受一下这种新的出行方式。', vi: 'Vì vậy, rất nhiều du khách nước ngoài sau khi đến Trung Quốc đều chọn đi tàu cao tốc một lần để cảm nhận cách di chuyển mới này.' },
    ],
    notes: [
      { word: '高铁', meaning: 'tàu cao tốc', pos: 'danh từ' }, { word: '越来越', meaning: 'càng ngày càng', pos: 'cụm từ' },
      { word: '护照', meaning: 'hộ chiếu', pos: 'danh từ' }, { word: '外卖', meaning: 'đồ ăn giao tận nơi', pos: 'danh từ' },
      { word: '晚点', meaning: 'bị trễ giờ', pos: 'động từ' }, { word: '而且', meaning: 'hơn nữa', pos: 'liên từ' },
      { word: '车站', meaning: 'nhà ga, bến xe', pos: 'danh từ' }, { word: '游客', meaning: 'du khách', pos: 'danh từ' },
      { word: '选择', meaning: 'lựa chọn', pos: 'động từ' }, { word: '感受', meaning: 'cảm nhận', pos: 'động từ' },
    ],
  },
  {
    id: 'zh-panda', lang: 'zh', level: 'HSK 3', topic: 'Thiên nhiên',
    title: '大熊猫的一天', titleVi: 'Một ngày của gấu trúc',
    summary: 'Gấu trúc ăn gì, ngủ bao lâu và vì sao được gọi là “quốc bảo”.',
    paras: [
      { text: '大熊猫是中国的国宝，也是很多外国人最喜爱的动物。', vi: 'Gấu trúc là quốc bảo của Trung Quốc, cũng là loài động vật được nhiều người nước ngoài yêu thích nhất.' },
      { text: '一般来说，大熊猫每天要吃十多个小时的竹子，其余的时间大多在睡觉。', vi: 'Nói chung, gấu trúc mỗi ngày phải ăn tre hơn mười tiếng, thời gian còn lại phần lớn là ngủ.' },
      { text: '它们看起来很可爱，但是其实也很怕热，夏天常常躲在树下休息。', vi: 'Chúng trông rất đáng yêu, nhưng thực ra cũng rất sợ nóng, mùa hè thường trốn dưới bóng cây nghỉ ngơi.' },
      { text: '全世界只有中国有野生大熊猫，所以保护它们非常重要。', vi: 'Trên toàn thế giới chỉ có Trung Quốc có gấu trúc hoang dã, vì vậy bảo vệ chúng vô cùng quan trọng.' },
    ],
    notes: [
      { word: '国宝', meaning: 'quốc bảo', pos: 'danh từ' }, { word: '喜爱', meaning: 'yêu thích', pos: 'động từ' },
      { word: '一般来说', meaning: 'nói chung', pos: 'cụm từ' }, { word: '竹子', meaning: 'tre', pos: 'danh từ' },
      { word: '其实', meaning: 'thực ra', pos: 'phó từ' }, { word: '野生', meaning: 'hoang dã', pos: 'tính từ' },
      { word: '保护', meaning: 'bảo vệ', pos: 'động từ' },
    ],
  },
  {
    id: 'en-bike', lang: 'en', level: 'A2', topic: 'Local news',
    title: 'A New Bike Lane Opens in Town', titleVi: 'Làn đường xe đạp mới mở trong thị trấn',
    summary: 'A small town opens a bike lane and more people start cycling to work.',
    paras: [
      { text: 'Last Monday, a new bike lane opened on Main Street. It is two kilometres long and runs from the station to the park.', vi: 'Thứ Hai tuần trước, một làn đường xe đạp mới đã mở trên phố Main. Làn đường dài hai ki-lô-mét, chạy từ nhà ga đến công viên.' },
      { text: 'Many people were happy about the change. "It is much safer now," said Anna, who cycles to work every day.', vi: 'Nhiều người vui với sự thay đổi này. “Bây giờ an toàn hơn nhiều,” Anna, người đạp xe đi làm mỗi ngày, nói.' },
      { text: 'The town also plans to add more parking spaces for bikes near the market and the school.', vi: 'Thị trấn cũng dự định thêm chỗ đỗ xe đạp gần chợ và trường học.' },
      { text: 'Doctors say that cycling is good for your health and it also helps to keep the air clean.', vi: 'Các bác sĩ nói đạp xe tốt cho sức khoẻ và còn giúp giữ không khí sạch.' },
    ],
    notes: [
      { word: 'lane', meaning: 'làn đường', ipa: '/leɪn/', pos: 'noun' }, { word: 'kilometres', meaning: 'ki-lô-mét', ipa: '/ˈkɪləˌmiːtəz/', pos: 'noun' },
      { word: 'safer', meaning: 'an toàn hơn', ipa: '/ˈseɪfə/', pos: 'adj' }, { word: 'cycles', meaning: 'đạp xe', ipa: '/ˈsaɪkəlz/', pos: 'verb' },
      { word: 'plans', meaning: 'dự định', ipa: '/plænz/', pos: 'verb' }, { word: 'parking', meaning: 'việc đỗ xe', ipa: '/ˈpɑːkɪŋ/', pos: 'noun' },
      { word: 'health', meaning: 'sức khoẻ', ipa: '/helθ/', pos: 'noun' }, { word: 'air', meaning: 'không khí', ipa: '/eə/', pos: 'noun' },
    ],
  },
  {
    id: 'en-sleep', lang: 'en', level: 'B1', topic: 'Health',
    title: 'Why Sleep Matters for Students', titleVi: 'Vì sao giấc ngủ quan trọng với học sinh, sinh viên',
    summary: 'How enough sleep helps memory, mood and exam results.',
    paras: [
      { text: 'Many students stay up late to finish homework or watch videos, but experts warn that this habit can harm their studies.', vi: 'Nhiều học sinh thức khuya để làm bài hoặc xem video, nhưng các chuyên gia cảnh báo thói quen này có thể gây hại cho việc học.' },
      { text: 'During sleep, the brain stores what we learned during the day. Without enough rest, it becomes harder to remember new words and facts.', vi: 'Trong lúc ngủ, não lưu lại những gì ta học trong ngày. Thiếu nghỉ ngơi, việc nhớ từ mới và kiến thức trở nên khó hơn.' },
      { text: 'Sleep also affects mood. Tired students are more likely to feel stressed and to make careless mistakes in exams.', vi: 'Giấc ngủ còn ảnh hưởng đến tâm trạng. Học sinh mệt mỏi dễ căng thẳng hơn và dễ mắc lỗi bất cẩn trong kỳ thi.' },
      { text: 'Most teenagers need between eight and ten hours a night. Going to bed at the same time every day is a simple way to improve your sleep.', vi: 'Hầu hết thanh thiếu niên cần ngủ từ tám đến mười tiếng mỗi đêm. Đi ngủ vào cùng một giờ mỗi ngày là cách đơn giản để cải thiện giấc ngủ.' },
    ],
    notes: [
      { word: 'stay up', meaning: 'thức khuya', ipa: '/steɪ ʌp/', pos: 'phrasal verb' }, { word: 'experts', meaning: 'chuyên gia', ipa: '/ˈekspɜːts/', pos: 'noun' },
      { word: 'warn', meaning: 'cảnh báo', ipa: '/wɔːn/', pos: 'verb' }, { word: 'harm', meaning: 'gây hại', ipa: '/hɑːm/', pos: 'verb' },
      { word: 'brain', meaning: 'bộ não', ipa: '/breɪn/', pos: 'noun' }, { word: 'affects', meaning: 'ảnh hưởng đến', ipa: '/əˈfekts/', pos: 'verb' },
      { word: 'stressed', meaning: 'căng thẳng', ipa: '/strest/', pos: 'adj' }, { word: 'careless', meaning: 'bất cẩn', ipa: '/ˈkeələs/', pos: 'adj' },
      { word: 'improve', meaning: 'cải thiện', ipa: '/ɪmˈpruːv/', pos: 'verb' },
    ],
  },
  {
    id: 'en-tea', lang: 'en', level: 'B1', topic: 'Culture',
    title: 'Tea or Coffee? A Morning Habit Around the World', titleVi: 'Trà hay cà phê? Thói quen buổi sáng trên thế giới',
    summary: 'People in different countries start their day with very different drinks.',
    paras: [
      { text: 'In many countries, a morning drink is part of daily life. In Vietnam, many people enjoy strong coffee with condensed milk.', vi: 'Ở nhiều nước, một thức uống buổi sáng là một phần của đời sống hằng ngày. Ở Việt Nam, nhiều người thích cà phê đậm pha sữa đặc.' },
      { text: 'In China, green tea is more popular. People often drink it all day and refill the cup with hot water again and again.', vi: 'Ở Trung Quốc, trà xanh phổ biến hơn. Mọi người thường uống cả ngày và châm thêm nước nóng vào cốc nhiều lần.' },
      { text: 'In Britain, a cup of black tea with a little milk is the usual choice, and many families have a short "tea break" in the afternoon.', vi: 'Ở Anh, một cốc trà đen với chút sữa là lựa chọn quen thuộc, và nhiều gia đình có một “giờ nghỉ uống trà” ngắn vào buổi chiều.' },
      { text: 'Although the drinks are different, the idea is the same: a few quiet minutes to relax before the busy day begins.', vi: 'Dù thức uống khác nhau, ý nghĩa thì giống nhau: vài phút yên tĩnh để thư giãn trước khi ngày bận rộn bắt đầu.' },
    ],
    notes: [
      { word: 'condensed milk', meaning: 'sữa đặc', ipa: '/kənˈdenst mɪlk/', pos: 'noun' }, { word: 'popular', meaning: 'phổ biến', ipa: '/ˈpɒpjələ/', pos: 'adj' },
      { word: 'refill', meaning: 'rót đầy lại', ipa: '/ˌriːˈfɪl/', pos: 'verb' }, { word: 'usual', meaning: 'thông thường', ipa: '/ˈjuːʒuəl/', pos: 'adj' },
      { word: 'break', meaning: 'giờ nghỉ', ipa: '/breɪk/', pos: 'noun' }, { word: 'relax', meaning: 'thư giãn', ipa: '/rɪˈlæks/', pos: 'verb' },
    ],
  },
];

// Bài dài (nhiều đoạn, có kiến thức) xếp lên đầu danh sách.
export const READING_ARTICLES: ReadingArticle[] = [...LONG_ARTICLES, ...BASE_ARTICLES, ...MORE_ARTICLES];

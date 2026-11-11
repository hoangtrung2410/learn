import { ReadingArticle } from './readingData';

// Bài đọc song ngữ bổ sung (tự soạn, không trích từ nguồn có bản quyền).
export const MORE_ARTICLES: ReadingArticle[] = [
  {
    id: 'zh-family', lang: 'zh', level: 'HSK 1', topic: 'Gia đình',
    title: '我的家', titleVi: 'Gia đình tôi',
    summary: 'Giới thiệu gia đình bốn người bằng những câu rất đơn giản.',
    paras: [
      { text: '我家有四口人：爸爸、妈妈、哥哥和我。', vi: 'Nhà tôi có bốn người: bố, mẹ, anh trai và tôi.' },
      { text: '我爸爸是医生，他在医院工作，每天都很忙。', vi: 'Bố tôi là bác sĩ, làm việc ở bệnh viện, ngày nào cũng rất bận.' },
      { text: '我妈妈是老师，她喜欢做饭，我们都爱吃她做的菜。', vi: 'Mẹ tôi là giáo viên, bà thích nấu ăn, cả nhà đều thích ăn món bà nấu.' },
      { text: '我哥哥今年二十岁，他在大学读书。我是学生，今年十岁。', vi: 'Anh trai tôi năm nay hai mươi tuổi, đang học đại học. Tôi là học sinh, năm nay mười tuổi.' },
    ],
    notes: [
      { word: '医生', meaning: 'bác sĩ' }, { word: '医院', meaning: 'bệnh viện' }, { word: '工作', meaning: 'làm việc' },
      { word: '做饭', meaning: 'nấu cơm' }, { word: '大学', meaning: 'đại học' }, { word: '读书', meaning: 'đi học, đọc sách' }, { word: '岁', meaning: 'tuổi' },
    ],
  },
  {
    id: 'zh-weather', lang: 'zh', level: 'HSK 1–2', topic: 'Thời tiết',
    title: '北京的天气', titleVi: 'Thời tiết Bắc Kinh',
    summary: 'Bốn mùa ở Bắc Kinh và nên mặc gì.',
    paras: [
      { text: '北京有春天、夏天、秋天和冬天，一年有四个季节。', vi: 'Bắc Kinh có mùa xuân, hạ, thu và đông, một năm có bốn mùa.' },
      { text: '春天不冷也不热，花都开了，很多人去公园玩。', vi: 'Mùa xuân không lạnh cũng không nóng, hoa nở hết, rất nhiều người ra công viên chơi.' },
      { text: '夏天很热，常常下雨，出门最好带一把伞。', vi: 'Mùa hè rất nóng, thường có mưa, ra ngoài tốt nhất nên mang theo một chiếc ô.' },
      { text: '冬天很冷，有时候还会下雪，大家要多穿一点儿衣服。', vi: 'Mùa đông rất lạnh, có lúc còn có tuyết, mọi người cần mặc thêm áo.' },
    ],
    notes: [
      { word: '季节', meaning: 'mùa' }, { word: '公园', meaning: 'công viên' }, { word: '常常', meaning: 'thường xuyên' },
      { word: '下雨', meaning: 'mưa' }, { word: '最好', meaning: 'tốt nhất là' }, { word: '伞', meaning: 'ô, dù' }, { word: '下雪', meaning: 'có tuyết rơi' },
    ],
  },
  {
    id: 'zh-restaurant', lang: 'zh', level: 'HSK 2', topic: 'Đời sống',
    title: '在饭馆点菜', titleVi: 'Gọi món ở nhà hàng',
    summary: 'Một bữa ăn tối cùng bạn bè: xem thực đơn, gọi món và thanh toán.',
    paras: [
      { text: '昨天晚上，我和三个朋友去了一家有名的饭馆。', vi: 'Tối qua, tôi và ba người bạn đến một nhà hàng nổi tiếng.' },
      { text: '服务员给我们拿来了菜单，菜单上有很多菜，我们不知道点什么。', vi: 'Nhân viên mang thực đơn đến cho chúng tôi, trên đó có rất nhiều món, chúng tôi không biết gọi gì.' },
      { text: '服务员说：“鱼和鸡肉做得最好吃。”所以我们点了一条鱼、一个鸡肉菜和四碗米饭。', vi: 'Nhân viên nói: “Cá và gà làm ngon nhất.” Vì vậy chúng tôi gọi một con cá, một món gà và bốn bát cơm.' },
      { text: '吃完饭，我们一共花了二百块钱。大家都说这家饭馆的菜好吃，也不太贵。', vi: 'Ăn xong, chúng tôi tổng cộng tiêu hết 200 đồng. Ai cũng nói món ở nhà hàng này ngon, cũng không đắt lắm.' },
    ],
    notes: [
      { word: '饭馆', meaning: 'quán ăn, nhà hàng' }, { word: '有名', meaning: 'nổi tiếng' }, { word: '服务员', meaning: 'nhân viên phục vụ' },
      { word: '菜单', meaning: 'thực đơn' }, { word: '点', meaning: 'gọi (món)' }, { word: '鸡肉', meaning: 'thịt gà' }, { word: '一共', meaning: 'tổng cộng' }, { word: '花', meaning: 'tiêu (tiền)' },
    ],
  },
  {
    id: 'zh-learn', lang: 'zh', level: 'HSK 3', topic: 'Học tập',
    title: '学习汉语的好办法', titleVi: 'Cách học tiếng Trung hiệu quả',
    summary: 'Ba thói quen nhỏ giúp bạn tiến bộ nhanh hơn.',
    paras: [
      { text: '很多人觉得学汉语很难，特别是汉字和声调。其实只要方法对，学汉语并不难。', vi: 'Nhiều người thấy học tiếng Trung rất khó, nhất là chữ Hán và thanh điệu. Thực ra chỉ cần phương pháp đúng thì học tiếng Trung không hề khó.' },
      { text: '第一，每天练习十五分钟，比一个星期只学一次要好得多。', vi: 'Thứ nhất, mỗi ngày luyện tập mười lăm phút tốt hơn nhiều so với một tuần chỉ học một lần.' },
      { text: '第二，不要只看书，还要多听、多说。你可以听中文歌，看中文视频，跟中国朋友聊天儿。', vi: 'Thứ hai, đừng chỉ đọc sách, còn phải nghe nhiều, nói nhiều. Bạn có thể nghe nhạc Trung, xem video tiếng Trung, trò chuyện với bạn người Trung Quốc.' },
      { text: '第三，不要害怕说错。每个人都会犯错误，只有大胆地说，才能越说越好。', vi: 'Thứ ba, đừng sợ nói sai. Ai cũng mắc lỗi, chỉ có mạnh dạn nói thì mới càng nói càng tốt.' },
    ],
    notes: [
      { word: '声调', meaning: 'thanh điệu' }, { word: '其实', meaning: 'thực ra' }, { word: '练习', meaning: 'luyện tập' },
      { word: '视频', meaning: 'video' }, { word: '害怕', meaning: 'sợ' }, { word: '错误', meaning: 'lỗi, sai lầm' }, { word: '大胆', meaning: 'mạnh dạn, to gan' }, { word: '只有', meaning: 'chỉ có (khi)' },
    ],
  },
  {
    id: 'zh-spring', lang: 'zh', level: 'HSK 3', topic: 'Văn hoá',
    title: '过春节', titleVi: 'Đón Tết Nguyên đán',
    summary: 'Người Trung Quốc đón Tết thế nào: sum họp, gói sủi cảo, lì xì.',
    paras: [
      { text: '春节是中国最重要的节日，大多数人都会回家和家人一起过年。', vi: 'Tết Nguyên đán là ngày lễ quan trọng nhất ở Trung Quốc, đa số mọi người đều về nhà đón Tết cùng người thân.' },
      { text: '除夕晚上，一家人一边包饺子，一边看春节联欢晚会，十分热闹。', vi: 'Đêm giao thừa, cả nhà vừa gói sủi cảo vừa xem Gala mừng Xuân, vô cùng náo nhiệt.' },
      { text: '新年第一天，大人会给孩子红包，孩子们要说“新年快乐”。', vi: 'Ngày đầu năm mới, người lớn sẽ lì xì cho trẻ em, bọn trẻ phải chúc “Chúc mừng năm mới”.' },
      { text: '春节假期一般有七八天，很多人也会利用这段时间出去旅游。', vi: 'Kỳ nghỉ Tết thường kéo dài bảy tám ngày, nhiều người cũng tranh thủ khoảng thời gian này để đi du lịch.' },
    ],
    notes: [
      { word: '节日', meaning: 'ngày lễ' }, { word: '大多数', meaning: 'đa số' }, { word: '联欢晚会', meaning: 'dạ hội liên hoan' },
      { word: '热闹', meaning: 'náo nhiệt' }, { word: '红包', meaning: 'bao lì xì' }, { word: '假期', meaning: 'kỳ nghỉ' }, { word: '利用', meaning: 'tận dụng' },
    ],
  },
  {
    id: 'zh-pay', lang: 'zh', level: 'HSK 3–4', topic: 'Công nghệ',
    title: '手机支付', titleVi: 'Thanh toán bằng điện thoại',
    summary: 'Vì sao ở Trung Quốc ra phố chỉ cần mang điện thoại.',
    paras: [
      { text: '在中国，很多人出门只带一部手机，不带钱包。买东西的时候，用手机扫一下二维码就可以付钱。', vi: 'Ở Trung Quốc, nhiều người ra ngoài chỉ mang một chiếc điện thoại, không mang ví. Khi mua đồ, quét mã QR bằng điện thoại là có thể trả tiền.' },
      { text: '这种方式非常方便，不但买菜、坐地铁可以用，在小饭馆吃饭也可以用。', vi: 'Cách này vô cùng tiện lợi, không những mua rau, đi tàu điện ngầm mà ăn ở quán nhỏ cũng dùng được.' },
      { text: '不过，用手机支付的时候也要注意安全，不要把密码告诉别人。', vi: 'Tuy nhiên, khi thanh toán bằng điện thoại cũng cần chú ý an toàn, đừng nói mật khẩu cho người khác.' },
      { text: '外国游客来中国以前，最好先在手机上准备好支付软件。', vi: 'Trước khi đến Trung Quốc, du khách nước ngoài tốt nhất nên chuẩn bị sẵn phần mềm thanh toán trên điện thoại.' },
    ],
    notes: [
      { word: '钱包', meaning: 'ví tiền' }, { word: '二维码', meaning: 'mã QR' }, { word: '付钱', meaning: 'trả tiền' },
      { word: '不过', meaning: 'tuy nhiên' }, { word: '安全', meaning: 'an toàn' }, { word: '密码', meaning: 'mật khẩu' }, { word: '软件', meaning: 'phần mềm' },
    ],
  },
  {
    id: 'zh-bike', lang: 'zh', level: 'HSK 3', topic: 'Đời sống',
    title: '骑自行车上班', titleVi: 'Đạp xe đi làm',
    summary: 'Một nhân viên văn phòng đổi từ ô tô sang xe đạp và thấy khoẻ hơn.',
    paras: [
      { text: '小王以前每天开车上班，路上常常要花一个多小时，因为路上的车太多了。', vi: 'Trước đây Tiểu Vương ngày nào cũng lái xe đi làm, trên đường thường mất hơn một tiếng vì xe quá đông.' },
      { text: '后来，他决定骑自行车上班，二十分钟就到了公司。', vi: 'Sau đó, anh quyết định đạp xe đi làm, hai mươi phút là đến công ty.' },
      { text: '骑车不但可以锻炼身体，而且不用担心堵车，也不用找地方停车。', vi: 'Đạp xe không những giúp rèn luyện sức khoẻ mà còn không phải lo tắc đường, cũng không phải tìm chỗ đỗ xe.' },
      { text: '半年以后，小王瘦了五公斤，他说现在每天早上心情都特别好。', vi: 'Nửa năm sau, Tiểu Vương gầy đi năm cân, anh nói giờ mỗi sáng tâm trạng đều rất tốt.' },
    ],
    notes: [
      { word: '自行车', meaning: 'xe đạp' }, { word: '后来', meaning: 'sau đó, về sau' }, { word: '锻炼', meaning: 'rèn luyện' },
      { word: '担心', meaning: 'lo lắng' }, { word: '堵车', meaning: 'tắc đường' }, { word: '停车', meaning: 'đỗ xe' }, { word: '心情', meaning: 'tâm trạng' },
    ],
  },
  {
    id: 'zh-trip', lang: 'zh', level: 'HSK 3', topic: 'Du lịch',
    title: '一个人的旅行', titleVi: 'Chuyến đi một mình',
    summary: 'Lần đầu đi du lịch một mình: lo lắng, bất ngờ và trưởng thành.',
    paras: [
      { text: '去年夏天，我第一次一个人去外地旅游。出发以前，我很紧张，也有点儿害怕。', vi: 'Mùa hè năm ngoái, lần đầu tiên tôi đi du lịch một mình đến nơi khác. Trước khi xuất phát tôi rất hồi hộp, cũng hơi sợ.' },
      { text: '到了那个城市，我先在地图上找到了宾馆，然后坐地铁去了几个有名的景点。', vi: 'Đến thành phố đó, tôi tìm khách sạn trên bản đồ trước, rồi đi tàu điện ngầm tới vài danh thắng nổi tiếng.' },
      { text: '路上我遇到了很多热情的人，他们告诉我哪里的东西好吃，哪里的风景最漂亮。', vi: 'Trên đường tôi gặp rất nhiều người nhiệt tình, họ chỉ cho tôi chỗ nào đồ ăn ngon, nơi nào phong cảnh đẹp nhất.' },
      { text: '这次旅行让我明白，只要认真准备，一个人也可以玩得很开心。', vi: 'Chuyến đi này giúp tôi hiểu rằng chỉ cần chuẩn bị nghiêm túc, một mình cũng có thể chơi rất vui.' },
    ],
    notes: [
      { word: '出发', meaning: 'xuất phát' }, { word: '紧张', meaning: 'hồi hộp, căng thẳng' }, { word: '地图', meaning: 'bản đồ' },
      { word: '景点', meaning: 'điểm tham quan' }, { word: '热情', meaning: 'nhiệt tình' }, { word: '风景', meaning: 'phong cảnh' }, { word: '明白', meaning: 'hiểu ra' },
    ],
  },
  {
    id: 'en-songs', lang: 'en', level: 'A2', topic: 'Study',
    title: 'Learning English with Songs', titleVi: 'Học tiếng Anh qua bài hát',
    summary: 'Why songs are a fun and easy way to remember new words.',
    paras: [
      { text: 'Many learners say that music helps them to study. When you listen to a song again and again, the words stay in your head.', vi: 'Nhiều người học nói rằng âm nhạc giúp họ học. Khi bạn nghe đi nghe lại một bài hát, các từ sẽ ở lại trong đầu.' },
      { text: 'Choose a slow song with clear words. Read the lyrics first, then listen and try to follow them.', vi: 'Hãy chọn một bài chậm có lời rõ ràng. Đọc lời bài hát trước, sau đó nghe và cố đọc theo.' },
      { text: 'You can also write down new words and look up their meanings. After a week, try to sing the whole song without looking.', vi: 'Bạn cũng có thể viết ra từ mới và tra nghĩa. Sau một tuần, hãy thử hát cả bài mà không nhìn lời.' },
      { text: 'Songs will not replace lessons, but they make practice more enjoyable and help your pronunciation.', vi: 'Bài hát không thay thế được bài học, nhưng giúp việc luyện tập thú vị hơn và cải thiện phát âm.' },
    ],
    notes: [
      { word: 'lyrics', meaning: 'lời bài hát', ipa: '/ˈlɪrɪks/', pos: 'noun' }, { word: 'follow', meaning: 'theo, làm theo', ipa: '/ˈfɒləʊ/', pos: 'verb' },
      { word: 'look up', meaning: 'tra (từ điển)', ipa: '/lʊk ʌp/', pos: 'phrasal verb' }, { word: 'replace', meaning: 'thay thế', ipa: '/rɪˈpleɪs/', pos: 'verb' },
      { word: 'enjoyable', meaning: 'thú vị', ipa: '/ɪnˈdʒɔɪəbl/', pos: 'adj' }, { word: 'pronunciation', meaning: 'phát âm', ipa: '/prəˌnʌnsiˈeɪʃn/', pos: 'noun' },
    ],
  },
  {
    id: 'en-market', lang: 'en', level: 'A2', topic: 'Daily life',
    title: 'A Morning at the Market', titleVi: 'Một buổi sáng ở chợ',
    summary: 'Shopping for fruit and vegetables at a busy local market.',
    paras: [
      { text: 'Every Saturday morning, Lan goes to the local market with her grandmother. It opens at six and is already busy by seven.', vi: 'Sáng thứ Bảy nào Lan cũng đi chợ với bà. Chợ mở cửa lúc sáu giờ và đến bảy giờ đã đông.' },
      { text: 'The fruit is fresh and cheap. Lan buys a kilo of oranges and some bananas, while her grandmother chooses vegetables.', vi: 'Hoa quả ở đây tươi và rẻ. Lan mua một ki-lô cam và vài quả chuối, trong khi bà chọn rau.' },
      { text: 'The sellers often give a small discount if you buy a lot, so it is worth asking politely.', vi: 'Người bán thường giảm giá một chút nếu bạn mua nhiều, nên hỏi một cách lịch sự cũng đáng.' },
      { text: 'Before they go home, they stop at a small stall for breakfast. Lan loves the hot rice soup there.', vi: 'Trước khi về, hai bà cháu ghé một quầy nhỏ ăn sáng. Lan rất thích món cháo nóng ở đó.' },
    ],
    notes: [
      { word: 'local', meaning: 'địa phương', ipa: '/ˈləʊkl/', pos: 'adj' }, { word: 'fresh', meaning: 'tươi', ipa: '/freʃ/', pos: 'adj' },
      { word: 'sellers', meaning: 'người bán', ipa: '/ˈselərz/', pos: 'noun' }, { word: 'discount', meaning: 'giảm giá', ipa: '/ˈdɪskaʊnt/', pos: 'noun' },
      { word: 'politely', meaning: 'một cách lịch sự', ipa: '/pəˈlaɪtli/', pos: 'adv' }, { word: 'stall', meaning: 'quầy hàng', ipa: '/stɔːl/', pos: 'noun' },
    ],
  },
  {
    id: 'en-remote', lang: 'en', level: 'B1', topic: 'Work',
    title: 'Working from Home: Pros and Cons', titleVi: 'Làm việc tại nhà: ưu và nhược điểm',
    summary: 'What people like and dislike about working from home.',
    paras: [
      { text: 'Since the pandemic, millions of people have started working from home. For many of them, the biggest benefit is saving time on travel.', vi: 'Kể từ đại dịch, hàng triệu người đã bắt đầu làm việc tại nhà. Với nhiều người, lợi ích lớn nhất là tiết kiệm thời gian đi lại.' },
      { text: 'Working from home also gives you more freedom. You can organise your day and take a break when you need one.', vi: 'Làm việc tại nhà còn cho bạn nhiều tự do hơn. Bạn có thể sắp xếp ngày làm việc và nghỉ khi cần.' },
      { text: 'However, some workers feel lonely, and it can be difficult to separate work from family life.', vi: 'Tuy nhiên, một số người cảm thấy cô đơn, và có thể khó tách công việc khỏi đời sống gia đình.' },
      { text: 'Many companies now choose a mix: two or three days at home and the rest in the office.', vi: 'Nhiều công ty hiện chọn cách kết hợp: hai hoặc ba ngày ở nhà, còn lại làm ở văn phòng.' },
    ],
    notes: [
      { word: 'pandemic', meaning: 'đại dịch', ipa: '/pænˈdemɪk/', pos: 'noun' }, { word: 'benefit', meaning: 'lợi ích', ipa: '/ˈbenɪfɪt/', pos: 'noun' },
      { word: 'freedom', meaning: 'sự tự do', ipa: '/ˈfriːdəm/', pos: 'noun' }, { word: 'organise', meaning: 'sắp xếp, tổ chức', ipa: '/ˈɔːɡənaɪz/', pos: 'verb' },
      { word: 'lonely', meaning: 'cô đơn', ipa: '/ˈləʊnli/', pos: 'adj' }, { word: 'separate', meaning: 'tách ra', ipa: '/ˈsepəreɪt/', pos: 'verb' }, { word: 'mix', meaning: 'sự kết hợp', ipa: '/mɪks/', pos: 'noun' },
    ],
  },
  {
    id: 'en-plastic', lang: 'en', level: 'B1', topic: 'Environment',
    title: 'Saying No to Plastic Bags', titleVi: 'Nói không với túi ni lông',
    summary: 'Small changes in shopping habits that reduce plastic waste.',
    paras: [
      { text: 'Every year, people around the world use trillions of plastic bags. Most are used only once and then thrown away.', vi: 'Mỗi năm, người dân trên thế giới dùng hàng nghìn tỷ túi ni lông. Phần lớn chỉ dùng một lần rồi vứt đi.' },
      { text: 'Plastic can take hundreds of years to break down, and it often ends up in rivers and the sea, where it harms animals.', vi: 'Nhựa có thể mất hàng trăm năm để phân huỷ, và thường trôi ra sông, biển, nơi nó gây hại cho động vật.' },
      { text: 'Some cities have introduced a small charge for plastic bags, and the number of bags used has fallen quickly.', vi: 'Một số thành phố đã áp dụng khoản phí nhỏ cho túi ni lông, và số túi được dùng đã giảm nhanh.' },
      { text: 'You can help by bringing your own cloth bag when you shop. It is a simple habit that makes a real difference.', vi: 'Bạn có thể góp sức bằng cách mang túi vải của mình khi đi mua sắm. Đó là thói quen đơn giản tạo ra khác biệt thật sự.' },
    ],
    notes: [
      { word: 'plastic', meaning: 'nhựa, ni lông', ipa: '/ˈplæstɪk/', pos: 'noun' }, { word: 'thrown away', meaning: 'bị vứt đi', ipa: '/θrəʊn əˈweɪ/', pos: 'phrasal verb' },
      { word: 'break down', meaning: 'phân huỷ', ipa: '/breɪk daʊn/', pos: 'phrasal verb' }, { word: 'harms', meaning: 'gây hại', ipa: '/hɑːmz/', pos: 'verb' },
      { word: 'charge', meaning: 'khoản phí', ipa: '/tʃɑːdʒ/', pos: 'noun' }, { word: 'cloth', meaning: 'vải', ipa: '/klɒθ/', pos: 'noun' }, { word: 'difference', meaning: 'sự khác biệt', ipa: '/ˈdɪfrəns/', pos: 'noun' },
    ],
  },
  {
    id: 'en-walk', lang: 'en', level: 'A2–B1', topic: 'Health',
    title: 'Why You Should Walk Every Day', titleVi: 'Vì sao nên đi bộ mỗi ngày',
    summary: 'Thirty minutes of walking can change your health and your mood.',
    paras: [
      { text: 'You do not need a gym or special clothes to stay fit. Walking is free, simple and good for almost everyone.', vi: 'Bạn không cần phòng tập hay quần áo đặc biệt để giữ dáng. Đi bộ miễn phí, đơn giản và tốt cho hầu như mọi người.' },
      { text: 'Doctors recommend walking for at least thirty minutes a day. It protects your heart, strengthens your legs and helps you sleep better.', vi: 'Bác sĩ khuyên đi bộ ít nhất ba mươi phút mỗi ngày. Nó bảo vệ tim, làm chắc đôi chân và giúp bạn ngủ ngon hơn.' },
      { text: 'Walking also improves your mood. Many people say they feel calmer and more creative after a short walk outside.', vi: 'Đi bộ còn cải thiện tâm trạng. Nhiều người nói họ thấy bình tĩnh và sáng tạo hơn sau một cuộc đi dạo ngắn ngoài trời.' },
      { text: 'If you are busy, try small changes: get off the bus one stop early, or take the stairs instead of the lift.', vi: 'Nếu bận, hãy thử những thay đổi nhỏ: xuống xe buýt sớm một trạm, hoặc đi cầu thang bộ thay vì thang máy.' },
    ],
    notes: [
      { word: 'fit', meaning: 'khoẻ mạnh, cân đối', ipa: '/fɪt/', pos: 'adj' }, { word: 'recommend', meaning: 'khuyên, đề xuất', ipa: '/ˌrekəˈmend/', pos: 'verb' },
      { word: 'protects', meaning: 'bảo vệ', ipa: '/prəˈtekts/', pos: 'verb' }, { word: 'strengthens', meaning: 'làm mạnh thêm', ipa: '/ˈstreŋθənz/', pos: 'verb' },
      { word: 'calmer', meaning: 'bình tĩnh hơn', ipa: '/ˈkɑːmə/', pos: 'adj' }, { word: 'creative', meaning: 'sáng tạo', ipa: '/kriˈeɪtɪv/', pos: 'adj' }, { word: 'stairs', meaning: 'cầu thang bộ', ipa: '/steəz/', pos: 'noun' },
    ],
  },
];

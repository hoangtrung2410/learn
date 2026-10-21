import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ShoppingBag,
  Star,
  Download,
  Sparkles,
  CheckCircle2,
  Tag,
  Headphones,
  Award,
  Search,
} from 'lucide-react';
import { playPopSound, playSuccessSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { LanguageCode } from '../types';

interface StoreItem {
  id: string;
  title: string;
  category: 'chinese' | 'english' | 'combo';
  categoryLabel: string;
  type: 'Ebook' | 'Khóa Học' | 'Flashcards' | 'Bộ Đề Thi';
  description: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  priceOriginal: number;
  priceDiscount: number;
  icon: string;
  tags: string[];
  downloadsCount: number;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'store-1',
    title: 'Cẩm Nang Đánh Hàng Quảng Châu & Tiếng Trung Thương Mại',
    category: 'chinese',
    categoryLabel: 'Tiếng Trung Thương Mại',
    type: 'Ebook',
    description:
      'Tuyển tập 800+ mẫu câu đàm phán giá sỉ, mẫu hợp đồng song ngữ, cách mặc cả ở chợ 13, Bạch Mã và thủ thuật logistics vận chuyển.',
    badge: 'Bestseller',
    rating: 4.9,
    reviewsCount: 384,
    priceOriginal: 299000,
    priceDiscount: 149000,
    icon: '📦',
    tags: ['Đánh hàng', 'Đàm phán', 'HSK 3-4'],
    downloadsCount: 1420,
  },
  {
    id: 'store-2',
    title: 'Bộ Thẻ Flashcard Thông Minh 2500 Từ Vựng HSK 1 - HSK 5',
    category: 'chinese',
    categoryLabel: 'Luyện Thi HSK',
    type: 'Flashcards',
    description:
      'Kèm file âm thanh chuẩn phát âm Bắc Kinh, bính âm Pinyin, thứ tự nét vẽ và chiết tự giải nghĩa bộ thủ độc quyền.',
    badge: 'Hot',
    rating: 4.95,
    reviewsCount: 512,
    priceOriginal: 350000,
    priceDiscount: 189000,
    icon: '🀄',
    tags: ['HSK 1-5', 'Anki', 'Âm thanh'],
    downloadsCount: 2310,
  },
  {
    id: 'store-3',
    title: 'Khóa 30 Ngày Bứt Phá Phản Xạ Nói & Ngữ Điệu Cùng AI',
    category: 'combo',
    categoryLabel: 'Luyện Nói Chuyên Sâu',
    type: 'Khóa Học',
    description:
      'Lộ trình 30 bài đối thoại tương tác thực tế với AI Coach, chỉnh âm thanh điệu từng ngày và cấp chứng chỉ hoàn thành.',
    badge: 'Khuyên Dùng',
    rating: 4.88,
    reviewsCount: 290,
    priceOriginal: 599000,
    priceDiscount: 299000,
    icon: '🎙️',
    tags: ['Luyện Âm AI', 'Hội thoại Thực Chiến', 'Phản xạ'],
    downloadsCount: 980,
  },
  {
    id: 'store-4',
    title: 'Tuyển Tập 100 Tình Huống Giao Tiếp Khách Sạn & Nhà Hàng Trung Hoa',
    category: 'chinese',
    categoryLabel: 'Giao Tiếp Thực Chiến',
    type: 'Ebook',
    description:
      'Các đoạn hội thoại chuẩn tại Haidilao, đặt phòng khách sạn, gọi xe taxi Didi và ứng biến khi du lịch tự túc.',
    rating: 4.85,
    reviewsCount: 175,
    priceOriginal: 199000,
    priceDiscount: 99000,
    icon: '🥟',
    tags: ['Du lịch', 'Gọi món', 'HSK 2-3'],
    downloadsCount: 840,
  },
  {
    id: 'store-5',
    title: 'Tuyệt Đỉnh Phát Âm Tiếng Anh Mỹ & Nối Âm Tự Nhiên',
    category: 'english',
    categoryLabel: 'Tiếng Anh Luyện Âm',
    type: 'Ebook',
    description:
      'Bí quyết làm chủ 44 âm IPA, trọng âm câu và quy tắc nối âm, nuốt âm của người bản xứ chuẩn xác.',
    rating: 4.92,
    reviewsCount: 420,
    priceOriginal: 250000,
    priceDiscount: 129000,
    icon: '🇺🇸',
    tags: ['IPA', 'American Accent', 'IELTS Speaking'],
    downloadsCount: 1650,
  },
  {
    id: 'store-6',
    title: 'Bộ Đề Thi Thử HSK 3 & HSK 4 Đầy Đủ Audio Chuẩn Mới',
    category: 'chinese',
    categoryLabel: 'Luyện Thi HSK',
    type: 'Bộ Đề Thi',
    description:
      '10 đề thi chuẩn cấu trúc mới, đáp án chi tiết giải thích ngữ pháp và file nghe chất lượng cao kèm transcript.',
    rating: 4.87,
    reviewsCount: 310,
    priceOriginal: 280000,
    priceDiscount: 139000,
    icon: '📝',
    tags: ['HSK 3', 'HSK 4', 'Đề thi'],
    downloadsCount: 1190,
  },
];

export const StoreView: React.FC<{ currentLang?: LanguageCode }> = ({ currentLang }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'chinese' | 'english'>(
    currentLang === 'en' ? 'english' : currentLang === 'zh' ? 'chinese' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    if (currentLang === 'en') setFilterCategory('english');
    else if (currentLang === 'zh') setFilterCategory('chinese');
    else setFilterCategory('all');
  }, [currentLang]);

  const filteredItems = STORE_ITEMS.filter((item) => {
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleBuyItem = (item: StoreItem) => {
    playSuccessSound();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
    });
    setPurchasedIds((prev) => [...prev, item.id]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-rose-900/40 p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
            🛍️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Siêu Thị Học Liệu & Khóa Học Bản Quyền</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                LinguaHub Market
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {currentLang === 'zh'
                ? 'Kho tài liệu độc quyền: Sách tiếng Trung thương mại đánh hàng Quảng Châu, bộ đề luyện thi HSK 1-6 và Flashcards thông minh.'
                : 'Kho tài liệu độc quyền: Giáo trình phát âm IPA người Mỹ, bộ từ vựng luyện thi IELTS / TOEIC và cẩm nang đàm phán thương mại.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-3 rounded-2xl border border-slate-700/80 shrink-0">
          <Award className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-xs font-bold text-white">100% Học Liệu Bản Quyền</p>
            <p className="text-[10px] text-slate-400">Tải về ngay & Học trọn đời</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => {
              playPopSound();
              setFilterCategory('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất Cả ({STORE_ITEMS.length})
          </button>
          <button
            onClick={() => {
              playPopSound();
              setFilterCategory('chinese');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterCategory === 'chinese'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇨🇳</span>
            <span>Tiếng Trung HSK & Thương Mại</span>
          </button>
          <button
            onClick={() => {
              playPopSound();
              setFilterCategory('english');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterCategory === 'english'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇺🇸</span>
            <span>Tiếng Anh & IELTS</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sách, HSK, khóa học..."
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isPurchased = purchasedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="bg-slate-800/80 hover:bg-slate-800 rounded-3xl p-6 border border-slate-700/80 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-amber-500/40 group relative overflow-hidden"
            >
              {item.badge && (
                <div className="absolute top-4 right-4 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {item.badge}
                </div>
              )}

              <div>
                {/* Type & Icon */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {item.type} • {item.categoryLabel}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-amber-400 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="ml-1 font-bold">{item.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">({item.reviewsCount} đánh giá)</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-900/60 text-slate-400 border border-slate-700/50"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-5 mt-5 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 line-through">
                    {item.priceOriginal.toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-lg font-black text-emerald-400">
                    {item.priceDiscount.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                {!isPurchased ? (
                  <button
                    onClick={() => handleBuyItem(item)}
                    className="px-4 py-2.5 rounded-xl btn-tactile-amber text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Mua Ngay</span>
                  </button>
                ) : (
                  <button
                    className="px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã Sở Hữu</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

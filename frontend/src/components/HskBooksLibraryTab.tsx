import React, { useState } from 'react';
import { HSK_BOOKS_CATALOG, HskBookItem, BookLessonUnit } from '../data/hskBooksData';
import { speakNativeText, playPopSound } from '../utils/audio';
import {
  BookOpen,
  Search,
  Volume2,
  Star,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  X,
  FileText,
  Bookmark,
  Layers,
  GraduationCap,
  DownloadCloud,
} from 'lucide-react';

interface HskBooksLibraryTabProps {
  onAddXp: (amount: number) => void;
}

export const HskBooksLibraryTab: React.FC<HskBooksLibraryTabProps> = ({ onAddXp }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBook, setActiveBook] = useState<HskBookItem | null>(null);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(0);

  const filteredBooks = HSK_BOOKS_CATALOG.filter((book) => {
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'standard' && book.category === 'standard') ||
      (selectedCategory === 'han-ngu' && book.category === 'han-ngu') ||
      (selectedCategory === 'exam-prep' && book.category === 'exam-prep');

    if (!searchQuery.trim()) return matchCat;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      book.title.toLowerCase().includes(q) ||
      book.chineseTitle.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.publisher.toLowerCase().includes(q) ||
      book.description.toLowerCase().includes(q);

    return matchCat && matchSearch;
  });

  const handleOpenBook = (book: HskBookItem) => {
    playPopSound();
    setActiveBook(book);
    setSelectedUnitIdx(0);
  };

  const handlePlayAudio = async (text: string) => {
    playPopSound();
    await speakNativeText(text, 'zh', false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-950/60 via-amber-950/40 to-slate-900 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10 shrink-0">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Thư Viện Giáo Trình & Sách Ôn Thi HSK Chuẩn
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Bản Quyền & BLCU
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Tổng hợp đầy đủ bộ Giáo trình Chuẩn HSK (HSK Standard Course 1-6), Bộ Giáo trình Hán ngữ 6 cuốn, sách mẹo luyện thi cấp tốc 21 ngày kèm khóa văn mẫu và audio giọng đọc bản xứ.
              </p>
            </div>
          </div>

          <div className="text-xs text-amber-400 font-bold bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-700 self-start md:self-auto shrink-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{HSK_BOOKS_CATALOG.length} Bộ sách giáo trình tinh tuyển</span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất Cả Sách' },
              { id: 'standard', label: 'Giáo Trình Chuẩn HSK (1-6)' },
              { id: 'han-ngu', label: 'Giáo Trình Hán Ngữ (6 Tập)' },
              { id: 'exam-prep', label: 'Sách Luyện Thi Cấp Tốc' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playPopSound();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sách theo tên, tác giả (Khương Lệ Bình, Dương Ký Châu), nhà xuất bản hoặc từ khóa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/40 transition-all shadow-xl flex flex-col justify-between overflow-hidden group hover:shadow-amber-500/10"
          >
            {/* Book Header Cover */}
            <div className={`p-6 bg-gradient-to-r ${book.coverGradient} relative overflow-hidden text-white space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-[11px] font-extrabold border border-white/20">
                  {book.badge}
                </span>
                <span className="text-3xl">{book.coverIcon}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono tracking-widest text-white/80 uppercase block">
                  {book.categoryNameVi}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-xs text-white/90 font-chinese font-semibold line-clamp-1">
                  {book.chineseTitle}
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-white/80 pt-1 border-t border-white/20">
                <span>Tác giả: {book.author.split('(')[0]}</span>
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>{book.rating}</span>
                </div>
              </div>
            </div>

            {/* Book Body Details */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {book.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Điểm nổi bật:
                  </span>
                  {book.keyHighlights.slice(0, 2).map((hl, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-700 flex items-center gap-2">
                <button
                  onClick={() => handleOpenBook(book)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Đọc & Học Bài Khóa</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL: CHI TIẾT SÁCH & BÀI KHÓA SONG NGỮ KÈM AUDIO ================= */}
      {activeBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${activeBook.coverGradient} text-white flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeBook.coverIcon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/30 text-[10px] font-bold">
                      {activeBook.badge}
                    </span>
                    <span className="text-xs text-white/80">NXB: {activeBook.publisher}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    {activeBook.title}
                  </h3>
                  <p className="text-xs text-white/90 font-chinese">{activeBook.chineseTitle}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveBook(null)}
                className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
              {/* Unit / Lesson Selector */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Chọn Bài Học Trong Giáo Trình ({activeBook.units.length} Bài Mẫu Chuẩn):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeBook.units.map((unit, uIdx) => (
                    <button
                      key={uIdx}
                      onClick={() => {
                        playPopSound();
                        setSelectedUnitIdx(uIdx);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedUnitIdx === uIdx
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black block">{unit.title}</span>
                        <span className="text-[11px] text-amber-400 font-chinese">{unit.chineseTitle}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Unit Deep-Dive Content */}
              {activeBook.units[selectedUnitIdx] && (() => {
                const curUnit = activeBook.units[selectedUnitIdx];
                return (
                  <div className="space-y-6 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-black text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-amber-400" />
                          {curUnit.title} - {curUnit.chineseTitle}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">{curUnit.summaryVi}</p>
                      </div>
                    </div>

                    {/* Reading Text (Khóa văn 课文) */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Bookmark className="w-4 h-4" />
                          Bài Khóa Mẫu (课文): {curUnit.readingText.title}
                        </span>

                        <button
                          onClick={() => handlePlayAudio(curUnit.readingText.chinese)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                          Nghe Toàn Bài
                        </button>
                      </div>

                      {/* Chinese Text */}
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Văn bản Chữ Hán:</span>
                        <p className="text-base sm:text-lg font-bold text-white font-chinese leading-relaxed whitespace-pre-line">
                          {curUnit.readingText.chinese}
                        </p>
                      </div>

                      {/* Pinyin Text */}
                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Phiên âm Pinyin chuẩn:</span>
                        <p className="text-xs sm:text-sm font-mono text-cyan-300 leading-relaxed whitespace-pre-line">
                          {curUnit.readingText.pinyin}
                        </p>
                      </div>

                      {/* Vietnamese Translation */}
                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Dịch nghĩa tiếng Việt:</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                          {curUnit.readingText.vietnamese}
                        </p>
                      </div>
                    </div>

                    {/* Key Vocabulary & Grammar In This Unit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                          Từ vựng trọng tâm bài này:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {curUnit.keyVocab.map((vb, vIdx) => (
                            <li key={vIdx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{vb}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                          Ngữ pháp trọng tâm bài này:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {curUnit.keyGrammar.map((gm, gIdx) => (
                            <li key={gIdx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span>{gm}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Study Tips from Book */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                <span className="font-extrabold uppercase tracking-wider block">
                  💡 Lời khuyên ôn tập từ giáo trình này:
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {activeBook.studyTips.map((tip, tIdx) => (
                    <li key={tIdx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

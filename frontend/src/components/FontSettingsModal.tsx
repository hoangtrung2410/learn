import React, { useState, useEffect } from 'react';
import { X, Type, Check, Sparkles, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { playPopSound, playSuccessSound } from '../utils/audio';

export interface FontPreset {
  id: string;
  name: string;
  fontFamily: string;
  description: string;
  sampleText: string;
  badge?: string;
  tag: string;
}

export const APP_FONT_PRESETS: FontPreset[] = [
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    description: 'Phông chữ hiện đại, sang trọng hàng đầu thế giới, sắc nét và thanh lịch tuyệt đối.',
    sampleText: 'Học tiếng Trung thông minh với AI • Chuẩn HSK 3.0',
    badge: 'Khuyên Dùng ⭐',
    tag: 'Hiện Đại & Cao Cấp',
  },
  {
    id: 'nunito',
    name: 'Nunito (Phong Cách Duolingo)',
    fontFamily: "'Nunito', system-ui, sans-serif",
    description: 'Nét chữ bo tròn thân thiện, trẻ trung, cực kỳ dễ nhìn, phong cách ứng dụng giáo dục nổi tiếng.',
    sampleText: 'Luyện phản xạ giọng nói 1-1 cùng trợ lý ảo bản xứ!',
    badge: 'Duolingo Style 🥑',
    tag: 'Thân Thiện & Đáng Yêu',
  },
  {
    id: 'be-vietnam',
    name: 'Be Vietnam Pro',
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    description: 'Thiết kế chuẩn hóa cho tiếng Việt có dấu, khoảng cách ký tự thoáng, rõ ràng từng nguyên âm.',
    sampleText: 'Lộ trình cá nhân hóa từ số 0 đến thành thạo HSK 6',
    tag: 'Chuẩn Dấu Tiếng Việt',
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter', system-ui, sans-serif",
    description: 'Chuẩn quốc tế tối giản, trung tính cao độ, đọc văn bản dài không gây mỏi mắt.',
    sampleText: 'Công nghệ phân tích âm vị học và ngữ pháp thời gian thực',
    tag: 'Tối Giản & Sắc Nét',
  },
  {
    id: 'lexend',
    name: 'Lexend',
    fontFamily: "'Lexend', system-ui, sans-serif",
    description: 'Phông chữ được nghiên cứu giúp mắt lướt nhanh và tăng khả năng ghi nhớ từ vựng.',
    sampleText: 'Ghi nhớ 5000+ từ vựng và mẫu câu giao tiếp đời sống',
    tag: 'Tăng Tốc Độ Đọc',
  },
];

export const CHINESE_FONT_PRESETS = [
  {
    id: 'noto-sans',
    name: 'Noto Sans SC (Hắc Thể - Chuẩn HSK)',
    fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    description: 'Nét chữ vuông vức, rõ ràng từng nét bút, chuẩn sách giáo khoa & đề thi HSK.',
    sampleText: '你好！很高兴认识你。今天我们一起学习汉语吧！',
    badge: 'Chuẩn Đề Thi 🇨🇳',
  },
  {
    id: 'noto-serif',
    name: 'Noto Serif SC (Tống Thể - Thanh Nhã)',
    fontFamily: "'Noto Serif SC', 'SongTi', serif",
    description: 'Nét thanh nét đậm truyền thống, mang phong cách ấn bản sách cổ điển sang trọng.',
    sampleText: '学而时习之，不亦说乎？有朋自远方来，不亦乐乎？',
    badge: 'Nét Cổ Điển 🖋️',
  },
  {
    id: 'ma-shan',
    name: 'Ma Shan Zheng (Thư Pháp Bút Lông)',
    fontFamily: "'Ma Shan Zheng', cursive",
    description: 'Nét bút lông thư pháp nghệ thuật bay bổng, đậm chất văn hóa phương Đông.',
    sampleText: '海内存知己，天涯若比邻。千里之行，始于足下。',
    badge: 'Thư Pháp 🖌️',
  },
];

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedAppFont, setSelectedAppFont] = useState<string>(() => {
    return localStorage.getItem('linguahub_app_font') || 'jakarta';
  });

  const [selectedChineseFont, setSelectedChineseFont] = useState<string>(() => {
    return localStorage.getItem('linguahub_chinese_font') || 'noto-sans';
  });

  const [fontSizeScale, setFontSizeScale] = useState<number>(() => {
    const saved = localStorage.getItem('linguahub_font_scale');
    return saved ? parseFloat(saved) : 100;
  });

  // Apply on mount
  useEffect(() => {
    applyFont(selectedAppFont, selectedChineseFont, fontSizeScale);
  }, []);

  const applyFont = (appFontId: string, chineseFontId: string, scale: number) => {
    const appPreset = APP_FONT_PRESETS.find((p) => p.id === appFontId) || APP_FONT_PRESETS[0];
    const chinesePreset = CHINESE_FONT_PRESETS.find((p) => p.id === chineseFontId) || CHINESE_FONT_PRESETS[0];

    document.documentElement.style.setProperty('--app-font', appPreset.fontFamily);
    document.documentElement.style.setProperty('--chinese-font', chinesePreset.fontFamily);
    document.documentElement.style.fontSize = `${scale}%`;

    localStorage.setItem('linguahub_app_font', appFontId);
    localStorage.setItem('linguahub_chinese_font', chineseFontId);
    localStorage.setItem('linguahub_font_scale', scale.toString());
  };

  const handleSelectAppFont = (id: string) => {
    playPopSound();
    setSelectedAppFont(id);
    applyFont(id, selectedChineseFont, fontSizeScale);
  };

  const handleSelectChineseFont = (id: string) => {
    playPopSound();
    setSelectedChineseFont(id);
    applyFont(selectedAppFont, id, fontSizeScale);
  };

  const handleScaleChange = (scale: number) => {
    playPopSound();
    setFontSizeScale(scale);
    applyFont(selectedAppFont, selectedChineseFont, scale);
  };

  const handleResetDefault = () => {
    playSuccessSound();
    setSelectedAppFont('jakarta');
    setSelectedChineseFont('noto-sans');
    setFontSizeScale(100);
    applyFont('jakarta', 'noto-sans', 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900/30 via-slate-900 to-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Tùy Chỉnh Phông Chữ
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Trực Tiếp
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chọn kiểu chữ và kích thước đẹp mắt nhất theo sở thích cá nhân của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Preview Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-purple-500/30 shadow-inner space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Bản xem trước phông chữ hiện tại:
              </span>
              <span className="text-[11px] text-slate-500">Cập nhật ngay tức thì</span>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-bold text-white leading-relaxed">
                Xin chào! Chào mừng bạn đến với LinguaHub - Nền tảng học ngoại ngữ cùng AI.
              </p>
              <p className="text-2xl font-bold text-emerald-400 font-chinese leading-relaxed">
                你好！欢迎来到中文学习世界。持之以恒，必有所成！
              </p>
              <p className="text-xs text-slate-400">
                Pinyin: Nǐ hǎo! Huānyíng lái dào zhōngwén xuéxí shìjiè. Chízhīyǐhéng, bì yǒu suǒ chéng!
              </p>
            </div>
          </div>

          {/* Section 1: Giao diện chính & Tiếng Việt */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>1. Phông chữ Giao Diện & Tiếng Việt</span>
              </label>
              <span className="text-[11px] text-purple-400">Bấm để đổi ngay</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {APP_FONT_PRESETS.map((preset) => {
                const isSelected = selectedAppFont === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectAppFont(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/40'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex-1 min-w-0" style={{ fontFamily: preset.fontFamily }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{preset.name}</span>
                        {preset.badge && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {preset.badge}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400">
                          {preset.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {preset.sampleText}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700/60 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Kiểu Chữ Hán (Tiếng Trung) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>2. Kiểu Chữ Hán (Tiếng Trung HSK)</span>
              </label>
              <span className="text-[11px] text-emerald-400">3 phong cách chữ Hán</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CHINESE_FONT_PRESETS.map((preset) => {
                const isSelected = selectedChineseFont === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectChineseFont(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {preset.badge}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p
                        className="text-xl font-bold text-white mb-2 leading-tight"
                        style={{ fontFamily: preset.fontFamily }}
                      >
                        学无止境
                      </p>
                      <p className="text-xs font-bold text-slate-200">{preset.name}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Kích thước chữ (Font Size Scale) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>3. Kích Thước Chữ (Tỷ Lệ Hiển Thị)</span>
              </label>
              <span className="text-xs font-bold text-amber-400">{fontSizeScale}%</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { scale: 95, label: 'Nhỏ gọn (95%)' },
                { scale: 100, label: 'Tiêu chuẩn (100%)' },
                { scale: 106, label: 'Chữ lớn (106%)' },
                { scale: 114, label: 'Rất lớn (114%)' },
              ].map((item) => (
                <button
                  key={item.scale}
                  onClick={() => handleScaleChange(item.scale)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                    fontSizeScale === item.scale
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi phục mặc định
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Đóng & Tiếp Tục Học
          </button>
        </div>
      </div>
    </div>
  );
};

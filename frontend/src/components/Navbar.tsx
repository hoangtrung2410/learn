import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../data/curriculum';
import { LanguageCode, UserStats, User } from '../types';
import {
  Flame,
  Heart,
  Gem,
  ChevronDown,
  BookOpen,
  Volume2,
  MessagesSquare,
  Compass,
  ShoppingBag,
  BookMarked,
  Crown,
  LogIn,
  LogOut,
  Shield,
  GraduationCap,
  Type,
  Sparkles,
} from 'lucide-react';
import { playPopSound } from '../utils/audio';

export type AppNavTab = 'home' | 'learn' | 'study' | 'hsk-prep' | 'english-vocab' | 'speaking' | 'roleplay' | 'pinyin' | 'pricing' | 'dictionary' | 'account' | 'admin' | 'legal';

interface NavbarProps {
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  activeTab: AppNavTab;
  onChangeTab: (tab: AppNavTab) => void;
  stats: UserStats;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenFontSettings: () => void;
  onLogout: () => void;
}

// Real flag images from flagcdn.com
const FLAG_IMAGES: Record<string, string> = {
  zh: 'https://flagcdn.com/w40/cn.png',
  en: 'https://flagcdn.com/w40/us.png',
  ja: 'https://flagcdn.com/w40/jp.png',
  ko: 'https://flagcdn.com/w40/kr.png',
};

// Language badge configs
const LANG_BADGES: Record<string, string> = {
  zh: '🔥 HSK Hot',
  en: '🌍 Toàn cầu',
  ja: '✨ Mới ra mắt',
  ko: '📈 Xu hướng',
};

// Flag Image Component with emoji fallback
const FlagImage: React.FC<{ langId: string; emoji: string; className?: string }> = ({ langId, emoji, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError || !FLAG_IMAGES[langId]) {
    return <span className="text-lg leading-none">{emoji}</span>;
  }
  return (
    <img
      src={FLAG_IMAGES[langId]}
      alt={langId}
      className={`object-cover rounded-sm shadow-sm ${className}`}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onSelectLang,
  activeTab,
  onChangeTab,
  stats,
  currentUser,
  onOpenAuth,
  onOpenFontSettings,
  onLogout,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.id === currentLang) || SUPPORTED_LANGUAGES[0];
  const isSuperAdmin = currentUser?.role === 'admin';

  return (
    <>
      <style>{`
        @keyframes navDropdown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .nav-dropdown { animation: navDropdown 0.18s cubic-bezier(0.16,1,0.3,1) forwards; }
        .lang-card:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.12) !important; }
        .nav-tab-btn:hover:not(.active-tab) { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(8, 12, 24, 0.96)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 lg:h-auto lg:min-h-16 lg:py-2 flex items-center justify-between lg:flex-wrap gap-2 sm:gap-4 lg:gap-y-2">

          {/* ── Brand + Language Selector ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => { playPopSound(); onChangeTab('home'); }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all group-hover:scale-110 group-hover:rotate-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.4), 0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                🐼
              </div>
              <div className="hidden sm:block shrink-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-black text-lg text-white" style={{ letterSpacing: '-0.02em' }}>LinguaHub</span>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest"
                    style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)', color: '#fff', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}
                  >
                    AI PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 hidden lg:block">
                  {currentLang === 'zh' ? 'Học Tiếng Trung HSK & Khẩu Ngữ AI' : 'Học Ngoại Ngữ & Luyện Phản Xạ AI'}
                </p>
              </div>
            </button>

            {/* ── Language Selector ── */}
            <div className="relative ml-0 sm:ml-4">
              <button
                onClick={() => { playPopSound(); setLangMenuOpen(!langMenuOpen); }}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl cursor-pointer transition-all"
                style={{
                  background: langMenuOpen ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                  border: langMenuOpen ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: langMenuOpen ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
                }}
              >
                {/* Current flag */}
                <div className="flex items-center justify-center rounded overflow-hidden flex-shrink-0" style={{ width: 24, height: 17 }}>
                  <FlagImage langId={currentLangObj.id} emoji={currentLangObj.flag} className="w-6 h-full" />
                </div>
                <span className="font-bold text-xs text-slate-200 hidden md:inline whitespace-nowrap">{currentLangObj.name}</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                  style={{ transform: langMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setLangMenuOpen(false)} />
                  <div
                    className="absolute left-0 mt-2 w-80 rounded-2xl p-3 z-30 nav-dropdown"
                    style={{
                      background: 'rgba(10, 14, 28, 0.98)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(24px)',
                    }}
                  >
                    {/* Dropdown header */}
                    <div
                      className="flex items-center gap-2 px-2 pb-2.5 mb-2"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Chọn ngôn ngữ muốn học
                      </span>
                    </div>

                    {/* Language cards */}
                    <div className="space-y-1.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isActive = currentLang === lang.id;
                        return (
                          <button
                            key={lang.id}
                            onClick={() => { playPopSound(); onSelectLang(lang.id); setLangMenuOpen(false); }}
                            className="lang-card w-full flex items-center justify-between px-3 py-3 rounded-xl text-left cursor-pointer transition-all"
                            style={{
                              background: isActive ? `${lang.accentColor}18` : 'rgba(255,255,255,0.03)',
                              border: isActive ? `1px solid ${lang.accentColor}50` : '1px solid rgba(255,255,255,0.06)',
                              boxShadow: isActive ? `0 0 20px ${lang.accentColor}20` : 'none',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Flag with styled container */}
                              <div
                                className="relative flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                                style={{
                                  width: 44,
                                  height: 32,
                                  background: 'rgba(255,255,255,0.06)',
                                  border: isActive ? `1px solid ${lang.accentColor}60` : '1px solid rgba(255,255,255,0.08)',
                                  boxShadow: isActive ? `0 0 14px ${lang.accentColor}40` : '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                              >
                                <FlagImage langId={lang.id} emoji={lang.flag} className="w-full h-full" />
                              </div>

                              {/* Text info */}
                              <div>
                                <p className="text-xs font-bold" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.85)' }}>
                                  {lang.name}
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                  {lang.nativeName}
                                </p>
                                <p className="text-[10px] mt-0.5 font-medium" style={{ color: isActive ? lang.accentColor : 'rgba(255,255,255,0.35)' }}>
                                  {lang.levelTitle}
                                </p>
                              </div>
                            </div>

                            {/* Badge */}
                            {LANG_BADGES[lang.id] && (
                              <span
                                className="text-[9px] px-2 py-1 rounded-full font-bold border whitespace-nowrap flex-shrink-0"
                                style={{
                                  background: isActive ? `${lang.accentColor}20` : 'rgba(255,255,255,0.05)',
                                  color: isActive ? lang.accentColor : 'rgba(255,255,255,0.35)',
                                  borderColor: isActive ? `${lang.accentColor}40` : 'rgba(255,255,255,0.07)',
                                }}
                              >
                                {LANG_BADGES[lang.id]}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Desktop Navigation Tabs ── */}
          <nav
            className="hidden lg:flex order-last basis-full max-w-full items-center justify-start xl:justify-center gap-0.5 p-1.5 rounded-2xl overflow-x-auto no-scrollbar"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Lộ Trình */}
            <button
              onClick={() => { playPopSound(); onChangeTab('learn'); }}
              className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'learn' ? 'active-tab' : ''}`}
              style={activeTab === 'learn'
                ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }
                : { color: 'rgba(255,255,255,0.45)' }}
            >
              <BookOpen className="w-3.5 h-3.5" /> Lộ Trình
            </button>

            {currentLang === 'zh' && (
              <button
                onClick={() => { playPopSound(); onChangeTab('hsk-prep'); }}
                className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'hsk-prep' ? 'active-tab' : ''}`}
                style={activeTab === 'hsk-prep'
                  ? { background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }
                  : { color: '#fbbf24' }}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Ôn Thi HSK 1-6
              </button>
            )}
            {currentLang === 'en' && (
              <button
                onClick={() => { playPopSound(); onChangeTab('english-vocab'); }}
                className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'english-vocab' ? 'active-tab' : ''}`}
                style={activeTab === 'english-vocab'
                  ? { background: 'linear-gradient(135deg,#10b981,#0ea5e9)', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }
                  : { color: '#34d399' }}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Từ Vựng A1-C1
              </button>
            )}
            {(currentLang === 'zh' || currentLang === 'en') && (
              <button
                onClick={() => { playPopSound(); onChangeTab('study'); }}
                className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'study' ? 'active-tab' : ''}`}
                style={activeTab === 'study'
                  ? { background: 'linear-gradient(135deg,#38bdf8,#818cf8)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }
                  : { color: '#38bdf8' }}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Ôn Luyện & Đề Thi
              </button>
            )}
            <button
              onClick={() => { playPopSound(); onChangeTab('speaking'); }}
              className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'speaking' ? 'active-tab' : ''}`}
              style={activeTab === 'speaking'
                ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }
                : { color: 'rgba(255,255,255,0.45)' }}
            >
              <Volume2 className="w-3.5 h-3.5" /> Luyện Phát Âm AI
            </button>
            <button
              onClick={() => { playPopSound(); onChangeTab('roleplay'); }}
              className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'roleplay' ? 'active-tab' : ''}`}
              style={activeTab === 'roleplay'
                ? { background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', boxShadow: '0 4px 14px rgba(168,85,247,0.35)' }
                : { color: 'rgba(255,255,255,0.45)' }}
            >
              <MessagesSquare className="w-3.5 h-3.5" /> Hội Thoại 1-1
            </button>
            {currentLang === 'zh' && (
              <button
                onClick={() => { playPopSound(); onChangeTab('pinyin'); }}
                className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'pinyin' ? 'active-tab' : ''}`}
                style={activeTab === 'pinyin'
                  ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }
                  : { color: 'rgba(255,255,255,0.45)' }}
              >
                <Compass className="w-3.5 h-3.5" /> Pinyin 4 Thanh
              </button>
            )}
            <button
              onClick={() => { playPopSound(); onChangeTab('dictionary'); }}
              className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dictionary' ? 'active-tab' : ''}`}
              style={activeTab === 'dictionary'
                ? { background: 'linear-gradient(135deg,#14b8a6,#0891b2)', color: '#fff', boxShadow: '0 4px 14px rgba(20,184,166,0.35)' }
                : { color: 'rgba(255,255,255,0.45)' }}
            >
              <BookMarked className="w-3.5 h-3.5" />
              {currentLang === 'zh' ? 'Tra Cứu & Bộ Thủ' : 'Từ Điển & Nguồn Gốc'}
            </button>
            <button
              onClick={() => { playPopSound(); onChangeTab('pricing'); }}
              className={`nav-tab-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'pricing' ? 'active-tab' : ''}`}
              style={activeTab === 'pricing'
                ? { background: 'linear-gradient(135deg,#f59e0b,#eab308)', color: '#0a0f1e', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }
                : { color: '#fbbf24' }}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Khoá Học & Bảng Giá
            </button>
          </nav>

          {/* ── Gamification Stats & Auth ── */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 whitespace-nowrap">
            {/* Streak */}
            <div
              title="Chuỗi ngày học liên tục"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl font-extrabold text-xs"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.28)', color: '#fb923c' }}
            >
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{stats.streak}</span>
            </div>

            {/* Gems */}
            <div
              title="Kim cương / Điểm kinh nghiệm"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl font-extrabold text-xs"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}
            >
              <Gem className="w-4 h-4" />
              <span>{stats.gems}</span>
            </div>

            {/* Hearts */}
            <div
              title="Số tim còn lại"
              className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl font-extrabold text-xs"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185' }}
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>{isSuperAdmin ? '∞' : `${stats.hearts}/${stats.maxHearts}`}</span>
            </div>

            {/* Font Settings */}
            <button
              onClick={() => { playPopSound(); onOpenFontSettings(); }}
              title="Tùy chỉnh phông chữ giao diện & chữ Hán"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Phông Chữ</span>
            </button>

            {/* Super Admin */}
            {isSuperAdmin && (
              <button
                onClick={() => { playPopSound(); onChangeTab('admin'); }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#eab308)', color: '#0a0f1e', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}
              >
                <Crown className="w-4 h-4" />
                Quản Trị
              </button>
            )}

            {/* User Account / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => { playPopSound(); setUserMenuOpen(!userMenuOpen); }}
                  className="flex items-center gap-2 p-1 pl-2 rounded-2xl transition-all cursor-pointer"
                  style={{
                    background: isSuperAdmin ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                    border: isSuperAdmin ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-white flex items-center gap-1">
                      {currentUser.name}
                      {isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</p>
                  </div>
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-xl object-cover"
                      style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
                    />
                    {isSuperAdmin && <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>}
                  </div>
                  <ChevronDown
                    className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                    style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl p-2 z-30 space-y-1 nav-dropdown"
                      style={{
                        background: 'rgba(10, 14, 28, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(24px)',
                      }}
                    >
                      <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          {currentUser.name}
                          {isSuperAdmin && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black" style={{ background: 'linear-gradient(135deg,#f59e0b,#eab308)', color: '#0a0f1e' }}>
                              ADMIN
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">@{currentUser.username}</p>
                      </div>

                      {isSuperAdmin && (
                        <button
                          onClick={() => { playPopSound(); setUserMenuOpen(false); onChangeTab('admin'); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer hover:bg-amber-500/15"
                          style={{ color: '#fbbf24' }}
                        >
                          <Crown className="w-4 h-4 text-amber-400" />
                          Quản trị bán hàng
                        </button>
                      )}

                      <button
                        onClick={() => { playPopSound(); setUserMenuOpen(false); onChangeTab('account'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer hover:bg-white/5"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        <Shield className="w-4 h-4 text-purple-400" />
                        Tài khoản & đơn hàng
                      </button>

                      <button
                        onClick={() => { playPopSound(); setUserMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer hover:bg-rose-500/12"
                        style={{ color: '#fb7185' }}
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => { playPopSound(); onOpenAuth(); }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden min-[400px]:inline">Đăng Nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Tab Bar ── */}
        <div
          className="lg:hidden flex items-center justify-between px-2 py-2 overflow-x-auto text-[11px] gap-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button onClick={() => onChangeTab('learn')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'learn' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>
            <BookOpen className="w-3.5 h-3.5" /> Lộ Trình
          </button>
          {currentLang === 'zh' && (
            <button onClick={() => onChangeTab('hsk-prep')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'hsk-prep' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'}`}>
              <GraduationCap className="w-3.5 h-3.5" /> Ôn HSK
            </button>
          )}
          {currentLang === 'en' && (
            <button onClick={() => onChangeTab('english-vocab')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'english-vocab' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400'}`}>
              <GraduationCap className="w-3.5 h-3.5" /> Từ Vựng
            </button>
          )}
          {(currentLang === 'zh' || currentLang === 'en') && (
            <button onClick={() => onChangeTab('study')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'study' ? 'bg-sky-500 text-slate-950' : 'text-sky-400'}`}>
              <GraduationCap className="w-3.5 h-3.5" /> Ôn Luyện
            </button>
          )}
          <button onClick={() => onChangeTab('speaking')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'speaking' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
            <Volume2 className="w-3.5 h-3.5" /> Luyện Phát Âm
          </button>
          <button onClick={() => onChangeTab('roleplay')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'roleplay' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
            <MessagesSquare className="w-3.5 h-3.5" /> Hội Thoại
          </button>
          {currentLang === 'zh' && (
            <button onClick={() => onChangeTab('pinyin')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'pinyin' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>
              Pinyin
            </button>
          )}
          <button onClick={() => onChangeTab('dictionary')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'dictionary' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>
            {currentLang === 'zh' ? 'Tra Cứu' : 'Từ Điển'}
          </button>
          <button onClick={() => onChangeTab('pricing')} className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all ${activeTab === 'pricing' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'}`}>
            <ShoppingBag className="w-3.5 h-3.5" /> Bảng Giá
          </button>
        </div>
      </header>
    </>
  );
};
